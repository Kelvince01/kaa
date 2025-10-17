# Canvas Usage Guide - Legal Documents Service

## Overview

The Legal Documents Service now includes powerful canvas-based image generation capabilities using Node.js `canvas` package. This enables creating custom graphics, watermarks, seals, charts, and more for PDF documents.

## What is Canvas?

`canvas` is a Cairo-backed Canvas implementation for Node.js that provides the HTML5 Canvas API in a server-side environment. It allows you to:

- Draw shapes, text, and images programmatically
- Create custom graphics for documents
- Generate charts and visualizations
- Add watermarks and seals
- Composite images and apply effects

## Available Canvas Methods

The Legal Documents Service provides 6 powerful canvas-based methods:

### 1. Create Custom Watermark Image

Generate a semi-transparent watermark with rotation.

**Method:**

```typescript
createWatermarkImage(
  text: string,
  options?: {
    width?: number;        // Default: 600
    height?: number;       // Default: 400
    fontSize?: number;     // Default: 72
    opacity?: number;      // Default: 0.2
    rotation?: number;     // Default: -45 (degrees)
    color?: string;        // Default: "#999999"
  }
): string  // Returns data URL
```

**Example:**

```typescript
import { legalDocumentsService } from '@kaa/services';

// Create a watermark
const watermarkDataUrl = legalDocumentsService.createWatermarkImage('CONFIDENTIAL', {
  fontSize: 96,
  opacity: 0.15,
  rotation: -45,
  color: '#ff0000'
});

// Use in PDF
// The dataUrl can be embedded directly in PDFKit using doc.image()
```

**Use Cases:**

- Draft documents
- Confidential markings
- Copyright notices
- Sample/Demo labels

---

### 2. Create Official Seal/Stamp

Generate an official circular seal with text.

**Method:**

```typescript
createOfficialSeal(options: {
  text: string;           // Main text
  subtext?: string;       // Optional subtext
  size?: number;          // Default: 200
  color?: string;         // Default: "#1e40af"
}): Buffer  // Returns PNG buffer
```

**Example:**

```typescript
// Create an official seal
const sealBuffer = legalDocumentsService.createOfficialSeal({
  text: 'KAA RENTALS',
  subtext: 'OFFICIAL DOCUMENT',
  size: 250,
  color: '#1e40af'
});

// Save to file
await fs.writeFile('seal.png', sealBuffer);

// Or embed in PDF
doc.image(sealBuffer, x, y, { width: 100 });
```

**Use Cases:**

- Official document certification
- Landlord/tenant agreements
- Government compliance documents
- Notarization marks

---

### 3. Create Signature Placeholder

Generate a visual signature placeholder with label and date line.

**Method:**

```typescript
createSignaturePlaceholder(options: {
  label: string;          // Label text (e.g., "Landlord Signature")
  width?: number;         // Default: 400
  height?: number;        // Default: 100
}): Buffer  // Returns PNG buffer
```

**Example:**

```typescript
// Create signature placeholders
const landlordSig = legalDocumentsService.createSignaturePlaceholder({
  label: 'Landlord Signature',
  width: 450,
  height: 120
});

const tenantSig = legalDocumentsService.createSignaturePlaceholder({
  label: 'Tenant Signature',
  width: 450,
  height: 120
});

// Add to PDF
doc.image(landlordSig, 50, 700, { width: 200 });
doc.image(tenantSig, 350, 700, { width: 200 });
```

**Use Cases:**

- Rental agreements
- Lease contracts
- Service agreements
- Any document requiring signatures

---

### 4. Create Document Header

Generate a branded header with gradient background.

**Method:**

```typescript
createDocumentHeader(options: {
  title: string;          // Main title
  subtitle?: string;      // Optional subtitle
  logoPath?: string;      // Future: logo image path
  width?: number;         // Default: 800
  height?: number;        // Default: 150
}): Buffer  // Returns PNG buffer
```

**Example:**

```typescript
// Create document header
const headerBuffer = legalDocumentsService.createDocumentHeader({
  title: 'TENANCY AGREEMENT',
  subtitle: 'Standard Residential Lease',
  width: 800,
  height: 180
});

// Add to PDF
doc.image(headerBuffer, 0, 0, { width: doc.page.width });
```

**Use Cases:**

- Professional document headers
- Branded letterheads
- Report covers
- Contract title pages

---

### 5. Create Verification Badge

Generate a verification badge with QR code reference.

**Method:**

```typescript
async createVerificationBadge(
  documentId: string,
  checksum: string
): Promise<Buffer>  // Returns PNG buffer
```

**Example:**

```typescript
// Create verification badge
const verificationBadge = await legalDocumentsService.createVerificationBadge(
  documentId,
  checksum
);

// Add to document
doc.image(verificationBadge, doc.page.width - 320, 20, { width: 150 });
```

