import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  FileIcon,
  FileText,
  Image,
  MoreVertical,
  Music,
  Share,
  Trash,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteFile } from "../file.queries";
import { useFileStore } from "../file.store";
import type { FileType } from "../file.type";

type FileCardProps = {
  file: FileType;
  onView?: (file: FileType) => void;
  onEdit?: (file: FileType) => void;
  onDownload?: (file: FileType) => void;
  onShare?: (file: FileType) => void;
  showSelection?: boolean;
  variant?: "compact" | "detailed";
};

export function FileCard({
  file,
  onView,
  onEdit,
  onDownload,
  onShare,
  showSelection = true,
  variant = "compact",
}: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutateAsync: deleteFile } = useDeleteFile();
  const { selectedFiles, toggleFileSelection } = useFileStore();

  const isSelected = selectedFiles.includes(file._id);

  const handleDelete = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      setIsDeleting(true);
      await deleteFile(file._id);
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (onDownload) {
      onDownload(file);
    } else {
      window.open(file.url, "_blank");
    }
  };

  const handleView = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    onView?.(file);
  };

  const handleEdit = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    onEdit?.(file);
  };

  const handleShare = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (onShare) {
      onShare(file);
    } else {
      // Default share behavior - copy URL to clipboard
      navigator.clipboard.writeText(file.url);
      toast.success("File URL copied to clipboard");
    }
  };

  const handleFileSelect = (event?: React.MouseEvent) => {
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

  const getFilePreview = () => {
    if (file.mimeType.startsWith("image/")) {
      return (
        <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
          {/** biome-ignore lint/nursery/useImageSize: by author */}
          {/** biome-ignore lint/performance/noImgElement: by author */}
          {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: by author */}
          <img
            alt={file.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
            src={file.url}
          />
        </div>
      );
    }

    const IconComponent = getFileIcon(file.mimeType);
    return (
      <div className="flex aspect-square flex-col items-center justify-center rounded-md bg-muted text-muted-foreground">
        <IconComponent className="mb-2 h-8 w-8" />
        <span className="px-2 text-center text-xs">
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

  const getFileCategory = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("video/")) return "Video";
    if (mimeType.startsWith("audio/")) return "Audio";
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("document") || mimeType.includes("text"))
      return "Document";
    return "File";
  };

  return (
    <TooltipProvider>
      <Card
        className={`group relative cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? "shadow-md ring-2 ring-primary" : ""
        } ${isDeleting ? "pointer-events-none opacity-50" : ""}`}
        onClick={handleFileSelect}
      >
        {/* Selection Checkbox */}
        {showSelection && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              className="bg-background shadow-sm"
              onCheckedChange={() => handleFileSelect()}
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
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(file.url);
                  toast.success("File URL copied to clipboard");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </DropdownMenuItem>
              {onEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="pb-2">
          {/* File Preview */}
          {getFilePreview()}
        </CardHeader>

        <CardContent className="space-y-2">
          {/* File Name and Category */}
          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="cursor-help truncate font-medium text-sm">
                  {file.name}
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                <p>{file.name}</p>
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center justify-between">
              <Badge className="text-xs" variant="outline">
                {getFileCategory(file.mimeType)}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {formatBytes(file.size)}
              </span>
            </div>
          </div>

          {/* Description */}
          {file.description && variant === "detailed" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="cursor-help truncate text-muted-foreground text-xs">
                  {file.description}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{file.description}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Tags */}
          {file.tags && file.tags.length > 0 && variant === "detailed" && (
            <div className="flex flex-wrap gap-1">
              {file.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  className="text-xs"
                  key={index.toString()}
                  variant="secondary"
                >
                  {tag}
                </Badge>
              ))}
              {file.tags.length > 3 && (
                <Badge className="text-xs" variant="secondary">
                  +{file.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* File Status Badges */}
          <div className="flex items-center space-x-1">
            {file.isPublic && (
              <Badge className="text-xs" variant="secondary">
                Public
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-2 pb-3 text-muted-foreground text-xs">
          {/* Upload Date */}
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(file.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onView && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-6 w-6 p-0"
                    onClick={handleView}
                    size="sm"
                    variant="ghost"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View file</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-6 w-6 p-0"
                  onClick={handleDownload}
                  size="sm"
                  variant="ghost"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download file</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardFooter>

        {/* Loading Overlay */}
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
            <div className="text-muted-foreground text-sm">Deleting...</div>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}
