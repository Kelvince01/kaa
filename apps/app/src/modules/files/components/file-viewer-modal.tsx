import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Progress } from "@kaa/ui/components/progress";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  FileText,
  Maximize2,
  RotateCw,
  Share,
  Trash,
  Volume2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDeleteFile } from "../file.queries";
import type { FileType } from "../file.type";
import { AttachmentRender } from "../upload/attachment-render";

type FileViewerModalProps = {
  file: FileType | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (file: FileType) => void;
  onDelete?: (file: FileType) => void;
  onShare?: (file: FileType) => void;
  files?: FileType[]; // For navigation between files
  onNavigate?: (direction: "prev" | "next") => void;
};

export function FileViewerModal({
  file,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onShare,
  files,
  onNavigate,
}: FileViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const { mutateAsync: deleteFile } = useDeleteFile();

  // Reset state when file changes
  useEffect(() => {
    if (file) {
      setZoom(100);
      setRotation(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [file]);

  if (!file) return null;

  const handleDownload = () => {
    window.open(file.url, "_blank");
    toast.success("Download started");
  };

  const handleShare = () => {
    if (onShare) {
      onShare(file);
    } else {
      navigator.clipboard.writeText(file.url);
      toast.success("File URL copied to clipboard");
    }
  };

  const handleEdit = () => {
    onEdit?.(file);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteFile(file._id);
      onDelete?.(file);
      onClose();
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetView = () => {
    setZoom(100);
    setRotation(0);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderFilePreview = () => {
    const { mimeType, url, name } = file;

    // Image preview
    if (mimeType.startsWith("image/")) {
      return (
        <div className="flex flex-1 items-center justify-center overflow-hidden">
          {/* biome-ignore lint/performance/noImgElement: by author */}
          {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: by author */}
          {/* biome-ignore lint/nursery/useImageSize: by author */}
          <img
            alt={name}
            className="max-h-full max-w-full object-contain transition-transform duration-200"
            onError={() => toast.error("Failed to load image")}
            src={url}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          />
        </div>
      );
    }

    // Video preview
    if (mimeType.startsWith("video/")) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center space-y-4">
          {/* biome-ignore lint/a11y/useMediaCaption: by author */}
          <video
            className="max-h-[60vh] max-w-full rounded-md"
            controls
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              setDuration(video.duration);
            }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onTimeUpdate={(e) => {
              const video = e.target as HTMLVideoElement;
              setCurrentTime(video.currentTime);
            }}
            src={url}
          >
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    // Audio preview
    if (mimeType.startsWith("audio/")) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <Volume2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="font-medium text-lg">{name}</h3>
            <p className="text-muted-foreground">Audio File</p>
          </div>

          {/* biome-ignore lint/a11y/useMediaCaption: by author */}
          <audio
            className="w-full max-w-md"
            controls
            onLoadedMetadata={(e) => {
              const audio = e.target as HTMLAudioElement;
              setDuration(audio.duration);
            }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onTimeUpdate={(e) => {
              const audio = e.target as HTMLAudioElement;
              setCurrentTime(audio.currentTime);
            }}
            src={url}
          >
            Your browser does not support audio playback.
          </audio>

          {duration > 0 && (
            <div className="w-full max-w-md space-y-2">
              <Progress
                className="w-full"
                value={(currentTime / duration) * 100}
              />
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // PDF preview
    if (mimeType === "application/pdf") {
      return (
        <div className="flex-1">
          <iframe
            className="h-full min-h-[60vh] w-full rounded-md"
            src={url}
            title={name}
          />
        </div>
      );
    }

    // Text file preview
    if (mimeType.startsWith("text/")) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center space-y-4">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-medium text-lg">{name}</h3>
            <p className="text-muted-foreground">Text File</p>
          </div>
          <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download to view
          </Button>
        </div>
      );
    }

    // Default preview for unsupported types
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-medium text-lg">{name}</h3>
          <p className="text-muted-foreground">Preview not available</p>
          <p className="text-muted-foreground text-sm">{mimeType}</p>
        </div>
        <Button onClick={handleDownload} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download to view
        </Button>
      </div>
    );
  };

  const canNavigate = files && files.length > 1;
  const currentIndex = files ? files.findIndex((f) => f._id === file._id) : -1;
  const canGoBack = canNavigate && currentIndex > 0;
  const canGoForward = canNavigate && currentIndex < files.length - 1;

  const classNameContainer =
    "justify-center, relative flex h-full items-center overflow-hidden";
  const itemClass = "object-contain";
  const isDialog = true;
  const contentType = file.mimeType;
  const url = file.url;
  const idx = currentIndex;

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DialogTitle className="max-w-sm truncate" title={file.name}>
                {file.name}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{formatBytes(file.size)}</Badge>
                <Badge variant="secondary">{file.mimeType.split("/")[0]}</Badge>
                {file.isPublic && <Badge variant="secondary">Public</Badge>}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Navigation */}
              {canNavigate && (
                <>
                  <Button
                    disabled={!canGoBack}
                    onClick={() => onNavigate?.("prev")}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    {currentIndex + 1} of {files?.length}
                  </span>
                  <Button
                    disabled={!canGoForward}
                    onClick={() => onNavigate?.("next")}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Separator className="h-6" orientation="vertical" />

              {/* Image controls */}
              {file.mimeType.startsWith("image/") && (
                <>
                  <Button onClick={handleZoomOut} size="sm" variant="outline">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="min-w-12 text-center text-muted-foreground text-sm">
                    {zoom}%
                  </span>
                  <Button onClick={handleZoomIn} size="sm" variant="outline">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleRotate} size="sm" variant="outline">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleResetView} size="sm" variant="outline">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Separator className="h-6" orientation="vertical" />
                </>
              )}

              {/* Actions */}
              <Button onClick={handleDownload} size="sm" variant="outline">
                <Download className="h-4 w-4" />
              </Button>
              <Button onClick={handleShare} size="sm" variant="outline">
                <Share className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button onClick={handleEdit} size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                className="mr-4 text-destructive hover:text-destructive"
                disabled={isDeleting}
                onClick={handleDelete}
                size="sm"
                variant="outline"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[80vh]">
          {/* Content */}
          <div className="flex max-h-[80vh] min-h-[50vh] flex-1 flex-col">
            {/* {renderFilePreview()} */}
            <AttachmentRender
              altName={`Slide ${idx}`}
              containerClassName={cn(
                "justify-center, relative flex h-8/12 items-center overflow-hidden",
                classNameContainer
              )}
              imagePanZoom={isDialog}
              itemClassName={itemClass}
              showButtons={true}
              togglePanState
              type={contentType}
              url={url}
            />
          </div>

          {/* Footer with metadata */}
          <div className="border-t bg-muted/20 px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Size:</span>
                <p className="font-medium">{formatBytes(file.size)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">{file.mimeType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Uploaded:</span>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(file.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Access:</span>
                <p className="font-medium">
                  {file.isPublic ? "Public" : "Private"}
                </p>
              </div>
            </div>

            {file.description && (
              <>
                <Separator className="my-3" />
                <div>
                  <span className="text-muted-foreground text-sm">
                    Description:
                  </span>
                  <p className="mt-1">{file.description}</p>
                </div>
              </>
            )}

            {file.tags && file.tags.length > 0 && (
              <>
                <Separator className="my-3" />
                <div>
                  <span className="text-muted-foreground text-sm">Tags:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {file.tags.map((tag, index) => (
                      <Badge
                        className="text-xs"
                        key={index.toString()}
                        variant="secondary"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
