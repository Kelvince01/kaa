import fs from "node:fs";
import path from "node:path";
import type { IProperty, ITenant, IUnit } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import type mongoose from "mongoose";
import PDFDocument from "pdfkit";
import {
  AddressHelpers,
  CONTRACT_CONSTANTS,
  DateHelpers,
  FileHelpers,
} from "./utils/contract.helpers";
import {
  type ContractTemplate,
  type ContractTemplateData,
  type ContractTerm,
  formatCurrency,
  getContractTerms,
  getDaySuffix,
  mergeContractTerms,
} from "./utils/contract.templates";

export type ContractPDFData = {
  property: IProperty;
  unit?: IUnit;
  tenants: ITenant[];
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  serviceCharge: number;
  lateFee: number;
  rentDueDate: number;
  waterBill: "Included" | "Tenant pays" | "Shared";
  electricityBill: "Included" | "Tenant pays" | "Shared";
  petsAllowed: boolean;
  smokingAllowed: boolean;
  sublettingAllowed: boolean;
  terms?: ContractTerm[];
  specialConditions?: string[];
  contractTemplate?: ContractTemplate;
};

export type PDFGenerationResult = {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
};

export class ContractPDFService {
  private readonly uploadDir: string;

  constructor(uploadDir: string = CONTRACT_CONSTANTS.UPLOAD_DIR) {
    this.uploadDir = uploadDir;
  }

