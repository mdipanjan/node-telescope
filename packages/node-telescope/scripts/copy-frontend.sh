#!/bin/bash

# Navigate to the script directory
cd "$(dirname "$0")" || exit

# Set source and destination paths
SOURCE_PATH="../../node-telescope-frontend/build"
DEST_PATH="../dist/frontend"

# Copy frontend build
if cp -R "$SOURCE_PATH" "$DEST_PATH"; then
    echo "Frontend build copied successfully to: $DEST_PATH"
else
    echo "Error copying frontend build"
    exit 1
fi