# Font Setup Guide for Legal Documents Service

## Overview

The Legal Documents Service uses the `canvas` package to register custom fonts for PDF generation. This guide will help you set up the required system dependencies and font files.

## System Dependencies

The `canvas` package has native dependencies that must be installed at the system level before it can work properly.

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev
```

### macOS

```bash
# Using Homebrew
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
```

### Fedora/RedHat/CentOS

```bash
sudo yum install -y \
  gcc-c++ \
  cairo-devel \
  pango-devel \
  libjpeg-turbo-devel \
  giflib-devel \
  librsvg2-devel
```

### Alpine Linux (Docker)

```dockerfile
RUN apk add --no-cache \
  build-base \
  cairo-dev \
  pango-dev \
  jpeg-dev \
  giflib-dev \
  librsvg-dev
```

### Verifying Installation

After installing system dependencies, verify the canvas module works:

```bash
cd packages/services
bun install
node -e "const { createCanvas } = require('canvas'); console.log('Canvas is available!');"
```

## Font Files Setup

### Quick Setup (Automated)

We provide automated scripts to download and install the required fonts:

**Linux/macOS:**

```bash
# From project root
./packages/services/scripts/setup-fonts.sh
```

**Windows (PowerShell):**

```powershell
# From project root
.\packages\services\scripts\setup-fonts.ps1
```

The script will:

- Create the fonts directory
- Download DejaVu Sans and Noto Sans fonts
- Verify installation
- Set proper permissions

### Manual Setup

If you prefer to set up fonts manually:

#### Directory Structure

Create the fonts directory and add your font files:

```bash
mkdir -p apps/api/assets/fonts
```

### Required Fonts

The service expects the following fonts (you can customize in `legal-document.service.ts`):

1. **DejaVu Sans** (Required)
   - `DejaVuSans.ttf`
   - `DejaVuSans-Bold.ttf`

2. **Noto Sans** (Required)
   - `NotoSans-Regular.ttf`

3. **Noto Sans Swahili** (Optional)
   - `NotoSansSwahili-Regular.ttf`

### Downloading Fonts

#### DejaVu Sans (Free, Open Source)

```bash
cd apps/api/assets/fonts
wget https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.tar.bz2
tar -xjf dejavu-fonts-ttf-2.37.tar.bz2
cp dejavu-fonts-ttf-2.37/ttf/DejaVuSans.ttf .
cp dejavu-fonts-ttf-2.37/ttf/DejaVuSans-Bold.ttf .
rm -rf dejavu-fonts-ttf-2.37*
```

#### Noto Sans (Free, Google Fonts)

```bash
cd apps/api/assets/fonts
# Download from Google Fonts
wget https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf
wget https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Bold.ttf
```

### Font File Validation

The service automatically validates font files:

- Must exist at the specified path
- Must not be empty (size > 0)
- Must not be too large (size < 10MB)

## Environment Configuration

Configure font behavior using environment variables:

```bash
# Enable/disable custom fonts (default: true)
CUSTOM_FONTS_ENABLED=true

# Custom fonts directory path (default: {cwd}/assets/fonts)
FONTS_PATH=/path/to/custom/fonts

# Enable fallback to system fonts if custom fonts fail (default: true)
FONT_FALLBACK_ENABLED=true
```

## Docker Setup

If running in Docker, add these steps to your Dockerfile:

```dockerfile
# Install system dependencies
RUN apt-get update && apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy font files
COPY apps/api/assets/fonts /app/apps/api/assets/fonts

# Install node dependencies
RUN bun install

# Verify canvas installation
RUN node -e "require('canvas')"
```

## Usage in Code

The font registration happens automatically during service initialization:

```typescript
import { legalDocumentsService } from '@kaa/services';

// Check if a font is available
if (legalDocumentsService.isFontAvailable('DejaVu Sans')) {
  console.log('DejaVu Sans is available');
}

// Get font with fallback
const font = legalDocumentsService.getFontFallback('Noto Sans');
// Returns: 'Noto Sans' if available, otherwise falls back to
// 'DejaVu Sans' -> 'Helvetica' -> 'Arial' -> 'sans-serif'
```

## Troubleshooting

### Canvas Module Not Found

**Error:** `Cannot find module 'canvas'`

**Solution:**

```bash
cd packages/services
bun install canvas
```

### Native Dependencies Error

**Error:** `Error: Cannot find module '../build/Release/canvas.node'`

**Solution:** Install system dependencies (see above), then reinstall:

```bash
cd packages/services
rm -rf node_modules
bun install
```

### Font Registration Fails

**Error:** Font file validation fails

**Solutions:**

1. Check font file exists: `ls -lh apps/api/assets/fonts/`
2. Check file permissions: `chmod 644 apps/api/assets/fonts/*.ttf`
3. Verify file size: `du -h apps/api/assets/fonts/*.ttf`
4. Check logs for specific error messages

### Font Not Rendering in PDF

**Issue:** PDF uses system fonts instead of custom fonts

**Solutions:**

1. Verify font registration succeeded in logs
2. Check Redis for cached fonts: `redis-cli GET legal-service:registered-fonts`
3. Ensure font family name matches exactly
4. Try clearing Redis cache and restarting service

## Testing

### Test Font Registration

```typescript
// Check registered fonts in Redis
import { redisClient } from '@kaa/utils';

const fonts = await redisClient.get('legal-service:registered-fonts');
console.log('Registered fonts:', JSON.parse(fonts || '[]'));
```

### Test PDF Generation

```typescript
import { legalDocumentsService } from '@kaa/services';

const document = await legalDocumentsService.generateDocument({
  templateId: 'your-template-id',
  data: { /* your data */ },
  options: {
    format: 'pdf',
    language: 'en'
  }
});

console.log('Generated document:', document.filePath);
```

## Performance Considerations

1. **Font Loading:** Fonts are registered once at service startup
2. **Caching:** Registered fonts are cached in Redis for 24 hours
3. **Concurrent Registration:** Multiple fonts are registered in parallel
4. **Graceful Degradation:** Service continues with system fonts if custom fonts fail

## Security Best Practices

1. **Validate Font Files:** Only use fonts from trusted sources
2. **File Size Limits:** Service enforces 10MB max per font file
3. **Directory Permissions:** Ensure fonts directory has appropriate permissions
4. **No User Uploads:** Don't allow users to upload arbitrary font files

## Adding New Fonts

To add additional fonts, update the `fontConfigs` array in `legal-document.service.ts`:

```typescript
private readonly fontConfigs: FontConfig[] = [
  // Existing fonts...
  {
    path: "YourFont-Regular.ttf",
    family: "Your Font",
    required: false,
  },
  {
    path: "YourFont-Bold.ttf",
    family: "Your Font",
    weight: "bold",
    required: false,
  },
];
```

Then add the font files to `apps/api/assets/fonts/`.

## Resources

- [node-canvas Documentation](https://github.com/Automattic/node-canvas)
- [DejaVu Fonts](https://dejavu-fonts.github.io/)
- [Google Fonts - Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans)
- [PDFKit Font Documentation](http://pdfkit.org/docs/text.html#fonts)

## Support

For issues related to:

- **Canvas installation:** See [canvas documentation](https://github.com/Automattic/node-canvas#installation)
- **Font licensing:** Check individual font licenses
- **Service issues:** Check application logs and Redis cache
