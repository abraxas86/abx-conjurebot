#!/bin/bash

SCRIPTVARS="./.env"

# Function to clean up and exit
cleanup() {
    # Unset all environment variables defined in the .env file
    while IFS= read -r line; do
        unset "${line%%=*}"  # Extract variable name before the '='
    done < "$SCRIPTVARS"
    echo "Environment variables unset"
    exit
}

# Trap interrupt signals (e.g., Ctrl+C) to run the cleanup function
trap cleanup INT TERM

echo "Setting environmental variables..."

# Check if .env file exists
if [ ! -f "$SCRIPTVARS" ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Source the .env file to set environment variables, ignoring comments and only overriding if not already set
while IFS= read -r line; do
    # Skip lines starting with '#' (comments) and empty lines
    if [[ "$line" =~ ^\ *# || -z "$line" ]]; then
        continue
    fi
    
    var=$(echo "$line" | cut -d '=' -f 1)
    if [ -z "${!var}" ]; then
        export "$line"
    else
        echo "Warning: Skipping $var as it's already set in the environment"
    fi
done < "$SCRIPTVARS"

# Run your Node.js script
echo "Starting server..."
node conjure-server.js &
wait