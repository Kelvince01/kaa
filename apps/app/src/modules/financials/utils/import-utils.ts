import { format, isValid as isValidDate, parse as parseDate } from "date-fns";
import { parse as parseCSV } from "papaparse";
import * as XLSX from "xlsx";
import { financialsService } from "../financials.service";
import {
  type Asset,
  AssetCategory,
  type CreateAssetRequest,
  type CreateExpenseRequest,
  type Expense,
} from "../financials.type";

export type ImportFormat = "csv" | "excel" | "json";
export type ImportDataType = "expenses" | "assets" | "mixed";

export type ImportOptions = {
  format: ImportFormat;
  dataType: ImportDataType;
  skipErrors?: boolean;
  validateOnly?: boolean;
  batchSize?: number;
  dateFormat?: string;
  currencySymbol?: string;
  defaultCategory?: string;
  defaultProperty?: string;
  columnMapping?: Record<string, string>;
};

export type ImportValidationError = {
  row: number;
  column?: string;
  field?: string;
  message: string;
  value?: any;
  severity: "error" | "warning";
};

export type ImportResult = {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  errors: ImportValidationError[];
  processedData: (Expense | Asset)[];
  skippedRows: number[];
  metadata?: {
    importedAt: string;
    format: ImportFormat;
    dataType: ImportDataType;
    fileName?: string;
  };
};

export type ParsedImportData = {
  headers: string[];
  rows: any[][];
  rawData: any[];
  detectedFormat: ImportFormat;
  estimatedDataType: ImportDataType;
};

// Default column mappings for different data types
const DEFAULT_EXPENSE_MAPPINGS: Record<string, string[]> = {
  amount: ["amount", "cost", "price", "expense", "total", "value"],
  description: ["description", "desc", "note", "notes", "memo", "details"],
  category: ["category", "type", "cat", "expense_type", "kind"],
  date: [
    "date",
    "expense_date",
    "transaction_date",
    "created_date",
    "occurred_date",
  ],
  vendor: ["vendor", "supplier", "merchant", "company", "payee", "paid_to"],
  taxDeductible: ["tax_deductible", "deductible", "tax", "taxable"],
  status: ["status", "state", "approval", "approved"],
  property: ["property", "property_id", "property_name", "location"],
  currency: ["currency", "curr", "symbol"],
  recurring: ["recurring", "repeat", "frequency", "is_recurring"],
};

const DEFAULT_ASSET_MAPPINGS: Record<string, string[]> = {
  name: ["name", "asset_name", "title", "description"],
  category: ["category", "type", "asset_type", "kind"],
  purchasePrice: [
    "purchase_price",
    "cost",
    "price",
    "original_price",
    "amount",
  ],
  purchaseDate: ["purchase_date", "date", "acquired_date", "bought_date"],
  currentValue: ["current_value", "value", "market_value", "estimated_value"],
  depreciationMethod: ["depreciation_method", "depreciation", "method"],
  usefulLife: ["useful_life", "life", "lifespan", "years"],
  salvageValue: ["salvage_value", "residual_value", "scrap_value"],
  status: ["status", "state", "condition"],
  property: ["property", "property_id", "property_name", "location"],
};

// Parse file based on format
export async function parseImportFile(
  file: File,
  options: Partial<ImportOptions> = {}
): Promise<ParsedImportData> {
  const format = options.format || detectFileFormat(file.name);

  switch (format) {
    case "csv":
      return await parseCSVFile(file);
    case "excel":
      return await parseExcelFile(file);
    case "json":
      return await parseJSONFile(file);
    default:
      throw new Error(`Unsupported file format: ${format}`);
  }
}

// Detect file format from filename
function detectFileFormat(filename: string): ImportFormat {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "csv":
      return "csv";
    case "xlsx":
    case "xls":
      return "excel";
    case "json":
      return "json";
    default:
      throw new Error(`Unable to detect format for file: ${filename}`);
  }
}

