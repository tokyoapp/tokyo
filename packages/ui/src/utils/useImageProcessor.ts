import { createSignal, createEffect, createMemo, onCleanup } from "solid-js";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";

// Types matching the Rust structs
export interface ImageInput {
  type: "file" | "base64";
  path?: string;
  data?: string;
}

export interface OperationSpec {
  operation: string;
  params: unknown;
}

export interface ProcessImageRequest {
  image: ImageInput;
  operations: OperationSpec[];
  output_format?: string;
}

export interface ProcessImageResult {
  image_attachment_id: string;
  width: number;
  height: number;
  format: string;
}

export interface ShadeStatus {
  running: boolean;
  pending_requests: number;
  message_counter: number;
}

export interface ServerCapabilities {
  supported_operations: string[];
  supported_input_formats: string[];
  supported_output_formats: string[];
}

// Shade API utility functions
export const ShadeAPI = {
  /**
   * Convenience method to process an image from a file path
   */
  async processImageFile(
    filePath: string,
    operations: OperationSpec[],
    outputFormat: string = "png",
  ): Promise<Uint8Array> {
    const request: ProcessImageRequest = {
      image: { type: "file", path: filePath },
      operations,
      output_format: outputFormat,
    };
    return ShadeAPI.processImage(request);
  },

  /**
   * Process an image with the specified operations
   */
  async processImage(request: ProcessImageRequest): Promise<Uint8Array> {
    return invoke("shade", { method: "process_image", request });
  },

  /**
   * Process an image with the specified operations
   */
  async getAttachment(attachment_id: string): Promise<Uint8Array> {
    return invoke("shade", {
      method: "get_attachment",
      request: {
        attachment_id: attachment_id,
      },
    });
  },

  /**
   * Get server capabilities (supported operations, formats, etc.)
   */
  async initialize(): Promise<ServerCapabilities> {
    return invoke("shade", { method: "initialize" });
  },

  /**
   * Get detailed status of the Shade process
   */
  async getShadeStatus(): Promise<ShadeStatus> {
    return invoke("shade_status");
  },

  /**
   * Read image file as raw bytes and create blob URL
   *
   * This method reads an image file from the local filesystem as raw bytes and creates
   * a blob URL for display. This is useful for files with problematic paths (spaces,
   * special characters) that don't work well with convertFileSrc or file:// URLs.
   *
   * @param filePath - Full path to the image file
   * @returns Promise<string> - Blob URL that can be used in img elements
   *
   * @example
   * ```typescript
   * // Read image with spaces in filename
   * const blobUrl = await ShadeAPI.readImageAsBlob("/path/to/my image.jpg");
   *
   * // Use in img element
   * imageElement.src = blobUrl;
   *
   * // Remember to clean up when done
   * URL.revokeObjectURL(blobUrl);
   * ```
   */
  async readImageAsBlob(filePath: string): Promise<string> {
    // Get raw bytes from Tauri command
    const binaryData = await invoke<number[]>("get_image", {
      filePath,
    });

    // Convert number array to Uint8Array
    const uint8Array = new Uint8Array(binaryData);

    // Create blob and return object URL
    const blob = new Blob([uint8Array]);
    return URL.createObjectURL(blob);
  },

  /**
   * Helper to create common operations
   */
  operations: {
    brightness: (value: number): OperationSpec => ({
      operation: "brightness",
      params: value,
    }),

    contrast: (value: number): OperationSpec => ({
      operation: "contrast",
      params: value,
    }),

    saturation: (value: number): OperationSpec => ({
      operation: "saturation",
      params: value,
    }),

    hue: (value: number): OperationSpec => ({
      operation: "hue",
      params: value,
    }),

    gamma: (value: number): OperationSpec => ({
      operation: "gamma",
      params: value,
    }),

    whiteBalance: (options: {
      auto_adjust?: boolean;
      temperature?: number;
      tint?: number;
    }): OperationSpec => ({
      operation: "white_balance",
      params: options,
    }),

    blur: (value: number): OperationSpec => ({
      operation: "blur",
      params: value,
    }),

    sharpen: (value: number): OperationSpec => ({
      operation: "sharpen",
      params: value,
    }),

    noise: (value: number): OperationSpec => ({
      operation: "noise",
      params: value,
    }),

    resize: (options: { width?: number; height?: number }): OperationSpec => ({
      operation: "resize",
      params: options,
    }),
  },
};

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
  selectedFile: () => string | null;
  previewState: () => PreviewState;
  error: () => string | null;
  shadeStatus: () => ShadeStatus | null;
  operations: () => OperationSpec[];
  adjustments: () => ImageAdjustments;

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
 * Custom composable for image processing functionality
 *
 * Provides complete image processing workflow including:
 * - File selection and loading with multiple fallback methods
 * - Real-time preview with debounced processing
 * - Adjustment parameter management
 * - Shade API integration and status monitoring
 * - Memory management for blob URLs
 *
 * @param options Configuration options for the composable
 * @returns Object containing all image processing state and functions
 */
