# Font Setup Quick Start

## TL;DR

Get custom fonts working in 3 steps:

### 1. Install System Dependencies

**Ubuntu/Debian:**

```bash
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**macOS:**

```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
```

### 2. Download Fonts

**Automated (Recommended):**

```bash
# From project root
./packages/services/scripts/setup-fonts.sh
```

**Manual:**

```bash
mkdir -p apps/api/assets/fonts
# Download fonts from official sources and place in directory
```

### 3. Verify Installation

```bash
# Test canvas module
node -e "require('canvas')"

# Start your app
bun run dev:server

# Check logs for "Font registration complete"

# Verify in Redis
redis-cli GET legal-service:registered-fonts
```

## What You Get

✅ Custom fonts in PDFs (DejaVu Sans, Noto Sans)  
✅ Multilingual support (English, Swahili)  
✅ Automatic fallback to system fonts  
✅ Redis caching for performance  

## Environment Variables (Optional)

```bash
CUSTOM_FONTS_ENABLED=true          # Enable custom fonts
FONTS_PATH=/custom/path/to/fonts   # Custom font directory
FONT_FALLBACK_ENABLED=true         # Enable system font fallback
```

## Docker Setup

Add to your Dockerfile:

```dockerfile
# Install system dependencies
RUN apt-get update && apt-get install -y \
  build-essential libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev

# Copy fonts
COPY apps/api/assets/fonts /app/apps/api/assets/fonts

# Verify canvas
RUN node -e "require('canvas')"
```

## Troubleshooting

### Canvas not found

```bash
cd packages/services
bun install
```

### Native dependencies error

```bash
# Install system dependencies (see step 1)
cd packages/services
rm -rf node_modules
bun install
```

### Fonts not loading

```bash
# Check fonts exist
ls -lh apps/api/assets/fonts/

# Check permissions
chmod 644 apps/api/assets/fonts/*.ttf

# Clear Redis cache
redis-cli DEL legal-service:registered-fonts

# Restart application
```

## More Information

- **[Complete Setup Guide](./FONT_SETUP_GUIDE.md)** - Detailed instructions
- **[Implementation Details](./FONT_REGISTRATION_IMPROVEMENTS.md)** - Technical documentation
- **[Canvas Documentation](https://github.com/Automattic/node-canvas)** - Canvas module docs

## Support

Font registration logs will show:

- ✅ Success: "Font registration complete: X successful, Y failed"
- ⚠️ Warning: "Font file not found: [filename]"
- ❌ Error: "Font registration failed: [error details]"

Service continues with default fonts if registration fails.
