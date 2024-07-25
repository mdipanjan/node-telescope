#!/bin/bash

# Navigate to the parent directory
cd "$(dirname "$0")/.." || exit

# Check if the tgz file exists
if ls node-telescope-*.tgz 1> /dev/null 2>&1; then
    echo "Found package file: $(ls node-telescope-*.tgz)"
    exit 0
else
    echo "Error: node-telescope-*.tgz file not found in the current directory"
    exit 1
fi