// Parse CSV file
async function parseCSVFile(file: File): Promise<ParsedImportData> {
  return await new Promise((resolve, reject) => {
    parseCSV(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }

        const [headers, ...rows] = results.data as string[][];
        const rawData = rows.map((row) => {
          const obj: Record<string, any> = {};
          headers?.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        resolve({
          headers: headers || [],
          rows,
          rawData,
          detectedFormat: "csv",
          estimatedDataType: estimateDataType(headers || []),
        });
      },
      error: (error: any) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

// Parse Excel file
async function parseExcelFile(file: File): Promise<ParsedImportData> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Use the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName || ""];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet || {}, {
          header: 1,
        });
        const [headers, ...rows] = jsonData as any[][];

        const rawData = rows.map((row) => {
          const obj: Record<string, any> = {};
          headers?.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        resolve({
          headers: headers?.map(String) || [],
          rows,
          rawData,
          detectedFormat: "excel",
          estimatedDataType: estimateDataType(headers || []),
        });
      } catch (error) {
        reject(
          new Error(
            `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read Excel file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Parse JSON file
async function parseJSONFile(file: File): Promise<ParsedImportData> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        let rawData: any[] = [];

        // Handle different JSON structures
        if (Array.isArray(jsonData)) {
          rawData = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          rawData = jsonData.data;
        } else if (jsonData.expenses && Array.isArray(jsonData.expenses)) {
          rawData = jsonData.expenses;
        } else if (jsonData.assets && Array.isArray(jsonData.assets)) {
          rawData = jsonData.assets;
        } else {
          throw new Error("Invalid JSON structure - expected array of objects");
        }

        if (rawData.length === 0) {
          throw new Error("No data found in JSON file");
        }

        const headers = Object.keys(rawData[0]);
        const rows = rawData.map((item) =>
          headers.map((header) => item[header])
        );

        resolve({
          headers,
          rows,
          rawData,
          detectedFormat: "json",
          estimatedDataType: estimateDataType(headers),
        });
      } catch (error) {
        reject(
          new Error(
            `Failed to parse JSON file: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read JSON file"));
    };

    reader.readAsText(file);
  });
}

// Estimate data type from headers
function estimateDataType(headers: string[]): ImportDataType {
  const lowerHeaders = headers.map((h) => h.toLowerCase());

  const expenseKeywords = [
    "amount",
    "expense",
    "cost",
    "category",
    "vendor",
    "receipt",
  ];
  const assetKeywords = [
    "asset",
    "purchase_price",
    "depreciation",
    "useful_life",
    "current_value",
  ];

  const expenseScore = expenseKeywords.reduce(
    (score, keyword) =>
      lowerHeaders.some((h) => h.includes(keyword)) ? score + 1 : score,
    0
  );

  const assetScore = assetKeywords.reduce(
    (score, keyword) =>
      lowerHeaders.some((h) => h.includes(keyword)) ? score + 1 : score,
    0
  );

  if (expenseScore > assetScore) return "expenses";
  if (assetScore > expenseScore) return "assets";
  return "mixed";
}

// Map columns to standard field names
function mapColumns(
  headers: string[],
  dataType: ImportDataType,
  customMapping?: Record<string, string>
): Record<string, string> {
  const mappings =
    dataType === "expenses" ? DEFAULT_EXPENSE_MAPPINGS : DEFAULT_ASSET_MAPPINGS;
  const result: Record<string, string> = {};

  // Apply custom mappings first
  if (customMapping) {
    for (const [field, column] of Object.entries(customMapping)) {
      result[field] = column;
    }
  }

  // Auto-detect mappings for unmapped fields
  for (const [field, possibleColumns] of Object.entries(mappings)) {
    if (result[field || ""]) return result; // Already mapped

    const matchedColumn = headers.find((header) =>
      possibleColumns.some((possible) =>
        header.toLowerCase().includes(possible.toLowerCase())
      )
    );

    if (matchedColumn) {
      result[field] = matchedColumn;
    }
  }

  return result;
}

// Validate and transform data
export function validateAndTransformData(
  parsedData: ParsedImportData,
  options: ImportOptions
): ImportResult {
  const errors: ImportValidationError[] = [];
  const processedData: (CreateExpenseRequest | CreateAssetRequest)[] = [];
  const skippedRows: number[] = [];

  const columnMapping = mapColumns(
    parsedData.headers,
    options.dataType,
    options.columnMapping
  );

  parsedData.rawData.forEach((row, index) => {
    try {
      if (options.dataType === "expenses") {
        const expense = transformToExpense(row, columnMapping, options);
        const validationErrors = validateExpense(expense, index + 2); // +2 for header row and 0-based index

        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          if (
            !options.skipErrors ||
            validationErrors.some((e) => e.severity === "error")
          ) {
            skippedRows.push(index);
            return;
          }
        }

        processedData.push(expense);
      } else if (options.dataType === "assets") {
        const asset = transformToAsset(row, columnMapping, options);
        const validationErrors = validateAsset(asset, index + 2);

        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          if (
            !options.skipErrors ||
            validationErrors.some((e) => e.severity === "error")
          ) {
            skippedRows.push(index);
            return;
          }
        }

        processedData.push(asset);
      }
    } catch (error) {
      errors.push({
        row: index + 2,
        message:
          error instanceof Error
            ? error.message
            : "Unknown transformation error",
        severity: "error",
      });
      skippedRows.push(index);
    }
  });

  const successCount = processedData.length;
  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  return {
    success: errorCount === 0,
    totalRows: parsedData.rawData.length,
    successCount,
    errorCount,
    warningCount,
    errors,
    processedData: processedData as any[], // Type assertion for mixed data
    skippedRows,
    metadata: {
      importedAt: new Date().toISOString(),
      format: parsedData.detectedFormat,
      dataType: options.dataType,
    },
  };
}