**Use Cases:**

- Document authentication
- Anti-fraud measures
- Digital verification
- Blockchain integration markers

---

### 6. Create Simple Bar Chart

Generate a bar chart for data visualization.

**Method:**

```typescript
createSimpleBarChart(
  data: Array<{ label: string; value: number }>,
  options?: {
    title?: string;
    width?: number;        // Default: 600
    height?: number;       // Default: 400
    color?: string;        // Default: "#3b82f6"
  }
): Buffer  // Returns PNG buffer
```

**Example:**

```typescript
// Create payment history chart
const paymentData = [
  { label: 'Jan', value: 5000 },
  { label: 'Feb', value: 5000 },
  { label: 'Mar', value: 5000 },
  { label: 'Apr', value: 4500 },
  { label: 'May', value: 5000 },
  { label: 'Jun', value: 5000 }
];

const chartBuffer = legalDocumentsService.createSimpleBarChart(paymentData, {
  title: 'Monthly Rent Payments (KES)',
  width: 700,
  height: 400,
  color: '#10b981'
});

// Add to PDF report
doc.addPage();
doc.image(chartBuffer, 50, 100, { width: 500 });
```

**Use Cases:**

- Rent payment history
- Occupancy rates
- Maintenance costs
- Financial reports
- Analytics dashboards

---

## Complete Usage Example

Here's a complete example combining multiple canvas features:

```typescript
import { legalDocumentsService } from '@kaa/services';
import PDFDocument from 'pdfkit';
import fs from 'node:fs/promises';

async function generateEnhancedDocument() {
  // Create PDF
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 180, left: 50, right: 50, bottom: 50 }
  });
  
  const stream = fs.createWriteStream('enhanced-document.pdf');
  doc.pipe(stream);

  // 1. Add branded header
  const header = legalDocumentsService.createDocumentHeader({
    title: 'TENANCY AGREEMENT',
    subtitle: 'Nairobi, Kenya',
    width: 595  // A4 width in points
  });
  doc.image(header, 0, 0, { width: 595 });

  // 2. Add official seal
  const seal = legalDocumentsService.createOfficialSeal({
    text: 'KAA RENTALS',
    subtext: 'OFFICIAL',
    size: 200
  });
  doc.image(seal, 450, 200, { width: 100 });

  // 3. Add document content
  doc.moveDown(8);
  doc.fontSize(12);
  doc.text('This Tenancy Agreement is made on...', { align: 'justify' });
  doc.moveDown();
  // ... more content ...

  // 4. Add payment history chart
  doc.addPage();
  doc.fontSize(16).text('Payment History', { align: 'center' });
  doc.moveDown();
  
  const paymentChart = legalDocumentsService.createSimpleBarChart([
    { label: 'Jan', value: 5000 },
    { label: 'Feb', value: 5000 },
    { label: 'Mar', value: 5000 }
  ], {
    title: 'Monthly Rent (KES)',
    color: '#10b981'
  });
  doc.image(paymentChart, 50, doc.y, { width: 495 });

  // 5. Add signature placeholders
  doc.addPage();
  doc.moveDown(10);
  
  const landlordSig = legalDocumentsService.createSignaturePlaceholder({
    label: 'Landlord Signature'
  });
  const tenantSig = legalDocumentsService.createSignaturePlaceholder({
    label: 'Tenant Signature'
  });
  
  doc.image(landlordSig, 50, doc.y, { width: 200 });
  doc.image(tenantSig, 295, doc.y, { width: 200 });

  // 6. Add verification badge
  const verificationBadge = await legalDocumentsService.createVerificationBadge(
    'doc-12345',
    'checksum-abc'
  );
  doc.image(verificationBadge, 445, 20, { width: 120 });

  // 7. Add draft watermark (if needed)
  const watermark = legalDocumentsService.createWatermarkImage('DRAFT', {
    opacity: 0.1
  });
  // Apply watermark to each page...

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// Usage
await generateEnhancedDocument();
console.log('Enhanced document generated!');
```

## Integration with PDF Generation

### Method 1: Using with PDFKit

```typescript
// Create canvas image
const imageBuffer = legalDocumentsService.createOfficialSeal({
  text: 'OFFICIAL'
});

// Add to PDF
doc.image(imageBuffer, x, y, {
  width: 100,
  height: 100,
  align: 'center'
});
```

### Method 2: Save and Reference

```typescript
// Generate and save
const chartBuffer = legalDocumentsService.createSimpleBarChart(data);
await fs.writeFile('temp-chart.png', chartBuffer);

// Use in PDF
doc.image('temp-chart.png', x, y);

// Cleanup
await fs.unlink('temp-chart.png');
```

### Method 3: Data URL Embedding

