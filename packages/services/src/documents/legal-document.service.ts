/**
 * Legal Documents Automation Service
 *
 * Comprehensive service for generating, managing, and automating legal documents
 * for the Kenyan rental market, including tenancy agreements, notices, and compliance documents
 */

import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import FS from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { DocumentTemplate, GeneratedDocument } from "@kaa/models";
import {
  DeliveryMethod,
  type DocumentParty,
  type DocumentRequest,
  FieldType,
  FileAccessLevel,
  FileCategory,
  type GenerationOptions,
  type IDocumentTemplate,
  type IGeneratedDocument,
  Language,
  type LegalDocumentCategory,
  LegalDocumentStatus,
  type LegalDocumentType,
  SmsPriority,
  SmsType,
  type TemplateField,
  type TemplateStatus,
} from "@kaa/models/types";
import {
  deleteFile,
  downloadFile,
  encryptSensitiveData,
  generateChecksum,
  logger,
  redisClient,
  translateToSwahili,
  uploadFile,
} from "@kaa/utils";
import { createCanvas, registerFont } from "canvas";
import Docxtemplater from "docxtemplater";
import PDFDocument from "pdfkit";
import PizZip from "pizzip";
import QRCode from "qrcode";
import type { RedisClientType } from "redis";
import { emailService, smsService, whatsappService } from "../comms";
import { filesV2Service } from "../files/file-v2.service";
import { defaultLegalDocumentTemplates } from "./legal-document.templates";

/**
 * Font configuration type for PDF generation
 */
type FontConfig = {
  path: string;
  family: string;
  weight?: string;
  style?: string;
  required?: boolean;
};

class LegalDocumentsService extends EventEmitter {
  private readonly redis: RedisClientType;
  private readonly templatesPath: string;
  private readonly outputPath: string;
  private readonly useCloudStorage: boolean;
  private readonly registeredFonts: Set<string> = new Set();
  private readonly fontsConfig = {
    enabled: process.env.CUSTOM_FONTS_ENABLED !== "false",
    path: process.env.FONTS_PATH || path.join(process.cwd(), "assets", "fonts"),
    fallbackToSystem: process.env.FONT_FALLBACK_ENABLED !== "false",
  };
  private readonly fontConfigs: FontConfig[] = [
    {
      path: "DejaVuSans.ttf",
      family: "DejaVu Sans",
      required: true,
    },
    {
      path: "DejaVuSans-Bold.ttf",
      family: "DejaVu Sans",
      weight: "bold",
      required: false,
    },
    {
      path: "NotoSans-Regular.ttf",
      family: "Noto Sans",
      required: true,
    },
    {
      path: "NotoSansSwahili-Regular.ttf",
      family: "Noto Sans Swahili",
      required: false,
    },
  ];

