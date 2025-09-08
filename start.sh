#!/bin/bash

echo "Building the project in production mode..."
pnpm run build

echo "Starting the preview server..."
pnpm run preview --host --port 5173