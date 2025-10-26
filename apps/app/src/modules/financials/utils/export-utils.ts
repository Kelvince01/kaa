import { format as formatDate } from "date-fns";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { financialsService } from "../financials.service";
import type {
  Asset,
  BudgetAnalysis,
  Expense,
  ExpenseAnalytics,
  FinancialInsights,
  FinancialReport,
  FinancialTrends,
} from "../financials.type";

// Extend jsPDF to include autoTable
declare module "jspdf" {
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: ignore
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export type ExportFormat = "csv" | "excel" | "json" | "pdf";

export type ExportOptions = {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  categories?: string[];
  properties?: string[];
  includeMetadata?: boolean;
  includeCharts?: boolean;
  customFields?: string[];
  reportTitle?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
};

export type FinancialExportData = {
  expenses?: Expense[];
  assets?: Asset[];
  reports?: FinancialReport[];
  analytics?: {
    expenseAnalytics?: ExpenseAnalytics;
    financialTrends?: FinancialTrends;
    budgetAnalysis?: BudgetAnalysis;
    insights?: FinancialInsights;
  };
  metadata?: {
    exportDate: string;
    exportedBy: string;
    filters: any;
    totalRecords: number;
    dateRange?: string;
    version: string;
  };
};

// Convert array of objects to CSV format
export function arrayToCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) return "";

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [csvHeaders.join(",")];

  for (const row of data) {
    const values = csvHeaders.map((header) => {
      const value = row[header];
      // Handle values that contain commas, quotes, or newlines
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"') || value.includes("\n"))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? "";
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

// Convert data to JSON format with formatting
export function dataToJSON(data: any, pretty = true): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

// Generate filename with timestamp
export function generateFilename(
  baseName: string,
  format: ExportFormat
): string {
  const timestamp = formatDate(new Date(), "yyyy-MM-dd-HHmmss");
  const extension = format === "excel" ? "xlsx" : format;
  return `${baseName}-${timestamp}.${extension}`;
}

// Download file utility
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType?: string
): void {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], {
          type: mimeType || "text/plain",
        });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format currency for export
export function formatCurrencyForExport(
  amount: number,
  includeCurrency = true
): string {
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sign = amount < 0 ? "-" : "";
  const currency = includeCurrency ? "$" : "";

  return `${sign}${currency}${formatted}`;
}

// Format date for export
export function formatDateForExport(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDate(dateObj, "yyyy-MM-dd");
}

// Clean data for export (remove internal IDs, format dates/currency)
export function cleanDataForExport(
  data: Array<Expense | Asset | FinancialReport>,
  _type: "expenses" | "assets" | "reports" = "expenses"
): any[] {
  return data.map((item): Record<string, any> => {
    const cleanItem: Record<string, any> = {};

    for (const key of Object.keys(item)) {
      const value = (item as Record<string, any>)[key];

      // Skip internal fields
      if (key.startsWith("_") || key === "landlord" || key === "userId") {
        continue;
      }

      // Format dates
      if (
        key.includes("Date") ||
        key.includes("date") ||
        key.includes("At") ||
        value instanceof Date
      ) {
        cleanItem[key] = formatDateForExport(value);
      }
      // Format currency amounts
      else if (
        key.includes("amount") ||
        key.includes("Amount") ||
        key.includes("cost") ||
        key.includes("Cost") ||
        key.includes("price") ||
        key.includes("Price") ||
        key.includes("value") ||
        key.includes("Value")
      ) {
        cleanItem[key] =
          typeof value === "number"
            ? formatCurrencyForExport(value, false)
            : value;
      }
      // Handle nested objects
      else if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        cleanItem[key] = JSON.stringify(value);
      }
      // Keep other values as is
      else {
        cleanItem[key] = value;
      }
    }

    return cleanItem;
  });
}

// Create Excel-compatible CSV (with BOM for proper UTF-8 encoding)
export function createExcelCSV(content: string): Blob {
  const BOM = "\uFEFF"; // UTF-8 BOM
  return new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
}

