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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { format } from "date-fns";
import {
  Download,
  ExternalLink,
  Eye,
  FileImage,
  MoreHorizontal,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/shared/utils/format.util";

type Receipt = {
  id: string;
  filename: string;
  url: string;
  uploadDate: Date;
  expenseId?: string;
  amount?: number;
  vendor?: string;
  category?: string;
  size: number;
  mimeType: string;
  ocrProcessed: boolean;
  confidence?: number;
};

type ReceiptGalleryProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadNew: () => void;
};

// Mock data
const mockReceipts: Receipt[] = [
  {
    id: "1",
    filename: "receipt-home-depot.jpg",
    url: "/mock-receipt-1.jpg",
    uploadDate: new Date("2024-01-15"),
    expenseId: "exp_1",
    amount: 149.99,
    vendor: "Home Depot",
    category: "Maintenance",
    size: 2.1 * 1024 * 1024, // 2.1MB
    mimeType: "image/jpeg",
    ocrProcessed: true,
    confidence: 95,
  },
  {
    id: "2",
    filename: "utility-bill-jan.pdf",
    url: "/mock-receipt-2.pdf",
    uploadDate: new Date("2024-01-10"),
    expenseId: "exp_2",
    amount: 287.5,
    vendor: "City Utilities",
    category: "Utilities",
    size: 1.8 * 1024 * 1024, // 1.8MB
    mimeType: "application/pdf",
    ocrProcessed: true,
    confidence: 89,
  },
  {
    id: "3",
    filename: "office-supplies.png",
    url: "/mock-receipt-3.png",
    uploadDate: new Date("2024-01-08"),
    amount: 67.23,
    vendor: "Staples",
    category: "Office Supplies",
    size: 3.2 * 1024 * 1024, // 3.2MB
    mimeType: "image/png",
    ocrProcessed: false,
  },
  {
    id: "4",
    filename: "insurance-payment.jpg",
    url: "/mock-receipt-4.jpg",
    uploadDate: new Date("2024-01-05"),
    expenseId: "exp_4",
    amount: 1250.0,
    vendor: "State Farm",
    category: "Insurance",
    size: 1.5 * 1024 * 1024, // 1.5MB
    mimeType: "image/jpeg",
    ocrProcessed: true,
    confidence: 92,
  },
];

