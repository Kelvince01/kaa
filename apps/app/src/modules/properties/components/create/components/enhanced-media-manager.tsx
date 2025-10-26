import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Edit,
  FileImage,
  Loader2,
  MoreVertical,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

type MediaItem = {
  id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  isPrimary?: boolean;
  tags?: string[];
  quality?: "excellent" | "good" | "fair" | "poor";
  aiGenerated?: boolean;
  uploadProgress?: number;
  processingStatus?: "pending" | "processing" | "completed" | "failed";
  metadata?: {
    size: number;
    dimensions?: { width: number; height: number };
    format: string;
    location?: { lat: number; lng: number };
  };
};

type EnhancedMediaManagerProps = {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
};

export function EnhancedMediaManager({
  items,
  onChange,
  maxFiles = 20,
  acceptedTypes = ["image/*", "video/*"],
  className,
}: EnhancedMediaManagerProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mock AI services for media processing
  const processWithAI = async (file: File): Promise<Partial<MediaItem>> => {
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const isImage = file.type.startsWith("image/");

    return {
      quality:
        Math.random() > 0.3
          ? "excellent"
          : Math.random() > 0.5
            ? "good"
            : "fair",
      tags: isImage
        ? ["modern", "spacious", "bright", "kitchen", "living room"].slice(
            0,
            Math.floor(Math.random() * 3) + 1
          )
        : ["tour", "overview"],
      caption: isImage
        ? `Beautiful ${["kitchen", "living room", "bedroom", "bathroom"][Math.floor(Math.random() * 4)]} with modern finishes`
        : "Property tour video",
      metadata: {
        size: file.size,
        format: file.type,
        dimensions: isImage ? { width: 1920, height: 1080 } : undefined,
      },
    };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (items.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setIsProcessing(true);

      try {
        const newItems: MediaItem[] = [];

        for (const file of acceptedFiles) {
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const url = URL.createObjectURL(file);

          // Add initial item with upload progress
          const initialItem: MediaItem = {
            id: tempId,
            url,
            type: file.type.startsWith("image/") ? "image" : "video",
            uploadProgress: 0,
            processingStatus: "pending",
          };

          newItems.push(initialItem);

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setIsProcessing(true);
            // @ts-expect-error
            onChange((prev: MediaItem[]) =>
              prev.map((item: MediaItem) =>
                item.id === tempId
                  ? {
                      ...item,
                      uploadProgress: Math.min(
                        (item.uploadProgress || 0) + 10,
                        90
                      ),
                    }
                  : item
              )
            );
          }, 200);

          try {
            // Process with AI
            const aiData = await processWithAI(file);

            clearInterval(progressInterval);

            // Update with AI-processed data
            const processedItem: MediaItem = {
              ...initialItem,
              ...aiData,
              uploadProgress: 100,
              processingStatus: "completed",
              aiGenerated: true,
            };

            // @ts-expect-error
            onChange((prev: MediaItem[]) =>
              prev.map((item) => (item.id === tempId ? processedItem : item))
            );
          } catch (error) {
            clearInterval(progressInterval);
            // @ts-expect-error
            onChange((prev: MediaItem[]) =>
              prev.map((item) =>
                item.id === tempId
                  ? { ...item, processingStatus: "failed", uploadProgress: 0 }
                  : item
              )
            );
            toast.error(`Failed to process ${file.name}`);
          }
        }

        // @ts-expect-error
        onChange((prev) => [...prev, ...newItems]);
      } finally {
        setIsProcessing(false);
      }
    },
    [items.length, maxFiles, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce(
      // biome-ignore lint/performance/noAccumulatingSpread: ignore
      (acc: Record<string, any>, type: string) => ({ ...acc, [type]: [] }),
      {}
    ),
    maxFiles: maxFiles - items.length,
    disabled: items.length >= maxFiles,
  });

  const handleReorder = (dragIndex: number, hoverIndex: number) => {
    const dragItem = items[dragIndex] as MediaItem;
    const newItems = [...items];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    onChange(newItems);
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
    setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
  };

  const handleSetPrimary = (id: string) => {
    console.log("handleSetPrimary", id);
    onChange(
      items.map((item) => ({
        ...item,
        isPrimary: item.id === id,
      }))
    );
  };

  const handleBulkDelete = () => {
    onChange(items.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
    toast.success(`Deleted ${selectedItems.length} items`);
  };

  const handleBulkTag = (tag: string) => {
    onChange(
      items.map((item) =>
        selectedItems.includes(item.id)
          ? {
              ...item,
              tags: [...(item.tags || []), tag].filter(
                (t, i, arr) => arr.indexOf(t) === i
              ),
            }
          : item
      )
    );
    setSelectedItems([]);
    toast.success(`Added "${tag}" tag to ${selectedItems.length} items`);
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getQualityVariant = (quality?: string) => {
    switch (quality) {
      case "excellent":
        return "default";
      case "good":
        return "secondary";
      case "fair":
        return "outline";
      case "poor":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400",
              items.length >= maxFiles && "cursor-not-allowed opacity-50"
            )}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-gray-100 p-4">
                <Upload className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-lg">
                  {isDragActive ? "Drop files here" : "Upload Property Media"}
                </h3>
                <p className="mt-1 text-gray-500 text-sm">
                  Drag & drop images and videos, or click to browse
                </p>
                <p className="mt-2 text-gray-400 text-xs">
                  {items.length}/{maxFiles} files • Supports JPG, PNG, MP4, MOV
                </p>
              </div>
              {!isDragActive && (
                <Button variant="outline">
                  <FileImage className="mr-2 h-4 w-4" />
                  Choose Files
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBulkTag("featured")}
                  size="sm"
                  variant="outline"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  Tag as Featured
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items?.map((item, index) => (
            <Card className="overflow-hidden" key={item.id}>
              <div className="group relative">
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    checked={selectedItems.includes(item.id)}
                    className="rounded border-gray-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, item.id]);
                      } else {
                        setSelectedItems(
                          selectedItems.filter((id) => id !== item.id)
                        );
                      }
                    }}
                    type="checkbox"
                  />
                </div>

                {/* Primary Badge */}
                {item.isPrimary && (
                  <Badge className="absolute top-2 right-2 z-10">
                    <Star className="mr-1 h-3 w-3" />
                    Primary
                  </Badge>
                )}

                {/* Media Content */}
                <div
                  className="flex aspect-square cursor-pointer items-center justify-center bg-gray-100"
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                >
                  {item.type === "image" ? (
                    <Image
                      alt={item.caption || `Media ${index + 1}`}
                      className="h-full w-full object-cover"
                      height={100}
                      src={item.url}
                      width={100}
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Video className="mb-2 h-8 w-8 text-gray-400" />
                      <span className="text-gray-500 text-xs">Video</span>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {item.uploadProgress !== undefined &&
                  item.uploadProgress < 100 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center text-white">
                        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                        <div className="text-sm">{item.uploadProgress}%</div>
                      </div>
                    </div>
                  )}

                {/* Processing Status */}
                {item.processingStatus === "processing" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                    <div className="text-center text-blue-700">
                      <Sparkles className="mx-auto mb-2 h-6 w-6 animate-pulse" />
                      <div className="text-xs">AI Processing...</div>
                    </div>
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(item);
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(item.id);
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="secondary">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)}>
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </DropdownMenuItem>
                        {index > 0 && (
                          <DropdownMenuItem
                            onClick={() => handleReorder(index, index - 1)}
                          >
                            <ArrowUp className="mr-2 h-3 w-3" />
                            Move Up
                          </DropdownMenuItem>
                        )}
                        {index < items.length - 1 && (
                          <DropdownMenuItem
                            onClick={() => handleReorder(index, index + 1)}
                          >
                            <ArrowDown className="mr-2 h-3 w-3" />
                            Move Down
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Media Info */}
              <CardContent className="p-3">
                <div className="space-y-2">
                  {item.caption && (
                    <p className="line-clamp-2 text-gray-600 text-xs">
                      {item.caption}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    {item.quality && (
                      <Badge
                        className="text-xs"
                        variant={getQualityVariant(item.quality)}
                      >
                        {item.quality}
                      </Badge>
                    )}

                    {item.aiGenerated && (
                      <Badge className="text-xs" variant="secondary">
                        <Sparkles className="mr-1 h-2 w-2" />
                        AI
                      </Badge>
                    )}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge className="text-xs" key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge className="text-xs" variant="outline">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog onOpenChange={() => setEditingItem(null)} open={!!editingItem}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                    {editingItem.type === "image" ? (
                      <Image
                        alt="Preview"
                        className="h-full w-full object-cover"
                        height={100}
                        src={editingItem.url}
                        width={100}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Video className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="mb-2 block font-medium text-sm">
                      Caption
                    </label>
                    <Textarea
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          caption: e.target.value,
                        })
                      }
                      placeholder="Describe this image..."
                      rows={3}
                      value={editingItem.caption || ""}
                    />
                  </div>

                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                    <label className="mb-2 block font-medium text-sm">
                      Tags
                    </label>
                    <Input
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          tags: e.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="modern, spacious, kitchen..."
                      value={editingItem.tags?.join(", ") || ""}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      checked={editingItem.isPrimary}
                      id="isPrimary"
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          isPrimary: e.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    <label className="text-sm" htmlFor="isPrimary">
                      Set as primary image
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={() => setEditingItem(null)} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onChange(
                      items.map((item) =>
                        item.id === editingItem.id ? editingItem : item
                      )
                    );
                    setEditingItem(null);
                    toast.success("Media updated successfully");
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox for viewing */}
      <Dialog onOpenChange={setLightboxOpen} open={lightboxOpen}>
        <DialogContent className="max-w-4xl p-0">
          {items[lightboxIndex] && (
            <div className="relative">
              {items[lightboxIndex].type === "image" ? (
                <Image
                  alt="Full size preview"
                  className="max-h-[80vh] w-full object-contain"
                  fill
                  height={100}
                  src={items[lightboxIndex].url}
                  width={100}
                />
              ) : (
                // biome-ignore lint/a11y/useMediaCaption: ignore
                <video
                  className="max-h-[80vh] w-full"
                  controls
                  src={items[lightboxIndex].url}
                />
              )}

              {/* Navigation */}
              <div className="absolute inset-x-0 bottom-0 bg-black/50 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {items[lightboxIndex].caption ||
                        `Media ${lightboxIndex + 1}`}
                    </h3>
                    <p className="text-sm opacity-75">
                      {lightboxIndex + 1} of {items.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={lightboxIndex === 0}
                      onClick={() => setLightboxIndex(lightboxIndex - 1)}
                      size="sm"
                      variant="secondary"
                    >
                      Previous
                    </Button>
                    <Button
                      disabled={lightboxIndex === items.length - 1}
                      onClick={() => setLightboxIndex(lightboxIndex + 1)}
                      size="sm"
                      variant="secondary"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
