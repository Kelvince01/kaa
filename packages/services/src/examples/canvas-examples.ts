/**
 * Canvas Usage Examples for Legal Documents Service
 *
 * This file demonstrates how to use the canvas-based image generation
 * methods in the Legal Documents Service for creating custom graphics,
 * watermarks, seals, and charts in PDF documents.
 */

import FS from "node:fs";
import fs from "node:fs/promises";
import PDFDocument from "pdfkit";
import { legalDocumentService } from "../documents/legal-document.service";

/**
 * Example 1: Create a Watermark
 */
export function example1_CreateWatermark() {
  console.log("Example 1: Creating watermark...");

  // Create a simple watermark
  const watermarkUrl = legalDocumentService.createWatermarkImage("DRAFT", {
    opacity: 0.2,
    rotation: -45,
    color: "#999999",
  });

  // Create a confidential watermark
  const confidentialUrl = legalDocumentService.createWatermarkImage(
    "CONFIDENTIAL",
    {
      fontSize: 96,
      opacity: 0.15,
      rotation: -30,
      color: "#ff0000",
    }
  );

  console.log("Watermarks created!");
  console.log("Data URLs length:", watermarkUrl.length, confidentialUrl.length);

  return { watermarkUrl, confidentialUrl };
}

/**
 * Example 2: Create Official Seals
 */
export async function example2_CreateOfficialSeals() {
  console.log("\nExample 2: Creating official seals...");

  // Create a standard official seal
  const officialSeal = legalDocumentService.createOfficialSeal({
    text: "KAA RENTALS",
    subtext: "OFFICIAL DOCUMENT",
    size: 250,
    color: "#1e40af",
  });

  // Save to file
  await fs.writeFile("examples/official-seal.png", officialSeal);
  console.log("Official seal saved to examples/official-seal.png");

  // Create a landlord certification seal
  const landlordSeal = legalDocumentService.createOfficialSeal({
    text: "CERTIFIED LANDLORD",
    subtext: "NAIROBI, KENYA",
    size: 200,
    color: "#059669",
  });

  await fs.writeFile("examples/landlord-seal.png", landlordSeal);
  console.log("Landlord seal saved to examples/landlord-seal.png");

  return { officialSeal, landlordSeal };
}

/**
 * Example 3: Create Signature Placeholders
 */
export async function example3_CreateSignaturePlaceholders() {
  console.log("\nExample 3: Creating signature placeholders...");

  // Landlord signature placeholder
  const landlordSig = legalDocumentService.createSignaturePlaceholder({
    label: "Landlord Signature",
    width: 450,
    height: 120,
  });

  await fs.writeFile("examples/landlord-signature.png", landlordSig);
  console.log("Landlord signature saved to examples/landlord-signature.png");

  // Tenant signature placeholder
  const tenantSig = legalDocumentService.createSignaturePlaceholder({
    label: "Tenant Signature",
    width: 450,
    height: 120,
  });

  await fs.writeFile("examples/tenant-signature.png", tenantSig);
  console.log("Tenant signature saved to examples/tenant-signature.png");

  // Witness signature placeholder
  const witnessSig = legalDocumentService.createSignaturePlaceholder({
    label: "Witness Signature",
    width: 400,
    height: 100,
  });

  await fs.writeFile("examples/witness-signature.png", witnessSig);
  console.log("Witness signature saved to examples/witness-signature.png");

  return { landlordSig, tenantSig, witnessSig };
}

/**
 * Example 4: Create Document Headers
 */
export async function example4_CreateDocumentHeaders() {
  console.log("\nExample 4: Creating document headers...");

  // Tenancy agreement header
  const tenancyHeader = legalDocumentService.createDocumentHeader({
    title: "TENANCY AGREEMENT",
    subtitle: "Standard Residential Lease - Nairobi, Kenya",
    width: 800,
    height: 180,
  });

  await fs.writeFile("examples/tenancy-header.png", tenancyHeader);
  console.log("Tenancy header saved to examples/tenancy-header.png");

  // Notice header
  const noticeHeader = legalDocumentService.createDocumentHeader({
    title: "OFFICIAL NOTICE",
    subtitle: "Kenya Rent Payment Notice",
    width: 800,
    height: 150,
  });

  await fs.writeFile("examples/notice-header.png", noticeHeader);
  console.log("Notice header saved to examples/notice-header.png");

  return { tenancyHeader, noticeHeader };
}

/**
 * Example 5: Create Verification Badge
 */
export async function example5_CreateVerificationBadge() {
  console.log("\nExample 5: Creating verification badge...");

  const documentId = "doc-12345-abcde";
  const checksum = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

  const verificationBadge = await legalDocumentService.createVerificationBadge(
    documentId,
    checksum
  );

  await fs.writeFile("examples/verification-badge.png", verificationBadge);
  console.log("Verification badge saved to examples/verification-badge.png");

  return verificationBadge;
}

/**
 * Example 6: Create Charts
 */
export async function example6_CreateCharts() {
  console.log("\nExample 6: Creating charts...");

  // Monthly rent payment chart
  const rentData = [
    { label: "Jan", value: 50_000 },
    { label: "Feb", value: 50_000 },
    { label: "Mar", value: 50_000 },
    { label: "Apr", value: 45_000 },
    { label: "May", value: 50_000 },
    { label: "Jun", value: 50_000 },
  ];

  const rentChart = legalDocumentService.createSimpleBarChart(rentData, {
    title: "Monthly Rent Payments (KES)",
    width: 700,
    height: 450,
    color: "#10b981",
  });

  await fs.writeFile("examples/rent-payment-chart.png", rentChart);
  console.log("Rent payment chart saved to examples/rent-payment-chart.png");

  // Occupancy rate chart
  const occupancyData = [
    { label: "Q1", value: 95 },
    { label: "Q2", value: 88 },
    { label: "Q3", value: 92 },
    { label: "Q4", value: 97 },
  ];

  const occupancyChart = legalDocumentService.createSimpleBarChart(
    occupancyData,
    {
      title: "Quarterly Occupancy Rate (%)",
      width: 600,
      height: 400,
      color: "#3b82f6",
    }
  );

  await fs.writeFile("examples/occupancy-chart.png", occupancyChart);
  console.log("Occupancy chart saved to examples/occupancy-chart.png");

  return { rentChart, occupancyChart };
}

