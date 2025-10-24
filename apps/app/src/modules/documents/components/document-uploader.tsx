import { Alert, AlertDescription, AlertTitle } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { AlertCircle, Camera, type File, Info, Upload, X } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useUploadDocument } from "../document.queries";
import { useDocumentStore } from "../document.store";
import {
  DocumentCategory,
  DocumentPriority,
  type DocumentUploadInput,
} from "../document.type";
import {
  formatFileSize,
  getCategoryDisplayName,
  getDocumentIcon,
} from "../utils/document-utils";
import {
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  getFileTypeRecommendations,
  validateBatchUpload,
  validateDocumentUpload,
} from "../utils/validation-utils";

type DocumentUploaderProps = {
  category?: DocumentCategory;
  onUpload?: (files: File[]) => void;
  onSuccess?: (documentId: string) => void;
  onError?: (error: Error) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  allowBatch?: boolean;
  showPreview?: boolean;
  showMetadata?: boolean;
  autoVerify?: boolean;
  setAutoVerify?: (autoVerify: boolean) => void;
  enableDragAndDrop?: boolean;
  className?: string;
};

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  validationErrors?: string[];
  metadata?: {
    name?: string;
    description?: string;
    expiryDate?: string;
    tags?: string[];
    priority?: DocumentPriority;
  };
}