// Transform row to expense
function transformToExpense(
  row: any,
  mapping: Record<string, string>,
  options: ImportOptions
): CreateExpenseRequest {
  const getValue = (field: string): any => {
    const column = mapping[field];
    return column ? row[column] : undefined;
  };

  // Required fields
  const amount = Number.parseFloat(
    String(getValue("amount") || "0").replace(/[^0-9.-]/g, "")
  );
  const description = String(getValue("description") || "").trim();
  const category = String(
    getValue("category") || options.defaultCategory || "Other"
  ).trim();

  // Date parsing
  let date = getValue("date");
  if (date) {
    if (typeof date === "number") {
      // Excel date serial number
      date = XLSX.SSF.parse_date_code(date);
      date = new Date(date.y, date.m - 1, date.d);
    } else if (typeof date === "string") {
      date = parseDate(date, options.dateFormat || "yyyy-MM-dd", new Date());
    }
  }

  if (!(date && isValidDate(date))) {
    date = new Date();
  }

  // Optional fields
  const vendor = getValue("vendor");
  const taxDeductible = parseBooleanValue(getValue("taxDeductible"));
  const recurring = getValue("recurring");
  const property = getValue("property") || options.defaultProperty;
  const currency = getValue("currency") || "USD";

  const expense: CreateExpenseRequest = {
    amount,
    description,
    category,
    date: format(date, "yyyy-MM-dd"),
    currency,
    taxDeductible,
    property,
  };

  // Add vendor if provided
  if (vendor) {
    expense.vendor = {
      name: String(vendor).trim(),
      contact: "",
    };
  }

  // Add recurring info if provided
  if (recurring) {
    const isRecurring = parseBooleanValue(recurring);
    if (isRecurring) {
      expense.recurring = {
        isRecurring: true,
        frequency: "monthly", // Default frequency
      };
    }
  }

  return expense;
}

// Transform row to asset
function transformToAsset(
  row: any,
  mapping: Record<string, string>,
  options: ImportOptions
): CreateAssetRequest {
  const getValue = (field: string): any => {
    const column = mapping[field];
    return column ? row[column] : undefined;
  };

  // Required fields
  const name = String(getValue("name") || "").trim();
  const category = parseAssetCategory(getValue("category"));
  const purchasePrice = Number.parseFloat(
    String(getValue("purchasePrice") || "0").replace(/[^0-9.-]/g, "")
  );
  const usefulLife = Number.parseInt(String(getValue("usefulLife") || "5"), 10);

  // Date parsing
  let purchaseDate = getValue("purchaseDate");
  if (purchaseDate) {
    if (typeof purchaseDate === "number") {
      purchaseDate = XLSX.SSF.parse_date_code(purchaseDate);
      purchaseDate = new Date(
        purchaseDate.y,
        purchaseDate.m - 1,
        purchaseDate.d
      );
    } else if (typeof purchaseDate === "string") {
      purchaseDate = parseDate(
        purchaseDate,
        options.dateFormat || "yyyy-MM-dd",
        new Date()
      );
    }
  }

  if (!(purchaseDate && isValidDate(purchaseDate))) {
    purchaseDate = new Date();
  }

  // Optional fields
  const depreciationMethod = parseDepreciationMethod(
    getValue("depreciationMethod")
  );
  const salvageValue = Number.parseFloat(
    String(getValue("salvageValue") || "0").replace(/[^0-9.-]/g, "")
  );
  const property = getValue("property") || options.defaultProperty;
  const description = String(getValue("description") || "").trim();

  const asset: CreateAssetRequest = {
    name,
    category,
    purchasePrice,
    purchaseDate: format(purchaseDate, "yyyy-MM-dd"),
    usefulLife,
    salvageValue,
    depreciationMethod,
    property,
    description,
  };

  return asset;
}

// Validation functions
function validateExpense(
  expense: CreateExpenseRequest,
  rowNumber: number
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  if (!expense.amount || expense.amount <= 0) {
    errors.push({
      row: rowNumber,
      field: "amount",
      message: "Amount must be greater than 0",
      value: expense.amount,
      severity: "error",
    });
  }

  if (!expense.description || expense.description.trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: "description",
      message: "Description is required",
      value: expense.description,
      severity: "error",
    });
  }

  if (!expense.category || expense.category.trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: "category",
      message: "Category is required",
      value: expense.category,
      severity: "error",
    });
  }

  if (expense.amount && expense.amount > 100_000) {
    errors.push({
      row: rowNumber,
      field: "amount",
      message: "Large amount detected - please verify",
      value: expense.amount,
      severity: "warning",
    });
  }

  return errors;
}

