import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Progress } from "@kaa/ui/components/progress";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

import {
  type ExportFormat,
  type ExportOptions,
  exportAssets,
  exportExpenses,
  exportFinancialData,
  exportReports,
  type FinancialExportData,
} from "../../utils/export-utils";
import {
  getColumnSuggestions,
  type ImportDataType,
  type ImportFormat,
  type ImportOptions,
  type ImportResult,
  importFinancialData,
  type ParsedImportData,
  parseImportFile,
  validateAndTransformData,
} from "../../utils/import-utils";

type ImportExportDialogProps = {
  mode: "import" | "export";
  dataType?: "expenses" | "assets" | "reports" | "analytics";
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  trigger?: React.ReactNode;
};

const formatOptions: Array<{
  value: ExportFormat;
  label: string;
  icon: React.ComponentType<any>;
}> = [
  { value: "csv", label: "CSV", icon: FileText },
  { value: "excel", label: "Excel (XLSX)", icon: FileSpreadsheet },
  { value: "json", label: "JSON", icon: Database },
  { value: "pdf", label: "PDF Report", icon: FileImage },
];

const importFormatOptions: Array<{
  value: ImportFormat;
  label: string;
  icon: React.ComponentType<any>;
}> = [
  { value: "csv", label: "CSV", icon: FileText },
  { value: "excel", label: "Excel (XLSX)", icon: FileSpreadsheet },
  { value: "json", label: "JSON", icon: Database },
];