// Validate export data
export function validateExportData(data: FinancialExportData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!(data.expenses || data.assets || data.reports || data.analytics)) {
    errors.push("No data available for export");
  }

  if (data.expenses && !Array.isArray(data.expenses)) {
    errors.push("Expenses data must be an array");
  }

  if (data.assets && !Array.isArray(data.assets)) {
    errors.push("Assets data must be an array");
  }

  if (data.reports && !Array.isArray(data.reports)) {
    errors.push("Reports data must be an array");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Main export function
export async function exportFinancialData(
  data: FinancialExportData,
  options: ExportOptions
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const validation = validateExportData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(", ") };
    }

    const filename =
      options.filename || generateFilename("financial-export", options.format);

    switch (options.format) {
      case "csv":
        return await exportAsCSV(data, filename, options);
      case "json":
        return await exportAsJSON(data, filename, options);
      case "excel":
        return await exportAsExcel(data, filename, options);
      case "pdf":
        return await exportAsPDF(data, filename, options);
      default:
        return { success: false, error: "Unsupported export format" };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

export async function exportAsCSV(
  data: FinancialExportData,
  filename: string,
  options: ExportOptions
): Promise<{ success: boolean; filename: string }> {
  let csvContent = "";

  // Add metadata header if requested
  if (options.includeMetadata && data.metadata) {
    csvContent += `Export Date,${data.metadata.exportDate}\n`;
    csvContent += `Total Records,${data.metadata.totalRecords}\n`;
    if (data.metadata.dateRange) {
      csvContent += `Date Range,${data.metadata.dateRange}\n`;
    }
    csvContent += `Version,${data.metadata.version}\n`;
    csvContent += "\n";
  }

  // Export expenses
  if (data.expenses && data.expenses.length > 0) {
    csvContent += "EXPENSES\n";
    const cleanExpenses = cleanDataForExport(data.expenses, "expenses");
    csvContent += arrayToCSV(cleanExpenses);
    csvContent += "\n\n";
  }

  // Export assets
  if (data.assets && data.assets.length > 0) {
    csvContent += "ASSETS\n";
    const cleanAssets = cleanDataForExport(data.assets, "assets");
    csvContent += arrayToCSV(cleanAssets);
    csvContent += "\n\n";
  }

  // Export reports
  if (data.reports && data.reports.length > 0) {
    csvContent += "REPORTS\n";
    const cleanReports = cleanDataForExport(data.reports, "reports");
    csvContent += arrayToCSV(cleanReports);
  }

  const blob = createExcelCSV(csvContent);
  downloadFile(blob, filename, "text/csv");

  return await Promise.resolve({ success: true, filename });
}

async function exportAsJSON(
  data: FinancialExportData,
  filename: string,
  options: ExportOptions
): Promise<{ success: boolean; filename: string }> {
  // Clean the data before JSON export
  const cleanedData: FinancialExportData = {};

  if (data.expenses) {
    cleanedData.expenses = cleanDataForExport(data.expenses, "expenses");
  }

  if (data.assets) {
    cleanedData.assets = cleanDataForExport(data.assets, "assets");
  }

  if (data.reports) {
    cleanedData.reports = cleanDataForExport(data.reports, "reports");
  }

  if (data.analytics) {
    cleanedData.analytics = data.analytics;
  }

  if (options.includeMetadata && data.metadata) {
    cleanedData.metadata = data.metadata;
  }

  const jsonContent = dataToJSON(cleanedData, true);
  downloadFile(jsonContent, filename, "application/json");

  return await Promise.resolve({ success: true, filename });
}

export function exportAsExcel(
  data: FinancialExportData,
  filename: string,
  options: ExportOptions
): { success: boolean; filename: string } {
  const workbook = XLSX.utils.book_new();

  // Add metadata sheet if requested
  if (options.includeMetadata && data.metadata) {
    const metadataWS = XLSX.utils.json_to_sheet([
      { Field: "Export Date", Value: data.metadata.exportDate },
      { Field: "Total Records", Value: data.metadata.totalRecords },
      { Field: "Date Range", Value: data.metadata.dateRange || "N/A" },
      { Field: "Version", Value: data.metadata.version },
    ]);
    XLSX.utils.book_append_sheet(workbook, metadataWS, "Metadata");
  }

  // Add expenses sheet
  if (data.expenses && data.expenses.length > 0) {
    const cleanExpenses = cleanDataForExport(data.expenses, "expenses");
    const expensesWS = XLSX.utils.json_to_sheet(cleanExpenses);

    // Auto-size columns
    const colWidths = Object.keys(cleanExpenses[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    expensesWS["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, expensesWS, "Expenses");
  }

  // Add assets sheet
  if (data.assets && data.assets.length > 0) {
    const cleanAssets = cleanDataForExport(data.assets, "assets");
    const assetsWS = XLSX.utils.json_to_sheet(cleanAssets);

    const colWidths = Object.keys(cleanAssets[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    assetsWS["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, assetsWS, "Assets");
  }

  // Add reports sheet
  if (data.reports && data.reports.length > 0) {
    const cleanReports = cleanDataForExport(data.reports, "reports");
    const reportsWS = XLSX.utils.json_to_sheet(cleanReports);

    const colWidths = Object.keys(cleanReports[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    reportsWS["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, reportsWS, "Reports");
  }

  // Add analytics sheets if available
  if (data.analytics?.expenseAnalytics) {
    const analytics = data.analytics.expenseAnalytics;
    const analyticsData = [
      {
        Metric: "Total Expenses",
        Value: formatCurrencyForExport(analytics.totalExpenses),
      },
      { Metric: "Monthly Trend Count", Value: analytics.monthlyTrend.length },
      { Metric: "Category Count", Value: analytics.categoryBreakdown.length },
      {
        Metric: "Comparison Amount",
        Value: formatCurrencyForExport(analytics.comparisonToPrevious.amount),
      },
      {
        Metric: "Comparison Percentage",
        Value: `${analytics.comparisonToPrevious.percentage.toFixed(2)}%`,
      },
    ];

    const analyticsWS = XLSX.utils.json_to_sheet(analyticsData);
    XLSX.utils.book_append_sheet(workbook, analyticsWS, "Analytics Summary");

    // Monthly trend sheet
    if (analytics.monthlyTrend.length > 0) {
      const trendWS = XLSX.utils.json_to_sheet(
        analytics.monthlyTrend.map((item: any) => ({
          Month: item.month,
          Amount: formatCurrencyForExport(item.amount),
          Count: item.count,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, trendWS, "Monthly Trends");
    }

    // Category breakdown sheet
    if (analytics.categoryBreakdown.length > 0) {
      const categoryWS = XLSX.utils.json_to_sheet(
        analytics.categoryBreakdown.map((item: any) => ({
          Category: item.category,
          Amount: formatCurrencyForExport(item.amount),
          Percentage: `${item.percentage.toFixed(2)}%`,
          Count: item.count,
        }))
      );
      XLSX.utils.book_append_sheet(workbook, categoryWS, "Category Breakdown");
    }
  }

  // Generate buffer and download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadFile(blob, filename, blob.type);

  return { success: true, filename };
}

async function exportAsPDF(
  data: FinancialExportData,
  filename: string,
  options: ExportOptions
): Promise<{ success: boolean; filename: string }> {
  const doc = new jsPDF();
  let currentY = 20;

  // Add header
  doc.setFontSize(20);
  doc.text(options.reportTitle || "Financial Report", 20, currentY);
  currentY += 20;

  // Add company info if provided
  if (options.companyInfo) {
    doc.setFontSize(12);
    doc.text(options.companyInfo.name, 20, currentY);
    currentY += 7;
    doc.text(options.companyInfo.address, 20, currentY);
    currentY += 7;
    doc.text(`Phone: ${options.companyInfo.phone}`, 20, currentY);
    currentY += 7;
    doc.text(`Email: ${options.companyInfo.email}`, 20, currentY);
    currentY += 15;
  }

  // Add metadata
  if (options.includeMetadata && data.metadata) {
    doc.setFontSize(10);
    doc.text(`Generated on: ${data.metadata.exportDate}`, 20, currentY);
    currentY += 7;
    if (data.metadata.dateRange) {
      doc.text(`Date Range: ${data.metadata.dateRange}`, 20, currentY);
      currentY += 7;
    }
    doc.text(`Total Records: ${data.metadata.totalRecords}`, 20, currentY);
    currentY += 15;
  }

  // Add expenses table
  if (data.expenses && data.expenses.length > 0) {
    doc.setFontSize(14);
    doc.text("Expenses", 20, currentY);
    currentY += 10;

    const expenseHeaders = [
      "Date",
      "Description",
      "Category",
      "Amount",
      "Status",
    ];
    const expenseRows = data.expenses
      .slice(0, 50)
      .map((expense) => [
        formatDateForExport(expense.date),
        expense.description.length > 30
          ? `${expense.description.substring(0, 30)}...`
          : expense.description,
        expense.category,
        formatCurrencyForExport(expense.amount),
        expense.status,
      ]);

    doc.autoTable({
      head: [expenseHeaders],
      body: expenseRows,
      startY: currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Add summary
    const totalExpenses = data.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    doc.setFontSize(12);
    doc.text(
      `Total Expenses: ${formatCurrencyForExport(totalExpenses)}`,
      20,
      currentY
    );
    currentY += 15;
  }

  // Add assets table
  if (data.assets && data.assets.length > 0) {
    // Add new page if needed
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.text("Assets", 20, currentY);
    currentY += 10;

    const assetHeaders = [
      "Name",
      "Category",
      "Purchase Price",
      "Current Value",
      "Status",
    ];
    const assetRows = data.assets
      .slice(0, 50)
      .map((asset) => [
        asset.name.length > 25
          ? `${asset.name.substring(0, 25)}...`
          : asset.name,
        asset.category,
        formatCurrencyForExport(asset.purchasePrice),
        formatCurrencyForExport(asset.currentValue),
        asset.status,
      ]);

    doc.autoTable({
      head: [assetHeaders],
      body: assetRows,
      startY: currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Add summary
    const totalAssetValue = data.assets.reduce(
      (sum, asset) => sum + asset.currentValue,
      0
    );
    doc.setFontSize(12);
    doc.text(
      `Total Asset Value: ${formatCurrencyForExport(totalAssetValue)}`,
      20,
      currentY
    );
    currentY += 15;
  }

  // Add analytics summary
  if (data.analytics?.expenseAnalytics) {
    // Add new page if needed
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    const analytics = data.analytics.expenseAnalytics;

    doc.setFontSize(14);
    doc.text("Analytics Summary", 20, currentY);
    currentY += 15;

    doc.setFontSize(10);
    doc.text(
      `Total Expenses: ${formatCurrencyForExport(analytics.totalExpenses)}`,
      20,
      currentY
    );
    currentY += 7;
    doc.text(
      `Number of Categories: ${analytics.categoryBreakdown.length}`,
      20,
      currentY
    );
    currentY += 7;
    doc.text(
      `Comparison to Previous: ${formatCurrencyForExport(analytics.comparisonToPrevious.amount)} (${analytics.comparisonToPrevious.percentage.toFixed(2)}%)`,
      20,
      currentY
    );
    currentY += 15;

    // Category breakdown table
    if (analytics.categoryBreakdown.length > 0) {
      doc.text("Category Breakdown", 20, currentY);
      currentY += 10;

      const categoryHeaders = ["Category", "Amount", "Percentage", "Count"];
      const categoryRows = analytics.categoryBreakdown.map((item: any) => [
        item.category,
        formatCurrencyForExport(item.amount),
        `${item.percentage.toFixed(2)}%`,
        item.count.toString(),
      ]);

      doc.autoTable({
        head: [categoryHeaders],
        body: categoryRows,
        startY: currentY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
    }
  }

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 40,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `Generated on ${formatDate(new Date(), "yyyy-MM-dd HH:mm")}`,
      20,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Save the PDF
  const pdfBlob = doc.output("blob");
  downloadFile(pdfBlob, filename, "application/pdf");

  return await Promise.resolve({ success: true, filename });
}

// Export specific data types
export const exportExpenses = async (
  filters?: any,
  options: Partial<ExportOptions> = {}
): Promise<{ success: boolean; filename?: string; error?: string }> => {
  try {
    const response = await financialsService.getExpenses(filters);
    const expenses = response.expenses;

    const exportData: FinancialExportData = {
      expenses,
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: "User", // This should come from auth context
        filters,
        totalRecords: expenses.length,
        dateRange:
          filters?.startDate && filters?.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : undefined,
        version: "1.0",
      },
    };

    return await exportFinancialData(exportData, {
      format: "excel",
      reportTitle: "Expenses Report",
      includeMetadata: true,
      ...options,
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export expenses",
    };
  }
};

export const exportAssets = async (
  filters?: any,
  options: Partial<ExportOptions> = {}
): Promise<{ success: boolean; filename?: string; error?: string }> => {
  try {
    const response = await financialsService.getAssets(filters);
    const assets = response.assets;

    const exportData: FinancialExportData = {
      assets,
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: "User",
        filters,
        totalRecords: assets.length,
        version: "1.0",
      },
    };

    return await exportFinancialData(exportData, {
      format: "excel",
      reportTitle: "Assets Report",
      includeMetadata: true,
      ...options,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export assets",
    };
  }
};

export const exportReports = async (
  filters?: any,
  options: Partial<ExportOptions> = {}
): Promise<{ success: boolean; filename?: string; error?: string }> => {
  try {
    const response = await financialsService.getReports(filters);
    const reports = response.reports;

    const exportData: FinancialExportData = {
      reports,
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: "User",
        filters,
        totalRecords: reports.length,
        version: "1.0",
      },
    };

    return await exportFinancialData(exportData, {
      format: "pdf",
      reportTitle: "Financial Reports",
      includeMetadata: true,
      ...options,
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export reports",
    };
  }
};