function validateAsset(
  asset: CreateAssetRequest,
  rowNumber: number
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  if (!asset.name || asset.name.trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: "name",
      message: "Asset name is required",
      value: asset.name,
      severity: "error",
    });
  }

  if (!asset.purchasePrice || asset.purchasePrice <= 0) {
    errors.push({
      row: rowNumber,
      field: "purchasePrice",
      message: "Purchase price must be greater than 0",
      value: asset.purchasePrice,
      severity: "error",
    });
  }

  if (!asset.usefulLife || asset.usefulLife <= 0) {
    errors.push({
      row: rowNumber,
      field: "usefulLife",
      message: "Useful life must be greater than 0",
      value: asset.usefulLife,
      severity: "error",
    });
  }

  if (asset.purchasePrice && asset.purchasePrice > 1_000_000) {
    errors.push({
      row: rowNumber,
      field: "purchasePrice",
      message: "Large purchase price detected - please verify",
      value: asset.purchasePrice,
      severity: "warning",
    });
  }

  return errors;
}

// Helper functions
function parseBooleanValue(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return ["true", "yes", "y", "1", "on", "enabled"].includes(lower);
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

function parseAssetCategory(value: any): AssetCategory {
  if (!value) return AssetCategory.OTHER;
  const str = String(value).toLowerCase().trim();

  if (str.includes("property")) return AssetCategory.PROPERTY;
  if (str.includes("equipment")) return AssetCategory.EQUIPMENT;
  if (str.includes("furniture")) return AssetCategory.FURNITURE;
  if (str.includes("vehicle")) return AssetCategory.VEHICLE;

  return AssetCategory.OTHER;
}

function parseDepreciationMethod(
  value: any
): "straight_line" | "declining_balance" | "units_of_production" {
  if (!value) return "straight_line";
  const str = String(value).toLowerCase().trim();

  if (str.includes("declining")) return "declining_balance";
  if (str.includes("units")) return "units_of_production";

  return "straight_line";
}

// Main import function
export async function importFinancialData(
  file: File,
  options: ImportOptions
): Promise<ImportResult> {
  try {
    // Parse the file
    const parsedData = await parseImportFile(file, options);

    // Validate and transform data
    const result = validateAndTransformData(parsedData, options);

    // If validation only, return early
    if (options.validateOnly) {
      return result;
    }

    // Import data if validation passed
    if (result.success && result.processedData.length > 0) {
      const importedData = await importDataToService(
        result.processedData,
        options
      );

      // Update result with import status
      result.metadata = {
        ...result.metadata,
        fileName: file.name,
        importedAt: result.metadata?.importedAt || new Date().toISOString(),
        format: result.metadata?.format || "excel",
        dataType: result.metadata?.dataType || "expenses",
      };

      return {
        ...result,
        processedData: importedData,
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      totalRows: 0,
      successCount: 0,
      errorCount: 1,
      warningCount: 0,
      errors: [
        {
          row: 0,
          message: error instanceof Error ? error.message : "Import failed",
          severity: "error",
        },
      ],
      processedData: [],
      skippedRows: [],
    };
  }
}

// Import data to service
async function importDataToService(
  data: (CreateExpenseRequest | CreateAssetRequest)[],
  options: ImportOptions
): Promise<(Expense | Asset)[]> {
  const batchSize = options.batchSize || 50;
  const results: (Expense | Asset)[] = [];

  // Process in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    if (options.dataType === "expenses") {
      const expenses = await Promise.all(
        batch.map((item) =>
          financialsService.createExpense(item as CreateExpenseRequest)
        )
      );
      results.push(...expenses);
    } else if (options.dataType === "assets") {
      const assets = await Promise.all(
        batch.map((item) =>
          financialsService.createAsset(item as CreateAssetRequest)
        )
      );
      results.push(...assets);
    }
  }

  return results;
}

// Export helper functions for UI components
export const getColumnSuggestions = (
  headers: string[],
  dataType: ImportDataType
): Record<string, string[]> => {
  const mappings =
    dataType === "expenses" ? DEFAULT_EXPENSE_MAPPINGS : DEFAULT_ASSET_MAPPINGS;
  const suggestions: Record<string, string[]> = {};

  for (const field of Object.keys(mappings)) {
    suggestions[field] = headers.filter((header) =>
      mappings[field]?.some((possible) =>
        header.toLowerCase().includes(possible.toLowerCase())
      )
    );
  }

  return suggestions;
};