export function ReceiptGallery({
  isOpen,
  onClose,
  onUploadNew,
}: ReceiptGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredReceipts = mockReceipts.filter((receipt) => {
    const matchesSearch =
      receipt.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || receipt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (receipt: Receipt) => {
    // In a real implementation, this would download the file
    console.log("Downloading receipt:", receipt.filename);
    // window.open(receipt.url, '_blank');
  };

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
  };

  const handleDelete = (receipt: Receipt) => {
    // In a real implementation, this would delete the receipt
    console.log("Deleting receipt:", receipt.filename);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf") {
      return <FileImage className="h-8 w-8 text-red-500" />;
    }
    return <FileImage className="h-8 w-8 text-blue-500" />;
  };

  return (
    <>
      <Dialog onOpenChange={onClose} open={isOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileImage className="mr-2 h-5 w-5" />
              Receipt Gallery
            </DialogTitle>
            <DialogDescription>
              Manage and view all your uploaded receipts
            </DialogDescription>
          </DialogHeader>

          {/* Controls */}
          <div className="flex flex-col space-y-4 border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="w-64 pl-9"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search receipts..."
                    value={searchTerm}
                  />
                </div>
                <Select
                  onValueChange={setSelectedCategory}
                  value={selectedCategory}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Office Supplies">
                      Office Supplies
                    </SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={onUploadNew}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Receipt
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {filteredReceipts.length} receipt
                {filteredReceipts.length !== 1 ? "s" : ""} found
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setViewMode("grid")}
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "outline"}
                >
                  Grid
                </Button>
                <Button
                  onClick={() => setViewMode("list")}
                  size="sm"
                  variant={viewMode === "list" ? "default" : "outline"}
                >
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Receipt Gallery */}
          <div className="flex-1 overflow-y-auto">
            {filteredReceipts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileImage className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">
                  No receipts found
                </h3>
                <p className="mb-4 text-center text-muted-foreground">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search filters"
                    : "Upload your first receipt to get started"}
                </p>
                <Button onClick={onUploadNew}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Receipt
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredReceipts.map((receipt) => (
                  <Card
                    className="transition-shadow hover:shadow-md"
                    key={receipt.id}
                  >
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(receipt.mimeType)}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-sm">
                              {receipt.filename}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatFileSize(receipt.size)}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleView(receipt)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownload(receipt)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(receipt)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {receipt.vendor && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs">
                              Vendor:
                            </span>
                            <span className="font-medium text-xs">
                              {receipt.vendor}
                            </span>
                          </div>
                          {receipt.amount && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-xs">
                                Amount:
                              </span>
                              <span className="font-medium text-xs">
                                {formatCurrency(receipt.amount)}
                              </span>
                            </div>
                          )}
                          {receipt.category && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-xs">
                                Category:
                              </span>
                              <Badge className="text-xs" variant="secondary">
                                {receipt.category}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t pt-3">
                        <span className="text-muted-foreground text-xs">
                          {format(receipt.uploadDate, "MMM d, yyyy")}
                        </span>
                        {receipt.ocrProcessed && (
                          <Badge
                            variant={
                              receipt.confidence && receipt.confidence > 85
                                ? "default"
                                : "secondary"
                            }
                          >
                            OCR: {receipt.confidence}%
                          </Badge>
                        )}
                      </div>

                      {receipt.expenseId && (
                        <div className="mt-2">
                          <Badge className="text-xs" variant="outline">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Linked to expense
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <div className="space-y-2">
                  {filteredReceipts.map((receipt) => (
                    <Card key={receipt.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 flex-1 items-center space-x-4">
                            {getFileIcon(receipt.mimeType)}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-sm">
                                {receipt.filename}
                              </p>
                              <div className="mt-1 flex items-center space-x-4 text-muted-foreground text-xs">
                                <span>{formatFileSize(receipt.size)}</span>
                                <span>
                                  {format(receipt.uploadDate, "MMM d, yyyy")}
                                </span>
                                {receipt.vendor && (
                                  <span>{receipt.vendor}</span>
                                )}
                                {receipt.amount && (
                                  <span>{formatCurrency(receipt.amount)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {receipt.category && (
                              <Badge className="text-xs" variant="secondary">
                                {receipt.category}
                              </Badge>
                            )}
                            {receipt.ocrProcessed && (
                              <Badge
                                variant={
                                  receipt.confidence && receipt.confidence > 85
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                OCR: {receipt.confidence}%
                              </Badge>
                            )}
                            {receipt.expenseId && (
                              <Badge className="text-xs" variant="outline">
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Linked
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleView(receipt)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownload(receipt)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(receipt)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Modal */}
      <Dialog
        onOpenChange={() => setSelectedReceipt(null)}
        open={!!selectedReceipt}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
            <DialogDescription>{selectedReceipt?.filename}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-8">
            {selectedReceipt?.mimeType === "application/pdf" ? (
              <div className="text-center">
                <FileImage className="mx-auto mb-4 h-16 w-16 text-red-500" />
                <p className="mb-4 text-muted-foreground">
                  PDF Preview not available
                </p>
                <Button onClick={() => handleDownload(selectedReceipt)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download to View
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <FileImage className="mx-auto mb-4 h-16 w-16 text-blue-500" />
                <p className="mb-4 text-muted-foreground">
                  Image preview would appear here
                </p>
                <div className="space-x-2">
                  <Button
                    onClick={() => handleDownload(selectedReceipt as Receipt)}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
