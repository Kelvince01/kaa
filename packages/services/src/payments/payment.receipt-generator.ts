import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { DateTime } from "luxon";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Receipt type definition based on the jsPDF implementation
export type Receipt = {
  receiptNumber: string;
  paymentDate: string | Date;
  tenantName: string;
  phoneNumber: string;
  propertyName: string;
  unitNumber: string;
  description: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
};

export class ReceiptGenerator {
  private readonly doc: typeof PDFDocument;
  private readonly buffers: Buffer[] = [];

  constructor() {
    // Create a new PDF document with better default options
    this.doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "Rental Payment Receipt",
        Author: "Kaa",
        Subject: "Payment Receipt",
        Keywords: "receipt, payment, rental",
        Creator: "Kaa SaaS",
      },
    });

    // Collect PDF data chunks
    this.doc.on("data", (chunk) => {
      this.buffers.push(chunk);
    });
  }

  private loadLogo(): Buffer | null {
    try {
      // Try to load the company logo if it exists
      const logoPath = path.join(process.cwd(), "assets", "logo.png");
      return fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;
    } catch (error) {
      console.error("Error loading logo:", error);
      return null;
    }
  }

  private addHeader() {
    this.doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("RENTAL PAYMENT RECEIPT", { align: "center" })
      .moveDown(1);
  }

  private async addCompanyInfo() {
    const logo = await this.loadLogo();

    // Position for company info
    const startY = 70;

    // If logo exists, add it
    if (logo) {
      this.doc.image(logo, 50, startY, { width: 80 });
      this.doc.moveDown(0.5);
    }

    this.doc
      .font("Helvetica")
      .fontSize(10)
      .text("Kaa", 50, logo ? startY + 85 : startY)
      .text("P.O. Box 12345-00100")
      .text("Nairobi, Kenya")
      .text("Tel: +254 712 345 678")
      .moveDown(0.5);
  }

  private addReceiptInfo(receipt: Receipt) {
    const pageWidth = this.doc.page.width;

    this.doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Receipt No: ${receipt.receiptNumber}`, pageWidth - 200, 70, {
        align: "right",
      })
      .text(
        `Date: ${DateTime.fromISO(receipt.paymentDate as string).toLocaleString(DateTime.DATE_MED)}`,
        pageWidth - 200,
        85,
        {
          align: "right",
        }
      );
  }

  private addTenantInfo(receipt: Receipt) {
    this.doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Bill To:", 50, 170)
      .font("Helvetica")
      .text(receipt.tenantName)
      .text(receipt.phoneNumber)
      .text(receipt.propertyName)
      .text(`Unit: ${receipt.unitNumber}`)
      .moveDown(1);
  }

  private addPaymentDetails(receipt: Receipt) {
    const startY = 240;
    const tableTop = startY;
    const tableLeft = 50;
    const tableWidth = this.doc.page.width - 100;
    const descriptionWidth = tableWidth * 0.7;
    const amountWidth = tableWidth * 0.3;

    // Table headers
    this.doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#2980b9")
      .rect(tableLeft, tableTop, tableWidth, 20)
      .fill()
      .fillColor("white")
      .text("Description", tableLeft + 5, tableTop + 5, {
        width: descriptionWidth,
      })
      .text("Amount", tableLeft + descriptionWidth + 5, tableTop + 5, {
        width: amountWidth,
      });

    // Table data
    this.doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("black")
      .rect(tableLeft, tableTop + 20, tableWidth, 25)
      .strokeColor("#cccccc")
      .stroke()
      .text(receipt.description, tableLeft + 5, tableTop + 25, {
        width: descriptionWidth,
      })
      .text(
        `KES ${receipt.amount.toLocaleString()}`,
        tableLeft + descriptionWidth + 5,
        tableTop + 25,
        { width: amountWidth }
      );

    // Total
    this.doc
      .font("Helvetica-Bold")
      .text("Total:", tableLeft + descriptionWidth - 50, tableTop + 55)
      .text(
        `KES ${receipt.amount.toLocaleString()}`,
        tableLeft + descriptionWidth + 5,
        tableTop + 55,
        { width: amountWidth }
      );

    this.doc.moveDown(2);
  }

  private addPaymentInfo(receipt: Receipt) {
    const startY = 330;

    this.doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Payment Information:", 50, startY)
      .font("Helvetica")
      .text(`Method: ${receipt.paymentMethod}`)
      .text(`Transaction ID: ${receipt.transactionId}`)
      .moveDown(1);
  }

  private addFooter() {
    const pageHeight = this.doc.page.height;

    // Add a horizontal line
    this.doc
      .strokeColor("#cccccc")
      .lineWidth(1)
      .moveTo(50, pageHeight - 100)
      .lineTo(this.doc.page.width - 50, pageHeight - 100)
      .stroke();

    // Add footer text
    this.doc
      .font("Helvetica")
      .fontSize(8)
      .text(
        "This is a computer-generated receipt and does not require a signature.",
        50,
        pageHeight - 90,
        { align: "center" }
      )
      .text(
        `Generated on: ${DateTime.now().toLocaleString(DateTime.DATE_MED)}`,
        50,
        pageHeight - 80,
        { align: "center" }
      )
      .text("Thank you for your payment.", 50, pageHeight - 70, {
        align: "center",
      });
  }

  private async addQRCode(receipt: Receipt) {
    try {
      // Generate QR code data with receipt information
      const qrData = JSON.stringify({
        receiptNumber: receipt.receiptNumber,
        transactionId: receipt.transactionId,
        amount: receipt.amount,
        date: DateTime.fromISO(receipt.paymentDate as string).toFormat(
          "yyyy-MM-dd"
        ),
        tenantName: receipt.tenantName,
      });

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 120,
        margin: 1,
        errorCorrectionLevel: "M",
      });

      // Position for QR code
      const qrX = this.doc.page.width - 150;
      const qrY = this.doc.page.height - 180;

      // Add QR code to the document
      this.doc.image(qrDataUrl, qrX, qrY, { width: 100 });

      // Add verification text
      this.doc
        .font("Helvetica")
        .fontSize(8)
        .text("Scan to verify receipt", qrX, qrY + 105, {
          width: 100,
          align: "center",
        });
    } catch (error) {
      console.error("Error generating QR code:", error);

      // Fallback: Add text if QR code generation fails
      this.doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Verification: ${receipt.receiptNumber} / ${receipt.transactionId}`,
          this.doc.page.width - 150,
          this.doc.page.height - 150,
          {
            width: 100,
            align: "center",
          }
        );
    }
  }

  private addWatermark() {
    // Add a subtle watermark
    this.doc.save();
    this.doc
      .rotate(45, {
        origin: [this.doc.page.width / 2, this.doc.page.height / 2],
      })
      .font("Helvetica")
      .fontSize(60)
      .fillColor("rgba(200, 200, 200, 0.3)")
      .text(
        "PAID",
        this.doc.page.width / 2 - 100,
        this.doc.page.height / 2 - 30,
        {
          align: "center",
        }
      );
    this.doc.restore();
  }

  async generateReceipt(receipt: Receipt): Promise<Buffer> {
    // Add content to the PDF
    this.addHeader();
    await this.addCompanyInfo();
    this.addReceiptInfo(receipt);
    this.addTenantInfo(receipt);
    this.addPaymentDetails(receipt);
    this.addPaymentInfo(receipt);
    this.addWatermark();
    await this.addQRCode(receipt);
    this.addFooter();

    // Finalize the PDF
    this.doc.end();

    // Return a promise that resolves with the complete PDF data
    return new Promise<Buffer>((resolve) => {
      this.doc.on("end", () => {
        resolve(Buffer.concat(this.buffers));
      });
    });
  }

  // Utility method to save the PDF to a file
  async saveToFile(receipt: Receipt, filePath: string): Promise<string> {
    const pdfBuffer = await this.generateReceipt(receipt);
    fs.writeFileSync(filePath, pdfBuffer);
    return filePath;
  }

  // Utility method to create a readable stream from the PDF
  async createReadStream(receipt: Receipt): Promise<Readable> {
    const pdfBuffer = await this.generateReceipt(receipt);
    const stream = new Readable();
    stream.push(pdfBuffer);
    stream.push(null);
    return stream;
  }
}