```typescript
// For watermarks (returns data URL)
const watermarkUrl = legalDocumentsService.createWatermarkImage('DRAFT');

// Use directly in PDF
doc.image(watermarkUrl, x, y, options);
```

## Advanced Canvas Techniques

### Custom Fonts

All canvas methods use the font fallback system:

```typescript
// Fonts are automatically selected based on availability
const font = this.getFontFallback("DejaVu Sans");
ctx.font = `bold 24px "${font}"`;
```

### Transparency and Compositing

```typescript
// Set opacity
ctx.globalAlpha = 0.5;

// Composite modes
ctx.globalCompositeOperation = 'multiply';
```

### Gradients

```typescript
// Linear gradient
const gradient = ctx.createLinearGradient(0, 0, width, 0);
gradient.addColorStop(0, '#1e40af');
gradient.addColorStop(1, '#3b82f6');
ctx.fillStyle = gradient;
```

### Transformations

```typescript
// Rotate
ctx.save();
ctx.translate(x, y);
ctx.rotate(angle * Math.PI / 180);
// ... draw ...
ctx.restore();
```

## Performance Considerations

### Memory Management

```typescript
// Canvas objects are created and disposed per method call
// No manual cleanup required - Node.js garbage collector handles it

// For bulk operations, consider batching
const images = await Promise.all([
  legalDocumentsService.createOfficialSeal({ text: 'SEAL 1' }),
  legalDocumentsService.createOfficialSeal({ text: 'SEAL 2' }),
  legalDocumentsService.createOfficialSeal({ text: 'SEAL 3' })
]);
```

### Caching

```typescript
// Cache frequently used graphics
class DocumentService {
  private sealCache = new Map<string, Buffer>();

  async getOrCreateSeal(key: string, options: any): Promise<Buffer> {
    if (this.sealCache.has(key)) {
      return this.sealCache.get(key)!;
    }
    
    const seal = legalDocumentsService.createOfficialSeal(options);
    this.sealCache.set(key, seal);
    return seal;
  }
}
```

## Best Practices

### 1. Use Appropriate Image Formats

```typescript
// For transparency: PNG
canvas.toBuffer('image/png');

// For photos: JPEG (smaller file size)
canvas.toBuffer('image/jpeg', { quality: 0.85 });
```

### 2. Optimize Image Sizes

```typescript
// Don't create oversized images
// A4 page is ~595x842 points at 72 DPI

// For full-width header
width: 595

// For seal/badge
size: 100-200

// For charts
width: 500-600
```

### 3. Handle Errors Gracefully

```typescript
try {
  const seal = legalDocumentsService.createOfficialSeal(options);
  doc.image(seal, x, y);
} catch (error) {
  logger.error('Failed to create seal:', error);
  // Fallback: use text instead
  doc.text('[OFFICIAL SEAL]', x, y);
}
```

### 4. Test Canvas Output

```typescript
// Save canvas output for verification
const testOutput = legalDocumentsService.createOfficialSeal({ text: 'TEST' });
await fs.writeFile('test-seal.png', testOutput);
```

## Troubleshooting

### Issue: Fonts not rendering correctly

```typescript
// Check font availability
if (legalDocumentsService.isFontAvailable('DejaVu Sans')) {
  console.log('Custom fonts available');
} else {
  console.log('Using fallback fonts');
}
```

### Issue: Image quality is poor

```typescript
// Increase canvas dimensions for higher resolution
const seal = legalDocumentsService.createOfficialSeal({
  size: 400  // Larger size, then scale down in PDF
});

doc.image(seal, x, y, { width: 100 });  // Scales down = better quality
```

### Issue: Colors look different

```typescript
// Use hex colors for consistency
color: '#1e40af'  // ✅ Consistent

color: 'rgb(30, 64, 175)'  // ⚠️ May vary
```

## Resources

- **[Canvas Documentation](https://github.com/Automattic/node-canvas)** - Full canvas API reference
- **[PDFKit Docs](http://pdfkit.org/)** - PDF generation guide
- **[HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)** - Canvas basics
- **[Font Setup Guide](./FONT_SETUP_GUIDE.md)** - Custom fonts configuration

## Future Enhancements

Potential additions to canvas capabilities:

1. **Image Manipulation**
   - Resize, crop, filters
   - Overlays and compositing

2. **Advanced Charts**
   - Line charts, pie charts
   - Multi-series data
   - Interactive legends

3. **QR Code Integration**
   - Embed QR codes in badges
   - Styled QR codes

4. **Logo Loading**
   - Load and composite logos
   - SVG support

5. **Custom Shapes**
   - Polygons, curves
   - Pattern fills

## Support

For canvas-related issues:

1. Verify canvas module is installed: `node -e "require('canvas')"`
2. Check system dependencies are installed (see Font Setup Guide)
3. Test canvas output independently before PDF integration
4. Review application logs for canvas errors

---

**Happy Drawing! 🎨**