/**
 * Example 7: Complete PDF with Canvas Elements
 */
export async function example7_CompletePDFWithCanvas() {
  console.log("\nExample 7: Creating complete PDF with canvas elements...");

  // Create PDF
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 180, left: 50, right: 50, bottom: 50 },
  });

  const stream = FS.createWriteStream("examples/enhanced-document.pdf");
  doc.pipe(stream);

  // 1. Add branded header
  const header = legalDocumentService.createDocumentHeader({
    title: "TENANCY AGREEMENT",
    subtitle: "Nairobi, Kenya",
    width: 595, // A4 width in points
    height: 160,
  });
  doc.image(header, 0, 0, { width: 595 });

  // 2. Add official seal in top right
  const seal = legalDocumentService.createOfficialSeal({
    text: "KAA RENTALS",
    subtext: "OFFICIAL",
    size: 180,
  });
  doc.image(seal, 450, 200, { width: 90 });

  // 3. Document content
  doc.moveDown(8);
  doc.fontSize(14).font("Helvetica-Bold");
  doc.text("TENANCY AGREEMENT", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).font("Helvetica");
  doc.text(
    "This Tenancy Agreement is made on this day between the Landlord and the Tenant.",
    { align: "justify" }
  );
  doc.moveDown();

  doc.text("LANDLORD DETAILS:", { underline: true });
  doc.text("Name: John Doe");
  doc.text("Address: 123 Main Street, Nairobi");
  doc.moveDown();

  doc.text("TENANT DETAILS:", { underline: true });
  doc.text("Name: Jane Smith");
  doc.text("Address: 456 Oak Avenue, Nairobi");
  doc.moveDown(2);

  // 4. Add payment history chart on new page
  doc.addPage();
  doc.fontSize(16).font("Helvetica-Bold");
  doc.text("Payment History", { align: "center" });
  doc.moveDown();

  const paymentData = [
    { label: "Jan", value: 50_000 },
    { label: "Feb", value: 50_000 },
    { label: "Mar", value: 50_000 },
    { label: "Apr", value: 50_000 },
    { label: "May", value: 50_000 },
    { label: "Jun", value: 50_000 },
  ];

  const paymentChart = legalDocumentService.createSimpleBarChart(paymentData, {
    title: "Monthly Rent (KES)",
    color: "#10b981",
  });
  doc.image(paymentChart, 50, doc.y, { width: 495 });

  // 5. Add signature section on new page
  doc.addPage();
  doc.fontSize(14).font("Helvetica-Bold");
  doc.text("SIGNATURES", { align: "center" });
  doc.moveDown(3);

  const landlordSig = legalDocumentService.createSignaturePlaceholder({
    label: "Landlord Signature",
  });
  const tenantSig = legalDocumentService.createSignaturePlaceholder({
    label: "Tenant Signature",
  });

  doc.image(landlordSig, 50, doc.y, { width: 220 });
  doc.image(tenantSig, 295, doc.y, { width: 220 });

  // 6. Add verification badge
  const verificationBadge = await legalDocumentService.createVerificationBadge(
    "DOC-2024-001",
    "abc123def456"
  );
  doc.image(verificationBadge, 445, 20, { width: 120 });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(undefined));
    stream.on("error", reject);
  });

  console.log("Enhanced PDF saved to examples/enhanced-document.pdf");
}

/**
 * Run all examples
 */
export async function runAllCanvasExamples() {
  console.log("=== Canvas Examples for Legal Documents Service ===\n");

  try {
    // Create examples directory
    await fs.mkdir("examples", { recursive: true });

    // Run all examples
    await example1_CreateWatermark();
    await example2_CreateOfficialSeals();
    await example3_CreateSignaturePlaceholders();
    await example4_CreateDocumentHeaders();
    await example5_CreateVerificationBadge();
    await example6_CreateCharts();
    await example7_CompletePDFWithCanvas();

    console.log("\n=== All examples completed successfully! ===");
    console.log("\nGenerated files:");
    console.log("  - examples/official-seal.png");
    console.log("  - examples/landlord-seal.png");
    console.log("  - examples/landlord-signature.png");
    console.log("  - examples/tenant-signature.png");
    console.log("  - examples/witness-signature.png");
    console.log("  - examples/tenancy-header.png");
    console.log("  - examples/notice-header.png");
    console.log("  - examples/verification-badge.png");
    console.log("  - examples/rent-payment-chart.png");
    console.log("  - examples/occupancy-chart.png");
    console.log("  - examples/enhanced-document.pdf");
  } catch (error) {
    console.error("Error running examples:", error);
    throw error;
  }
}

// Export individual examples
export default {
  example1_CreateWatermark,
  example2_CreateOfficialSeals,
  example3_CreateSignaturePlaceholders,
  example4_CreateDocumentHeaders,
  example5_CreateVerificationBadge,
  example6_CreateCharts,
  example7_CompletePDFWithCanvas,
  runAllCanvasExamples,
};

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllCanvasExamples();
}
