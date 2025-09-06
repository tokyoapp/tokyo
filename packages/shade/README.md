# Shade - GPU-Accelerated Image Processing

Shade is a powerful, GPU-accelerated image processing and color grading tool that can be used both as a command-line utility and as a language server-style socket service for integration into other applications.

## Features

- **GPU-Accelerated Processing**: Leverages WGPU for high-performance image operations
- **Multiple Operation Modes**: CLI, socket/server mode for integration
- **Rich Image Operations**: Brightness, contrast, saturation, hue, gamma, white balance, blur, sharpen, noise, scale, and rotate
- **Format Support**: PNG, JPEG, BMP, TIFF, OpenEXR (HDR), Camera Raw (CR3, CR2, NEF, ARW, DNG, RW2)
- **Persistent Cache**: Automatic caching of decoded raw images for faster repeated processing
- **High Precision**: 32-bit float processing pipeline with 16-bit output for maximum quality
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **WebAssembly Support**: Can run in browsers

## Installation

### From Source

```bash
git clone https://github.com/luckydye/shade
cd shade
cargo build --release
```

The binary will be available at `target/release/shade`.

### Dependencies

- Rust 2024 Edition
- WGPU-compatible GPU (most modern GPUs)
- For socket mode: serde, tokio, base64 dependencies (included)

## Usage

### Command Line Mode

#### Basic Usage

```bash
# Apply brightness adjustment
shade input.jpg --brightness 1.2 -o output.jpg

# Apply multiple operations in sequence
shade input.jpg --brightness 1.2 --contrast 1.1 --saturation 1.3 -o output.jpg

# Generate example image
shade --example example.png
```

#### Available Operations

- `--brightness <value>`: Adjust brightness (0.0=black, 1.0=normal, 2.0=double)
- `--contrast <value>`: Adjust contrast (0.0=gray, 1.0=normal, 2.0=high)
- `--saturation <value>`: Adjust saturation (0.0=grayscale, 1.0=normal)
- `--hue <degrees>`: Rotate hue (-180 to 180 degrees)
- `--gamma <value>`: Gamma correction (0.5=darker, 1.0=normal, 2.0=lighter)
- `--blur <radius>`: Apply blur with specified radius
- `--sharpen <amount>`: Apply sharpening
- `--noise <amount>`: Add noise
- `--scale <factor>`: Scale image (0.5=half, 2.0=double)
- `--rotate <degrees>`: Rotate image

#### White Balance

```bash
# Auto white balance
shade input.jpg --auto-white-balance -o output.jpg

# Manual white balance
shade input.jpg --white-balance-temperature 5500 --white-balance-tint 0.1 -o output.jpg
```

### Socket Mode

Shade can operate as a language server-style process for integration with other applications.

#### Starting Socket Mode

```bash
shade --socket
```

The process will:
- Listen for JSON-RPC messages on stdin
- Send responses via stdout
- Use Content-Length headers for message framing (LSP-style)
- Log to stderr

#### Protocol Overview

All messages follow JSON-RPC 2.0 with Content-Length headers:

```
Content-Length: 123\r\n
\r\n
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
```

#### Basic Example with Python Client

```python
from example_client import ShadeClient

client = ShadeClient()
client.start_server("./target/release/shade")

# Initialize
capabilities = client.initialize()

# Process image
result = client.process_image_file(
    input_path="/path/to/image.jpg",
    operations=[
        {"operation": "brightness", "params": 1.2},
        {"operation": "contrast", "params": 1.1}
    ],
    output_format="png"
)

# Save result
import base64
with open("output.png", "wb") as f:
    f.write(base64.b64decode(result["image_data"]))

client.stop_server()
```

#### Supported Socket Methods

1. **initialize** - Initialize server and get capabilities
2. **process_image** - Process image with specified operations
3. **shutdown** - Gracefully shutdown server
4. **exit** - Immediately exit server

#### Image Input Formats

**File Path:**
```json
{
  "type": "file",
  "path": "/absolute/path/to/image.jpg"
}
```

**Base64 Data:**
```json
{
  "type": "base64",
  "data": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Binary Blob:**
```json
{
  "type": "blob",
  "data": [137, 80, 78, 71, 13, 10, 26, 10, ...]
}
```

#### Operation Parameters

**Simple Operations (single parameter):**
```json
{"operation": "brightness", "params": 1.5}
{"operation": "contrast", "params": 1.2}
{"operation": "saturation", "params": 1.3}
{"operation": "hue", "params": 30.0}
{"operation": "gamma", "params": 1.2}
{"operation": "blur", "params": 2.0}
{"operation": "sharpen", "params": 1.5}
{"operation": "noise", "params": 0.1}
{"operation": "scale", "params": 1.5}
{"operation": "rotate", "params": 90.0}
```

**White Balance (complex parameters):**
```json
{
  "operation": "white_balance",
  "params": {
    "auto_adjust": false,
    "temperature": 5500.0,
    "tint": 0.1
  }
}
```

## Examples

### CLI Examples

```bash
# Basic color grading
shade photo.jpg --brightness 1.1 --contrast 1.2 --saturation 1.1 -o graded.jpg

