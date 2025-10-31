"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import {
  Download,
  Eye,
  Filter,
  Grid,
  List,
  Plus,
  Search,
  Trash,
  Upload,
} from "lucide-react";
// import { motion } from "motion/react";
import React, { useState } from "react";
import { toast } from "sonner";
import { dialog } from "@/components/common/dialoger/state";
import ErrorBoundary from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { Shell } from "@/components/shell";
import { DataTableSkeleton } from "@/components/ui/data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "@/components/ui/data-table/feature-flags-provider";
import {
  type FileCategory,
  FileEditModal,
  type FileStatus,
  type FileType,
  FileUploader,
  FileViewerModal,
  useDeleteFile,
  useFileStore,
  useFiles,
  useUserFiles,
} from "@/modules/files";
import { FilesTable } from "@/modules/files/table";
import AttachmentsCarousel from "@/modules/files/upload/carousel";

type SearchParams = {
  status: FileStatus;
  page: number;
  perPage: number;
};

type FilesPageProps = {
  searchParams: Promise<SearchParams>;
};

export default function FilesPage(props: FilesPageProps) {
  const searchParams = React.use(props.searchParams);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    FileCategory | "all"
  >("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [selectedViewFiles, setSelectedViewFiles] = useState<FileType[]>([]);

  const {
    selectedFiles,
    viewMode,
    setViewMode,
    toggleFileSelection,
    clearSelectedFiles,
    selectedCount,
  } = useFileStore();

  const { data: filesData, isLoading, error } = useUserFiles();
  const { mutateAsync: deleteFile } = useDeleteFile();

  // Parse search params directly since we don't have searchParamsCache
  const search = {
    status: searchParams.status,
    page: Number(searchParams.page) || 1,
    perPage: Number(searchParams.perPage) || 10,
  };

  const { data } = useFiles({
    page: search.page,
    limit: search.perPage,
  });

  const files = filesData?.files || [];

  // Filter files based on search query and category
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      searchQuery === "" ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      file.mimeType.startsWith(
        selectedCategory === "image"
          ? "image/"
          : selectedCategory === "video"
            ? "video/"
            : selectedCategory === "audio"
              ? "audio/"
              : selectedCategory === "document"
                ? "application/"
                : ""
      );

    return matchesSearch && matchesCategory;
  });

  const handleFileSelect = (file: FileType) => {
    toggleFileSelection(file._id);
    setSelectedViewFiles([...selectedViewFiles, file]);
  };

  const handleSelectAll = () => {
    if (selectedCount() === filteredFiles.length) {
      clearSelectedFiles();
    } else {
      useFileStore.getState().setSelectedFiles(filteredFiles.map((f) => f._id));
      setSelectedViewFiles(filteredFiles);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedFiles.map((id) => deleteFile(id)));
      clearSelectedFiles();
      toast.success(`${selectedFiles.length} files deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete some files");
    }
  };

  const handleBulkDownload = () => {
    setSelectedViewFiles(selectedViewFiles);
    // setIsDownloadModalOpen(true);
  };

  const handleBulkShare = () => {
    setSelectedViewFiles(selectedViewFiles);
    // setIsShareModalOpen(true);
  };

  const openCarouselView = () => {
    dialog(
      <AttachmentsCarousel
        classNameContainer="rounded-lg border bg-card p-4 h-11/12"
        isDialog={false}
        slides={selectedViewFiles.map((file) => ({
          id: file._id,
          url: file.url,
          name: file.name,
          filename: file.name,
          contentType: file.mimeType,
        }))}
      />,
      {
        className: "max-w-4xl",
        title: "View Files",
        description: "View the selected files",
      }
    );
  };

  const handleFileView = (file: FileType) => {
    setSelectedFile(file);
    setIsViewModalOpen(true);
  };

  const handleFileEdit = (file: FileType) => {
    setSelectedFile(file);
    setIsEditModalOpen(true);
  };

  const getTotalSize = () =>
    files.reduce((total, file) => total + (file.size || 0), 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-destructive">Error loading files</div>
      </div>
    );
  }

  return (
    <Shell className="gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Files</h1>
          <p className="text-muted-foreground">
            Manage your uploaded files and documents
          </p>
        </div>
        <Dialog onOpenChange={setIsUploadModalOpen} open={isUploadModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
            </DialogHeader>
            <FileUploader
              accept={{
                "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                "application/pdf": [".pdf"],
                "application/msword": [".doc"],
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                  [".docx"],
                "text/*": [".txt", ".csv"],
              }}
              maxSize={10 * 1024 * 1024}
              multiple={true}
              onSuccess={() => {
                setIsUploadModalOpen(false);
                toast.success("Files uploaded successfully");
              }} // 10MB
            />
          </DialogContent>
        </Dialog>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="font-bold text-2xl">{files.length}</div>
          <div className="text-muted-foreground text-sm">Total Files</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="font-bold text-2xl">
            {formatBytes(getTotalSize())}
          </div>
          <div className="text-muted-foreground text-sm">Total Size</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="font-bold text-2xl">
            {files.filter((f) => f.mimeType?.startsWith("image/")).length}
          </div>
          <div className="text-muted-foreground text-sm">Images</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="font-bold text-2xl">
            {
              files.filter(
                (f) =>
                  f.mimeType?.includes("pdf") ||
                  f.mimeType?.includes("document")
              ).length
            }
          </div>
          <div className="text-muted-foreground text-sm">Documents</div>
        </div>
      </div>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              value={searchQuery}
            />
          </div>
          <Select
            onValueChange={(value) =>
              setSelectedCategory(value as FileCategory | "all")
            }
            value={selectedCategory}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          {selectedCount() > 0 && (
            <>
              <Badge variant="secondary">{selectedCount()} selected</Badge>
              <Button onClick={openCarouselView} size="sm" variant="outline">
                View
              </Button>
              <Button
                className="text-destructive"
                onClick={handleBulkDelete}
                size="sm"
                variant="outline"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button onClick={clearSelectedFiles} size="sm" variant="outline">
                Clear
              </Button>
              {/* <Button
                asChild
                onClick={clearSelectedFiles}
                size="sm"
                variant="ghost"
              >
                <motion.button
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  initial={{ x: -20, opacity: 0 }}
                  transition={{
                    bounce: 0,
                    duration: 0.2,
                  }}
                >
                  <XSquare className="mr-1" size={16} />
                  <span className="ml-1">Clear</span>
                </motion.button>
              </Button> */}
              {/* <Button onClick={handleBulkDownload} size="sm" variant="outline">
                Download
              </Button>
              <Button onClick={handleBulkShare} size="sm" variant="outline">
                Share
              </Button> */}
              <Separator className="h-6" orientation="vertical" />
            </>
          )}
          <div className="flex items-center rounded-md border">
            <Button
              className="rounded-r-none border-0"
              onClick={() => setViewMode("grid")}
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              className="rounded-l-none border-0"
              onClick={() => setViewMode("list")}
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* File Selection */}
      {filteredFiles.length > 0 && (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={
              selectedCount() === filteredFiles.length &&
              filteredFiles.length > 0
            }
            onCheckedChange={handleSelectAll}
          />
          <span className="text-muted-foreground text-sm">
            Select all {filteredFiles.length} files
          </span>
        </div>
      )}
      {/* Files Grid/List */}
      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-medium text-lg">No files found</h3>
          <p className="mb-4 text-muted-foreground">
            {searchQuery || selectedCategory !== "all"
              ? "Try adjusting your search or filters"
              : "Upload your first file to get started"}
          </p>
          {!searchQuery && selectedCategory === "all" && (
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredFiles.map((file) => (
            <div
              className={`group relative cursor-pointer rounded-lg border bg-card p-4 transition-shadow hover:shadow-md ${
                selectedFiles.includes(file._id) ? "ring-2 ring-primary" : ""
              }`}
              key={file._id || file.name}
              onClick={() => handleFileSelect(file)}
            >
              <div className="absolute top-2 left-2">
                <Checkbox
                  checked={selectedFiles.includes(file._id)}
                  onCheckedChange={() => handleFileSelect(file)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="mb-3 flex aspect-square items-center justify-center rounded-md bg-muted">
                {file.mimeType?.startsWith("image/") ? (
                  // biome-ignore lint/performance/noImgElement: by author
                  // biome-ignore lint/nursery/useImageSize: by author
                  <img
                    alt={file.name}
                    className="h-full w-full rounded-md object-cover"
                    src={file.url}
                  />
                ) : (
                  <div className="text-2xl">📄</div>
                )}
              </div>
              <div className="space-y-1">
                <p className="truncate font-medium text-sm" title={file.name}>
                  {file.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatBytes(file.size)}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex space-x-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileView(file);
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, "_blank");
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <FeatureFlagsProvider>
          <ErrorBoundary errorComponent={ErrorFallback}>
            <React.Suspense
              fallback={
                <DataTableSkeleton
                  cellWidths={[
                    "10rem",
                    "30rem",
                    "10rem",
                    "10rem",
                    "6rem",
                    "6rem",
                    "6rem",
                  ]}
                  columnCount={7}
                  filterCount={2}
                  shrinkZero
                />
              }
            >
              <FilesTable
                files={filteredFiles}
                onEdit={handleFileEdit}
                onView={handleFileView}
                pageCount={Math.ceil(files.length / search.perPage)}
              />
            </React.Suspense>
          </ErrorBoundary>
        </FeatureFlagsProvider>
      )}
      {/* File Edit Modal */}
      <FileEditModal
        file={selectedFile}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          toast.success("File updated successfully");
        }}
      />
      {/* File Viewer Modal */}
      <FileViewerModal
        file={selectedFile}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
      {/* File Viewer Modal */}
      {/* <Dialog onOpenChange={setIsViewModalOpen} open={isViewModalOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              {selectedFile.mimeType?.startsWith("image/") ? (
                // biome-ignore lint/performance/noImgElement: by author
                // biome-ignore lint/nursery/useImageSize: by author
                <img
                  alt={selectedFile.name}
                  className="mx-auto max-h-[60vh] max-w-full object-contain"
                  src={selectedFile.url}
                />
              ) : selectedFile.mimeType === "application/pdf" ? (
                <iframe
                  className="h-[60vh] w-full"
                  src={selectedFile.url}
                  title={selectedFile.name}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 text-4xl">📄</div>
                  <p className="mb-4 text-muted-foreground">
                    Preview not available for this file type
                  </p>
                  <Button
                    onClick={() => window.open(selectedFile.url, "_blank")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download to view
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Size:</strong> {formatBytes(selectedFile.size)}
                </div>
                <div>
                  <strong>Type:</strong> {selectedFile.mimeType}
                </div>
                <div>
                  <strong>Uploaded:</strong>{" "}
                  {new Date(selectedFile.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>Public:</strong>{" "}
                  {selectedFile.isPublic ? "Yes" : "No"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog> */}
    </Shell>
  );
}
