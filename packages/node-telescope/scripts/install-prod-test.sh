#!/bin/bash

# Navigate to the node-telescope directory
cd "$(dirname "$0")/.." || exit

# Find the most recent .tgz file
PACKAGE_FILE=$(ls -t node-telescope-*.tgz | head -n1)

if [ -z "$PACKAGE_FILE" ]; then
    echo "Error: No node-telescope-*.tgz file found"
    exit 1
fi

echo "Found package file: $PACKAGE_FILE"

# Navigate to the prod-test directory and install the package
cd ../examples/prod-test || exit
npm install "../../node-telescope/$PACKAGE_FILE"

if [ $? -eq 0 ]; then
    echo "Successfully installed $PACKAGE_FILE in prod-test"
else
    echo "Error installing $PACKAGE_FILE in prod-test"
    exit 1
fi