/*
// Basic usage
<DocumentUploader />

// With specific category and callbacks
<DocumentUploader
  category={DocumentCategory.IDENTITY}
  onSuccess={(id) => console.log('Document uploaded:', id)}
  onError={(error) => console.error('Upload failed:', error)}
  allowBatch={true}
  maxFiles={10}
/>

// Simplified version without metadata
<DocumentUploader
  showMetadata={false}
  showPreview={false}
  autoVerify={false}
/>
*/
export function DocumentUploader({
  category = DocumentCategory.GENERAL,
  onUpload,
  onSuccess,
  onError,
  maxFiles = 5,
  acceptedFileTypes,
  maxFileSize,
  allowBatch = false,
  showMetadata = true,
  autoVerify = true,
  enableDragAndDrop = true,
  className,
  setAutoVerify,
}: DocumentUploaderProps) {
  // State
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [currentCategory, setCurrentCategory] =
    useState<DocumentCategory>(category);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Hooks
  const { mutateAsync: uploadDocument, isPending } = useUploadDocument();
  const { setUploadModalOpen, setUploadProgress: setStoreProgress } =
    useDocumentStore();

  // Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Get recommendations for current category
  const recommendations = getFileTypeRecommendations(currentCategory);
  const allowedTypes = acceptedFileTypes || ALLOWED_FILE_TYPES[currentCategory];
  const fileSizeLimit = maxFileSize || FILE_SIZE_LIMITS[currentCategory];

  // Handle file drop and selection
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(
          ({ file, errors }) =>
            `${file.name}: ${errors.map((e: any) => e.message).join(", ")}`
        );
        setValidationErrors((prev) => [...prev, ...errors]);
      }

      // Process accepted files
      const newFiles: FileWithPreview[] = acceptedFiles.map((file, index) => {
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          id: `${Date.now()}-${index}`,
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          validationErrors: [],
          metadata: {
            // biome-ignore lint/performance/useTopLevelRegex: ignore
            name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            description: "",
            expiryDate: "",
            tags: [],
            priority: DocumentPriority.NORMAL,
          },
        });
        return fileWithPreview;
      });

      // Validate files
      if (allowBatch && newFiles.length > 1) {
        const validation = validateBatchUpload(
          newFiles,
          currentCategory,
          maxFiles
        );
        if (!validation.isValid) {
          setValidationErrors(validation.errors.map((e) => e.message));
          return;
        }
        if (validation.warnings) {
          setValidationWarnings(validation.warnings);
        }
      }

      // Check file limits
      if (files.length + newFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setFiles((prev) => [...prev, ...newFiles]);
      setValidationErrors([]);

      // Call onUpload callback if provided
      if (onUpload) {
        onUpload(newFiles);
      }
    },
    [files, currentCategory, maxFiles, allowBatch, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce(
      (acc, type) => {
        if (type.endsWith("/*")) {
          acc[type] = [];
        } else {
          acc[type] = [];
        }
        return acc;
      },
      {} as Record<string, string[]>
    ),
    maxSize: fileSizeLimit,
    multiple: allowBatch,
    disabled: isPending || !enableDragAndDrop,
  });

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      // Revoke preview URL to prevent memory leaks
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  }, []);

  // Update file metadata
  const updateFileMetadata = useCallback(
    (fileId: string, metadata: Partial<FileWithPreview["metadata"]>) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId
            ? { ...file, metadata: { ...file.metadata, ...metadata } }
            : file
        )
      );
    },
    []
  );

  // Handle camera capture
  const handleCameraCapture = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, []);

  const handleCameraInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onDrop([file], []);
      }
    },
    [onDrop]
  );

  // Upload files
  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    const errors: string[] = [];
    const uploadedIds: string[] = [];

    try {
      for (const file of files) {
        const uploadInput: DocumentUploadInput = {
          file,
          category: currentCategory,
          name: file.metadata?.name,
          description: file.metadata?.description,
          expiryDate: file.metadata?.expiryDate,
          tags: file.metadata?.tags,
          priority: file.metadata?.priority,
          autoVerify,
        };

        // Validate individual file
        const validation = validateDocumentUpload(uploadInput);
        if (!validation.isValid) {
          errors.push(
            `${file.name}: ${validation.errors.map((e) => e.message).join(", ")}`
          );
          continue;
        }

        // Set upload progress
        setUploadProgress((prev) => ({ ...prev, [file.id]: 0 }));
        setStoreProgress(file.id, 0);

        try {
          const response = await uploadDocument(uploadInput);

          setUploadProgress((prev) => ({ ...prev, [file.id]: 100 }));
          setStoreProgress(file.id, 100);

          if (response.data) {
            uploadedIds.push(response.data._id);
            onSuccess?.(response.data._id);
          }
        } catch (uploadError) {
          errors.push(
            `${file.name}: ${uploadError instanceof Error ? uploadError.message : "Upload failed"}`
          );
          onError?.(
            uploadError instanceof Error
              ? uploadError
              : new Error("Upload failed")
          );
        }
      }

      // Show results
      if (uploadedIds.length > 0) {
        toast.success(
          `${uploadedIds.length} document(s) uploaded successfully`
        );

        // Clear files and close dialog
        setFiles([]);
        setUploadProgress({});
        setIsDialogOpen(false);
        setUploadModalOpen(false);
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
      }
    } catch (error) {
      toast.error("Upload failed");
      onError?.(error instanceof Error ? error : new Error("Upload failed"));
    }
  }, [
    files,
    currentCategory,
    autoVerify,
    uploadDocument,
    onSuccess,
    onError,
    setStoreProgress,
    setUploadModalOpen,
  ]);

  // File drag and drop reordering
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = Number.parseInt(e.dataTransfer.getData("text/plain"), 10);

    if (dragIndex !== dropIndex) {
      setFiles((prev) => {
        const newFiles = [...prev];
        const [draggedFile] = newFiles.splice(dragIndex, 1);
        if (draggedFile) {
          newFiles.splice(dropIndex, 0, draggedFile);
        }
        return newFiles;
      });
    }

    setDraggedOverIndex(null);
  }, []);

  return (
    <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
      <DialogTrigger asChild>
        <Button className={className} onClick={() => setIsDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload and manage your{" "}
            {getCategoryDisplayName(currentCategory).toLowerCase()} documents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <div>
            <Label>Document Category</Label>
            <Select
              disabled={isPending}
              onValueChange={(value) =>
                setCurrentCategory(value as DocumentCategory)
              }
              value={currentCategory}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DocumentCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryDisplayName(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Type Recommendations */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Recommended File Types</AlertTitle>
            <AlertDescription>
              {recommendations.description}
              <div className="mt-2 flex flex-wrap gap-1">
                {recommendations.recommended.map((type) => (
                  <Badge className="text-xs" key={type} variant="secondary">
                    {type?.split("/")[1]?.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            } ${isPending ? "pointer-events-none opacity-50" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-lg">
                  {isDragActive ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-muted-foreground text-sm">
                  or click to select files
                </p>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span>Max size: {formatFileSize(fileSizeLimit)}</span>
                {allowBatch && <span>Max files: {maxFiles}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCameraCapture();
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
                <input
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleCameraInput}
                  ref={cameraInputRef}
                  type="file"
                />
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-inside list-disc space-y-1">
                  {validationErrors.map((error, index) => (
                    <li className="text-sm" key={index.toString()}>
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Recommendations</AlertTitle>
              <AlertDescription>
                <ul className="list-inside list-disc space-y-1">
                  {validationWarnings.map((warning, index) => (
                    <li className="text-sm" key={index.toString()}>
                      {warning}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* File Previews */}
          {files.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-lg">
                  Selected Files ({files.length})
                </h3>
                <Button
                  disabled={isPending}
                  onClick={() => setFiles([])}
                  size="sm"
                  variant="outline"
                >
                  Clear All
                </Button>
              </div>
              <div className="max-h-60 space-y-3 overflow-auto">
                {files.map((file, index) => (
                  <FilePreview
                    currentCategory={currentCategory}
                    draggedOverIndex={draggedOverIndex}
                    file={file}
                    handleDragOver={handleDragOver}
                    handleDragStart={handleDragStart}
                    handleDrop={handleDrop}
                    index={index}
                    isPending={isPending}
                    key={file.id}
                    removeFile={removeFile}
                    showMetadata={showMetadata}
                    updateFileMetadata={updateFileMetadata}
                    uploadProgress={uploadProgress}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upload Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <label className="flex items-center gap-2">
                <input
                  checked={autoVerify}
                  disabled={isPending}
                  onChange={(e) => {
                    setAutoVerify?.(e.target.checked);
                  }}
                  type="checkbox"
                />
                Auto-verify documents
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                disabled={isPending}
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={files.length === 0 || isPending}
                onClick={handleUpload}
              >
                {isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {files.length > 0 && `(${files.length})`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Preview component
const FilePreview = ({
  file,
  index,
  draggedOverIndex,
  handleDragOver,
  handleDragStart,
  handleDrop,
  currentCategory,
  isPending,
  removeFile,
  updateFileMetadata,
  uploadProgress,
  showMetadata,
}: {
  file: FileWithPreview;
  index: number;
  draggedOverIndex: number | null;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  currentCategory: DocumentCategory;
  isPending: boolean;
  removeFile: (fileId: string) => void;
  updateFileMetadata: (
    fileId: string,
    metadata: Partial<FileWithPreview["metadata"]>
  ) => void;
  uploadProgress: Record<string, number>;
  showMetadata: boolean;
}) => (
  <div
    className={`relative rounded-lg border bg-card p-3 ${
      draggedOverIndex === index
        ? "border-primary bg-primary/5"
        : "border-border"
    }`}
    draggable
    onDragOver={(e) => handleDragOver(e, index)}
    onDragStart={(e) => handleDragStart(e, index)}
    onDrop={(e) => handleDrop(e, index)}
  >
    <div className="flex items-start gap-3">
      {/* File Icon/Preview */}
      <div className="shrink-0">
        {file.preview ? (
          <Image
            alt={file.name}
            className="h-12 w-12 rounded border object-cover"
            height={48}
            src={file.preview}
            width={48}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
            <span className="text-lg">
              {getDocumentIcon(file.type, currentCategory)}
            </span>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <p className="truncate font-medium text-sm" title={file.name}>
            {file.name}
          </p>
          <Button
            disabled={isPending}
            onClick={() => removeFile(file.id)}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-2 text-muted-foreground text-xs">
          {formatFileSize(file.size)} • {file.type}
        </div>

        {/* Upload Progress */}
        {uploadProgress[file.id] !== undefined && (
          <div className="mb-2">
            <Progress className="h-1" value={uploadProgress[file.id]} />
            <p className="mt-1 text-muted-foreground text-xs">
              {uploadProgress[file.id]}% uploaded
            </p>
          </div>
        )}

        {/* Metadata Form */}
        {showMetadata && (
          <div className="space-y-2 border-t pt-2">
            <div>
              <Label className="text-xs" htmlFor={`name-${file.id}`}>
                Name
              </Label>
              <Input
                className="h-7 text-xs"
                disabled={isPending}
                id={`name-${file.id}`}
                onChange={(e) =>
                  updateFileMetadata(file.id, { name: e.target.value })
                }
                placeholder="Document name"
                value={file.metadata?.name || ""}
              />
            </div>

            {currentCategory === DocumentCategory.IDENTITY && (
              <div>
                <Label className="text-xs" htmlFor={`expiry-${file.id}`}>
                  Expiry Date
                </Label>
                <Input
                  className="h-7 text-xs"
                  disabled={isPending}
                  id={`expiry-${file.id}`}
                  onChange={(e) =>
                    updateFileMetadata(file.id, {
                      expiryDate: e.target.value,
                    })
                  }
                  type="date"
                  value={file.metadata?.expiryDate || ""}
                />
              </div>
            )}

            <div>
              <Label className="text-xs" htmlFor={`description-${file.id}`}>
                Description
              </Label>
              <Textarea
                className="h-16 resize-none text-xs"
                disabled={isPending}
                id={`description-${file.id}`}
                onChange={(e) =>
                  updateFileMetadata(file.id, { description: e.target.value })
                }
                placeholder="Brief description (optional)"
                value={file.metadata?.description || ""}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor={`tags-${file.id}`}>
                Tags
              </Label>
              <Input
                className="h-7 text-xs"
                disabled={isPending}
                id={`tags-${file.id}`}
                onChange={(e) =>
                  updateFileMetadata(file.id, {
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="tag1, tag2, tag3"
                value={file.metadata?.tags?.join(", ") || ""}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor={`priority-${file.id}`}>
                Priority
              </Label>
              <Select
                disabled={isPending}
                onValueChange={(value) =>
                  updateFileMetadata(file.id, {
                    priority: Number.parseInt(value, 10) as DocumentPriority,
                  })
                }
                value={
                  file.metadata?.priority?.toString() ||
                  DocumentPriority.NORMAL.toString()
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DocumentPriority.LOW.toString()}>
                    Low Priority
                  </SelectItem>
                  <SelectItem value={DocumentPriority.NORMAL.toString()}>
                    Normal Priority
                  </SelectItem>
                  <SelectItem value={DocumentPriority.HIGH.toString()}>
                    High Priority
                  </SelectItem>
                  <SelectItem value={DocumentPriority.URGENT.toString()}>
                    Urgent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
