#!/bin/bash

# Google Drive Authentication Helper for Zuma Logo Download
# Run this script to authenticate and download the logo

echo "=== Google Drive Auth Helper ==="
echo ""
echo "Service Account: harvey-access@harvey-wayan-ai.iam.gserviceaccount.com"
echo ""
echo "To download the Zuma logo:"
echo ""
echo "1. Go to Google Drive in your browser"
echo "2. Find the Zuma logo file"
echo "3. Right-click → Share"
echo "4. Add this service account email with Viewer access:"
echo "   harvey-access@harvey-wayan-ai.iam.gserviceaccount.com"
echo ""
echo "5. Get the File ID from the shareable link"
echo "   (e.g., https://drive.google.com/file/d/FILE_ID/view)"
echo ""
echo "6. Run this command to download:"
echo "   curl -L \"https://drive.google.com/uc?export=download&id=FILE_ID\" -o /root/clawd/harvey-projects/zuma-ro-pwa/public/zuma-logo.png"
echo ""
echo "Or share the direct link here and I'll download it for you!"
