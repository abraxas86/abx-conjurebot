#!/bin/bash
# This script should be called from Node.js after an image is ready.

function createYugi() {
    local cardDir="./cards"
    local generationID="$1"
    local requestor="$2"
    local timestamp="$3"
    local cardName="$4"
    local cardType="$5"
    local prompt="$6"

    local isoTimestamp=$(date -d @$timestamp +%Y-%m-%d_%H-%M-%S)
    local imageFile="${isoTimestamp}-${requestor}-${generationID}.webp"
    local outputFile="${isoTimestamp}-${requestor}-${generationID}_yugi.png"

    # Create the directory if it doesn't exist
    mkdir -p "$cardDir"

    # Process the image
    echo "Processing image: $imageFile"
    magick convert "$cardDir/$imageFile" -resize 480x640 "$cardDir/$outputFile"

    echo "Image processed and saved as: $outputFile"
}

# Call the function with passed arguments
createYugi "$@"