  constructor() {
    super();

    this.redis = redisClient;

    this.templatesPath = path.join(process.cwd(), "assets", "legal-templates");
    this.outputPath = path.join(process.cwd(), "storage", "documents");
    this.useCloudStorage = process.env.USE_CLOUD_STORAGE !== "false";

    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Ensure directories exist
      await fs.mkdir(this.templatesPath, { recursive: true });
      await fs.mkdir(this.outputPath, { recursive: true });

      // Load templates
      await this.loadTemplates();

      // Register fonts for PDF generation
      await this.registerFonts();

      logger.info("Legal Documents Service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Legal Documents Service:", error);
      throw error;
    }
  }

  /**
   * Register custom fonts for PDF generation with multilingual support
   * Handles font validation, registration, and graceful fallback
   */
  private async registerFonts(): Promise<void> {
    try {
      // Skip if custom fonts are disabled
      if (!this.fontsConfig.enabled) {
        logger.info("Custom fonts disabled, using system defaults");
        return;
      }

      const fontsPath = this.fontsConfig.path;

      // Verify fonts directory exists
      try {
        await fs.access(fontsPath);
      } catch {
        logger.warn(`Fonts directory not found at ${fontsPath}, creating...`);
        await fs.mkdir(fontsPath, { recursive: true });
      }

      // Register fonts with concurrent validation
      const registrationResults = await Promise.allSettled(
        this.fontConfigs.map(async (config) => {
          const fontPath = path.join(fontsPath, config.path);

          // Check if font file exists
          try {
            await fs.access(fontPath);
          } catch {
            const message = `Font file not found: ${config.path}`;
            if (config.required) {
              throw new Error(message);
            }
            logger.warn(message);
            return null;
          }

          // Validate font file
          const isValid = await this.validateFontFile(fontPath);
          if (!isValid) {
            const message = `Invalid font file: ${config.path}`;
            if (config.required) {
              throw new Error(message);
            }
            logger.warn(message);
            return null;
          }

          // Register font with canvas
          registerFont(fontPath, {
            family: config.family,
            weight: config.weight,
            style: config.style,
          });

          this.registeredFonts.add(config.family);
          logger.info(`Registered font: ${config.family}`, {
            path: config.path,
            weight: config.weight,
            style: config.style,
          });
          return config.family;
        })
      );

      // Analyze registration results
      const successful = registrationResults.filter(
        (r) => r.status === "fulfilled" && r.value
      ).length;
      const failed = registrationResults.filter(
        (r) => r.status === "rejected"
      ).length;

      // Log summary
      if (this.registeredFonts.size === 0) {
        logger.warn("No fonts registered, PDFs will use system default fonts");
      } else {
        logger.info(
          `Font registration complete: ${successful} successful, ${failed} failed`,
          { fonts: Array.from(this.registeredFonts) }
        );
      }

      // Cache available fonts in Redis for quick lookup
      if (this.registeredFonts.size > 0) {
        await this.redis.setEx(
          "legal-service:registered-fonts",
          86_400, // 24 hours
          JSON.stringify(Array.from(this.registeredFonts))
        );
      }
    } catch (error) {
      logger.error("Font registration failed:", error);
      // Don't throw - service can continue with default fonts
      if (this.fontsConfig.fallbackToSystem) {
        logger.info("Falling back to system fonts");
      }
    }
  }

  /**
   * Validate font file exists and has reasonable size
   */
  private async validateFontFile(fontPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(fontPath);

      // Check if file is empty
      if (stats.size === 0) {
        logger.warn(`Font file is empty: ${fontPath}`);
        return false;
      }

      // Check if file is too large (> 10MB is suspicious for a font)
      if (stats.size > 10 * 1024 * 1024) {
        logger.warn(`Font file too large: ${fontPath} (${stats.size} bytes)`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Failed to validate font file: ${fontPath}`, error);
      return false;
    }
  }

  /**
   * Check if a specific font family is available
   */
  isFontAvailable(fontFamily: string): boolean {
    return this.registeredFonts.has(fontFamily);
  }

  /**
   * Get the best available font from a fallback chain
   * Used in PDF generation to select appropriate fonts based on availability
   */
  getFontFallback(preferredFont: string): string {
    const fallbackChain = [
      preferredFont,
      "Noto Sans",
      "DejaVuSans",
      "Helvetica",
      "Arial",
      "sans-serif",
    ];

    for (const font of fallbackChain) {
      if (this.isFontAvailable(font) || font === "sans-serif") {
        return font;
      }
    }

    return "sans-serif";
  }

  private async loadTemplates(): Promise<void> {
    // Check if templates already exist in database
    const existingCount = await DocumentTemplate.countDocuments();

    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing templates in database`);
      return;
    }

    // Create default templates
    const defaultTemplates = defaultLegalDocumentTemplates;

    for (const template of defaultTemplates) {
      // Save to database
      await DocumentTemplate.create(template);

      // Cache template in Redis
      await this.redis.setEx(
        `template:${template.id}`,
        86_400, // 24 hours
        JSON.stringify(template)
      );
    }

    console.log(`Created ${defaultTemplates.length} default templates`);
  }

  // Generate document from template
  async generateDocument(
    request: DocumentRequest
  ): Promise<IGeneratedDocument> {
    try {
      // Validate request
      await this.validateDocumentRequest(request);

      // Get template
      const template = await this.getTemplate(request.templateId);
      if (!template) {
        throw new Error(`Template ${request.templateId} not found`);
      }

      // Validate data against template fields
      await this.validateTemplateData(request.data, template);

      // Generate document ID
      const documentId = crypto.randomUUID();

      // Process template content
      const processedContent = await this.processTemplate(
        template.content,
        request.data,
        request.options.language
      );

      // Generate document based on format
      let filePath: string;
      let fileSize: number;
      let fileUrl: string;
      let cdnUrl: string | undefined;

      switch (request.options.format) {
        case "pdf":
          ({ filePath, fileSize, fileUrl, cdnUrl } = await this.generatePDF(
            documentId,
            processedContent,
            request.options,
            request.requesterId
          ));
          break;
        case "html":
          ({ filePath, fileSize, fileUrl, cdnUrl } = await this.generateHTML(
            documentId,
            processedContent,
            request.options,
            request.requesterId
          ));
          break;
        case "docx":
          ({ filePath, fileSize, fileUrl, cdnUrl } = await this.generateDOCX(
            documentId,
            processedContent,
            request.options,
            request.requesterId
          ));
          break;
        default:
          throw new Error(`Unsupported format: ${request.options.format}`);
      }

      // Calculate checksum
      const fileBuffer = await fs.readFile(filePath);
      const checksum = generateChecksum(fileBuffer);

      // Generate QR code for document verification
      const qrCode = await this.generateQRCode(documentId, checksum);

      // Add digital signature if requested
      let digitalSignature: string | undefined;
      if (request.options.digitalSignature) {
        digitalSignature = await this.addDigitalSignature(
          fileBuffer,
          request.requesterId
        );
      }

      // Encrypt if requested
      let encryptedData: string | undefined;
      if (request.options.encryption && request.options.password) {
        encryptedData = await this.encryptDocument(
          fileBuffer,
          request.options.password
        );
      }

      // Create document record
      const documentData: Partial<IGeneratedDocument> = {
        id: documentId,
        templateId: template.id,
        type: template.type,
        title: template.metadata.title,
        fileName: path.basename(filePath),
        filePath: fileUrl, // Use cloud URL
        fileSize,
        format: request.options.format,
        language: request.options.language,
        checksum,
        qrCode,
        digitalSignature,
        encrypted: !!encryptedData,
        status: LegalDocumentStatus.GENERATED,
        metadata: {
          ...request.metadata,
          generationOptions: request.options,
          templateVersion: template.version,
          cdnUrl,
          localPath: filePath,
          encryptedData,
        },
        parties: this.extractParties(request.data),
        generatedBy: request.requesterId,
        // propertyId: request.propertyId as unknown as mongoose.Types.ObjectId,
        // tenantId: request.tenantId,
        // landlordId: request.landlordId,
        // deliveryMethods: request.options.delivery,
      };

      // Save to database
      const document = await GeneratedDocument.create(documentData);

      const fileName = path.basename(filePath);

      // Create file record
      const uploadOptions = {
        ownerId: request.requesterId,
        uploadedBy: request.requesterId,
        category: FileCategory.LEGAL_DOCUMENT,
        accessLevel: FileAccessLevel.PUBLIC,
        description: `Legal document: ${template.metadata.title}`,
        tags: ["legal-document", template.type, ...template.metadata.tags],
        relatedEntityId: document.id,
        relatedEntityType: "document",
        metadata: {
          checksum,
          qrCode,
        },
      };

      await filesV2Service.uploadFile(fileBuffer, fileName, uploadOptions);

      // Cache document record
      await this.cacheDocument(document.toObject());

      // Emit document generated event
      this.emit("document.generated", {
        document: document.toObject(),
        request,
        timestamp: new Date(),
      });

      // Handle delivery
      if (request.options.delivery.length > 0) {
        await this.deliverDocument(document.toObject(), request);
      }

      logger.info(`Document generated successfully: ${documentId}`);

      return document.toObject();
    } catch (error) {
      console.error("Document generation error:", error);

      this.emit("document.generation.failed", {
        request,
        error: (error as Error).message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  private async generatePDF(
    documentId: string,
    content: string,
    options: GenerationOptions,
    userId: string
  ): Promise<{
    filePath: string;
    fileSize: number;
    fileUrl: string;
    cdnUrl?: string;
  }> {
    const fileName = `${documentId}.pdf`;
    const localPath = path.join(this.outputPath, fileName);

    // Professional PDF configuration
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72,
      },
      info: {
        Title: "Legal Document",
        Author: "Kaa Rentals Platform",
        Subject: "Legal Document - Rental Agreement",
        Keywords: "legal, document, rental, agreement, kenya",
        Creator: "Kaa Legal Documents Service",
        Producer: "Kaa Platform",
        CreationDate: new Date(),
      },
      compress: true, // Enable compression for smaller file sizes
    });

    const stream = FS.createWriteStream(localPath);
    doc.pipe(stream);

    // Get appropriate fonts with fallback support
    // const boldFont = this.getFontFallback("DejaVu Sans");
    // const regularFont = this.getFontFallback("DejaVu Sans");

    // Typography configuration
    const typography = {
      fontRegular: "Helvetica",
      fontBold: "Helvetica-Bold",
      fontItalic: "Helvetica-Oblique",
      sizes: {
        title: 24,
        heading1: 18,
        heading2: 16,
        heading3: 14,
        body: 11,
        small: 9,
        footnote: 8,
      },
      colors: {
        primary: "#1e293b",
        secondary: "#64748b",
        accent: "#2563eb",
        success: "#16a34a",
        danger: "#dc2626",
        light: "#94a3b8",
      },
      spacing: {
        paragraph: 6,
        heading: 12,
        section: 18,
        large: 24,
      },
    };

    // Page tracking for headers/footers
    let pageNumber = 0;
    const totalPages: number[] = [];

    // Add page numbers and headers/footers
    doc.on("pageAdded", () => {
      pageNumber++;
      totalPages.push(pageNumber);
      this.addPageHeaderFooter(doc, documentId, pageNumber, typography);
    });

    // Generate QR code image for embedding
    // Note: Checksum will be calculated after PDF generation, so we use a temporary one
    let qrCodeImage: Buffer | null = null;
    if (options.digitalSignature) {
      try {
        // Generate QR code with document ID (checksum will be added later in document metadata)
        const qrCodeDataUrl = await this.generateQRCode(
          documentId,
          "pending" // Placeholder checksum, actual checksum added in document metadata
        );
        qrCodeImage = Buffer.from(
          qrCodeDataUrl.split(",")[1] || qrCodeDataUrl,
          "base64"
        );
      } catch (error) {
        logger.warn("Failed to generate QR code for PDF:", error);
      }
    }

    // Add watermark background if specified
    if (options.watermark) {
      this.addWatermarkBackground(doc, options.watermark, typography);
    }

    // Document header
    this.addDocumentHeader(doc, documentId, typography);

    // Process and render content with rich formatting
    await this.renderRichContent(doc, content, typography, {
      width: doc.page.width - 144, // Account for margins
    });

    // Add signature section
    this.addSignatureSection(doc, typography, {
      width: doc.page.width - 144,
    });

    // Add verification footer if QR code available
    if (qrCodeImage && options.digitalSignature) {
      await this.addVerificationFooter(
        doc,
        documentId,
        qrCodeImage,
        typography
      );
    }

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      stream.on("finish", () => resolve());
      stream.on("error", (error) => {
        logger.error("PDF stream error:", error);
        reject(error);
      });
    });

    // Upload to cloud storage if enabled
    if (this.useCloudStorage) {
      const fileBuffer = await fs.readFile(localPath);
      const uploadResult = await uploadFile(
        {
          originalname: fileName,
          buffer: fileBuffer,
          mimetype: "application/pdf",
          size: fileBuffer.length,
        },
        {
          fileName,
          userId,
          public: false,
        }
      );

      return {
        filePath: localPath,
        fileSize: uploadResult.size,
        fileUrl: uploadResult.url,
        cdnUrl: uploadResult.cdnUrl,
      };
    }

    const stats = await fs.stat(localPath);
    return {
      filePath: localPath,
      fileSize: stats.size,
      fileUrl: localPath,
    };
  }

  /**
   * Add professional page header and footer
   */
  private addPageHeaderFooter(
    doc: PDFKit.PDFDocument,
    documentId: string,
    pageNumber: number,
    typography: {
      fontRegular: string;
      sizes: Record<string, number>;
      colors: Record<string, string>;
    }
  ): void {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 72;
    const footnoteSize = typography.sizes.footnote ?? 8;
    const secondaryColor = typography.colors.secondary ?? "#64748b";

    // Header
    doc
      .save()
      .fontSize(footnoteSize)
      .fillColor(secondaryColor)
      .font(typography.fontRegular)
      .text("KAA RENTALS", margin, 40, {
        align: "left",
        width: pageWidth - 2 * margin,
      })
      .text(`Document ID: ${documentId.slice(0, 8)}...`, margin, 52, {
        align: "right",
        width: pageWidth - 2 * margin,
      })
      .restore();

    // Footer with page number
    const footerY = pageHeight - 40;
    doc
      .save()
      .fontSize(footnoteSize)
      .fillColor(secondaryColor)
      .font(typography.fontRegular)
      .text(`Page ${pageNumber}`, margin, footerY, {
        align: "center",
        width: pageWidth - 2 * margin,
      })
      .text(
        new Date().toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        margin,
        footerY + 12,
        {
          align: "right",
          width: pageWidth - 2 * margin,
        }
      )
      .restore();
  }

  /**
   * Add watermark background to all pages
   */
  private addWatermarkBackground(
    doc: PDFKit.PDFDocument,
    watermarkText: string,
    typography: {
      fontRegular: string;
      colors: Record<string, string>;
    }
  ): void {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    const lightColor = typography.colors.light ?? "#94a3b8";

    doc
      .save()
      .fontSize(72)
      .fillColor(lightColor)
      .fillOpacity(0.08)
      .font(typography.fontRegular)
      .rotate(45, { origin: [centerX, centerY] })
      .text(watermarkText, centerX - 200, centerY - 36, {
        align: "center",
        width: 400,
      })
      .restore();
  }

  /**
   * Add professional document header
   */
  private addDocumentHeader(
    doc: PDFKit.PDFDocument,
    _documentId: string,
    typography: {
      fontBold: string;
      fontRegular: string;
      sizes: Record<string, number>;
      colors: Record<string, string>;
      spacing: Record<string, number>;
    }
  ): void {
    const titleSize = typography.sizes.title ?? 24;
    const primaryColor = typography.colors.primary ?? "#1e293b";
    const smallSize = typography.sizes.small ?? 9;
    const secondaryColor = typography.colors.secondary ?? "#64748b";
    const sectionSpacing = typography.spacing.section ?? 18;
    const lightColor = typography.colors.light ?? "#94a3b8";

    doc
      .fontSize(titleSize)
      .fillColor(primaryColor)
      .font(typography.fontBold)
      .text("KAA RENTALS", {
        align: "center",
        width: doc.page.width - 144,
      });

    doc.moveDown(0.3);

    doc
      .fontSize(smallSize)
      .fillColor(secondaryColor)
      .font(typography.fontRegular)
      .text("Legal Document Generation Platform", {
        align: "center",
        width: doc.page.width - 144,
      });

    doc.moveDown(sectionSpacing);

    // Divider line
    doc
      .moveTo(72, doc.y)
      .lineTo(doc.page.width - 72, doc.y)
      .strokeColor(lightColor)
      .lineWidth(1)
      .stroke();

    doc.moveDown(sectionSpacing);
  }

  /**
   * Render content with rich formatting support
   * Supports: headings, bold, italic, lists, paragraphs, tables
   */
  private renderRichContent(
    doc: PDFKit.PDFDocument,
    content: string,
    typography: {
      fontRegular: string;
      fontBold: string;
      fontItalic: string;
      sizes: Record<string, number>;
      colors: Record<string, string>;
      spacing: Record<string, number>;
    },
    options: { width: number }
  ): void {
    const lines = content.split("\n");
    let inList = false;
    let listType: "ordered" | "unordered" | null = null;
    let orderedIndex = 1;

    for (const line of lines) {
      if (!line) {
        continue;
      }
      const trimmedLine = line.trim();

      // Check if we need a page break
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      if (!trimmedLine) {
        // Empty line - end list if active
        if (inList) {
          inList = false;
          listType = null;
          orderedIndex = 1;
          doc.moveDown(typography.spacing.paragraph ?? 6);
        } else {
          doc.moveDown((typography.spacing.paragraph ?? 6) * 0.5);
        }
        continue;
      }

      // Heading detection
      const primaryColor = typography.colors.primary ?? "#1e293b";
      const heading1Size = typography.sizes.heading1 ?? 18;
      const heading2Size = typography.sizes.heading2 ?? 16;
      const heading3Size = typography.sizes.heading3 ?? 14;
      const headingSpacing = typography.spacing.heading ?? 12;
      const paragraphSpacing = typography.spacing.paragraph ?? 6;

      if (trimmedLine.startsWith("# ")) {
        if (inList) {
          inList = false;
          listType = null;
        }
        doc
          .fontSize(heading1Size)
          .fillColor(primaryColor)
          .font(typography.fontBold)
          // biome-ignore lint/performance/useTopLevelRegex: ignore
          .text(trimmedLine.replace(/^#+\s*/, "").trim(), {
            width: options.width,
            align: "left",
          });
        doc.moveDown(headingSpacing);
      } else if (trimmedLine.startsWith("## ")) {
        if (inList) {
          inList = false;
          listType = null;
        }
        doc
          .fontSize(heading2Size)
          .fillColor(primaryColor)
          .font(typography.fontBold)
          // biome-ignore lint/performance/useTopLevelRegex: ignore
          .text(trimmedLine.replace(/^#+\s*/, "").trim(), {
            width: options.width,
            align: "left",
          });
        doc.moveDown(headingSpacing * 0.75);
      } else if (trimmedLine.startsWith("### ")) {
        if (inList) {
          inList = false;
          listType = null;
        }
        doc
          .fontSize(heading3Size)
          .fillColor(primaryColor)
          .font(typography.fontBold)
          // biome-ignore lint/performance/useTopLevelRegex: ignore
          .text(trimmedLine.replace(/^#+\s*/, "").trim(), {
            width: options.width,
            align: "left",
          });
        doc.moveDown(headingSpacing * 0.5);
      }
      // Ordered list detection
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      else if (/^\d+\.\s/.test(trimmedLine)) {
        if (!inList || listType !== "ordered") {
          inList = true;
          listType = "ordered";
          orderedIndex = 1;
        }
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        const listText = trimmedLine.replace(/^\d+\.\s/, "");
        const bullet = `${orderedIndex}. `;
        const indent = 20;

        const bodySize = typography.sizes.body ?? 11;
        doc
          .fontSize(bodySize)
          .fillColor(primaryColor)
          .font(typography.fontRegular);

        doc.text(bullet, { continued: false, width: indent });

        // Render formatted text with bold/italic support
        this.renderFormattedText(
          doc,
          listText,
          options.width - indent,
          typography
        );

        orderedIndex++;
        doc.moveDown(paragraphSpacing * 0.75);
      }
      // Unordered list detection
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      else if (/^[-*]\s/.test(trimmedLine)) {
        if (!inList || listType !== "unordered") {
          inList = true;
          listType = "unordered";
        }
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        const listText = trimmedLine.replace(/^[-*]\s/, "");
        const bullet = "• ";
        const indent = 20;

        const bodySize = typography.sizes.body ?? 11;
        doc
          .fontSize(bodySize)
          .fillColor(primaryColor)
          .font(typography.fontRegular);

        doc.text(bullet, { continued: false, width: indent });

        // Render formatted text with bold/italic support
        this.renderFormattedText(
          doc,
          listText,
          options.width - indent,
          typography
        );

        doc.moveDown(paragraphSpacing * 0.75);
      }
      // Regular paragraph with formatting
      else {
        if (inList) {
          inList = false;
          listType = null;
          orderedIndex = 1;
        }

        const bodySize = typography.sizes.body ?? 11;
        doc
          .fontSize(bodySize)
          .fillColor(primaryColor)
          .font(typography.fontRegular);

        this.renderFormattedText(doc, trimmedLine, options.width, typography);
        doc.moveDown(paragraphSpacing);
      }
    }
  }

  /**
   * Render text with inline formatting (bold, italic)
   */
  private renderFormattedText(
    doc: PDFKit.PDFDocument,
    text: string,
    width: number,
    typography: {
      fontRegular: string;
      fontBold: string;
      fontItalic: string;
      colors: Record<string, string>;
    }
  ): void {
    // Parse bold (**text**) and italic (*text*) markers
    const parts: Array<{
      text: string;
      bold?: boolean;
      italic?: boolean;
    }> = [];

    const boldRegex = /\*\*([^*]+)\*\*/g;
    const italicRegex = /\*([^*]+)\*/g;

    const boldMatches: Array<{ start: number; end: number; text: string }> = [];
    const italicMatches: Array<{ start: number; end: number; text: string }> =
      [];

    // Collect all bold matches
    let match: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: ignore
    while ((match = boldRegex.exec(text)) !== null) {
      const matchText = match[1];
      if (matchText) {
        boldMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: matchText,
        });
      }
    }

    // Collect all italic matches (excluding those inside bold)
    // biome-ignore lint/suspicious/noAssignInExpressions: ignore
    while ((match = italicRegex.exec(text)) !== null) {
      const isInsideBold = boldMatches.some(
        (bm) =>
          match &&
          match.index !== undefined &&
          match.index > bm.start &&
          match.index < bm.end
      );
      const matchText = match[1];
      if (!isInsideBold && matchText) {
        italicMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: matchText,
        });
      }
    }

    // Merge and sort all matches
    const allMatches = [
      ...boldMatches.map((m) => ({ ...m, type: "bold" as const })),
      ...italicMatches.map((m) => ({ ...m, type: "italic" as const })),
    ].sort((a, b) => a.start - b.start);

    // Build parts array
    let lastIndex = 0;
    for (const match of allMatches) {
      if (match.start > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.start) });
      }
      parts.push({
        text: match.text,
        bold: match.type === "bold",
        italic: match.type === "italic",
      });
      lastIndex = match.end;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex) });
    }

    // If no formatting found, render as plain text
    if (parts.length === 0) {
      doc.text(text, { width, align: "left" });
      return;
    }

    // Render parts with formatting
    let isFirst = true;
    for (const part of parts) {
      if (part.text.length === 0) {
        continue;
      }

      const font =
        part.bold && part.italic
          ? typography.fontBold
          : part.bold
            ? typography.fontBold
            : part.italic
              ? typography.fontItalic
              : typography.fontRegular;

      doc.font(font).text(part.text, {
        width: isFirst ? width : undefined,
        continued: !isFirst || part !== parts.at(-1),
      });

      isFirst = false;
    }

    // Reset to regular font
    doc.font(typography.fontRegular);
  }

  /**
   * Add professional signature section
   */
  private addSignatureSection(
    doc: PDFKit.PDFDocument,
    typography: {
      fontRegular: string;
      fontBold: string;
      sizes: Record<string, number>;
      colors: Record<string, string>;
      spacing: Record<string, number>;
    },
    options: { width: number }
  ): void {
    // Ensure we have space or add new page
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    }

    doc.moveDown(typography.spacing.large);

    // Signature boxes
    const signatureWidth = (options.width - 20) / 2;
    const signatureHeight = 80;
    const lightColor = typography.colors.light ?? "#94a3b8";
    const secondaryColor = typography.colors.secondary ?? "#64748b";
    const primaryColor = typography.colors.primary ?? "#1e293b";
    const smallSize = typography.sizes.small ?? 9;
    const paragraphSpacing = typography.spacing.paragraph ?? 6;

    // Landlord signature
    doc
      .rect(72, doc.y, signatureWidth, signatureHeight)
      .strokeColor(lightColor)
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(smallSize)
      .fillColor(secondaryColor)
      .font(typography.fontRegular)
      .text("Landlord Signature & Date", 77, doc.y + 5, {
        width: signatureWidth - 10,
      });

    doc
      .moveTo(77, doc.y + signatureHeight - 25)
      .lineTo(72 + signatureWidth - 5, doc.y + signatureHeight - 25)
      .strokeColor(primaryColor)
      .lineWidth(0.5)
      .stroke();

    doc.moveDown(signatureHeight + paragraphSpacing);

    // Tenant signature
    doc
      .rect(72, doc.y, signatureWidth, signatureHeight)
      .strokeColor(lightColor)
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(smallSize)
      .fillColor(secondaryColor)
      .font(typography.fontRegular)
      .text("Tenant Signature & Date", 77, doc.y + 5, {
        width: signatureWidth - 10,
      });

    doc
      .moveTo(77, doc.y + signatureHeight - 25)
      .lineTo(72 + signatureWidth - 5, doc.y + signatureHeight - 25)
      .strokeColor(primaryColor)
      .lineWidth(0.5)
      .stroke();
  }

  /**
   * Add verification footer with QR code
   */
  private addVerificationFooter(
    doc: PDFKit.PDFDocument,
    documentId: string,
    qrCodeImage: Buffer,
    typography: {
      fontRegular: string;
      sizes: Record<string, number>;
      colors: Record<string, string>;
      spacing?: Record<string, number>;
    }
  ): void {
    // Ensure we have space or add new page
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }

    const sectionSpacing = typography.spacing?.section ?? 18;
    const paragraphSpacing = typography.spacing?.paragraph ?? 6;
    const lightColor = typography.colors.light ?? "#94a3b8";
    const secondaryColor = typography.colors.secondary ?? "#64748b";
    const smallSize = typography.sizes.small ?? 9;
    const footnoteSize = typography.sizes.footnote ?? 8;

    doc.moveDown(sectionSpacing);

    // Divider
    doc
      .moveTo(72, doc.y)
      .lineTo(doc.page.width - 72, doc.y)
      .strokeColor(lightColor)
      .lineWidth(1)
      .stroke();

    doc.moveDown(paragraphSpacing);

    try {
      // Add QR code image
      const qrSize = 80;
      doc.image(qrCodeImage, doc.page.width - 72 - qrSize, doc.y, {
        width: qrSize,
        height: qrSize,
      });

      // Add verification text
      doc
        .fontSize(smallSize)
        .fillColor(secondaryColor)
        .font(typography.fontRegular)
        .text("Document Verification", 72, doc.y, {
          width: doc.page.width - 144 - qrSize - 10,
        });

      doc.moveDown(paragraphSpacing * 0.5);

      doc
        .fontSize(footnoteSize)
        .fillColor(secondaryColor)
        .text(`Document ID: ${documentId}`, 72, doc.y, {
          width: doc.page.width - 144 - qrSize - 10,
        });

      doc
        .fontSize(footnoteSize)
        .fillColor(secondaryColor)
        .text(
          "Scan QR code or use Document ID to verify authenticity",
          72,
          doc.y + 12,
          {
            width: doc.page.width - 144 - qrSize - 10,
          }
        );
    } catch (error) {
      logger.warn("Failed to add QR code to PDF:", error);
      // Fallback to text only
      doc
        .fontSize(smallSize)
        .fillColor(secondaryColor)
        .text(`Document ID: ${documentId}`, {
          width: doc.page.width - 144,
          align: "center",
        });
    }
  }

  private async generateHTML(
    documentId: string,
    content: string,
    options: GenerationOptions,
    userId: string
  ): Promise<{
    filePath: string;
    fileSize: number;
    fileUrl: string;
    cdnUrl?: string;
  }> {
    const fileName = `${documentId}.html`;
    const localPath = path.join(this.outputPath, fileName);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${options.language}">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Legal Document - ${documentId}</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 18px; font-weight: bold; }
              .content { margin: 20px 0; }
              .signature-section { margin-top: 50px; }
              .signature-box { border-bottom: 1px solid #000; width: 300px; margin: 20px 0; padding-bottom: 5px; }
              ${options.watermark ? ".watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg); opacity: 0.1; font-size: 60px; pointer-events: none; }" : ""}
          </style>
      </head>
      <body>
          ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ""}
          <div class="header">
              <div class="title">KAA RENTALS</div>
          </div>
          <div class="content">
              ${content
                .replace(/\n/g, "<br>")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/^#(.*)/gm, "<h3>$1</h3>")}
          </div>
          <div class="signature-section">
              <div class="signature-box">Landlord Signature & Date</div>
              <div class="signature-box">Tenant Signature & Date</div>
          </div>
          <div style="text-align: center; margin-top: 30px; font-size: 10px;">
              Document ID: ${documentId}
          </div>
      </body>
      </html>
      `;

    await fs.writeFile(localPath, htmlContent, "utf-8");

    // Upload to cloud storage if enabled
    if (this.useCloudStorage) {
      const fileBuffer = Buffer.from(htmlContent, "utf-8");
      const uploadResult = await uploadFile(
        {
          originalname: fileName,
          buffer: fileBuffer,
          mimetype: "text/html",
          size: fileBuffer.length,
        },
        {
          fileName,
          userId,
          public: false,
        }
      );

      return {
        filePath: localPath,
        fileSize: uploadResult.size,
        fileUrl: uploadResult.url,
        cdnUrl: uploadResult.cdnUrl,
      };
    }

    const stats = await fs.stat(localPath);
    return {
      filePath: localPath,
      fileSize: stats.size,
      fileUrl: localPath,
    };
  }

  private async generateDOCX(
    documentId: string,
    content: string,
    options: GenerationOptions,
    userId: string
  ): Promise<{
    filePath: string;
    fileSize: number;
    fileUrl: string;
    cdnUrl?: string;
  }> {
    const fileName = `${documentId}.docx`;
    const localPath = path.join(this.outputPath, fileName);

    try {
      // Create a basic DOCX template
      const templateContent = this.createDOCXTemplate(content, options);

      // Create a new PizZip instance
      const zip = new PizZip(templateContent);

      // Create docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Generate the document
      doc.render();

      // Get the document as a buffer
      const buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      // Write to file
      await fs.writeFile(localPath, buffer);

      // Upload to cloud storage if enabled
      if (this.useCloudStorage) {
        const uploadResult = await uploadFile(
          {
            originalname: fileName,
            buffer,
            mimetype:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: buffer.length,
          },
          {
            fileName,
            userId,
            public: false,
          }
        );

        return {
          filePath: localPath,
          fileSize: uploadResult.size,
          fileUrl: uploadResult.url,
          cdnUrl: uploadResult.cdnUrl,
        };
      }

      const stats = await fs.stat(localPath);
      return {
        filePath: localPath,
        fileSize: stats.size,
        fileUrl: localPath,
      };
    } catch (error) {
      logger.error("DOCX generation error:", error);
      throw new Error(`Failed to generate DOCX: ${(error as Error).message}`);
    }
  }

  private createDOCXTemplate(
    content: string,
    options: GenerationOptions
  ): Buffer {
    // Create a minimal DOCX structure
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        ${this.contentToWordXML(content, options)}
        <w:sectPr>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
        </w:sectPr>
    </w:body>
</w:document>`;

    // Create ZIP structure for DOCX
    const zip = new PizZip();

    // Add required files
    zip.file(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    );

    zip.file(
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );

    zip.file(
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`
    );

    zip.file("word/document.xml", xml);

    return zip.generate({ type: "nodebuffer" });
  }

  private contentToWordXML(
    content: string,
    options: GenerationOptions
  ): string {
    let xml = "";
    const lines = content.split("\n");

    // Add watermark if specified
    if (options.watermark) {
      xml += `<w:p>
                <w:pPr>
                    <w:jc w:val="center"/>
                </w:pPr>
                <w:r>
                    <w:rPr>
                        <w:color w:val="D3D3D3"/>
                        <w:sz w:val="72"/>
                    </w:rPr>
                    <w:t>${this.escapeXML(options.watermark)}</w:t>
                </w:r>
            </w:p>`;
    }

    for (const line of lines) {
      if (!line.trim()) {
        // Empty line
        xml += "<w:p/>";
        continue;
      }

      if (line.startsWith("#")) {
        // Heading
        xml += `<w:p>
                    <w:pPr>
                        <w:pStyle w:val="Heading1"/>
                    </w:pPr>
                    <w:r>
                        <w:rPr>
                            <w:b/>
                            <w:sz w:val="32"/>
                        </w:rPr>
                        <w:t>${this.escapeXML(line.replace("#", "").trim())}</w:t>
                    </w:r>
                </w:p>`;
      } else if (line.startsWith("**") && line.endsWith("**")) {
        // Bold text
        xml += `<w:p>
                    <w:r>
                        <w:rPr>
                            <w:b/>
                        </w:rPr>
                        <w:t>${this.escapeXML(line.replace(/\*\*/g, ""))}</w:t>
                    </w:r>
                </w:p>`;
      } else {
        // Normal paragraph
        xml += `<w:p>
                    <w:r>
                        <w:t>${this.escapeXML(line)}</w:t>
                    </w:r>
                </w:p>`;
      }
    }

    // Add signature section
    xml += `<w:p>
            <w:pPr>
                <w:spacing w:before="480"/>
            </w:pPr>
        </w:p>
        <w:p>
            <w:r>
                <w:t>_________________________________________________</w:t>
            </w:r>
        </w:p>
        <w:p>
            <w:r>
                <w:t>Landlord Signature &amp; Date</w:t>
            </w:r>
        </w:p>
        <w:p/>
        <w:p>
            <w:r>
                <w:t>_________________________________________________</w:t>
            </w:r>
        </w:p>
        <w:p>
            <w:r>
                <w:t>Tenant Signature &amp; Date</w:t>
            </w:r>
        </w:p>`;

    return xml;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private async processTemplate(
    template: string,
    data: Record<string, any>,
    language: Language
  ): Promise<string> {
    let processed = template;

    // Replace placeholders
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`\\{${key}\\}`, "g");
      processed = processed.replace(placeholder, String(value || ""));
    }

    // Handle language-specific content
    if (language === Language.SWAHILI) {
      processed = await this.translateToSwahiliContent(processed);
    } else if (language === Language.BILINGUAL) {
      processed = await this.addBilingualContent(processed);
    }

    // Add current date if needed
    processed = processed.replace(
      /\{currentDate\}/g,
      new Date().toLocaleDateString("en-GB")
    );

    return processed;
  }

  private async translateToSwahiliContent(content: string): Promise<string> {
    // Use the comprehensive translation utility
    return await translateToSwahili(content);
  }

  private async addBilingualContent(content: string): Promise<string> {
    // Add both English and Swahili versions
    const swahiliContent = await this.translateToSwahiliContent(content);
    return `${content}\n\n--- SWAHILI VERSION / TOLEO LA KISWAHILI ---\n\n${swahiliContent}`;
  }

  private async generateQRCode(
    documentId: string,
    checksum: string
  ): Promise<string> {
    const verificationData = {
      documentId,
      checksum,
      verificationUrl: `${process.env.API_BASE_URL}/api/v1/legal-documents/verify/${documentId}`,
      timestamp: Date.now(),
    };

    return await QRCode.toDataURL(JSON.stringify(verificationData));
  }

  /**
   * Create a custom watermark image using canvas
   * Returns a data URL that can be embedded in PDFs
   */
  createWatermarkImage(
    text: string,
    options: {
      width?: number;
      height?: number;
      fontSize?: number;
      opacity?: number;
      rotation?: number;
      color?: string;
    } = {}
  ): string {
    const {
      width = 600,
      height = 400,
      fontSize = 72,
      opacity = 0.2,
      rotation = -45,
      color = "#999999",
    } = options;

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Set transparent background
    ctx.clearRect(0, 0, width, height);

    // Configure text
    const font = this.getFontFallback("DejaVu Sans");
    ctx.font = `bold ${fontSize}px "${font}"`;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Apply rotation
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw text
    ctx.fillText(text, 0, 0);

    // Return as data URL
    return canvas.toDataURL("image/png");
  }

  /**
   * Create an official seal or stamp image
   * Useful for official documents requiring certification marks
   */
  createOfficialSeal(options: {
    text: string;
    subtext?: string;
    size?: number;
    color?: string;
  }): Buffer {
    const { text, subtext, size = 200, color = "#1e40af" } = options;

    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // Draw outer circle
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw inner circle
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 20, 0, 2 * Math.PI);
    ctx.stroke();

    // Add text (curved along top)
    ctx.fillStyle = color;
    ctx.font = `bold ${size / 12}px "${this.getFontFallback("DejaVu Sans")}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Main text
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.fillText(text, 0, -size / 6);
    ctx.restore();

    // Subtext
    if (subtext) {
      ctx.font = `${size / 16}px "${this.getFontFallback("DejaVu Sans")}"`;
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.fillText(subtext, 0, size / 6);
      ctx.restore();
    }

    // Add center star/emblem
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 20, 0, 2 * Math.PI);
    ctx.fill();

    return canvas.toBuffer("image/png");
  }

  /**
   * Create a visual signature placeholder with custom design
   */
  createSignaturePlaceholder(options: {
    label: string;
    width?: number;
    height?: number;
  }): Buffer {
    const { label, width = 400, height = 100 } = options;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(5, 5, width - 10, height - 10);

    // Label
    ctx.fillStyle = "#6b7280";
    ctx.font = `14px "${this.getFontFallback("DejaVu Sans")}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label, width / 2, 15);

    // Signature line
    ctx.setLineDash([]);
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, height - 30);
    ctx.lineTo(width - 50, height - 30);
    ctx.stroke();

    // Date placeholder
    ctx.fillStyle = "#9ca3af";
    ctx.font = `12px "${this.getFontFallback("DejaVu Sans")}"`;
    ctx.fillText("Date: __________________", width / 2, height - 15);

    return canvas.toBuffer("image/png");
  }

  /**
   * Create a branded header image for documents
   */
  createDocumentHeader(options: {
    title: string;
    subtitle?: string;
    logoPath?: string;
    width?: number;
    height?: number;
  }): Buffer {
    const { title, subtitle, width = 800, height = 150 } = options;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#1e40af");
    gradient.addColorStop(1, "#3b82f6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${height / 4}px "${this.getFontFallback("DejaVu Sans")}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, width / 2, height / 2 - 10);

    // Subtitle
    if (subtitle) {
      ctx.font = `${height / 8}px "${this.getFontFallback("DejaVu Sans")}"`;
      ctx.fillText(subtitle, width / 2, height / 2 + height / 5);
    }

    return canvas.toBuffer("image/png");
  }

  /**
   * Create a verification badge with QR code
   * Combines canvas drawing with QR code generation
   */
  async createVerificationBadge(
    documentId: string,
    checksum: string
  ): Promise<Buffer> {
    const size = 300;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, size - 20, size - 20);

    // Header
    ctx.fillStyle = "#10b981";
    ctx.font = `bold 24px "${this.getFontFallback("DejaVu Sans")}"`;
    ctx.textAlign = "center";
    ctx.fillText("VERIFIED", size / 2, 40);

    // Generate QR code as data URL
    const qrDataUrl = await this.generateQRCode(documentId, checksum);

    // Note: To embed the QR code, you'd need to load it as an image
    // This is a simplified version showing the structure

    // Document ID
    ctx.fillStyle = "#374151";
    ctx.font = `12px "${this.getFontFallback("DejaVu Sans")}"`;
    ctx.fillText(`Doc ID: ${documentId.slice(0, 12)}...`, size / 2, size - 40);

    // Checksum
    ctx.font = `10px "${this.getFontFallback("DejaVu Sans")}"`;
    ctx.fillText(`Checksum: ${checksum.slice(0, 16)}...`, size / 2, size - 20);

    return canvas.toBuffer("image/png");
  }

  /**
   * Create a custom chart or graph for analytics
   * Example: Rent payment timeline, occupancy rates, etc.
   */
  createSimpleBarChart(
    data: Array<{ label: string; value: number }>,
    options: {
      title?: string;
      width?: number;
      height?: number;
      color?: string;
    } = {}
  ): Buffer {
    const { title, width = 600, height = 400, color = "#3b82f6" } = options;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Title
    if (title) {
      ctx.fillStyle = "#1f2937";
      ctx.font = `bold 20px "${this.getFontFallback("DejaVu Sans")}"`;
      ctx.textAlign = "center";
      ctx.fillText(title, width / 2, 30);
    }

    // Calculate chart dimensions
    const chartTop = title ? 60 : 30;
    const chartHeight = height - chartTop - 60;
    const chartLeft = 80;
    const chartWidth = width - chartLeft - 40;

    // Find max value for scaling
    const maxValue = Math.max(...data.map((d) => d.value));

    // Draw bars
    const barWidth = chartWidth / data.length;
    const padding = barWidth * 0.2;

    for (const [index, item] of data.entries()) {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = chartLeft + index * barWidth + padding;
      const y = chartTop + chartHeight - barHeight;

      // Bar
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth - 2 * padding, barHeight);

      // Value on top
      ctx.fillStyle = "#374151";
      ctx.font = `12px "${this.getFontFallback("DejaVu Sans")}"`;
      ctx.textAlign = "center";
      ctx.fillText(
        item.value.toString(),
        x + (barWidth - 2 * padding) / 2,
        y - 5
      );

      // Label
      ctx.save();
      ctx.translate(
        x + (barWidth - 2 * padding) / 2,
        chartTop + chartHeight + 15
      );
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = "right";
      ctx.fillText(item.label, 0, 0);
      ctx.restore();
    }

    // Y-axis
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartTop + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop + chartHeight);
    ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
    ctx.stroke();

    return canvas.toBuffer("image/png");
  }

  private async addDigitalSignature(
    fileBuffer: Buffer,
    signerId: string
  ): Promise<string> {
    // Create a cryptographic signature
    const signature = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .update(signerId)
      .update(Date.now().toString())
      .digest("hex");

    return await Promise.resolve(signature);
  }

  private async encryptDocument(
    fileBuffer: Buffer,
    _password: string
  ): Promise<string> {
    // Use AES-256-GCM encryption from utils
    const encryptedData = encryptSensitiveData(fileBuffer.toString("base64"));
    return await Promise.resolve(encryptedData);
  }

  private extractParties(data: Record<string, any>): DocumentParty[] {
    const parties: DocumentParty[] = [];

    if (data.landlordName) {
      parties.push({
        type: "landlord",
        name: data.landlordName,
        idNumber: data.landlordId,
        phoneNumber: data.landlordPhone,
        email: data.landlordEmail,
        address: data.landlordAddress,
        signed: false,
      });
    }

    if (data.tenantName) {
      parties.push({
        type: "tenant",
        name: data.tenantName,
        idNumber: data.tenantId,
        phoneNumber: data.tenantPhone,
        email: data.tenantEmail,
        address: data.tenantAddress,
        signed: false,
      });
    }

    return parties;
  }

  private async deliverDocument(
    document: IGeneratedDocument,
    request: DocumentRequest
  ): Promise<void> {
    for (const method of request.options.delivery) {
      try {
        switch (method) {
          case DeliveryMethod.EMAIL:
            await this.deliverByEmail(document, request);
            break;
          case DeliveryMethod.SMS:
            await this.deliverBySMS(document, request);
            break;
          case DeliveryMethod.WHATSAPP:
            await this.deliverByWhatsApp(document, request);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Failed to deliver document via ${method}:`, error);
      }
    }
  }

  private async deliverByEmail(
    document: IGeneratedDocument,
    request: DocumentRequest
  ): Promise<void> {
    const recipient = request.data.tenantEmail || request.data.landlordEmail;

    if (!recipient) {
      logger.warn("No email recipient found for document delivery");
      return;
    }

    await emailService.sendEmail({
      to: [recipient],
      subject: `Legal Document: ${document.title}`,
      html: `
                <h2>Legal Document Generated</h2>
                <p>Your legal document has been generated and is ready for review.</p>
                <p><strong>Document Type:</strong> ${document.type}</p>
                <p><strong>Document ID:</strong> ${document.id}</p>
                <p><strong>Generated:</strong> ${new Date(document.createdAt).toLocaleString()}</p>
                <p>You can download your document using the link below:</p>
                <p><a href="${document.filePath}">Download Document</a></p>
                <p>If you have any questions, please contact us.</p>
            `,
      content: `
                Your legal document has been generated and is ready for review.
                Document Type: ${document.type}
                Document ID: ${document.id}
                Generated: ${new Date(document.createdAt).toLocaleString()}
                You can download your document using the link below:
                ${document.filePath}
                If you have any questions, please contact us.
            `,
      priority: SmsPriority.HIGH,
    });

    this.emit("document.delivery", {
      method: "email",
      document: document.id,
      recipient,
      timestamp: new Date(),
    });

    logger.info(`Document delivered via email to ${recipient}`);
  }

  private async deliverBySMS(
    document: IGeneratedDocument,
    request: DocumentRequest
  ): Promise<void> {
    const recipient = request.data.tenantPhone || request.data.landlordPhone;

    if (!recipient) {
      logger.warn("No phone recipient found for document delivery");
      return;
    }

    await smsService.sendSms({
      to: [{ phoneNumber: recipient }],
      message: `Your legal document "${document.title}" has been generated. Document ID: ${document.id}. Access it at: ${process.env.API_BASE_URL}/documents/${document.id}`,
      type: SmsType.TRANSACTIONAL,
      priority: SmsPriority.HIGH,
    });

    this.emit("document.delivery", {
      method: "sms",
      document: document.id,
      recipient,
      timestamp: new Date(),
    });

    logger.info(`Document delivered via SMS to ${recipient}`);
  }

  private async deliverByWhatsApp(
    document: IGeneratedDocument,
    request: DocumentRequest
  ): Promise<void> {
    const recipient = request.data.tenantPhone || request.data.landlordPhone;

    if (!recipient) {
      logger.warn("No WhatsApp recipient found for document delivery");
      return;
    }

    await whatsappService.sendMessage({
      to: recipient,
      message: `Your legal document has been generated and is ready for review.\n\nDocument: ${document.title}\nID: ${document.id}\n\nAccess: ${process.env.API_BASE_URL}/documents/${document.id}`,
      title: "Legal Document Ready",
    });

    this.emit("document.delivery", {
      method: "whatsapp",
      document: document.id,
      recipient,
      timestamp: new Date(),
    });

    logger.info(`Document delivered via WhatsApp to ${recipient}`);
  }

  private async validateDocumentRequest(
    request: DocumentRequest
  ): Promise<void> {
    if (!request.templateId) {
      throw new Error("Template ID is required");
    }

    if (!request.data || Object.keys(request.data).length === 0) {
      throw new Error("Document data is required");
    }

    if (!request.options) {
      throw new Error("Generation options are required");
    }

    if (!request.requesterId) {
      throw new Error("Requester ID is required");
    }

    await Promise.resolve();
  }

  private async validateTemplateData(
    data: Record<string, any>,
    template: IDocumentTemplate
  ): Promise<void> {
    for (const field of template.fields) {
      if (field.required && (!data[field.id] || data[field.id] === "")) {
        throw new Error(`Required field '${field.name}' is missing`);
      }

      if (data[field.id] && field.validation) {
        await this.validateField(data[field.id], field);
      }
    }
  }

  private async validateField(value: any, field: TemplateField): Promise<void> {
    const validation = field.validation;

    if (validation?.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(String(value))) {
        throw new Error(
          validation.errorMessage || `Invalid format for ${field.name}`
        );
      }
    }

    if (
      field.type === FieldType.ID_NUMBER &&
      field.kenyaSpecific &&
      !this.isValidKenyanID(String(value))
    ) {
      throw new Error("Invalid Kenyan ID number");
    }

    if (
      field.type === FieldType.PHONE &&
      field.kenyaSpecific &&
      !this.isValidKenyanPhone(String(value))
    ) {
      throw new Error("Invalid Kenyan phone number");
    }

    await Promise.resolve();
  }

  private isValidKenyanID(idNumber: string): boolean {
    // Basic Kenyan ID validation (8 digits)
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    return /^\d{8}$/.test(idNumber);
  }

  private isValidKenyanPhone(phoneNumber: string): boolean {
    // Kenyan phone number validation
    const cleaned = phoneNumber.replace(/\D/g, "");
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    return /^(?:254|0)[71]\d{8}$/.test(cleaned);
  }

  // Template management methods
  async getTemplate(templateId: string): Promise<IDocumentTemplate | null> {
    // Try cache first
    const cached = await this.redis.get(`template:${templateId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const template = await DocumentTemplate.findOne({ _id: templateId }).lean();

    if (template) {
      // Cache for future use
      await this.redis.setEx(
        `template:${templateId}`,
        86_400, // 24 hours
        JSON.stringify(template)
      );
    }

    return template;
  }

  async getTemplates(filters?: {
    type?: LegalDocumentType;
    category?: LegalDocumentCategory;
    jurisdiction?: string;
    status?: TemplateStatus;
  }): Promise<IDocumentTemplate[]> {
    const query: Record<string, any> = {};

    if (filters) {
      if (filters.type) {
        query.type = filters.type;
      }
      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.jurisdiction) {
        query.jurisdiction = filters.jurisdiction;
      }
      if (filters.status) {
        query.status = filters.status;
      }
    }

    return await DocumentTemplate.find(query).lean();
  }

  async createTemplate(
    template: IDocumentTemplate
  ): Promise<IDocumentTemplate> {
    const created = await DocumentTemplate.create(template);

    // Cache the template
    await this.redis.setEx(
      `template:${template.id}`,
      86_400, // 24 hours
      JSON.stringify(created.toObject())
    );

    return created.toObject();
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<IDocumentTemplate>
  ): Promise<IDocumentTemplate | null> {
    const updated = await DocumentTemplate.findOneAndUpdate(
      { _id: templateId },
      { $set: updates },
      { new: true }
    ).lean();

    if (updated) {
      // Update cache
      await this.redis.setEx(
        `template:${templateId}`,
        86_400,
        JSON.stringify(updated)
      );
    }

    return updated;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const result = await DocumentTemplate.deleteOne({ _id: templateId });

    if (result.deletedCount > 0) {
      // Remove from cache
      await this.redis.del(`template:${templateId}`);
      return true;
    }

    return false;
  }

  async cacheDocument(document: IGeneratedDocument): Promise<void> {
    const key = `document:${document.id}`;
    await this.redis.setEx(key, 86_400 * 7, JSON.stringify(document)); // Cache for 7 days
  }

  async getDocument(documentId: string): Promise<IGeneratedDocument | null> {
    // Try cache first
    const cached = await this.redis.get(`document:${documentId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const document = await GeneratedDocument.findOne({
      _id: documentId,
    }).lean();

    if (document) {
      // Cache for future use
      await this.cacheDocument(document);
    }

    return document;
  }

  async getDocuments(filters?: {
    type?: LegalDocumentType;
    status?: LegalDocumentStatus;
    generatedBy?: string;
    propertyId?: string;
    tenantId?: string;
    landlordId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IGeneratedDocument[]> {
    const query: Record<string, any> = {};

    if (filters) {
      if (filters.type) {
        query.type = filters.type;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.generatedBy) {
        query.generatedBy = filters.generatedBy;
      }
      if (filters.propertyId) {
        query.propertyId = filters.propertyId;
      }
      if (filters.tenantId) {
        query.tenantId = filters.tenantId;
      }
      if (filters.landlordId) {
        query.landlordId = filters.landlordId;
      }
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.createdAt.$lte = filters.endDate;
        }
      }
    }

    return await GeneratedDocument.find(query).sort({ createdAt: -1 }).lean();
  }

  async updateDocumentStatus(
    documentId: string,
    status: LegalDocumentStatus
  ): Promise<IGeneratedDocument | null> {
    const updated = await GeneratedDocument.findOneAndUpdate(
      { _id: documentId },
      { $set: { status } },
      { new: true }
    ).lean();

    if (updated) {
      // Update cache
      await this.cacheDocument(updated);
      logger.info(`Document status updated: ${documentId} -> ${status}`);
    }

    return updated;
  }

  async signDocument(
    documentId: string,
    partyType: "landlord" | "tenant" | "guarantor" | "witness" | "agent",
    signatureData: {
      signedAt: Date;
      signatureHash: string;
    }
  ): Promise<IGeneratedDocument | null> {
    const document = await GeneratedDocument.findOne({ _id: documentId });

    if (!document) {
      return null;
    }

    // Update the specific party's signature
    const partyIndex = document.parties.findIndex((p) => p.type === partyType);
    if (partyIndex !== -1) {
      (document.parties[partyIndex] as any).signed = true;
      (document.parties[partyIndex] as any).signedAt = signatureData.signedAt;
      (document.parties[partyIndex] as any).signatureHash =
        signatureData.signatureHash;
    }

    // Check if all parties have signed
    const allSigned = document.parties.every((p) => p.signed);
    if (allSigned) {
      document.status = LegalDocumentStatus.SIGNED;
    }

    await document.save();
    const updated = document.toObject();

    // Update cache
    await this.cacheDocument(updated);

    logger.info(`Document signed by ${partyType}: ${documentId}`);
    return updated;
  }

  async archiveDocument(
    documentId: string,
    archivedBy: string
  ): Promise<IGeneratedDocument | null> {
    const updated = await GeneratedDocument.findOneAndUpdate(
      { _id: documentId },
      {
        $set: {
          archived: true,
          archivedAt: new Date(),
          archivedBy,
        },
      },
      { new: true }
    ).lean();

    if (updated) {
      // Update cache
      await this.cacheDocument(updated);
      logger.info(`Document archived: ${documentId}`);
    }

    return updated;
  }

  async trackDocumentAccess(
    documentId: string,
    accessType: "view" | "download"
  ): Promise<void> {
    const updateField = accessType === "view" ? "viewCount" : "downloadCount";

    await GeneratedDocument.findOneAndUpdate(
      { _id: documentId },
      {
        $inc: { [updateField]: 1 },
        $set: { lastAccessedAt: new Date() },
      }
    );

    // Invalidate cache to force refresh
    await this.redis.del(`document:${documentId}`);

    logger.info(`Document ${accessType}: ${documentId}`);
  }

  async verifyDocument(
    documentId: string,
    checksum: string
  ): Promise<{
    valid: boolean;
    document?: IGeneratedDocument;
    error?: string;
  }> {
    try {
      const document = await this.getDocument(documentId);

      if (!document) {
        return { valid: false, error: "Document not found" };
      }

      if (document.checksum !== checksum) {
        return {
          valid: false,
          error:
            "Document checksum mismatch - document may have been tampered with",
        };
      }

      return { valid: true, document };
    } catch (error) {
      logger.error("Document verification error:", error);
      return { valid: false, error: "Verification failed" };
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const document = await this.getDocument(documentId);

      if (!document) {
        return false;
      }

      // Delete from cloud storage if using it
      if (this.useCloudStorage && document.metadata?.cdnUrl) {
        try {
          await deleteFile(document.filePath);
        } catch (error) {
          logger.warn("Failed to delete file from cloud storage:", error);
        }
      }

      // Delete from database
      await GeneratedDocument.deleteOne({ id: documentId });

      // Remove from cache
      await this.redis.del(`document:${documentId}`);

      logger.info(`Document deleted: ${documentId}`);
      return true;
    } catch (error) {
      logger.error("Document deletion error:", error);
      return false;
    }
  }

  /**
   * Get document file from storage
   * Supports both local and cloud storage
   */
  async getDocumentFile(filePath: string): Promise<Buffer | null> {
    try {
      // Check if it's a cloud URL
      if (
        this.useCloudStorage &&
        (filePath.startsWith("http://") || filePath.startsWith("https://"))
      ) {
        // Download from cloud storage
        logger.info("Downloading file from cloud storage");
        const fileBuffer = await downloadFile(filePath);

        if (!fileBuffer) {
          logger.error("Failed to download file from cloud storage");
          return null;
        }

        logger.info("File downloaded successfully from cloud storage");
        return fileBuffer;
      }

      // Try to read from local storage
      // If filePath is absolute, use it directly
      // If relative, resolve from outputPath
      const localPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.outputPath, path.basename(filePath));

      // Check if file exists
      try {
        await fs.access(localPath);
      } catch {
        logger.error("Document file not found");
        return null;
      }

      // Read and return file buffer
      const fileBuffer = await fs.readFile(localPath);
      logger.info("Document file retrieved from local storage");
      return fileBuffer;
    } catch (error) {
      logger.error("Failed to get document file:", error);
      return null;
    }
  }
}

export const legalDocumentService = new LegalDocumentsService();
