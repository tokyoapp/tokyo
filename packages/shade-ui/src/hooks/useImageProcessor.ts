import { useState, useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { ShadeStatus, OperationSpec } from "../lib/shade-api";
import { ShadeAPI } from "../lib/shade-api";

/**
 * Debounce utility for image processing operations
 * Prevents excessive API calls during rapid slider adjustments
 */
function debounce<T>(callback: (arg: T) => void, ms = 80) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (arg: T) => {
    return new Promise<void>((resolve) => {
      if (!timeout) {
        resolve(callback(arg));
        return;
      }
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        timeout = null;
        resolve(callback(arg));
      }, ms);
    });
  };
}

export interface ImageData {
  src: string;
  width: number;
  height: number;
  name: string;
}

export interface PreviewState {
  original: ImageData | null;
  processed: ImageData | null;
  isProcessing: boolean;
}

export interface ImageAdjustments {
  // Basic adjustments
  exposure: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;

  // Tone curve
  brightness: number;
  contrast: number;
  gamma: number;

  // Color adjustments
  saturation: number;
  vibrance: number;
  hue: number;
  temperature: number;
  tint: number;

  // Effects
  clarity: number;
  dehaze: number;
  blur: number;
  sharpen: number;
  noise: number;
}

const defaultAdjustments: ImageAdjustments = {
  // Basic adjustments
  exposure: 0.0,
  highlights: 0.0,
  shadows: 0.0,
  whites: 0.0,
  blacks: 0.0,

  // Tone curve
  brightness: 1.0,
  contrast: 1.0,
  gamma: 1.0,

  // Color adjustments
  saturation: 1.0,
  vibrance: 0.0,
  hue: 0.0,
  temperature: 0.0,
  tint: 0.0,

  // Effects
  clarity: 0.0,
  dehaze: 0.0,
  blur: 0.0,
  sharpen: 0.0,
  noise: 0.0,
};

export interface UseImageProcessorOptions {
  /** Initial adjustment values */
  initialAdjustments?: Partial<ImageAdjustments>;
  /** Debounce delay for processing operations in milliseconds */
  debounceMs?: number;
  /** Whether to automatically check Shade status */
  enableStatusCheck?: boolean;
  /** Status check interval in milliseconds */
  statusCheckInterval?: number;
}

export interface UseImageProcessorReturn {
  // State
  selectedFile: string | null;
  previewState: PreviewState;
  error: string | null;
  shadeStatus: ShadeStatus | null;
  operations: OperationSpec[];
  adjustments: ImageAdjustments;

  // Actions
  selectFile: () => Promise<void>;
  updateAdjustment: (key: keyof ImageAdjustments, value: number) => void;
  resetAdjustments: () => void;
  setSelectedFile: (file: string | null) => void;
  clearError: () => void;

  // Utilities
  tryLoadImage: (filePath: string) => Promise<ImageData>;
}

/**
 * Custom hook for image processing functionality
 *
 * Provides complete image processing workflow including:
 * - File selection and loading with multiple fallback methods
 * - Real-time preview with debounced processing
 * - Adjustment parameter management
 * - Shade API integration and status monitoring
 * - Memory management for blob URLs
 *
 * @param options Configuration options for the hook
 * @returns Object containing all image processing state and functions
 */
