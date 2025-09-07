import type React from "react";
import { useState, useEffect } from "react";
import { useImageProcessor } from "../hooks/useImageProcessor";

interface ImageProcessorProps {
  className?: string;
}

const Slider = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  unit = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
}) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-2">
      <label className="text-sm font-medium text-gray-200">{label}</label>
      <span className="text-sm text-gray-400 w-16 text-right">
        {value.toFixed(2)}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
    />
  </div>
);

const PanelButton = ({
  panel: id,
  label,
  icon,
  shortcut,
  activePanel,
  setActivePanel,
}: {
  panel: string;
  label: string;
  icon: string;
  shortcut?: string;
  setActivePanel: React.Dispatch<React.SetStateAction<string>>;
  activePanel: string;
}) => (
  <button
    type="button"
    onClick={() => setActivePanel(id)}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative group ${
      activePanel === id
        ? "bg-blue-600 text-white"
        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
    }`}
    data-tooltip={shortcut ? `Press ${shortcut}` : undefined}
  >
    <span className="mr-2">{icon}</span>
    {label}
    {shortcut && (
      <span className="absolute top-1 right-1 text-xs opacity-50 group-hover:opacity-100 transition-opacity">
        {shortcut}
      </span>
    )}
  </button>
);

const ImageProcessor: React.FC<ImageProcessorProps> = () => {
  // Use the image processing hook
  const {
    selectedFile,
    previewState,
    error,
    shadeStatus,
    operations,
    adjustments,
    selectFile,
    updateAdjustment,
  } = useImageProcessor();

  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [activePanel, setActivePanel] = useState<
    "basic" | "tone" | "color" | "effects"
  >("basic");

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + I to import image
      if ((event.metaKey || event.ctrlKey) && event.key === "i") {
        event.preventDefault();
        selectFile();
      }
      // B key for before/after toggle
      if (event.key === "b" && !event.metaKey && !event.ctrlKey) {
        if (previewState.original) {
          setShowBeforeAfter(!showBeforeAfter);
        }
      }
      // Number keys for panel switching
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        switch (event.key) {
          case "1":
            setActivePanel("basic");
            break;
          case "2":
            setActivePanel("tone");
            break;
          case "3":
            setActivePanel("color");
            break;
          case "4":
            setActivePanel("effects");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectFile, showBeforeAfter, previewState.original]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Center - Image Preview */}
      <div className="flex-1 flex flex-col">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-4">
          {selectedFile && previewState.original ? (
            <div className="relative max-w-full max-h-full">
              <div className="text-center">
                <div className="relative mb-4">
                  {previewState.processed?.src || previewState.original.src ? (
                    <img
                      src={
                        previewState.processed?.src || previewState.original.src
                      }
                      alt="Preview"
                      className="max-w-full max-h-96 object-contain"
                      style={{ maxHeight: "calc(100vh - 300px)" }}
                      onError={(e) => {
                        console.error(
                          "Preview image error for:",
                          previewState.processed?.src ||
                            previewState.original.src
                        );
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : (
                    <div className="max-w-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-6xl mb-4">⚠️</div>
                        <div className="text-lg mb-2">Unable to Load Image</div>
                        <div className="text-sm text-gray-400 max-w-md">
                          The selected image could not be loaded. This might be
                          due to:
                        </div>
                        <div className="text-xs text-gray-400 mt-2 space-y-1">
                          <div>• File permissions restrictions</div>
                          <div>• Unsupported image format</div>
                          <div>• File path contains special characters</div>
                          <div>• File has been moved or deleted</div>
                        </div>
                        <div className="text-xs text-blue-400 mt-3">
                          Check browser console for detailed error info
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="hidden text-center py-20 text-gray-500">
                    <div className="text-4xl mb-2">❌</div>
                    <div>Failed to load image</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">📁</div>
              <div className="text-xl mb-2">No image selected</div>
              <div className="text-sm">Click Import Image to get started</div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Adjustment Panels */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center space-x-2">
              <div
                className={`status-indicator ${
                  previewState.isProcessing
                    ? "processing"
                    : shadeStatus?.running
                    ? "online"
                    : "offline"
                }`}
              ></div>
              <span className="text-sm text-gray-400">
                {previewState.isProcessing
                  ? "Processing..."
                  : shadeStatus?.running
                  ? "Ready"
                  : "Disconnected"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={selectFile}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium tooltip"
            data-tooltip="Cmd+I"
          >
            📁 Import Image
          </button>

          {/* Image Info */}
          {previewState.original && (
            <div className="space-y-1 text-sm text-gray-400 mt-4">
              <div>Name: {previewState.original.name}</div>
              <div>
                Size: {previewState.original.width} ×{" "}
                {previewState.original.height}
              </div>
              <div>
                Format:{" "}
                {previewState.original.name.split(".").pop()?.toUpperCase() ||
                  "Unknown"}
              </div>
            </div>
          )}
        </div>

        {/* Panel Navigation */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <PanelButton
              panel="basic"
              label="Basic"
              icon="🔆"
              shortcut="1"
              activePanel={activePanel}
              setActivePanel={setActivePanel}
            />
            <PanelButton
              panel="tone"
              label="Tone"
              icon="📊"
              shortcut="2"
              activePanel={activePanel}
              setActivePanel={setActivePanel}
            />
            <PanelButton
              panel="color"
              label="Color"
              icon="🎨"
              shortcut="3"
              activePanel={activePanel}
              setActivePanel={setActivePanel}
            />
            <PanelButton
              panel="effects"
              label="Effects"
              icon="✨"
              shortcut="4"
              activePanel={activePanel}
              setActivePanel={setActivePanel}
            />
          </div>
        </div>

        {/* Adjustment Controls */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activePanel === "basic" && (
            <div>
              <h3 className="font-medium mb-4 text-lg">Basic Adjustments</h3>
              <Slider
                label="Exposure"
                value={adjustments.exposure}
                min={-2.0}
                max={2.0}
                onChange={(value) => updateAdjustment("exposure", value)}
              />
              <Slider
                label="Highlights"
                value={adjustments.highlights}
                min={-100}
                max={100}
                step={1}
                onChange={(value) => updateAdjustment("highlights", value)}
              />
              <Slider
                label="Shadows"
                value={adjustments.shadows}
                min={-100}
                max={100}
                step={1}
                onChange={(value) => updateAdjustment("shadows", value)}
              />
              <Slider
                label="Whites"
                value={adjustments.whites}
                min={-100}
                max={100}
                step={1}
                onChange={(value) => updateAdjustment("whites", value)}
              />
              <Slider
                label="Blacks"
                value={adjustments.blacks}
                min={-100}
                max={100}
                step={1}
                onChange={(value) => updateAdjustment("blacks", value)}
              />
            </div>
          )}

          {activePanel === "tone" && (
            <div>
              <h3 className="font-medium mb-4 text-lg">Tone Curve</h3>
              <Slider
                label="Brightness"
                value={adjustments.brightness}
                min={0.1}
                max={2.0}
                onChange={(value) => updateAdjustment("brightness", value)}
              />
              <Slider
                label="Contrast"
                value={adjustments.contrast}
                min={0.1}
                max={2.0}
                onChange={(value) => updateAdjustment("contrast", value)}
              />
              <Slider
                label="Gamma"
                value={adjustments.gamma}
                min={0.1}
                max={3.0}
                onChange={(value) => updateAdjustment("gamma", value)}
              />
            </div>
          )}

          {activePanel === "color" && (
            <div>
              <h3 className="font-medium mb-4 text-lg">Color Adjustments</h3>
              <Slider
                label="Temperature"
                value={adjustments.temperature}
                min={-1.0}
                max={1.0}
                onChange={(value) => updateAdjustment("temperature", value)}
              />
              <Slider
                label="Tint"
                value={adjustments.tint}
                min={-1.0}
                max={1.0}
                onChange={(value) => updateAdjustment("tint", value)}
              />
              <Slider
                label="Saturation"
                value={adjustments.saturation}
                min={0.0}
                max={2.0}
                onChange={(value) => updateAdjustment("saturation", value)}
              />
              <Slider
                label="Vibrance"
                value={adjustments.vibrance}
                min={-100}
                max={100}
                step={1}
                onChange={(value) => updateAdjustment("vibrance", value)}
              />
              <Slider
                label="Hue"
                value={adjustments.hue}
                min={-180}
                max={180}
                step={1}
                onChange={(value) => updateAdjustment("hue", value)}
                unit="°"
              />
            </div>
          )}

          {activePanel === "effects" && (
            <div>
              <h3 className="font-medium mb-4 text-lg">Effects</h3>
              <Slider
                label="Clarity"
                value={adjustments.clarity}
                min={-100}
                max={100}
                step={1}
                onChange={(value) => updateAdjustment("clarity", value)}
              />
              <Slider
                label="Dehaze"
                value={adjustments.dehaze}
                min={-100}
                max={100}
                step={1}
                onChange={(value) => updateAdjustment("dehaze", value)}
              />
              <Slider
                label="Blur"
                value={adjustments.blur}
                min={0.0}
                max={10.0}
                onChange={(value) => updateAdjustment("blur", value)}
              />
              <Slider
                label="Sharpen"
                value={adjustments.sharpen}
                min={0.0}
                max={2.0}
                onChange={(value) => updateAdjustment("sharpen", value)}
              />
              <Slider
                label="Noise"
                value={adjustments.noise}
                min={0.0}
                max={1.0}
                onChange={(value) => updateAdjustment("noise", value)}
              />
            </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {/* Status Information */}
          <div className="text-xs text-gray-400 mb-2">Status</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Operations:</span>
              <span className="text-white">{operations.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Processing:</span>
              <span
                className={
                  previewState.isProcessing
                    ? "text-yellow-400"
                    : "text-green-400"
                }
              >
                {previewState.isProcessing ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Shade Server:</span>
              <span
                className={
                  shadeStatus?.running ? "text-green-400" : "text-red-400"
                }
              >
                {shadeStatus?.running ? "Running" : "Stopped"}
              </span>
            </div>
            {shadeStatus?.running && (
              <div className="flex justify-between">
                <span className="text-gray-400">Pending:</span>
                <span className="text-white">
                  {shadeStatus.pending_requests}
                </span>
              </div>
            )}

            {operations.length > 0 && (
              <div className="pt-1 border-t border-gray-700 mt-1">
                <div className="text-xs text-gray-400 mb-1">
                  Current Operations
                </div>
                {operations.map((op, index) => (
                  <div key={index} className="text-xs text-gray-300">
                    {index + 1}. {op.operation}
                    {typeof op.params === "number"
                      ? ` (${op.params.toFixed(2)})`
                      : op.params && typeof op.params === "object"
                      ? ` (${JSON.stringify(op.params).substring(0, 20)}...)`
                      : ""}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Image Loaded:</span>
              <span
                className={
                  previewState.original?.src ? "text-green-400" : "text-red-400"
                }
              >
                {previewState.original?.src ? "Yes" : "No"}
              </span>
            </div>
            {selectedFile && (
              <div className="pt-1 border-t border-gray-700 mt-1">
                <div className="text-xs text-gray-400 mb-1">Debug Info</div>
                <div className="text-xs text-gray-300 break-all">
                  File: {selectedFile.split("/").pop()}
                </div>
                {previewState.original?.src && (
                  <div className="text-xs text-gray-300 break-all mt-1">
                    Method:{" "}
                    {previewState.original.src.startsWith("blob:")
                      ? "Binary Blob"
                      : "File URL"}
                  </div>
                )}
                {previewState.original?.src && (
                  <div className="text-xs text-gray-300 break-all mt-1">
                    URL: {previewState.original?.src.substring(0, 50)}...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Debug/Test Controls */}
        {error && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-gray-800 border border-gray-700 rounded-lg p-2 opacity-0 hover:opacity-100 transition-opacity">
        <div className="font-medium mb-1">Keyboard Shortcuts</div>
        <div className="space-y-0.5">
          <div>Cmd+I: Import Image</div>
          <div>B: Toggle Before/After</div>
          <div>1-5: Switch Panels</div>
        </div>
      </div>
    </div>
  );
};

export default ImageProcessor;
