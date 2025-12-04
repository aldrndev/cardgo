#!/bin/bash

# PWA Icon Generator Script for Card Go
# This script generates all required PWA icons from the base icon

SOURCE_ICON="../assets/icon.png"
ICONS_DIR="."

echo "Generating PWA icons from $SOURCE_ICON..."

# Check if ImageMagick or sips (macOS) is available
if command -v sips &> /dev/null; then
  echo "Using sips (macOS)..."
  
  # Generate icons
  sips -z 16 16 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-16x16.png"
  sips -z 32 32 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-32x32.png"
  sips -z 72 72 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-72x72.png"
  sips -z 96 96 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-96x96.png"
  sips -z 128 128 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-128x128.png"
  sips -z 144 144 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-144x144.png"
  sips -z 152 152 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-152x152.png"
  sips -z 167 167 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-167x167.png"
  sips -z 180 180 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-180x180.png"
  sips -z 192 192 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-192x192.png"
  sips -z 384 384 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-384x384.png"
  sips -z 512 512 "$SOURCE_ICON" --out "${ICONS_DIR}/icon-512x512.png"
  
  # Copy 180x180 as apple-touch-icon
  cp "${ICONS_DIR}/icon-180x180.png" "${ICONS_DIR}/apple-touch-icon.png"
  
  echo "✓ All PWA icons generated successfully!"
  
elif command -v convert &> /dev/null; then
  echo "Using ImageMagick convert..."
  
  # Generate icons with ImageMagick
  convert "$SOURCE_ICON" -resize 16x16 "${ICONS_DIR}/icon-16x16.png"
  convert "$SOURCE_ICON" -resize 32x32 "${ICONS_DIR}/icon-32x32.png"
  convert "$SOURCE_ICON" -resize 72x72 "${ICONS_DIR}/icon-72x72.png"
  convert "$SOURCE_ICON" -resize 96x96 "${ICONS_DIR}/icon-96x96.png"
  convert "$SOURCE_ICON" -resize 128x128 "${ICONS_DIR}/icon-128x128.png"
  convert "$SOURCE_ICON" -resize 144x144 "${ICONS_DIR}/icon-144x144.png"
  convert "$SOURCE_ICON" -resize 152x152 "${ICONS_DIR}/icon-152x152.png"
  convert "$SOURCE_ICON" -resize 167x167 "${ICONS_DIR}/icon-167x167.png"
  convert "$SOURCE_ICON" -resize 180x180 "${ICONS_DIR}/icon-180x180.png"
  convert "$SOURCE_ICON" -resize 192x192 "${ICONS_DIR}/icon-192x192.png"
  convert "$SOURCE_ICON" -resize 384x384 "${ICONS_DIR}/icon-384x384.png"
  convert "$SOURCE_ICON" -resize 512x512 "${ICONS_DIR}/icon-512x512.png"
  
  # Copy 180x180 as apple-touch-icon
  cp "${ICONS_DIR}/icon-180x180.png" "${ICONS_DIR}/apple-touch-icon.png"
  
  echo "✓ All PWA icons generated successfully!"
  
else
  echo "❌ Error: Neither sips nor ImageMagick (convert) found."
  echo "Please install ImageMagick: brew install imagemagick"
  exit 1
fi

echo "Done! PWA icons are ready in ${ICONS_DIR}/"