export function useImageProcessor(
  options: UseImageProcessorOptions = {}
): UseImageProcessorReturn {
  const {
    initialAdjustments = {},
    debounceMs = 80,
    enableStatusCheck = true,
    statusCheckInterval = 5000,
  } = options;

  // Core state management
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>({
    original: null,
    processed: null,
    isProcessing: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [shadeStatus, setShadeStatus] = useState<ShadeStatus | null>(null);
  const [operations, setOperations] = useState<OperationSpec[]>([]);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    ...defaultAdjustments,
    ...initialAdjustments,
  });

  /**
   * Convert UI adjustment values to Shade operations
   * Maps slider values to appropriate operation parameters
   */
  useEffect(() => {
    const newOperations: OperationSpec[] = [];

    // Combine exposure and brightness into a single brightness operation
    const combinedBrightness =
      (1.0 + adjustments.exposure) * adjustments.brightness;
    if (combinedBrightness !== 1.0) {
      newOperations.push(ShadeAPI.operations.brightness(combinedBrightness));
    }
    if (adjustments.contrast !== 1.0) {
      newOperations.push(ShadeAPI.operations.contrast(adjustments.contrast));
    }
    if (adjustments.saturation !== 1.0) {
      newOperations.push(
        ShadeAPI.operations.saturation(adjustments.saturation)
      );
    }
    if (adjustments.hue !== 0.0) {
      newOperations.push(ShadeAPI.operations.hue(adjustments.hue));
    }
    if (adjustments.gamma !== 1.0) {
      newOperations.push(ShadeAPI.operations.gamma(adjustments.gamma));
    }
    if (adjustments.temperature !== 0.0 || adjustments.tint !== 0.0) {
      newOperations.push(
        ShadeAPI.operations.whiteBalance({
          temperature: 5500 + adjustments.temperature * 2000,
          tint: adjustments.tint,
        })
      );
    }
    if (adjustments.blur > 0.0) {
      newOperations.push(ShadeAPI.operations.blur(adjustments.blur));
    }
    if (adjustments.sharpen > 0.0) {
      newOperations.push(ShadeAPI.operations.sharpen(adjustments.sharpen));
    }
    if (adjustments.noise > 0.0) {
      newOperations.push(ShadeAPI.operations.noise(adjustments.noise));
    }

    // Log unsupported adjustments for debugging
    const unsupportedAdjustments = [];
    if (adjustments.highlights !== 0.0)
      unsupportedAdjustments.push("highlights");
    if (adjustments.shadows !== 0.0) unsupportedAdjustments.push("shadows");
    if (adjustments.whites !== 0.0) unsupportedAdjustments.push("whites");
    if (adjustments.blacks !== 0.0) unsupportedAdjustments.push("blacks");
    if (adjustments.vibrance !== 0.0) unsupportedAdjustments.push("vibrance");
    if (adjustments.clarity !== 0.0) unsupportedAdjustments.push("clarity");
    if (adjustments.dehaze !== 0.0) unsupportedAdjustments.push("dehaze");

    if (unsupportedAdjustments.length > 0) {
      console.warn(
        "Unsupported adjustments ignored:",
        unsupportedAdjustments.join(", ")
      );
    }

    setOperations(newOperations);
  }, [adjustments]);

  /**
   * Debounced image processing function
   * Handles the core processing workflow with Shade API
   */
  const process = useCallback(
    debounce(
      async (args: { selectedFile: string; operations: OperationSpec[] }) => {
        setPreviewState((prev) => ({ ...prev, isProcessing: true }));

        try {
          const result = await ShadeAPI.processImageFile(
            args.selectedFile,
            args.operations,
            "png"
          );

          /**
           * Binary Data Processing:
           * 1. Result is already Uint8Array from Tauri
           * 2. Create blob with PNG MIME type
           * 3. Create object URL for display in img elements
           */
          const binaryData = new Uint8Array(result);
          const blob = new Blob([binaryData], {
            type: "image/png",
          });
          const blobUrl = URL.createObjectURL(blob);

          setPreviewState((prev) => ({
            ...prev,
            processed: prev.original
              ? {
                  ...prev.original,
                  src: blobUrl,
                  name: `processed_${prev.original.name}`,
                }
              : null,
            isProcessing: false,
          }));
        } catch (err) {
          console.error("Preview processing failed:", err);
          setError(`Preview failed: ${err}`);
          setPreviewState((prev) => ({ ...prev, isProcessing: false }));
        }
      },
      debounceMs
    ),
    []
  );

  /**
   * Live preview system with debouncing
   *
   * This effect handles the core preview functionality:
   * 1. Debounces adjustment changes
   * 2. Sends processing request to Shade server
   * 3. Retrieves binary attachment containing processed image
   * 4. Creates blob URL for display in UI
   * 5. Cleans up blob URLs to prevent memory leaks
   */
  useEffect(() => {
    if (!selectedFile || operations.length === 0) {
      // Reset to original image if no operations
      setPreviewState((prev) => ({
        ...prev,
        processed: prev.original,
        isProcessing: false,
      }));
      return;
    }

    process({
      selectedFile,
      operations,
    });
  }, [selectedFile, operations, process]);

  /**
   * Memory Management: Clean up blob URLs to prevent memory leaks
   * Blob URLs must be explicitly revoked when no longer needed
   */
  useEffect(() => {
    return () => {
      // Clean up all blob URLs when component unmounts or state changes
      if (previewState.processed?.src?.startsWith("blob:")) {
        URL.revokeObjectURL(previewState.processed.src);
      }
      if (previewState.original?.src?.startsWith("blob:")) {
        URL.revokeObjectURL(previewState.original.src);
      }
    };
  }, [previewState.processed, previewState.original]);

  /**
   * Multi-method image loading with fallbacks
   * Tries different approaches to load images in Tauri environment
   */
  const tryLoadImage = useCallback(
    async (filePath: string): Promise<ImageData> => {
      const fileName = filePath.split("/").pop() || "Unknown";

      // Method 1: Try Tauri's convertFileSrc first (recommended)
      try {
        const tauriSrc = convertFileSrc(filePath);

        const imageData = await new Promise<ImageData>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              src: tauriSrc,
              width: img.naturalWidth,
              height: img.naturalHeight,
              name: fileName,
            });
          };
          img.onerror = () => {
            reject(new Error("Tauri method failed"));
          };
          img.src = tauriSrc;
        });

        return imageData;
      } catch (error) {
        // Continue to next method
      }

      // Method 2: Use custom Tauri command to read file as raw bytes and create blob
      try {
        // Use our custom Tauri command to read the file as bytes and create blob URL
        const blobUrl = await ShadeAPI.readImageAsBlob(filePath);

        const imageData = await new Promise<ImageData>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              src: blobUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
              name: fileName,
            });
          };
          img.onerror = () => {
            URL.revokeObjectURL(blobUrl); // Clean up on error
            reject(new Error("Binary blob method failed"));
          };
          img.src = blobUrl;
        });

        return imageData;
      } catch (error) {
        // Continue to next method
      }

      // Method 3: Try various URL encoding approaches as fallback
      const encodedPath = encodeURI(filePath);
      const encodedPathComponents = filePath
        .split("/")
        .map(encodeURIComponent)
        .join("/");

      const urlsToTry = [
        `file://${encodedPath}`,
        `file://${encodedPathComponents}`,
        `file://localhost${encodedPath}`,
        `file://localhost${encodedPathComponents}`,
        `file://${filePath.replace(/\s+/g, "%20")}`,
      ];

      for (let i = 0; i < urlsToTry.length; i++) {
        const srcUrl = urlsToTry[i];
        try {
          const imageData = await new Promise<ImageData>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              resolve({
                src: srcUrl,
                width: img.naturalWidth,
                height: img.naturalHeight,
                name: fileName,
              });
            };
            img.onerror = () => {
              reject(new Error(`Failed to load: ${srcUrl}`));
            };
            img.src = srcUrl;
          });

          return imageData;
        } catch (error) {
          // Continue to next method
        }
      }

      throw new Error(`All loading methods failed for: ${filePath}`);
    },
    []
  );

  /**
   * File selection handler with integrated image loading
   * Opens file dialog and loads selected image with error handling
   */
  const selectFile = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Images",
            extensions: [
              "jpg",
              "jpeg",
              "png",
              "tiff",
              "tif",
              "bmp",
              "webp",
              "cr3",
              "arw",
              "nef",
              "dng",
              "raw",
            ],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        setSelectedFile(selected);
        setError(null);

        try {
          // Use the improved image loading method
          const imageData = await tryLoadImage(selected);

          setPreviewState({
            original: imageData,
            processed: null,
            isProcessing: false,
          });
        } catch (error) {
          console.error("All image loading methods failed:", error);
          setError(
            `Unable to load image "${selected
              .split("/")
              .pop()}". Please check file permissions, format support, or try a different image.`
          );

          // Set a minimal state so UI doesn't break
          setPreviewState({
            original: {
              src: "",
              width: 0,
              height: 0,
              name: selected.split("/").pop() || "Unknown",
            },
            processed: null,
            isProcessing: false,
          });
        }
      }
    } catch (err) {
      setError(`Failed to select file: ${err}`);
    }
  }, [tryLoadImage]);

  /**
   * Shade API status monitoring
   * Periodically checks if the Shade server is running and responsive
   */
  useEffect(() => {
    if (!enableStatusCheck) return;

    const checkStatus = async () => {
      try {
        const status = await ShadeAPI.getShadeStatus();
        setShadeStatus(status);
      } catch (err) {
        console.error("Failed to get Shade status:", err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, statusCheckInterval);
    return () => clearInterval(interval);
  }, [enableStatusCheck, statusCheckInterval]);

  /**
   * Update individual adjustment parameter
   */
  const updateAdjustment = useCallback(
    (key: keyof ImageAdjustments, value: number) => {
      setAdjustments((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Reset all adjustments to default values
   */
  const resetAdjustments = useCallback(() => {
    setAdjustments({ ...defaultAdjustments, ...initialAdjustments });
  }, [initialAdjustments]);

  /**
   * Clear current error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    selectedFile,
    previewState,
    error,
    shadeStatus,
    operations,
    adjustments,

    // Actions
    selectFile,
    updateAdjustment,
    resetAdjustments,
    setSelectedFile,
    clearError,

    // Utilities
    tryLoadImage,
  };
}
