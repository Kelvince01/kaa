import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  Edit,
  Eye,
  FileIcon,
  FileText,
  Image,
  MoreVertical,
  Music,
  Trash,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteFile } from "../file.queries";
import { useFileStore } from "../file.store";
import type { FileType } from "../file.type";

type FileGridProps = {
  files: FileType[];
  onView?: (file: FileType) => void;
  onEdit?: (file: FileType) => void;
  onDownload?: (file: FileType) => void;
  showSelection?: boolean;
};

export function FileGrid({
  files,
  onView,
  onEdit,
  onDownload,
  showSelection = true,
}: FileGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { mutateAsync: deleteFile } = useDeleteFile();
  const { selectedFiles, toggleFileSelection } = useFileStore();

  const handleDelete = async (file: FileType, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      setDeletingId(file._id);
      await deleteFile(file._id);
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (file: FileType, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (onDownload) {
      onDownload(file);
    } else {
      window.open(file.url, "_blank");
    }
  };

  const handleView = (file: FileType, event?: React.MouseEvent) => {
    event?.stopPropagation();
    onView?.(file);
  };

  const handleEdit = (file: FileType, event?: React.MouseEvent) => {
    event?.stopPropagation();
    onEdit?.(file);
  };

  const handleFileSelect = (file: FileType, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (showSelection) {
      toggleFileSelection(file._id);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.startsWith("audio/")) return Music;
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text")
    )
      return FileText;
    return FileIcon;
  };

  const getFilePreview = (file: FileType) => {
    if (file.mimeType.startsWith("image/")) {
      return (
        // biome-ignore lint/nursery/useImageSize: by author
        // biome-ignore lint/performance/noImgElement: by author
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: by author
        <img
          alt={file.name}
          className="h-full w-full rounded-md object-cover"
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            target.nextElementSibling?.classList.remove("hidden");
          }}
          src={file.url}
        />
      );
    }

    const IconComponent = getFileIcon(file.mimeType);
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground">
        <IconComponent className="mb-2 h-8 w-8" />
        <span className="px-1 text-center text-xs">
          {file.mimeType.split("/")[1]?.toUpperCase()}
        </span>
      </div>
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  if (!files.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileIcon className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-medium text-lg">No files found</h3>
        <p className="text-muted-foreground">
          Upload some files to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {files.map((file) => {
        const isSelected = selectedFiles.includes(file._id);
        const isDeleting = deletingId === file._id;

        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: by author
          // biome-ignore lint/a11y/noNoninteractiveElementInteractions: by author
          // biome-ignore lint/a11y/useKeyWithClickEvents: by author
          <div
            className={`group relative cursor-pointer rounded-lg border bg-card transition-all duration-200 hover:shadow-md ${
              isSelected ? "shadow-md ring-2 ring-primary" : ""
            } ${isDeleting ? "pointer-events-none opacity-50" : ""}`}
            key={file._id}
            onClick={() => handleFileSelect(file)}
          >
            {/* Selection Checkbox */}
            {showSelection && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={isSelected}
                  className="bg-background shadow-sm"
                  onCheckedChange={() => handleFileSelect(file)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Actions Menu */}
            <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-8 w-8 p-0 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                    size="sm"
                    variant="secondary"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={(e) => handleView(file, e)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(e) => handleDownload(file, e)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => handleEdit(file, e)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => handleDelete(file, e)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* File Preview */}
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-t-lg bg-muted">
              {getFilePreview(file)}

              {/* Quick Action Buttons on Hover */}
              <div className="absolute inset-0 flex items-center justify-center space-x-1 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                {onView && (
                  <Button
                    className="h-8 w-8 p-0"
                    onClick={(e) => handleView(file, e)}
                    size="sm"
                    variant="secondary"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  className="h-8 w-8 p-0"
                  onClick={(e) => handleDownload(file, e)}
                  size="sm"
                  variant="secondary"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* File Info */}
            <div className="space-y-2 p-3">
              <div className="space-y-1">
                <p className="truncate font-medium text-sm" title={file.name}>
                  {file.name}
                </p>
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>{formatBytes(file.size)}</span>
                  <span>
                    {formatDistanceToNow(new Date(file.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {/* File Metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {file.isPublic && (
                    <Badge className="text-xs" variant="secondary">
                      Public
                    </Badge>
                  )}
                  {file.tags && file.tags.length > 0 && (
                    <Badge className="text-xs" variant="outline">
                      {file.tags.length} tag{file.tags.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              {file.description && (
                <p
                  className="truncate text-muted-foreground text-xs"
                  title={file.description}
                >
                  {file.description}
                </p>
              )}
            </div>

            {/* Loading Overlay */}
            {isDeleting && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
                <div className="text-muted-foreground text-sm">Deleting...</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
