import { invoke } from "@tauri-apps/api/core";

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
	binary_attachments: {
		id: string;
		content_type: string;
		size: number;
		data: number[];
	}[];
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
	): Promise<ProcessImageResult> {
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
	async processImage(
		request: ProcessImageRequest,
	): Promise<ProcessImageResult> {
		return invoke("shade", { method: "process_image", request });
	},

	/**
	 * Process an image with the specified operations
	 */
	async getAttachment(attachment_id: string): Promise<ProcessImageResult> {
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
