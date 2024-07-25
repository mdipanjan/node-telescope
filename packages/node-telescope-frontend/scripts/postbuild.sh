#!/bin/bash

# Navigate to the build directory
cd "$(dirname "$0")/../build" || exit

# Update paths in index.html
sed -i.bak \
    -e 's|="/static/|="./static/|g' \
    -e 's|="/manifest|="./manifest|g' \
    -e 's|="/favicon|="./favicon|g' \
    index.html

if [ $? -eq 0 ]; then
    echo "Successfully updated paths in index.html"
    rm index.html.bak
else
    echo "Error updating index.html"
    exit 1
fi