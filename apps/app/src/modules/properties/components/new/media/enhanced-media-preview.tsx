"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import { cn } from "@kaa/ui/lib/utils";
import {
  Check,
  Copy,
  Edit,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  MapPin,
  MoreVertical,
  Play,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { Photo, Video } from "@/modules/properties/property.type";

type MediaItem = Partial<Photo> &
  Partial<Video> & {
    id: string;
    url: string;
    type: "photo" | "video" | "virtual-tour" | "floor-plan" | "epc";
    caption?: string;
    tags?: string[];
    isPrimary?: boolean;
    isSelected?: boolean;
    uploadProgress?: number;
    file?: File;
  };

type EnhancedMediaPreviewProps = {
  items: MediaItem[];
  onItemUpdate: (id: string, updates: Partial<MediaItem>) => void;
  onItemDelete: (id: string) => void;
  onItemsReorder: (newOrder: MediaItem[]) => void;
  onBulkSelect: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onSetPrimary: (id: string) => void;
  previewMode?: "grid" | "list" | "detailed";
  allowReordering?: boolean;
  allowBulkActions?: boolean;
  showTags?: boolean;
  suggestedTags?: string[];
  className?: string;
};

export function EnhancedMediaPreview({
  items,
  onItemUpdate,
  onItemDelete,
  onItemsReorder,
  onBulkSelect,
  onBulkDelete,
  onSetPrimary,
  previewMode = "grid",
  allowReordering = true,
  allowBulkActions = true,
  showTags = true,
  className,
}: EnhancedMediaPreviewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const selectedItems = items.filter((item) => item.isSelected);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!allowReordering) return;

      setDraggedIndex(index);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    },
    [allowReordering]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!allowReordering || draggedIndex === null) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverIndex(index);
    },
    [allowReordering, draggedIndex]
  );

  const handleDragEnd = useCallback(() => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      const newItems = [...items];
      const draggedItem = newItems.splice(draggedIndex, 1)[0];
      if (draggedItem) {
        newItems.splice(dragOverIndex, 0, draggedItem);
      }
      onItemsReorder(newItems);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, items, onItemsReorder]);

  const handleSelect = useCallback(
    (id: string, selected: boolean) => {
      onItemUpdate(id, { isSelected: selected });
    },
    [onItemUpdate]
  );

  const handleBulkAction = useCallback(
    (action: "delete" | "select-all" | "select-none") => {
      switch (action) {
        case "delete":
          if (selectedItems.length > 0) {
            onBulkDelete(selectedItems.map((item) => item.id));
            toast.success(
              `${selectedItems.length} items deleted successfully.`
            );
          }
          break;
        case "select-all":
          onBulkSelect(items.map((item) => item.id));
          break;
        case "select-none":
          onBulkSelect([]);
          break;
        default:
          break;
      }
    },
    [selectedItems, items, onBulkSelect, onBulkDelete]
  );

  const handleCaptionEdit = useCallback(
    (id: string, caption: string) => {
      onItemUpdate(id, { caption });
      setEditingCaption(null);
    },
    [onItemUpdate]
  );

  const handleTagAdd = useCallback(
    (id: string, tag: string) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        const currentTags = item.tags || [];
        if (!currentTags.includes(tag)) {
          onItemUpdate(id, { tags: [...currentTags, tag] });
        }
      }
      setNewTag("");
    },
    [items, onItemUpdate]
  );

  const handleTagRemove = useCallback(
    (id: string, tagToRemove: string) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        const updatedTags = (item.tags || []).filter(
          (tag) => tag !== tagToRemove
        );
        onItemUpdate(id, { tags: updatedTags });
      }
    },
    [items, onItemUpdate]
  );

  const getMediaTypeIcon = (type: MediaItem["type"]) => {
    switch (type) {
      case "photo":
        return ImageIcon;
      case "video":
        return Play;
      case "virtual-tour":
        return MapPin;
      case "floor-plan":
      case "epc":
        return FileText;
      default:
        return ImageIcon;
    }
  };

  const renderMediaItem = (item: MediaItem, index: number) => {
    const IconComponent = getMediaTypeIcon(item.type);
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;

    return (
      <div
        className={cn(
          "group relative rounded-lg border bg-background transition-all duration-200",
          isDragging && "scale-95 opacity-50",
          isDragOver && "border-primary bg-primary/5",
          item.isSelected && "border-primary ring-2 ring-primary/20",
          previewMode === "grid" ? "aspect-video" : "flex gap-4 p-4",
          className
        )}
        draggable={allowReordering}
        key={item.id}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragStart={(e) => handleDragStart(e, index)}
      >
        {/* Selection checkbox */}
        {allowBulkActions && (
          <div className="absolute top-2 left-2 z-10">
            <input
              checked={item.isSelected}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              onChange={(e) => handleSelect(item.id, e.target.checked)}
              type="checkbox"
            />
          </div>
        )}

        {/* Primary indicator */}
        {item.isPrimary && (
          <div className="absolute top-2 right-12 z-10">
            <Badge className="text-xs" variant="default">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Primary
            </Badge>
          </div>
        )}

        {/* Drag handle */}
        {allowReordering && (
          <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
          </div>
        )}

        {previewMode === "grid" ? (
          <>
            {/* Media preview */}
            <div className="relative h-32 w-full overflow-hidden rounded-t-lg bg-muted">
              {item.type === "photo" && (
                <Image
                  alt={item.caption || "Property media"}
                  className="h-full w-full object-cover"
                  height={100}
                  loading="lazy"
                  src={item.url}
                  width={100}
                />
              )}
              {item.type === "video" && (
                <div className="relative flex h-full w-full items-center justify-center bg-black">
                  <Play className="h-8 w-8 text-white" />
                  <video
                    className="h-full w-full object-cover"
                    muted
                    preload="metadata"
                    src={item.url}
                  />
                </div>
              )}
              {(item.type === "virtual-tour" ||
                item.type === "floor-plan" ||
                item.type === "epc") && (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <IconComponent className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Upload progress */}
              {item.uploadProgress !== undefined &&
                item.uploadProgress < 100 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-sm text-white">
                      {item.uploadProgress}%
                    </div>
                  </div>
                )}
            </div>

            {/* Item details */}
            <div className="space-y-2 p-3">
              {/* Caption */}
              {editingCaption === item.id ? (
                <Input
                  autoFocus
                  className="text-sm"
                  defaultValue={item.caption || ""}
                  onBlur={(e) => handleCaptionEdit(item.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCaptionEdit(item.id, e.currentTarget.value);
                    }
                    if (e.key === "Escape") {
                      setEditingCaption(null);
                    }
                  }}
                />
              ) : (
                <div
                  className="cursor-pointer font-medium text-sm hover:text-primary"
                  onClick={() => setEditingCaption(item.id)}
                >
                  {item.caption || "Click to add caption"}
                </div>
              )}

              {/* Tags */}
              {showTags && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {item.tags?.map((tag) => (
                      <Badge
                        className="cursor-pointer text-xs hover:bg-destructive hover:text-destructive-foreground"
                        key={tag}
                        onClick={() => handleTagRemove(item.id, tag)}
                        variant="secondary"
                      >
                        {tag}
                        <X className="ml-1 h-2 w-2" />
                      </Badge>
                    ))}
                  </div>

                  {editingTags === item.id && (
                    <div className="flex gap-1">
                      <Input
                        autoFocus
                        className="h-6 text-xs"
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTag.trim()) {
                            handleTagAdd(item.id, newTag.trim());
                          }
                          if (e.key === "Escape") {
                            setEditingTags(null);
                            setNewTag("");
                          }
                        }}
                        placeholder="Add tag..."
                        value={newTag}
                      />
                      <Button
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          if (newTag.trim()) {
                            handleTagAdd(item.id, newTag.trim());
                          }
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {editingTags !== item.id && (
                    <Button
                      className="h-6 text-muted-foreground text-xs"
                      onClick={() => setEditingTags(item.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      Add Tag
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          // List/detailed view
          <div className="flex w-full gap-4">
            {/* Thumbnail */}
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-muted">
              {item.type === "photo" && (
                <Image
                  alt={item.caption || "Property media"}
                  className="h-full w-full object-cover"
                  height={100}
                  src={item.url}
                  width={100}
                />
              )}
              {item.type !== "photo" && (
                <div className="flex h-full w-full items-center justify-center">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-1">
              <div className="font-medium text-sm">
                {item.caption || `${item.type} ${index + 1}`}
              </div>
              <div className="text-muted-foreground text-xs">
                {item.type} •{" "}
                {item.file?.size
                  ? `${(item.file.size / 1024 / 1024).toFixed(1)}MB`
                  : "External"}
              </div>
              {showTags && item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge className="text-xs" key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions dropdown */}
        <div className="absolute right-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!item.isPrimary && (
                <DropdownMenuItem onClick={() => onSetPrimary(item.id)}>
                  <Star className="mr-2 h-4 w-4" />
                  Set as Primary
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setEditingCaption(item.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Caption
              </DropdownMenuItem>
              {showTags && (
                <DropdownMenuItem onClick={() => setEditingTags(item.id)}>
                  <Tag className="mr-2 h-4 w-4" />
                  Manage Tags
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open(item.url, "_blank")}>
                <Eye className="mr-2 h-4 w-4" />
                View Full Size
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(item.url);
                  toast.success("URL copied to clipboard");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onItemDelete(item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <ImageIcon className="mx-auto mb-4 h-12 w-12" />
        <p>No media uploaded yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Bulk actions */}
      {allowBulkActions && selectedItems.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <span className="font-medium text-sm">
            {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              onClick={() => handleBulkAction("select-none")}
              size="sm"
              variant="outline"
            >
              Clear Selection
            </Button>
            <Button
              onClick={() => handleBulkAction("delete")}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Media grid */}
      <div
        className={cn(
          previewMode === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "space-y-2"
        )}
      >
        {items.map(renderMediaItem)}
      </div>

      {/* Quick actions */}
      {allowBulkActions && items.length > 0 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => handleBulkAction("select-all")}
            size="sm"
            variant="outline"
          >
            Select All
          </Button>
          <Button
            onClick={() => handleBulkAction("select-none")}
            size="sm"
            variant="outline"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
