#
# Font Setup Script for Legal Documents Service (Windows)
# 
# This script downloads and installs the required fonts for PDF generation
# Run from PowerShell: .\packages\services\scripts\setup-fonts.ps1
#

$ErrorActionPreference = "Stop"

# Configuration
$FontsDir = "apps\api\assets\fonts"
$TempDir = "$env:TEMP\kaa-fonts-setup"

Write-Host "=== KAA Legal Documents Service - Font Setup ===" -ForegroundColor Green
Write-Host ""

# Check if running from project root
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Create fonts directory
Write-Host "Creating fonts directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $FontsDir | Out-Null
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

# Download DejaVu Sans fonts
Write-Host ""
Write-Host "Downloading DejaVu Sans fonts..." -ForegroundColor Yellow
$DejaVuUrl = "https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.zip"
$DejaVuZip = "$TempDir\dejavu-fonts.zip"

try {
    Invoke-WebRequest -Uri $DejaVuUrl -OutFile $DejaVuZip -UseBasicParsing
    Write-Host "Extracting DejaVu Sans fonts..." -ForegroundColor Yellow
    Expand-Archive -Path $DejaVuZip -DestinationPath $TempDir -Force
    
    # Copy required DejaVu fonts
    Copy-Item "$TempDir\dejavu-fonts-ttf-2.37\ttf\DejaVuSans.ttf" -Destination $FontsDir
    Copy-Item "$TempDir\dejavu-fonts-ttf-2.37\ttf\DejaVuSans-Bold.ttf" -Destination $FontsDir
    Write-Host "✓ DejaVu Sans fonts installed" -ForegroundColor Green
} catch {
    Write-Host "Error downloading/extracting DejaVu fonts: $_" -ForegroundColor Red
    exit 1
}

# Download Noto Sans fonts
Write-Host ""
Write-Host "Downloading Noto Sans fonts..." -ForegroundColor Yellow
$NotoSansUrl = "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans[wdth,wght].ttf"

try {
    Invoke-WebRequest -Uri $NotoSansUrl -OutFile "$FontsDir\NotoSans-Regular.ttf" -UseBasicParsing
    Invoke-WebRequest -Uri $NotoSansUrl -OutFile "$FontsDir\NotoSans-Bold.ttf" -UseBasicParsing
    Invoke-WebRequest -Uri $NotoSansUrl -OutFile "$FontsDir\NotoSansSwahili-Regular.ttf" -UseBasicParsing
    Write-Host "✓ Noto Sans fonts installed" -ForegroundColor Green
} catch {
    Write-Host "Error downloading Noto Sans fonts: $_" -ForegroundColor Red
    exit 1
}

# Verify fonts
Write-Host ""
Write-Host "Verifying installed fonts..." -ForegroundColor Yellow
$FontFiles = Get-ChildItem "$FontsDir\*.ttf"
$FontCount = $FontFiles.Count

if ($FontCount -eq 0) {
    Write-Host "✗ No fonts found!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Found $FontCount font files:" -ForegroundColor Green
foreach ($font in $FontFiles) {
    $size = "{0:N2} KB" -f ($font.Length / 1KB)
    Write-Host "  - $($font.Name) ($size)"
}

# Cleanup
Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Path $TempDir -Recurse -Force
Write-Host "✓ Cleanup complete" -ForegroundColor Green

# Final instructions
Write-Host ""
Write-Host "=== Font Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Installed fonts:"
Write-Host "  • DejaVu Sans (Regular & Bold)"
Write-Host "  • Noto Sans (Regular, Bold & Swahili)"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Start/restart your application"
Write-Host "  2. Check logs for font registration status"
Write-Host "  3. Verify fonts in Redis: redis-cli GET legal-service:registered-fonts" -ForegroundColor Yellow
Write-Host ""
Write-Host "For more information, see: packages\services\docs\FONT_SETUP_GUIDE.md" -ForegroundColor Yellow
Write-Host ""

