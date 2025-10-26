import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  Camera,
  Check,
  FileImage,
  Loader2,
  RefreshCw,
  Scan,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useCreateExpense } from "../../financials.queries";
import type { CreateExpenseRequest } from "../../financials.type";

type ReceiptUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
};

type OCRResult = {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  confidence: number;
};

export function ReceiptUploadModal({
  isOpen,
  onClose,
  propertyId,
}: ReceiptUploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [currentStep, setCurrentStep] = useState<
    "upload" | "review" | "confirm"
  >("upload");
  const [extractedData, setExtractedData] = useState<
    Partial<CreateExpenseRequest>
  >({});

  const { mutate: createExpense, isPending: isCreating } = useCreateExpense();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(
      (file) =>
        file.type.startsWith("image/") || file.type === "application/pdf"
    );

    if (imageFiles.length !== acceptedFiles.length) {
      toast.error("Only image files and PDFs are accepted");
    }

    setUploadedFiles((prev) => [...prev, ...imageFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processReceipts = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one receipt");
      return;
    }

    setIsProcessing(true);
    try {
      // Mock OCR processing - in real implementation, this would call your OCR service
      const mockOCRResults: OCRResult[] = uploadedFiles.map((file, index) => ({
        vendor: `Vendor ${index + 1}`,
        amount: Math.round((Math.random() * 500 + 50) * 100) / 100,
        date: new Date().toISOString().split("T")[0] || "",
        category:
          ["Maintenance", "Utilities", "Office Supplies", "Travel"][
            Math.floor(Math.random() * 4)
          ] || "",
        description: `Expense from ${file.name}`,
        confidence: Math.round((Math.random() * 30 + 70) * 100) / 100, // 70-100%
      }));

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setOcrResults(mockOCRResults);

      // Set extracted data from first receipt for form
      const firstResult = mockOCRResults[0];
      setExtractedData({
        amount: firstResult?.amount,
        description: firstResult?.description,
        category: firstResult?.category,
        date: new Date(firstResult?.date || "").toISOString(),
        vendor: { name: firstResult?.vendor, contact: "" } as {
          name: string;
          contact: string;
          vatNumber?: string;
        },
        property: propertyId,
      });

      setCurrentStep("review");
      toast.success("Receipt processed successfully!");
    } catch (error) {
      console.error("OCR processing failed:", error);
      toast.error("Failed to process receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateExpense = () => {
    if (!(extractedData.amount && extractedData.description)) {
      toast.error("Please fill in required fields");
      return;
    }

    createExpense(
      {
        amount: extractedData.amount,
        description: extractedData.description || "",
        category: extractedData.category || "Other",
        date: extractedData.date || new Date().toISOString(),
        vendor: extractedData.vendor,
        property: extractedData.property,
        // receipt: {
        // 	url: "mock-receipt-url", // Would be actual uploaded file URL
        // 	filename: "mock-receipt-filename",
        // 	uploadedAt: new Date().toISOString(),
        // },
      },
      {
        onSuccess: () => {
          toast.success("Expense created successfully!");
          handleClose();
        },
        onError: () => {
          toast.error("Failed to create expense");
        },
      }
    );
  };

  const handleClose = () => {
    setUploadedFiles([]);
    setOcrResults([]);
    setExtractedData({});
    setCurrentStep("upload");
    onClose();
  };

  const retryOCR = () => {
    setCurrentStep("upload");
    setOcrResults([]);
    processReceipts();
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Upload Receipt
          </DialogTitle>
          <DialogDescription>
            Upload receipt images and we'll automatically extract expense
            details using OCR
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm",
                currentStep === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              1
            </div>
            <span
              className={cn(
                "text-sm",
                currentStep === "upload"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Upload
            </span>
          </div>
          <div className="mx-4 h-px flex-1 bg-border" />
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm",
                currentStep === "review"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              2
            </div>
            <span
              className={cn(
                "text-sm",
                currentStep === "review"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Review
            </span>
          </div>
          <div className="mx-4 h-px flex-1 bg-border" />
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm",
                currentStep === "confirm"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              3
            </div>
            <span
              className={cn(
                "text-sm",
                currentStep === "confirm"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Confirm
            </span>
          </div>
        </div>

        {currentStep === "upload" && (
          <div className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardContent className="pt-6">
                <div
                  {...getRootProps()}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-medium text-lg">
                    {isDragActive ? "Drop files here" : "Drag & drop receipts"}
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Or click to select files from your device
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Supports: PNG, JPG, JPEG, GIF, WebP, PDF (max 10MB)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="mb-4 font-medium">
                    Uploaded Files ({uploadedFiles.length})
                  </h4>
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div
                        className="flex items-center justify-between rounded-lg bg-muted p-3"
                        key={file.name}
                      >
                        <div className="flex items-center space-x-3">
                          <FileImage className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeFile(index)}
                          size="sm"
                          variant="ghost"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={uploadedFiles.length === 0 || isProcessing}
                onClick={processReceipts}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Process Receipts
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {currentStep === "review" && (
          <div className="space-y-6">
            {/* OCR Results */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-medium">Extracted Information</h4>
                  <Button onClick={retryOCR} size="sm" variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry OCR
                  </Button>
                </div>

                {ocrResults.map((result, index) => (
                  <div
                    className="mb-4 rounded-lg border p-4"
                    key={result.vendor}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h5 className="font-medium">Receipt {index + 1}</h5>
                      <Badge
                        variant={
                          result.confidence > 85 ? "default" : "secondary"
                        }
                      >
                        {result.confidence}% confidence
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Vendor:</span>
                        <span className="ml-2 font-medium">
                          {result.vendor}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="ml-2 font-medium">
                          ${result.amount}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <span className="ml-2 font-medium">{result.date}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <span className="ml-2 font-medium">
                          {result.category}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">
                        Description:
                      </span>
                      <p className="mt-1 text-sm">{result.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Edit Form */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="mb-4 font-medium">Edit Expense Details</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      onChange={(e) =>
                        setExtractedData((prev) => ({
                          ...prev,
                          amount: Number.parseFloat(e.target.value),
                        }))
                      }
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={extractedData.amount || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input
                      id="vendor"
                      onChange={(e) =>
                        setExtractedData((prev) => ({
                          ...prev,
                          vendor: { name: e.target.value, contact: "" },
                        }))
                      }
                      placeholder="Vendor name"
                      value={extractedData.vendor?.name || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      onValueChange={(value) =>
                        setExtractedData((prev) => ({
                          ...prev,
                          category: value,
                        }))
                      }
                      value={extractedData.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Property Tax">
                          Property Tax
                        </SelectItem>
                        <SelectItem value="Office Supplies">
                          Office Supplies
                        </SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      onChange={(e) =>
                        setExtractedData((prev) => ({
                          ...prev,
                          date: new Date(e.target.value).toISOString(),
                        }))
                      }
                      type="date"
                      value={
                        new Date(extractedData.date || "")
                          ?.toISOString()
                          .split("T")[0] || ""
                      }
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    onChange={(e) =>
                      setExtractedData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Expense description"
                    rows={3}
                    value={extractedData.description || ""}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setCurrentStep("upload")}
                variant="outline"
              >
                Back
              </Button>
              <Button disabled={isCreating} onClick={handleCreateExpense}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Expense
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