  /**
   * Generate a complete contract PDF
   */
  async generateContractPDF(
    data: ContractPDFData,
    options?: {
      includeSignatures?: boolean;
      includeWatermark?: boolean;
      customFileName?: string;
    }
  ): Promise<PDFGenerationResult> {
    try {
      // Ensure upload directory exists
      const uploadPath = path.join(process.cwd(), this.uploadDir);
      await FileHelpers.ensureUploadDir(uploadPath);

      // Generate filename
      const fileName =
        options?.customFileName ||
        FileHelpers.generateContractFilename(
          (data.property._id as mongoose.Types.ObjectId).toString(),
          data.unit?._id?.toString() || "no-unit"
        );

      const filePath = path.join(uploadPath, fileName);

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: "Rental Agreement",
          Author: "KAA Property Management",
          Subject: "Assured Shorthold Tenancy Agreement",
          Keywords: "rental, agreement, tenancy, contract",
          CreationDate: new Date(),
        },
      });

      // Create write stream
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Generate contract content
      await this.generateContractContent(doc, data, options);

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      await new Promise<void>((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      logger.info(`Contract PDF generated successfully: ${fileName}`);

      return {
        success: true,
        filePath,
        fileName,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to generate contract PDF", { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate the main contract content
   */
  private generateContractContent(
    doc: PDFKit.PDFDocument,
    data: ContractPDFData,
    options?: {
      includeSignatures?: boolean;
      includeWatermark?: boolean;
    }
  ): void {
    const {
      property,
      unit,
      tenants,
      startDate,
      endDate,
      rentAmount,
      depositAmount,
      serviceCharge,
      lateFee,
      rentDueDate,
      waterBill,
      electricityBill,
      petsAllowed,
      smokingAllowed,
      sublettingAllowed,
      terms,
      specialConditions,
      contractTemplate = "standard",
    } = data;

    // Add watermark if requested
    if (options?.includeWatermark) {
      this.addWatermark(doc);
    }

    // Document header
    this.addDocumentHeader(doc);

    // Contract parties
    this.addPartiesSection(doc, property, tenants);

    // Property details
    this.addPropertySection(doc, property, unit);

    // Tenancy details
    this.addTenancyDetails(doc, {
      startDate,
      endDate,
      rentAmount,
      depositAmount,
      serviceCharge,
      lateFee,
      rentDueDate,
    });

    // Contract terms
    const templateData: ContractTemplateData = {
      rentAmount,
      rentDueDate,
      depositAmount,
      lateFee,
      waterBill,
      electricityBill,
      petsAllowed,
      smokingAllowed,
      sublettingAllowed,
    };

    const baseTerms = getContractTerms(contractTemplate, templateData);
    const finalTerms = mergeContractTerms(baseTerms, terms);
    this.addTermsSection(doc, finalTerms);

    // Special conditions
    if (specialConditions && specialConditions.length > 0) {
      this.addSpecialConditions(doc, specialConditions);
    }

    // Signatures section
    if (options?.includeSignatures !== false) {
      this.addSignaturesSection(doc, property, tenants);
    }

    // Footer
    this.addDocumentFooter(doc);
  }

  /**
   * Add document header
   */
  private addDocumentHeader(doc: PDFKit.PDFDocument): void {
    // Main title
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("ASSURED SHORTHOLD TENANCY AGREEMENT", { align: "center" });

    doc.moveDown(0.5);

    // Subtitle
    doc
      .fontSize(12)
      .fillColor("gray")
      .font("Helvetica")
      .text("(Under the Laws of Kenya)", { align: "center" });

    doc.moveDown(1);

    // Date
    doc
      .fillColor("black")
      .fontSize(12)
      .font("Helvetica")
      .text(`Date: ${DateHelpers.formatContractDate(new Date())}`, {
        align: "right",
      });

    doc.moveDown(2);
  }

  /**
   * Add parties section
   */
  private addPartiesSection(
    doc: PDFKit.PDFDocument,
    property: IProperty,
    tenants: ITenant[]
  ): void {
    this.addSectionTitle(doc, "THIS AGREEMENT IS MADE BETWEEN:");
    doc.moveDown(1);

    // Landlord details
    doc.fontSize(12).font("Helvetica-Bold").text("LANDLORD:");
    doc.moveDown(0.5);

    const landlord = property.landlord as any;
    this.addKeyValue(doc, "Name", `${landlord.firstName} ${landlord.lastName}`);
    this.addKeyValue(doc, "ID Number", landlord.idNumber || "Not provided");
    this.addKeyValue(doc, "Email", landlord.email);
    this.addKeyValue(doc, "Phone", landlord.phone || "Not provided");

    if (landlord.address) {
      const formattedAddress = AddressHelpers.formatKenyanAddress(
        landlord.address
      );
      this.addKeyValue(doc, "Address", formattedAddress);
    }

    doc.moveDown(1);

    // Tenant details
    doc.fontSize(12).font("Helvetica-Bold").text("TENANT(S):");
    doc.moveDown(0.5);

    tenants.forEach((tenant, index) => {
      if (index > 0) doc.moveDown(0.5);

      this.addKeyValue(
        doc,
        "Name",
        `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`
      );
      this.addKeyValue(doc, "ID Number", tenant.personalInfo.nationalId);
      this.addKeyValue(doc, "Email", tenant.personalInfo.email);
      this.addKeyValue(
        doc,
        "Phone",
        tenant.personalInfo.phone || "Not provided"
      );
      this.addKeyValue(
        doc,
        "Occupation",
        tenant.personalInfo.occupation || "Not provided"
      );

      if (tenant.address) {
        const formattedAddress = AddressHelpers.formatKenyanAddress(
          tenant.address
        );
        this.addKeyValue(doc, "Address", formattedAddress);
      }
    });

    doc.moveDown(2);
  }

  /**
   * Add property section
   */
  private addPropertySection(
    doc: PDFKit.PDFDocument,
    property: IProperty,
    unit?: IUnit
  ): void {
    this.addSectionTitle(doc, "PROPERTY DETAILS");

    this.addKeyValue(doc, "Property Name", property.title);
    this.addKeyValue(doc, "Property Type", property.type);

    const propertyAddress = AddressHelpers.formatPropertyAddress(property);
    this.addKeyValue(doc, "Property Address", propertyAddress);

    if (unit) {
      this.addKeyValue(doc, "Unit Number", unit.unitNumber);
      this.addKeyValue(doc, "Unit Type", unit.type);
      this.addKeyValue(doc, "Floor Area", `${unit.size}`);
      // this.addKeyValue(doc, 'Floor Area', `${unit.size.area} ${unit.size.unit}`);
      this.addKeyValue(doc, "Bedrooms", unit.bedrooms.toString());
      this.addKeyValue(doc, "Bathrooms", unit.bathrooms.toString());
    }

    doc.moveDown(2);
  }

  /**
   * Add tenancy details
   */
  private addTenancyDetails(
    doc: PDFKit.PDFDocument,
    details: {
      startDate: string;
      endDate: string;
      rentAmount: number;
      depositAmount: number;
      serviceCharge: number;
      lateFee: number;
      rentDueDate: number;
    }
  ): void {
    this.addSectionTitle(doc, "TENANCY DETAILS");

    this.addKeyValue(
      doc,
      "Tenancy Start Date",
      DateHelpers.formatContractDate(new Date(details.startDate))
    );
    this.addKeyValue(
      doc,
      "Tenancy End Date",
      DateHelpers.formatContractDate(new Date(details.endDate))
    );
    this.addKeyValue(doc, "Monthly Rent", formatCurrency(details.rentAmount));
    this.addKeyValue(
      doc,
      "Security Deposit",
      formatCurrency(details.depositAmount)
    );

    if (details.serviceCharge > 0) {
      this.addKeyValue(
        doc,
        "Service Charge",
        formatCurrency(details.serviceCharge)
      );
    }

    if (details.lateFee > 0) {
      this.addKeyValue(
        doc,
        "Late Payment Fee",
        formatCurrency(details.lateFee)
      );
    }

    this.addKeyValue(
      doc,
      "Rent Due Date",
      `${details.rentDueDate}${getDaySuffix(details.rentDueDate)} of each month`
    );

    const duration = DateHelpers.calculateContractDuration(
      new Date(details.startDate),
      new Date(details.endDate)
    );
    this.addKeyValue(doc, "Contract Duration", `${duration} month(s)`);

    doc.moveDown(2);
  }

  /**
   * Add terms section
   */
  private addTermsSection(
    doc: PDFKit.PDFDocument,
    terms: ContractTerm[]
  ): void {
    this.addSectionTitle(doc, "TERMS AND CONDITIONS");

    terms.forEach((term, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`${index + 1}. ${term.title}`);
      doc.moveDown(0.3);

      doc.fontSize(11).font("Helvetica").text(term.content, {
        indent: 20,
        align: "justify",
        lineGap: 2,
      });

      doc.moveDown(0.8);
    });

    doc.moveDown(1);
  }

  /**
   * Add special conditions
   */
  private addSpecialConditions(
    doc: PDFKit.PDFDocument,
    conditions: string[]
  ): void {
    this.addSectionTitle(doc, "SPECIAL CONDITIONS");

    conditions.forEach((condition, index) => {
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`${index + 1}. ${condition}`, {
          indent: 20,
          align: "justify",
          lineGap: 2,
        });
      doc.moveDown(0.5);
    });

    doc.moveDown(2);
  }

  /**
   * Add signatures section
   */
  private addSignaturesSection(
    doc: PDFKit.PDFDocument,
    property: IProperty,
    tenants: ITenant[]
  ): void {
    // Start new page for signatures
    doc.addPage();

    this.addSectionTitle(doc, "SIGNATURES");

    const landlord = property.landlord as any;

    // Landlord signature
    doc.fontSize(12).font("Helvetica-Bold").text("LANDLORD:");
    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Name: ${landlord.firstName} ${landlord.lastName}`);
    doc.moveDown(2);

    doc.text(
      "Signature: ________________________________     Date: _______________"
    );
    doc.moveDown(3);

    // Tenant signatures
    doc.fontSize(12).font("Helvetica-Bold").text("TENANT(S):");
    doc.moveDown(0.5);

    tenants.forEach((tenant, index) => {
      if (index > 0) doc.moveDown(2);

      doc
        .fontSize(11)
        .font("Helvetica")
        .text(
          `Name: ${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`
        );
      doc.moveDown(2);

      doc.text(
        "Signature: ________________________________     Date: _______________"
      );
    });

    doc.moveDown(3);

    // Witness section
    doc.fontSize(12).font("Helvetica-Bold").text("WITNESS:");
    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text("Name: ________________________________");
    doc.moveDown(2);

    doc.text(
      "Signature: ________________________________     Date: _______________"
    );
    doc.moveDown(1);

    doc.text("ID Number: ________________________________");
  }

  /**
   * Add document footer
   */
  private addDocumentFooter(doc: PDFKit.PDFDocument): void {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Add page number
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 50, {
          align: "center",
        });

      // Add generation timestamp
      doc
        .fontSize(8)
        .fillColor("gray")
        .text(
          `Generated on ${new Date().toLocaleString("en-KE")}`,
          50,
          doc.page.height - 30,
          {
            align: "center",
          }
        );
    }
  }

  /**
   * Add watermark
   */
  private addWatermark(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(60)
      .font("Helvetica-Bold")
      .fillColor("lightgray")
      .text("DRAFT", 200, 400, {
        // rotate: 45,
        align: "center",
      });

    doc.fillColor("black"); // Reset color
  }

  /**
   * Add section title
   */
  private addSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.fontSize(14).font("Helvetica-Bold").text(title, { underline: true });

    doc.moveDown(0.8);
  }

  /**
   * Add key-value pair
   */
  private addKeyValue(
    doc: PDFKit.PDFDocument,
    key: string,
    value: string
  ): void {
    doc.fontSize(11);
    doc.font("Helvetica-Bold").text(key, { continued: true });
    doc.font("Helvetica").text(`: ${value}`);
    doc.moveDown(0.3);
  }

  /**
   * Generate contract preview (smaller, watermarked version)
   */
  async generateContractPreview(
    data: ContractPDFData
  ): Promise<PDFGenerationResult> {
    return await this.generateContractPDF(data, {
      includeWatermark: true,
      includeSignatures: false,
    });
  }

  /**
   * Generate contract amendment PDF
   */
  async generateAmendmentPDF(
    originalData: ContractPDFData,
    amendments: {
      amendmentDate: string;
      amendmentReason: string;
      changes: Array<{
        field: string;
        oldValue: string;
        newValue: string;
      }>;
    }
  ): Promise<PDFGenerationResult> {
    try {
      const uploadPath = path.join(process.cwd(), this.uploadDir);
      await FileHelpers.ensureUploadDir(uploadPath);

      const fileName = `amendment_${originalData.property._id}_${Date.now()}.pdf`;
      const filePath = path.join(uploadPath, fileName);

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Amendment header
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("CONTRACT AMENDMENT", { align: "center" });
      doc.moveDown(2);

      // Amendment details
      this.addKeyValue(
        doc,
        "Amendment Date",
        DateHelpers.formatContractDate(new Date(amendments.amendmentDate))
      );
      this.addKeyValue(doc, "Reason for Amendment", amendments.amendmentReason);
      doc.moveDown(2);

      // Changes
      this.addSectionTitle(doc, "CHANGES MADE:");
      amendments.changes.forEach((change, index) => {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(`${index + 1}. ${change.field}:`);
        doc.font("Helvetica").text(`   From: ${change.oldValue}`);
        doc.text(`   To: ${change.newValue}`);
        doc.moveDown(1);
      });

      // Signatures
      doc.moveDown(2);
      this.addSignaturesSection(
        doc,
        originalData.property,
        originalData.tenants
      );

      doc.end();

      await new Promise<void>((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      return {
        success: true,
        filePath,
        fileName,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanupTempFiles(filePaths: string[]): Promise<void> {
    await FileHelpers.cleanupTempFiles(filePaths);
  }
}

// Export singleton instance
export const contractPDFService = new ContractPDFService();
