#!/bin/bash

# Test script for Shade socket mode
# This demonstrates basic communication with the shade process

set -e

SHADE_BINARY="./target/release/shade"
TEST_IMAGE="test_input.png"

echo "Starting Shade socket mode test..."

# Check if shade binary exists
if [ ! -f "$SHADE_BINARY" ]; then
    echo "Error: Shade binary not found at $SHADE_BINARY"
    echo "Run 'cargo build --release' first"
    exit 1
fi

# Check if test image exists
if [ ! -f "$TEST_IMAGE" ]; then
    echo "Creating test image..."
    $SHADE_BINARY --example "$TEST_IMAGE"
fi

# Start shade in background
echo "Starting shade server..."
$SHADE_BINARY --socket &
SHADE_PID=$!

# Give it a moment to start
sleep 1

# Function to send a message to shade
send_message() {
    local message="$1"
    local length=${#message}
    printf "Content-Length: %d\r\n\r\n%s" "$length" "$message"
}

# Function to read response (simplified - just reads some output)
read_response() {
    # Read until we get some content (this is a simplified version)
    timeout 5 head -20
}

# Test 1: Initialize
echo "Test 1: Initialize server"
INIT_MESSAGE='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"client_info":{"name":"shell-test","version":"1.0.0"}}}'

{
    send_message "$INIT_MESSAGE"
    echo "Sent initialize message"
} | {
    exec 3<&0  # Save stdin to fd 3
    exec 0<&- 3<&-  # Close stdin for the main process

    # This is a simplified test - in practice you'd want proper JSON parsing
    echo "Server should respond with capabilities..."
}

# Test 2: Simple brightness adjustment (file path method)
echo "Test 2: Process image with brightness adjustment"
ABS_PATH="$(pwd)/$TEST_IMAGE"
PROCESS_MESSAGE="{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"process_image\",\"params\":{\"image\":{\"type\":\"file\",\"path\":\"$ABS_PATH\"},\"operations\":[{\"operation\":\"brightness\",\"params\":1.5}],\"output_format\":\"png\"}}"

echo "Would send: $PROCESS_MESSAGE"

# Test 3: Shutdown
echo "Test 3: Shutdown server"
SHUTDOWN_MESSAGE='{"jsonrpc":"2.0","id":3,"method":"shutdown"}'

echo "Would send: $SHUTDOWN_MESSAGE"

# For this simple test, just kill the process
echo "Shutting down shade server..."
kill $SHADE_PID 2>/dev/null || true
wait $SHADE_PID 2>/dev/null || true

echo "Socket mode test completed!"
echo ""
echo "For a full working example, use the Python client:"
echo "python3 example_client.py $TEST_IMAGE $SHADE_BINARY"
