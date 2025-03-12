#!/bin/bash

# Get the absolute path of the script's directory
SCRIPT_DIR=$(dirname "$(realpath "$0")")

# Get the absolute path of the current project directory
PROJECT_DIR=$(realpath "$SCRIPT_DIR/..")

# Navigate to the target directory
cd ~/.node-red

# Initialize a package.json if it doesn't exist
if [ ! -f "package.json" ]; then
  npm init -y
fi

npm i --save $PROJECT_DIR

echo "Installation completed."