export function ImportExportDialog({
  mode,
  dataType = "expenses",
  onSuccess,
  onError,
  trigger,
}: ImportExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<
    "configure" | "preview" | "process" | "complete"
  >("configure");

  // Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "excel",
    includeMetadata: true,
    includeHeaders: true,
    reportTitle: "Financial Report",
  });

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: "csv",
    dataType: "expenses",
    skipErrors: false,
    validateOnly: false,
    batchSize: 50,
  });
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [validationResult, setValidationResult] = useState<ImportResult | null>(
    null
  );
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );

  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    setProgress(10);

    try {
      setProgress(30);

      let result: any;
      switch (dataType) {
        case "expenses":
          result = await exportExpenses(undefined, exportOptions);
          break;
        case "assets":
          result = await exportAssets(undefined, exportOptions);
          break;
        case "reports":
          result = await exportReports(undefined, exportOptions);
          break;
        default: {
          // Export combined data
          const mockData: FinancialExportData = {
            expenses: [],
            assets: [],
            metadata: {
              exportDate: new Date().toISOString(),
              exportedBy: "User",
              filters: {},
              totalRecords: 0,
              version: "1.0",
            },
          };
          result = await exportFinancialData(mockData, exportOptions);
        }
      }

      setProgress(100);

      if (result.success) {
        onSuccess?.(result);
        setCurrentStep("complete");
      } else {
        throw new Error(result.error || "Export failed");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Export failed";
      onError?.(errorMessage);
      setCurrentStep("configure");
    } finally {
      setIsProcessing(false);
    }
  }, [dataType, exportOptions, onSuccess, onError]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setImportFile(file);
      setIsProcessing(true);
      setProgress(20);

      try {
        const parsed = await parseImportFile(file, {
          format: importOptions.format,
        });
        setParsedData(parsed);

        // Auto-detect column mappings
        const suggestions = getColumnSuggestions(
          parsed.headers,
          importOptions.dataType
        );
        const autoMapping: Record<string, string> = {};
        for (const [field, possibleColumns] of Object.entries(suggestions)) {
          if (possibleColumns.length > 0) {
            autoMapping[field as keyof typeof autoMapping] =
              possibleColumns[0] as string;
          }
        }
        setColumnMapping(autoMapping);

        setProgress(60);

        // Validate data
        const validation = validateAndTransformData(parsed, {
          ...importOptions,
          columnMapping: autoMapping,
          validateOnly: true,
        });
        setValidationResult(validation);

        setProgress(100);
        setCurrentStep("preview");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "File parsing failed";
        onError?.(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [importOptions, onError]
  );

  const handleImport = useCallback(async () => {
    if (!(importFile && parsedData)) return;

    setIsProcessing(true);
    setCurrentStep("process");

    try {
      const result = await importFinancialData(importFile, {
        ...importOptions,
        columnMapping,
        validateOnly: false,
      });

      if (result.success) {
        onSuccess?.(result);
        setCurrentStep("complete");
      } else {
        setValidationResult(result);
        setCurrentStep("preview");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Import failed";
      onError?.(errorMessage);
      setCurrentStep("configure");
    } finally {
      setIsProcessing(false);
    }
  }, [
    importFile,
    parsedData,
    importOptions,
    columnMapping,
    onSuccess,
    onError,
  ]);

  const resetDialog = () => {
    setCurrentStep("configure");
    setIsProcessing(false);
    setProgress(0);
    setImportFile(null);
    setParsedData(null);
    setValidationResult(null);
    setColumnMapping({});
  };

  const renderExportConfig = () => (
    <div className="space-y-6">
      <div>
        <Label className="mb-3 block font-medium text-sm">Export Format</Label>
        <div className="grid grid-cols-2 gap-3">
          {formatOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                className={`cursor-pointer transition-colors ${
                  exportFormat === option.value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                key={option.value}
                onClick={() => {
                  setExportFormat(option.value);
                  setExportOptions((prev) => ({
                    ...prev,
                    format: option.value,
                  }));
                }}
              >
                <CardContent className="flex items-center space-x-3 p-4">
                  <Icon className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{option.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={exportOptions.includeMetadata}
            id="include-metadata"
            onCheckedChange={(checked) =>
              setExportOptions((prev) => ({
                ...prev,
                includeMetadata: checked as boolean,
              }))
            }
          />
          <Label className="text-sm" htmlFor="include-metadata">
            Include metadata and export details
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={exportOptions.includeHeaders}
            id="include-headers"
            onCheckedChange={(checked) =>
              setExportOptions((prev) => ({
                ...prev,
                includeHeaders: checked as boolean,
              }))
            }
          />
          <Label className="text-sm" htmlFor="include-headers">
            Include column headers
          </Label>
        </div>
      </div>

      {exportFormat === "pdf" && (
        <div className="space-y-4">
          <div>
            <Label className="font-medium text-sm" htmlFor="report-title">
              Report Title
            </Label>
            <Input
              id="report-title"
              onChange={(e) =>
                setExportOptions((prev) => ({
                  ...prev,
                  reportTitle: e.target.value,
                }))
              }
              placeholder="Enter report title"
              value={exportOptions.reportTitle || ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-medium text-sm" htmlFor="company-name">
                Company Name
              </Label>
              <Input
                id="company-name"
                onChange={(e) =>
                  setExportOptions((prev) => ({
                    ...prev,
                    companyInfo: {
                      ...prev.companyInfo,
                      name: e.target.value,
                      address: "",
                      phone: "",
                      email: "",
                    },
                  }))
                }
                placeholder="Your Company Name"
                value={exportOptions.companyInfo?.name || ""}
              />
            </div>
            <div>
              <Label className="font-medium text-sm" htmlFor="company-email">
                Email
              </Label>
              <Input
                id="company-email"
                onChange={(e) =>
                  setExportOptions((prev) => ({
                    ...prev,
                    companyInfo: {
                      ...prev.companyInfo,
                      email: e.target.value,
                      name: "",
                      address: "",
                      phone: "",
                    },
                  }))
                }
                placeholder="company@example.com"
                value={exportOptions.companyInfo?.email || ""}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderImportConfig = () => (
    <div className="space-y-6">
      <div>
        <Label className="mb-3 block font-medium text-sm">Data Type</Label>
        <Select
          onValueChange={(value) =>
            setImportOptions((prev) => ({
              ...prev,
              dataType: value as ImportDataType,
            }))
          }
          value={importOptions.dataType}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expenses">Expenses</SelectItem>
            <SelectItem value="assets">Assets</SelectItem>
            <SelectItem value="mixed">Mixed Data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-3 block font-medium text-sm">Upload File</Label>
        <div className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-6 text-center">
          <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-muted-foreground text-xs">
              Supported formats: CSV, Excel (.xlsx), JSON
            </p>
          </div>
          <Input
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            id="file-upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            type="file"
          />
          <Button
            className="mt-4"
            onClick={() => document.getElementById("file-upload")?.click()}
            variant="outline"
          >
            Choose File
          </Button>
        </div>
      </div>

      {importFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium">{importFile.name}</div>
                <div className="text-muted-foreground text-sm">
                  {(importFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <Button
                onClick={() => {
                  setImportFile(null);
                  setParsedData(null);
                  setValidationResult(null);
                  setCurrentStep("configure");
                }}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={importOptions.skipErrors}
            id="skip-errors"
            onCheckedChange={(checked) =>
              setImportOptions((prev) => ({
                ...prev,
                skipErrors: checked as boolean,
              }))
            }
          />
          <Label className="text-sm" htmlFor="skip-errors">
            Skip rows with errors and continue import
          </Label>
        </div>

        <div>
          <Label className="font-medium text-sm" htmlFor="batch-size">
            Batch Size
          </Label>
          <Select
            onValueChange={(value) =>
              setImportOptions((prev) => ({
                ...prev,
                batchSize: Number.parseInt(value, 10),
              }))
            }
            value={importOptions.batchSize?.toString() || "50"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 records</SelectItem>
              <SelectItem value="50">50 records</SelectItem>
              <SelectItem value="100">100 records</SelectItem>
              <SelectItem value="200">200 records</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderImportPreview = () => {
    if (!(parsedData && validationResult)) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">
                    {validationResult.successCount}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Valid Records
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium">
                    {validationResult.errorCount}
                  </div>
                  <div className="text-muted-foreground text-sm">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium">
                    {validationResult.warningCount}
                  </div>
                  <div className="text-muted-foreground text-sm">Warnings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {validationResult.errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Validation Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {validationResult.errors.slice(0, 20).map((error, index) => (
                    <div
                      className={`rounded p-2 text-sm ${
                        error.severity === "error"
                          ? "border border-red-200 bg-red-50 text-red-800"
                          : "border border-yellow-200 bg-yellow-50 text-yellow-800"
                      }`}
                      key={index.toString()}
                    >
                      <div className="font-medium">
                        Row {error.row}: {error.message}
                      </div>
                      {error.field && (
                        <div className="text-xs opacity-75">
                          Field: {error.field}
                        </div>
                      )}
                    </div>
                  ))}
                  {validationResult.errors.length > 20 && (
                    <div className="py-2 text-center text-muted-foreground text-sm">
                      ... and {validationResult.errors.length - 20} more issues
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Column Mapping</CardTitle>
            <CardDescription>
              Map your file columns to the correct fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(columnMapping).map((field) => (
                <div key={field}>
                  <Label className="font-medium text-sm capitalize">
                    {field.replace(/([A-Z])/g, " $1").toLowerCase()}
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setColumnMapping((prev) => ({ ...prev, [field]: value }))
                    }
                    value={columnMapping[field] || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {parsedData.headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProcessing = () => (
    <div className="space-y-6 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        {mode === "import" ? (
          <Upload className="h-8 w-8 animate-pulse text-primary" />
        ) : (
          <Download className="h-8 w-8 animate-pulse text-primary" />
        )}
      </div>
      <div>
        <h3 className="font-medium text-lg">
          {mode === "import" ? "Importing Data" : "Exporting Data"}
        </h3>
        <p className="text-muted-foreground">
          Please wait while we process your request...
        </p>
      </div>
      <div className="space-y-2">
        <Progress className="mx-auto w-full max-w-xs" value={progress} />
        <p className="text-muted-foreground text-sm">{progress}% complete</p>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h3 className="font-medium text-lg">
          {mode === "import" ? "Import Complete!" : "Export Complete!"}
        </h3>
        <p className="text-muted-foreground">
          {mode === "import"
            ? `Successfully imported ${validationResult?.successCount || 0} records.`
            : "Your file has been downloaded successfully."}
        </p>
      </div>
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </div>
  );

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            {mode === "import" ? (
              <Upload className="mr-2 h-4 w-4" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {mode === "import" ? "Import" : "Export"} Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "import" ? "Import" : "Export"} {dataType} Data
          </DialogTitle>
          <DialogDescription>
            {mode === "import"
              ? "Upload and import financial data from files"
              : "Export your financial data in various formats"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStep === "configure" && (
            <div>
              {mode === "import" ? renderImportConfig() : renderExportConfig()}
              <div className="mt-6 flex justify-end space-x-2">
                <Button onClick={resetDialog} variant="outline">
                  Cancel
                </Button>
                {mode === "import" ? (
                  <Button
                    disabled={!importFile}
                    onClick={() => importFile && handleFileUpload(importFile)}
                  >
                    Analyze File
                  </Button>
                ) : (
                  <Button disabled={isProcessing} onClick={handleExport}>
                    {isProcessing ? "Exporting..." : "Export"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {currentStep === "preview" && mode === "import" && (
            <div>
              {renderImportPreview()}
              <div className="mt-6 flex justify-between">
                <Button onClick={resetDialog} variant="outline">
                  Back
                </Button>
                <Button
                  disabled={
                    (validationResult?.errorCount &&
                      validationResult.errorCount > 0 &&
                      !importOptions.skipErrors) as boolean
                  }
                  onClick={handleImport}
                >
                  Import Data
                </Button>
              </div>
            </div>
          )}

          {currentStep === "process" && renderProcessing()}
          {currentStep === "complete" && renderComplete()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
