#!/bin/bash

#
# Font Setup Script for Legal Documents Service
# 
# This script downloads and installs the required fonts for PDF generation
# Run from the project root: ./packages/services/scripts/setup-fonts.sh
#

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
FONTS_DIR="apps/api/assets/fonts"
TEMP_DIR="/tmp/kaa-fonts-setup"
PROJECT_ROOT="$(pwd)"

echo -e "${GREEN}=== KAA Legal Documents Service - Font Setup ===${NC}\n"

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Create fonts directory
echo -e "${YELLOW}Creating fonts directory...${NC}"
mkdir -p "$FONTS_DIR"
mkdir -p "$TEMP_DIR"

# Download DejaVu Sans fonts
echo -e "\n${YELLOW}Downloading DejaVu Sans fonts...${NC}"
cd "$TEMP_DIR"

if command -v wget &> /dev/null; then
    wget -q --show-progress https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.tar.bz2
elif command -v curl &> /dev/null; then
    curl -L -o dejavu-fonts-ttf-2.37.tar.bz2 https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.tar.bz2
else
    echo -e "${RED}Error: Neither wget nor curl is installed${NC}"
    exit 1
fi

echo -e "${YELLOW}Extracting DejaVu Sans fonts...${NC}"
tar -xjf dejavu-fonts-ttf-2.37.tar.bz2

# Copy required DejaVu fonts
# cd "$(pwd)/../../../.."
cd "$PROJECT_ROOT"
cp "$TEMP_DIR/dejavu-fonts-ttf-2.37/ttf/DejaVuSans.ttf" "$FONTS_DIR/"
cp "$TEMP_DIR/dejavu-fonts-ttf-2.37/ttf/DejaVuSans-Bold.ttf" "$FONTS_DIR/"
echo -e "${GREEN}✓ DejaVu Sans fonts installed${NC}"

# Download Noto Sans fonts
echo -e "\n${YELLOW}Downloading Noto Sans fonts...${NC}"
cd "$TEMP_DIR"

if command -v wget &> /dev/null; then
    wget -q --show-progress -O NotoSans-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
    wget -q --show-progress -O NotoSans-Bold.ttf "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
    wget -q --show-progress -O NotoSansSwahili-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
else
    curl -L -o NotoSans-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
    curl -L -o NotoSans-Bold.ttf "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
    curl -L -o NotoSansSwahili-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
fi

# Copy Noto Sans fonts
# cd "$(pwd)/../../../.."
cd "$PROJECT_ROOT"
cp "$TEMP_DIR/NotoSans-Regular.ttf" "$FONTS_DIR/"
cp "$TEMP_DIR/NotoSans-Bold.ttf" "$FONTS_DIR/"
cp "$TEMP_DIR/NotoSansSwahili-Regular.ttf" "$FONTS_DIR/"
echo -e "${GREEN}✓ Noto Sans fonts installed${NC}"

# Verify fonts
echo -e "\n${YELLOW}Verifying installed fonts...${NC}"
FONT_COUNT=$(find "$FONTS_DIR" -name "*.ttf" | wc -l)

if [ "$FONT_COUNT" -eq 0 ]; then
    echo -e "${RED}✗ No fonts found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found $FONT_COUNT font files:${NC}"
ls -lh "$FONTS_DIR"/*.ttf | awk '{print "  - " $9 " (" $5 ")"}'

# Cleanup
echo -e "\n${YELLOW}Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Set permissions
echo -e "\n${YELLOW}Setting font file permissions...${NC}"
chmod 644 "$FONTS_DIR"/*.ttf
echo -e "${GREEN}✓ Permissions set${NC}"

# Final instructions
echo -e "\n${GREEN}=== Font Setup Complete! ===${NC}\n"
echo -e "Installed fonts:"
echo -e "  • DejaVu Sans (Regular & Bold)"
echo -e "  • Noto Sans (Regular, Bold & Swahili)"
echo -e "\nNext steps:"
echo -e "  1. Start/restart your application"
echo -e "  2. Check logs for font registration status"
echo -e "  3. Verify fonts in Redis: ${YELLOW}redis-cli GET legal-service:registered-fonts${NC}"
echo -e "\nFor more information, see: ${YELLOW}packages/services/docs/FONT_SETUP_GUIDE.md${NC}\n"

