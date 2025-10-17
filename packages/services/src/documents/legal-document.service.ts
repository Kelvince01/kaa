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
  type GenerationOptions,
  type IDocumentTemplate,
  type IGeneratedDocument,
  KENYA_LEGAL_CONSTANTS,
  Language,
  LegalDocumentCategory,
  LegalDocumentStatus,
  LegalDocumentType,
  SmsPriority,
  type TemplateField,
  TemplateStatus,
} from "@kaa/models/types";
import {
  deleteFile,
  encryptSensitiveData,
  generateChecksum,
  logger,
  redisClient,
  translateToSwahili,
  uploadFile,
} from "@kaa/utils";
import { createCanvas, registerFont } from "canvas";
import Docxtemplater from "docxtemplater";
import type mongoose from "mongoose";
import PDFDocument from "pdfkit";
import PizZip from "pizzip";
import QRCode from "qrcode";
import type { RedisClientType } from "redis";
import { emailService, smsService, whatsappService } from "../comms";
import { createFile } from "../files/file.service";

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
      "DejaVu Sans",
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
    const defaultTemplates = this.createDefaultTemplates();

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

  private createDefaultTemplates(): IDocumentTemplate[] {
    const templates: IDocumentTemplate[] = [];

    // Residential Tenancy Agreement Template
    templates.push({
      id: "residential-tenancy-kenya-v1",
      name: "Residential Tenancy Agreement (Kenya)",
      type: LegalDocumentType.TENANCY_AGREEMENT,
      category: LegalDocumentCategory.CONTRACTS,
      version: "1.0",
      language: Language.BILINGUAL,
      jurisdiction: "kenya",
      status: TemplateStatus.ACTIVE,
      fields: [
        {
          id: "landlordName",
          name: "Landlord Name",
          type: FieldType.TEXT,
          required: true,
        },
        {
          id: "landlordId",
          name: "Landlord ID Number",
          type: FieldType.ID_NUMBER,
          required: true,
          kenyaSpecific: true,
        },
        {
          id: "landlordPhone",
          name: "Landlord Phone",
          type: FieldType.PHONE,
          required: true,
          kenyaSpecific: true,
        },
        {
          id: "tenantName",
          name: "Tenant Name",
          type: FieldType.TEXT,
          required: true,
        },
        {
          id: "tenantId",
          name: "Tenant ID Number",
          type: FieldType.ID_NUMBER,
          required: true,
          kenyaSpecific: true,
        },
        {
          id: "tenantPhone",
          name: "Tenant Phone",
          type: FieldType.PHONE,
          required: true,
          kenyaSpecific: true,
        },
        {
          id: "propertyAddress",
          name: "Property Address",
          type: FieldType.ADDRESS,
          required: true,
        },
        {
          id: "county",
          name: "County",
          type: FieldType.SELECT,
          required: true,
          options: KENYA_LEGAL_CONSTANTS.COUNTIES,
          kenyaSpecific: true,
        },
        {
          id: "rentAmount",
          name: "Monthly Rent (KES)",
          type: FieldType.CURRENCY,
          required: true,
        },
        {
          id: "depositAmount",
          name: "Security Deposit (KES)",
          type: FieldType.CURRENCY,
          required: true,
        },
        {
          id: "startDate",
          name: "Tenancy Start Date",
          type: FieldType.DATE,
          required: true,
        },
        {
          id: "duration",
          name: "Duration (Months)",
          type: FieldType.NUMBER,
          required: true,
        },
        {
          id: "rentDueDate",
          name: "Rent Due Date",
          type: FieldType.NUMBER,
          required: true,
          validation: { min: 1, max: 31 },
        },
      ],
      content: this.getResidentialTenancyTemplate(),
      metadata: {
        title: "Residential Tenancy Agreement",
        description:
          "Standard residential tenancy agreement compliant with Kenyan law",
        tags: ["residential", "tenancy", "kenya", "rental"],
        author: "Legal Department",
        legalReviewed: true,
        complianceChecked: true,
        governingLaw: "Laws of Kenya",
        court: "Environment and Land Court",
      },
      compliance: [
        {
          law: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
          section: "Section 7",
          description: "Notice requirements for termination",
          mandatory: true,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Notice to Quit Template
    templates.push({
      id: "notice-to-quit-kenya-v1",
      name: "Notice to Quit (Kenya)",
      type: LegalDocumentType.NOTICE_TO_QUIT,
      category: LegalDocumentCategory.NOTICES,
      version: "1.0",
      language: Language.BILINGUAL,
      jurisdiction: "kenya",
      status: TemplateStatus.ACTIVE,
      fields: [
        {
          id: "landlordName",
          name: "Landlord Name",
          type: FieldType.TEXT,
          required: true,
        },
        {
          id: "tenantName",
          name: "Tenant Name",
          type: FieldType.TEXT,
          required: true,
        },
        {
          id: "propertyAddress",
          name: "Property Address",
          type: FieldType.ADDRESS,
          required: true,
        },
        {
          id: "reason",
          name: "Reason for Notice",
          type: FieldType.SELECT,
          required: true,
          options: [
            "Non-payment of rent",
            "Breach of tenancy agreement",
            "End of lease term",
            "Property sale",
            "Personal use",
          ],
        },
        {
          id: "noticePeriod",
          name: "Notice Period (Days)",
          type: FieldType.NUMBER,
          required: true,
        },
        {
          id: "noticeDate",
          name: "Notice Date",
          type: FieldType.DATE,
          required: true,
        },
        {
          id: "quitDate",
          name: "Date to Quit",
          type: FieldType.DATE,
          required: true,
        },
        {
          id: "rentArrears",
          name: "Rent Arrears (KES)",
          type: FieldType.CURRENCY,
          required: false,
        },
      ],
      content: this.getNoticeToQuitTemplate(),
      metadata: {
        title: "Notice to Quit Premises",
        description: "Legal notice for tenant to vacate property",
        tags: ["notice", "quit", "eviction", "kenya"],
        author: "Legal Department",
        legalReviewed: true,
        complianceChecked: true,
        governingLaw: "Laws of Kenya",
        court: "Magistrate Court",
      },
      compliance: [
        {
          law: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
          section: "Section 12",
          description: "Required notice period for termination",
          mandatory: true,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return templates;
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

      // Create file record
      await createFile({
        url: fileUrl,
        cdnUrl,
        path: filePath,
        name: path.basename(filePath),
        mimeType: this.getMimeType(request.options.format),
        size: fileSize,
        user: request.requesterId as unknown as mongoose.Types.ObjectId,
        description: `Legal document: ${template.metadata.title}`,
        tags: ["legal-document", template.type, ...template.metadata.tags],
      });

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

    const doc = new PDFDocument({
      margins: { top: 50, left: 50, right: 50, bottom: 50 },
      info: {
        Title: "Legal Document",
        Author: "Kaa Rentals Platform",
        Subject: "Rental Agreement",
        Creator: "Legal Documents Service",
      },
    });

    const stream = FS.createWriteStream(localPath);
    doc.pipe(stream);

    // Get appropriate fonts with fallback support
    const boldFont = this.getFontFallback("DejaVu Sans");
    const regularFont = this.getFontFallback("DejaVu Sans");

    // Add header
    doc.fontSize(16).font(boldFont);
    doc.text("KAA RENTALS", { align: "center" });
    doc.moveDown();

    // Add watermark if specified
    if (options.watermark) {
      doc.save();
      doc.rotate(45, { origin: [300, 400] });
      doc.fontSize(60).fillOpacity(0.1);
      doc.text(options.watermark, 100, 300);
      doc.restore();
    }

    // Process content
    const lines = content.split("\n");
    doc.fontSize(11).font(regularFont);

    for (const line of lines) {
      if (line.trim()) {
        // Handle different formatting
        if (line.startsWith("#")) {
          doc.fontSize(14).font(boldFont);
          doc.text(line.replace("#", "").trim(), { align: "left" });
          doc.moveDown(0.5);
        } else if (line.startsWith("**") && line.endsWith("**")) {
          doc.fontSize(11).font(boldFont);
          doc.text(line.replace(/\*\*/g, "").trim());
        } else {
          doc.fontSize(11).font(regularFont);
          doc.text(line.trim());
        }
        doc.moveDown(0.2);
      }
    }

    // Add signature section
    doc.moveDown(2);
    doc.text("_".repeat(50), 50);
    doc.text("Landlord Signature & Date", 50);
    doc.moveDown();
    doc.text("_".repeat(50), 50);
    doc.text("Tenant Signature & Date", 50);

    // Add QR code if requested
    if (options.digitalSignature) {
      doc.moveDown();
      doc.text(`Document ID: ${documentId}`, { align: "center" });
    }

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(localPath));
      stream.on("error", reject);
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
      type: "transactional",
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

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      html: "text/html",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return mimeTypes[format] || "application/octet-stream";
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

  // Helper methods for default templates
  private getResidentialTenancyTemplate(): string {
    return `
  # RESIDENTIAL TENANCY AGREEMENT
  
  **THIS AGREEMENT** is made this {currentDate} day between:
  
  **THE LANDLORD**: {landlordName}, ID No. {landlordId}, Phone: {landlordPhone}
  
  **THE TENANT**: {tenantName}, ID No. {tenantId}, Phone: {tenantPhone}
  
  **PROPERTY**: {propertyAddress}, {county} County
  
  ## TERMS AND CONDITIONS
  
  1. **RENT**: The monthly rent is KES {rentAmount}, due on the {rentDueDate} of each month.
  
  2. **SECURITY DEPOSIT**: A security deposit of KES {depositAmount} is required.
  
  3. **TENANCY PERIOD**: This tenancy shall commence on {startDate} for a period of {duration} months.
  
  4. **UTILITIES**: Tenant shall be responsible for electricity, water, and other utilities.
  
  5. **MAINTENANCE**: Tenant shall maintain the property in good condition.
  
  6. **TERMINATION**: Either party may terminate with 30 days written notice.
  
  7. **GOVERNING LAW**: This agreement is governed by the Laws of Kenya.
  
  **IN WITNESS WHEREOF**, the parties have executed this agreement on the date first written above.
  `;
  }

  private getNoticeToQuitTemplate(): string {
    return `
  # NOTICE TO QUIT
  
  **TO**: {tenantName}
  
  **PROPERTY ADDRESS**: {propertyAddress}
  
  **DATE**: {noticeDate}
  
  You are hereby required to QUIT and deliver up to me the above-mentioned premises which you hold as my tenant.
  
  **REASON**: {reason}
  
  You are required to quit the premises within {noticePeriod} days from the date of service of this notice, failing which proceedings will be instituted against you to recover possession of the said premises.
  
  **QUIT DATE**: {quitDate}
  
  _______________________
  Landlord: {landlordName}
  `;
  }
}

export const legalDocumentService = new LegalDocumentsService();