# Artistic effect
shade photo.jpg --hue 30 --saturation 1.5 --blur 0.5 --noise 0.05 -o artistic.png

# HDR processing
shade hdr_image.exr --gamma 0.8 --contrast 1.3 -o processed.png

# Batch-style with chaining
shade input.jpg --brightness 1.2 | shade --stdin --contrast 1.1 -o output.jpg
```

### Socket Mode Integration Examples

#### Node.js Integration
```javascript
const { spawn } = require('child_process');

const shade = spawn('./target/release/shade', ['--socket']);

function sendMessage(method, params) {
  const message = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };

  const json = JSON.stringify(message);
  const header = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n`;

  shade.stdin.write(header + json);
}

// Initialize
sendMessage('initialize', {
  client_info: { name: 'node-client', version: '1.0.0' }
});

// Process image
sendMessage('process_image', {
  image: { type: 'file', path: '/absolute/path/to/image.jpg' },
  operations: [
    { operation: 'brightness', params: 1.2 },
    { operation: 'contrast', params: 1.1 }
  ],
  output_format: 'png'
});
```

#### Python Integration
See `example_client.py` for a complete working example.

## Advanced Usage

### Custom Pipeline Building

Operations are applied in the order specified:

```json
{
  "operations": [
    {"operation": "gamma", "params": 1.2},      // Applied first
    {"operation": "brightness", "params": 1.1},  // Applied second
    {"operation": "contrast", "params": 1.2},    // Applied third
    {"operation": "saturation", "params": 1.3}   // Applied last
  ]
}
```

### Camera Raw Processing

Shade supports Camera Raw files from major camera manufacturers:

**Supported Raw Formats:**
- Canon: CR3, CR2
- Nikon: NEF
- Sony: ARW
- Adobe: DNG
- Panasonic: RW2

**Raw Processing Features:**
- Automatic raw decoding using rawler
- Default development pipeline for natural-looking results
- Persistent caching for faster repeated processing
- Full 32-bit float precision throughout the pipeline

```bash
# Process Canon CR3 file
shade IMG_1234.CR3 --brightness 0.2 --contrast 1.1 -o processed.jpg

# Batch process with white balance
shade photo.NEF --auto-white-balance --sharpen 0.5 -o output.tiff

# Raw to HDR workflow
shade image.ARW --gamma 0.8 -o enhanced.exr
```

### Cache Management

Shade automatically caches decoded raw images to dramatically improve performance on repeated processing:

**Cache Features:**
- Automatic caching of expensive raw decode operations
- Content-based cache keys (same file = same cache entry)
- Version-aware cache (automatic cleanup on software updates)
- Cross-platform cache location
- Automatic cleanup of old cache files (30+ days)

**Cache Commands:**
```bash
# Show cache information
shade --cache-info

# Clear all cached data
shade --clear-cache

# Process raw file (first time: ~3-5 seconds, subsequent: ~0.5 seconds)
shade large_raw.CR3 --brightness 0.1 -o output.jpg
```

**Cache Locations:**
- macOS: `~/Library/Caches/shade/raw_cache/`
- Linux: `~/.cache/shade/raw_cache/`
- Windows: `%LOCALAPPDATA%\shade\raw_cache\`

**Performance Impact:**
- First raw file load: 3-5 seconds (depending on file size)
- Cached raw file load: 0.3-0.8 seconds
- Cache hit rate typically >90% in normal workflows

### High Dynamic Range (HDR)

Shade supports OpenEXR files for HDR processing:

```bash
# Process HDR image
shade hdr_image.exr --gamma 0.7 --contrast 1.4 -o processed.png

# Socket mode with HDR
{
  "image": {"type": "file", "path": "/path/to/image.exr"},
  "operations": [
    {"operation": "gamma", "params": 0.8},
    {"operation": "contrast", "params": 1.3}
  ]
}
```

### Performance Optimization

- Keep server running for multiple operations to avoid GPU initialization overhead
- Use file paths for large images instead of base64 to reduce memory usage
- Operations are GPU-accelerated and can handle large images efficiently
- Server processes one request at a time for memory efficiency

## Error Handling

### CLI Mode

The program will exit with non-zero status codes on error and display helpful error messages.

### Socket Mode

Errors follow JSON-RPC 2.0 specification:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": "Brightness parameter must be a number"
  }
}
```

Common error codes:
- `-32700`: Parse error (invalid JSON)
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid parameters
- `-32603`: Internal error
- `-32002`: Server not initialized
