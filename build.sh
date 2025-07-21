#!/bin/bash

# Clean up any previous build artifacts
rm -rf dist node_modules/.vite

# Clear cache directories that might be causing issues
rm -rf .cache
rm -rf node_modules/.cache

# Set memory limit for Node.js
export NODE_OPTIONS="--max-old-space-size=2048"

# Run build with reduced concurrency
echo "Starting build with optimized settings..."
VITE_CJS_IGNORE_WARNING=true pnpm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
else
    echo "Build failed. Trying alternative build approach..."
    # Try with even more restricted settings
    export NODE_OPTIONS="--max-old-space-size=1536"
    VITE_CJS_IGNORE_WARNING=true npx vite build --emptyOutDir
fi