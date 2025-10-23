"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Progress } from "@kaa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  useDeleteContractDocument,
  useUploadContractDocument,
} from "../../contract.queries";
import type { Contract, ContractDocument } from "../../contract.type";

// Mock documents for demo
const mockDocuments: ContractDocument[] = [
  {
    name: "Rental Agreement.pdf",
    url: "/documents/rental-agreement.pdf",
    type: "contract",
    uploadedAt: "2025-01-15T10:30:00Z",
    uploadedBy: "user123",
    fileSize: 245_760,
    mimeType: "application/pdf",
    description: "Main rental agreement document",
  },
  {
    name: "Property Inspection Report.pdf",
    url: "/documents/inspection-report.pdf",
    type: "addendum",
    uploadedAt: "2025-01-10T14:20:00Z",
    uploadedBy: "user456",
    fileSize: 1_024_000,
    mimeType: "application/pdf",
    description: "Initial property condition report",
  },
  {
    name: "Tenant ID Copy.jpg",
    url: "/documents/tenant-id.jpg",
    type: "other",
    uploadedAt: "2025-01-08T09:15:00Z",
    uploadedBy: "user789",
    fileSize: 512_000,
    mimeType: "image/jpeg",
    description: "Copy of tenant identification document",
  },
];

type DocumentManagerProps = {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
};

type FileUploadData = {
  file: File;
  type: ContractDocument["type"];
  description: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
};

