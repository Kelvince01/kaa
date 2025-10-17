import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";

// Background service for PDF signing
class ContractSigningService {
  private static instance: ContractSigningService;

  static getInstance(): ContractSigningService {
    if (!ContractSigningService.instance) {
      ContractSigningService.instance = new ContractSigningService();
    }
    return ContractSigningService.instance;
  }

  /**
   * Method 1: Using pdf-lib - Most common approach
   * Good for adding signatures to specific coordinates
   */
  async signPDFWithPdfLib(
    unsignedPdfPath: string,
    signatureBase64: string,
    signatureDate: string,
    signerName: string,
    coordinates?: { x: number; y: number; width?: number; height?: number }
  ): Promise<Buffer> {
    try {
      // Read the unsigned PDF
      const existingPdfBytes = await fs.readFile(unsignedPdfPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Get the last page (signature page)
      const pages = pdfDoc.getPages();
      const lastPage = pages.at(-1);
      const { width, height } = lastPage?.getSize() || { width: 0, height: 0 };

      // Convert base64 signature to image
      const signatureImage = await this.processSignatureImage(
        pdfDoc,
        signatureBase64
      );

      // Default coordinates for signature placement
      const signatureCoords = coordinates || {
        x: 200,
        y: 200, // Adjust based on your PDF layout
        width: 200,
        height: 80,
      };

      // const signatureCoords = {
      //     x: 200,    // Left margin from your signature line
      //     y: 380,    // Bottom margin (PDF coordinates start from bottom)
      //     width: 200,
      //     height: 60
      //   };

      // Add signature image to PDF
      lastPage?.drawImage(signatureImage, {
        x: signatureCoords.x,
        y: signatureCoords.y,
        width: signatureCoords.width || 200,
        height: signatureCoords.height || 80,
      });

      // Add signature date
      lastPage?.drawText(signatureDate, {
        x: signatureCoords.x + 300,
        y: signatureCoords.y + 20,
        size: 12,
        color: rgb(0, 0, 0),
      });

      // Add metadata
      pdfDoc.setTitle("Signed Tenancy Agreement");
      pdfDoc.setAuthor(signerName);
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      // Save and return the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      return Buffer.from(signedPdfBytes);
    } catch (error: any) {
      console.error("Error signing PDF with pdf-lib:", error);
      throw new Error(`Failed to sign PDF: ${error.message}`);
    }
  }

  /**
   * Method 2: Using HummusJS - More advanced PDF manipulation
   * Better for complex layouts and form filling
   */
  async signPDFWithHummus(
    unsignedPdfPath: string,
    signatureBase64: string,
    signatureDate: string,
    _signerName: string
  ): Promise<Buffer> {
    try {
      // Note: This requires hummus-pdf package
      // npm install hummus-pdf
      const hummus = require("hummus-pdf");

      const outputPath = path.join(
        __dirname,
        "temp",
        `signed_${Date.now()}.pdf`
      );

      const pdfWriter = hummus.createWriter(outputPath);
      const copyingContext = pdfWriter.createPDFCopyingContext(unsignedPdfPath);

      // Copy all pages from original PDF
      const pageCount = copyingContext
        .getSourceDocumentParser()
        .getPagesCount();
      for (let i = 0; i < pageCount; i++) {
        const pageCopyingContext = pdfWriter.createPageCopyingContext(
          copyingContext.getSourceDocumentParser().parsePage(i)
        );
        pdfWriter.writePage(pageCopyingContext);
      }

      // Create a new page or modify the last page for signature
      const pageModifier = new hummus.PDFPageModifier(pdfWriter, pageCount - 1);
      const context = pageModifier.startContext().getContext();

      // Add signature image (you'll need to convert base64 to image file first)
      const signatureImagePath = await this.saveBase64Image(signatureBase64);

      context.drawImage(50, 100, signatureImagePath, {
        transformation: [200, 0, 0, 80, 0, 0],
      });

      // Add date text
      context.writeText(signatureDate, 350, 120, {
        font: pdfWriter.getFontForFile(
          path.join(__dirname, "fonts", "arial.ttf")
        ),
        size: 12,
        color: 0x00_00_00,
      });

      pageModifier.endContext().writePage();
      pdfWriter.end();

      // Read the signed PDF and return as buffer
      const signedPdfBuffer = await fs.readFile(outputPath);

      // Clean up temporary files
      await fs.unlink(outputPath);
      await fs.unlink(signatureImagePath);

      return signedPdfBuffer;
    } catch (error: any) {
      console.error("Error signing PDF with Hummus:", error);
      throw new Error(`Failed to sign PDF: ${error.message}`);
    }
  }

  /**
   * Method 3: Using pdf2pic + jimp for image-based approach
   * Convert PDF to images, add signature, convert back to PDF
   */
  async signPDFWithImageProcessing(
    unsignedPdfPath: string,
    signatureBase64: string,
    _signatureDate: string
  ): Promise<Buffer> {
    try {
      // This requires pdf2pic and jimp packages
      // npm install pdf2pic jimp
      const pdf2pic = require("pdf2pic");
      const Jimp = require("jimp");

      // Convert PDF to images
      const convert = pdf2pic.fromPath(unsignedPdfPath, {
        density: 300,
        saveFilename: "page",
        savePath: "./temp/",
        format: "png",
        width: 2480,
        height: 3508,
      });

      const results = await convert.bulk(-1); // Convert all pages

      // Process the last page (signature page)
      const lastPageIndex = results.length - 1;
      const lastPagePath = results[lastPageIndex].path;

      // Load the last page image
      const pageImage = await Jimp.read(lastPagePath);

      // Process signature image
      const signatureBuffer = Buffer.from(
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        signatureBase64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const signatureImage = await Jimp.read(signatureBuffer);

      // Resize signature if needed
      signatureImage.resize(400, 160);

      // Add signature to the page
      pageImage.composite(signatureImage, 400, 1000); // Adjust coordinates

      // Add date text (this is basic - you might want to use a better text rendering library)
      // For better text rendering, consider using canvas or sharp

      // Save the modified page
      await pageImage.writeAsync(lastPagePath);

      // Convert images back to PDF
      const modifiedPdfBuffer = await this.imagesToPDF(
        results.map((r: any) => r.path)
      );

      // Clean up temporary files
      for (const result of results) {
        await fs.unlink(result.path);
      }

      return modifiedPdfBuffer;
    } catch (error: any) {
      console.error("Error signing PDF with image processing:", error);
      throw new Error(`Failed to sign PDF: ${error.message}`);
    }
  }

  // Helper methods
  private async processSignatureImage(pdfDoc: any, signatureBase64: string) {
    // Remove data URL prefix if present
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
    const signatureBytes = Buffer.from(base64Data, "base64");

    // Embed the signature image
    return await pdfDoc.embedPng(signatureBytes);
  }

  private async saveBase64Image(base64Data: string): Promise<string> {
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const imagePath = path.join(
      __dirname,
      "temp",
      `signature_${Date.now()}.png`
    );

    await fs.writeFile(imagePath, buffer);
    return imagePath;
  }

  private async imagesToPDF(_imagePaths: string[]): Promise<Buffer> {
    // This is a placeholder - you'd need to implement image to PDF conversion
    // Consider using libraries like jsPDF or puppeteer
    await Promise.resolve();
    throw new Error("Image to PDF conversion not implemented");
  }
}

export const contractSigningService = ContractSigningService.getInstance();