export function useImageProcessor(
  options: UseImageProcessorOptions = {},
): UseImageProcessorReturn {
  const {
    initialAdjustments = {},
    debounceMs = 80,
    enableStatusCheck = true,
    statusCheckInterval = 5000,
  } = options;

  // Core state management
  const [selectedFile, setSelectedFile] = createSignal<string | null>(null);
  const [previewState, setPreviewState] = createSignal<PreviewState>({
    original: null,
    processed: null,
    isProcessing: false,
  });
  const [error, setError] = createSignal<string | null>(null);
  const [shadeStatus, setShadeStatus] = createSignal<ShadeStatus | null>(null);
  const [adjustments, setAdjustments] = createSignal<ImageAdjustments>({
    ...defaultAdjustments,
    ...initialAdjustments,
  });

  /**
   * Convert UI adjustment values to Shade operations
   * Maps slider values to appropriate operation parameters
   */
  const operations = createMemo(() => {
    const newOperations: OperationSpec[] = [];
    const currentAdjustments = adjustments();

    // Combine exposure and brightness into a single brightness operation
    const combinedBrightness =
      (1.0 + currentAdjustments.exposure) * currentAdjustments.brightness;
    if (combinedBrightness !== 1.0) {
      newOperations.push(ShadeAPI.operations.brightness(combinedBrightness));
    }
    if (currentAdjustments.contrast !== 1.0) {
      newOperations.push(
        ShadeAPI.operations.contrast(currentAdjustments.contrast),
      );
    }
    if (currentAdjustments.saturation !== 1.0) {
      newOperations.push(
        ShadeAPI.operations.saturation(currentAdjustments.saturation),
      );
    }
    if (currentAdjustments.hue !== 0.0) {
      newOperations.push(ShadeAPI.operations.hue(currentAdjustments.hue));
    }
    if (currentAdjustments.gamma !== 1.0) {
      newOperations.push(ShadeAPI.operations.gamma(currentAdjustments.gamma));
    }
    if (
      currentAdjustments.temperature !== 0.0 ||
      currentAdjustments.tint !== 0.0
    ) {
      newOperations.push(
        ShadeAPI.operations.whiteBalance({
          temperature: 5500 + currentAdjustments.temperature * 2000,
          tint: currentAdjustments.tint,
        }),
      );
    }
    if (currentAdjustments.blur > 0.0) {
      newOperations.push(ShadeAPI.operations.blur(currentAdjustments.blur));
    }
    if (currentAdjustments.sharpen > 0.0) {
      newOperations.push(
        ShadeAPI.operations.sharpen(currentAdjustments.sharpen),
      );
    }
    if (currentAdjustments.noise > 0.0) {
      newOperations.push(ShadeAPI.operations.noise(currentAdjustments.noise));
    }

    // Log unsupported adjustments for debugging
    const unsupportedAdjustments = [];
    if (currentAdjustments.highlights !== 0.0)
      unsupportedAdjustments.push("highlights");
    if (currentAdjustments.shadows !== 0.0)
      unsupportedAdjustments.push("shadows");
    if (currentAdjustments.whites !== 0.0)
      unsupportedAdjustments.push("whites");
    if (currentAdjustments.blacks !== 0.0)
      unsupportedAdjustments.push("blacks");
    if (currentAdjustments.vibrance !== 0.0)
      unsupportedAdjustments.push("vibrance");
    if (currentAdjustments.clarity !== 0.0)
      unsupportedAdjustments.push("clarity");
    if (currentAdjustments.dehaze !== 0.0)
      unsupportedAdjustments.push("dehaze");

    if (unsupportedAdjustments.length > 0) {
      console.warn(
        "Unsupported adjustments ignored:",
        unsupportedAdjustments.join(", "),
      );
    }

    return newOperations;
  });

  /**
   * Debounced image processing function
   * Handles the core processing workflow with Shade API
   */
  const process = debounce(
    async (args: { selectedFile: string; operations: OperationSpec[] }) => {
      setPreviewState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const result = await ShadeAPI.processImageFile(
          args.selectedFile,
          args.operations,
          "png",
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
    debounceMs,
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
  createEffect(() => {
    const currentFile = selectedFile();
    const currentOperations = operations();

    if (!currentFile || currentOperations.length === 0) {
      // Reset to original image if no operations
      setPreviewState((prev) => ({
        ...prev,
        processed: prev.original,
        isProcessing: false,
      }));
      return;
    }

    process({
      selectedFile: currentFile,
      operations: currentOperations,
    });
  });

  /**
   * Memory Management: Clean up blob URLs to prevent memory leaks
   * Blob URLs must be explicitly revoked when no longer needed
   */
  onCleanup(() => {
    const state = previewState();
    // Clean up all blob URLs when component unmounts or state changes
    if (state.processed?.src?.startsWith("blob:")) {
      URL.revokeObjectURL(state.processed.src);
    }
    if (state.original?.src?.startsWith("blob:")) {
      URL.revokeObjectURL(state.original.src);
    }
  });

  /**
   * Multi-method image loading with fallbacks
   * Tries different approaches to load images in Tauri environment
   */
  const tryLoadImage = async (filePath: string): Promise<ImageData> => {
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
  };

  /**
   * File selection handler with integrated image loading
   * Opens file dialog and loads selected image with error handling
   */
  const selectFile = async () => {
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
              .pop()}". Please check file permissions, format support, or try a different image.`,
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
  };

  /**
   * Shade API status monitoring
   * Periodically checks if the Shade server is running and responsive
   */
  createEffect(() => {
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

    onCleanup(() => clearInterval(interval));
  });

  /**
   * Update individual adjustment parameter
   */
  const updateAdjustment = (key: keyof ImageAdjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Reset all adjustments to default values
   */
  const resetAdjustments = () => {
    setAdjustments({ ...defaultAdjustments, ...initialAdjustments });
  };

  /**
   * Clear current error message
   */
  const clearError = () => {
    setError(null);
  };

  return {
    // State (as getter functions for SolidJS reactivity)
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