export function DocumentManager({
  contract,
  open,
  onClose,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<ContractDocument[]>(mockDocuments);
  const [uploading, setUploading] = useState<FileUploadData[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<ContractDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const uploadMutation = useUploadContractDocument();
  const deleteMutation = useDeleteContractDocument();

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: FileUploadData[] = acceptedFiles.map((file) => ({
      file,
      type: "other",
      description: "",
      progress: 0,
      status: "pending",
    }));

    setUploading((prev) => [...prev, ...newUploads]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  if (!contract) return null;

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <FileImage className="h-4 w-4" />;
    }
    if (mimeType === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    }
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return <FileSpreadsheet className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  // Format date
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Get document type badge variant
  const getDocumentTypeBadge = (type: ContractDocument["type"]) => {
    switch (type) {
      case "contract":
        return "default";
      case "addendum":
      case "amendment":
        return "secondary";
      case "termination":
        return "destructive";
      case "renewal":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Upload file
  const uploadFile = async (uploadData: FileUploadData, index: number) => {
    try {
      setUploading((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, status: "uploading" } : item
        )
      );

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setUploading((prev) =>
          prev.map((item, i) => (i === index ? { ...item, progress } : item))
        );
      }

      const response = await uploadMutation.mutateAsync({
        contractId: contract._id,
        file: uploadData.file,
        documentType: uploadData.type,
        description: uploadData.description,
      });

      // Add to documents list
      setDocuments((prev) => [...prev, response.document]);

      // Remove from uploading
      setUploading((prev) => prev.filter((_, i) => i !== index));

      toast.success("Document uploaded successfully!");
    } catch (error) {
      setUploading((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, status: "error" } : item
        )
      );

      toast.error("Failed to upload document. Please try again.");
    }
  };

  // Delete document
  const deleteDocument = async (document: ContractDocument) => {
    try {
      await deleteMutation.mutateAsync({
        contractId: contract._id,
        documentId: document.url, // Using URL as ID for demo
      });

      setDocuments((prev) => prev.filter((doc) => doc.url !== document.url));
      toast.success("Document deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete document. Please try again.");
    }
  };

  // View document
  const viewDocument = (document: ContractDocument) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  // Download document
  const downloadDocument = (document: ContractDocument) => {
    // Create a temporary anchor element to trigger download
    const link = window.document.createElement("a");
    link.href = document.url;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);

    toast.success("Document download started!");
  };

  // Filter documents
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog onOpenChange={onClose} open={open}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Manager
            </DialogTitle>
            <DialogDescription>
              Contract #{contract._id.slice(-8)} - Manage contract documents and
              files
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Drag and drop files or click to browse. Max file size: 10MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="font-medium text-primary">
                      Drop the files here...
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium">
                        Drag & drop files here, or click to select
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Supports PDF, Word documents, and images
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Queue */}
                {uploading.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium">Uploading Files</h4>
                    {uploading.map((upload, index) => (
                      <div
                        className="space-y-3 rounded-lg border p-4"
                        key={index.toString()}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getFileIcon(upload.file.type)}
                            <div>
                              <div className="font-medium">
                                {upload.file.name}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {formatFileSize(upload.file.size)}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setUploading((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <Label className="text-sm">Document Type</Label>
                            <Select
                              onValueChange={(
                                value: ContractDocument["type"]
                              ) => {
                                setUploading((prev) =>
                                  prev.map((item, i) =>
                                    i === index
                                      ? { ...item, type: value }
                                      : item
                                  )
                                );
                              }}
                              value={upload.type}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="contract">
                                  Contract
                                </SelectItem>
                                <SelectItem value="addendum">
                                  Addendum
                                </SelectItem>
                                <SelectItem value="amendment">
                                  Amendment
                                </SelectItem>
                                <SelectItem value="termination">
                                  Termination
                                </SelectItem>
                                <SelectItem value="renewal">Renewal</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm">Description</Label>
                            <Input
                              className="mt-1"
                              onChange={(e) => {
                                setUploading((prev) =>
                                  prev.map((item, i) =>
                                    i === index
                                      ? { ...item, description: e.target.value }
                                      : item
                                  )
                                );
                              }}
                              placeholder="Document description..."
                              value={upload.description}
                            />
                          </div>
                        </div>

                        {upload.status === "uploading" && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Uploading...</span>
                              <span>{upload.progress}%</span>
                            </div>
                            <Progress value={upload.progress} />
                          </div>
                        )}

                        {upload.status === "error" && (
                          <div className="text-destructive text-sm">
                            Upload failed. Please try again.
                          </div>
                        )}

                        {upload.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              disabled={
                                !upload.type || upload.status === "pending"
                              }
                              onClick={() => uploadFile(upload, index)}
                              size="sm"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      {filteredDocuments.length} document(s) found
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search documents..."
                      value={searchTerm}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((document, index) => (
                      <div
                        className="flex items-center justify-between rounded-lg border p-4"
                        key={index.toString()}
                      >
                        <div className="flex items-center gap-4">
                          <div className="shrink-0">
                            {getFileIcon(document.mimeType || "")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="truncate font-medium">
                                {document.name}
                              </h4>
                              <Badge
                                variant={getDocumentTypeBadge(document.type)}
                              >
                                {document.type}
                              </Badge>
                            </div>
                            <p className="mt-1 text-muted-foreground text-sm">
                              {document.description}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-muted-foreground text-xs">
                              <span>
                                {formatFileSize(document.fileSize || 0)}
                              </span>
                              <span>•</span>
                              <span>{formatDate(document.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => viewDocument(document)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => downloadDocument(document)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteDocument(document)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <FileText className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                      <h3 className="font-medium">No documents found</h3>
                      <p className="text-muted-foreground text-sm">
                        {searchTerm
                          ? "Try adjusting your search terms."
                          : "Upload your first document to get started."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog onOpenChange={setViewerOpen} open={viewerOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocument && getFileIcon(selectedDocument.mimeType || "")}
              {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 rounded-lg bg-muted/50 p-4">
            {selectedDocument?.mimeType?.startsWith("image/") ? (
              // biome-ignore lint/nursery/useImageSize: ignore
              // biome-ignore lint/performance/noImgElement: ignore
              <img
                alt={selectedDocument.name}
                className="mx-auto max-h-[60vh] max-w-full object-contain"
                src={selectedDocument.url}
              />
            ) : selectedDocument?.mimeType === "application/pdf" ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">
                  PDF preview not available. Click download to view the
                  document.
                </p>
                <Button
                  onClick={() =>
                    selectedDocument && downloadDocument(selectedDocument)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <File className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">
                  Preview not available for this file type.
                </p>
                <Button
                  onClick={() =>
                    selectedDocument && downloadDocument(selectedDocument)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setViewerOpen(false)} variant="outline">
              Close
            </Button>
            {selectedDocument && (
              <Button onClick={() => downloadDocument(selectedDocument)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
