"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Slider } from "@kaa/ui/components/slider";
import { cn } from "@kaa/ui/lib/utils";
import {
  Archive,
  ChevronDown,
  Download,
  Eye,
  FileIcon,
  Filter,
  Grid3X3,
  Heart,
  ImageIcon,
  List,
  MapIcon,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  VideoIcon,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import type { Photo } from "./types";

export interface MediaItem extends Photo {
  dateAdded: Date;
  fileSize: number;
  dimensions?: { width: number; height: number };
  mediaType:
    | "photo"
    | "video"
    | "document"
    | "virtual-tour"
    | "floor-plan"
    | "epc";
  folder?: string;
  isFavorite?: boolean;
  views?: number;
  downloads?: number;
  aiGenerated?: boolean;
  location?: string;
  photographer?: string;
  equipment?: string;
}

export type MediaFolder = {
  id: string;
  name: string;
  count: number;
  color?: string;
  parentId?: string;
};

type MediaLibraryProps = {
  items: MediaItem[];
  onItemSelect?: (item: MediaItem) => void;
  onBulkAction?: (action: string, items: MediaItem[]) => void;
  onCreateFolder?: (name: string, parentId?: string) => void;
  folders?: MediaFolder[];
  className?: string;
  selectionMode?: boolean;
  maxSelections?: number;
};

type SortField =
  | "name"
  | "dateAdded"
  | "fileSize"
  | "views"
  | "downloads"
  | "quality";
type SortOrder = "asc" | "desc";
type ViewMode = "grid" | "list" | "masonry";

const getMediaTypeIcon = (type: string) => {
  switch (type) {
    case "photo":
      return <ImageIcon className="h-4 w-4" />;
    case "video":
      return <VideoIcon className="h-4 w-4" />;
    case "virtual-tour":
      return <MapIcon className="h-4 w-4" />;
    case "floor-plan":
      return <FileIcon className="h-4 w-4" />;
    case "epc":
      return <Zap className="h-4 w-4" />;
    default:
      return <FileIcon className="h-4 w-4" />;
  }
};

export function MediaLibrary({
  items,
  onItemSelect,
  onBulkAction,
  folders = [],
  className,
  selectionMode = false,
  maxSelections,
}: MediaLibraryProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [qualityRange, setQualityRange] = useState<[number, number]>([0, 100]);
  const [fileSizeRange, setFileSizeRange] = useState<[number, number]>([
    0, 100,
  ]);
  const [sortField, setSortField] = useState<SortField>("dateAdded");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  // Get all unique tags from items
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const item of items) {
      for (const tag of item.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !(
            item.caption?.toLowerCase().includes(query) ||
            item.tags?.some((tag) => tag.toLowerCase().includes(query))
          )
        ) {
          return false;
        }
      }

      // Tags filter
      if (
        selectedTags.length > 0 &&
        !item.tags?.some((tag) => selectedTags.includes(tag))
      ) {
        return false;
      }

      // Folder filter
      if (selectedFolder !== "all" && item.folder !== selectedFolder) {
        return false;
      }

      // Media type filter
      if (mediaTypeFilter !== "all" && item.mediaType !== mediaTypeFilter) {
        return false;
      }

      // Quality range filter
      if (
        item.quality &&
        (item.quality.score < qualityRange[0] ||
          item.quality.score > qualityRange[1])
      ) {
        return false;
      }

      // Date range filter
      if (dateRange[0] && item.dateAdded < dateRange[0]) return false;
      if (dateRange[1] && item.dateAdded > dateRange[1]) return false;

      // Favorite filter
      if (favoriteOnly && !item.isFavorite) return false;

      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case "name":
          aVal = a.caption || "";
          bVal = b.caption || "";
          break;
        case "dateAdded":
          aVal = a.dateAdded;
          bVal = b.dateAdded;
          break;
        case "fileSize":
          aVal = a.fileSize || 0;
          bVal = b.fileSize || 0;
          break;
        case "views":
          aVal = a.views || 0;
          bVal = b.views || 0;
          break;
        case "downloads":
          aVal = a.downloads || 0;
          bVal = b.downloads || 0;
          break;
        case "quality":
          aVal = a.quality?.score || 0;
          bVal = b.quality?.score || 0;
          break;
        default:
          aVal = a.dateAdded;
          bVal = b.dateAdded;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    items,
    searchQuery,
    selectedTags,
    selectedFolder,
    mediaTypeFilter,
    qualityRange,
    dateRange,
    favoriteOnly,
    sortField,
    sortOrder,
  ]);

  // Selection handlers
  const handleItemSelect = useCallback(
    (item: MediaItem) => {
      if (selectionMode) {
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(item.id || "")) {
            newSet.delete(item.id || "");
          } else if (!maxSelections || newSet.size < maxSelections) {
            newSet.add(item.id || "");
          }
          return newSet;
        });
      }
      onItemSelect?.(item);
    },
    [selectionMode, maxSelections, onItemSelect]
  );

  const handleBulkAction = useCallback(
    (action: string) => {
      const selectedItemsArray = items.filter((item) =>
        selectedItems.has(item.id || "")
      );
      onBulkAction?.(action, selectedItemsArray);
      setSelectedItems(new Set());
    },
    [items, selectedItems, onBulkAction]
  );

  // Get media type icon
  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case "photo":
        return <ImageIcon className="h-4 w-4" />;
      case "video":
        return <VideoIcon className="h-4 w-4" />;
      case "virtual-tour":
        return <MapIcon className="h-4 w-4" />;
      case "floor-plan":
        return <FileIcon className="h-4 w-4" />;
      case "epc":
        return <Zap className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-md flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search media..."
              value={searchQuery}
            />
          </div>

          <Button
            className={showFilters ? "bg-primary/10" : ""}
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
            variant="outline"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            <ChevronDown
              className={cn(
                "ml-2 h-4 w-4 transition-transform",
                showFilters && "rotate-180"
              )}
            />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border p-1">
            {[
              { mode: "grid" as ViewMode, icon: Grid3X3 },
              { mode: "list" as ViewMode, icon: List },
            ].map(({ mode, icon: Icon }) => (
              <Button
                className="h-8 w-8 p-0"
                key={mode}
                onClick={() => setViewMode(mode)}
                size="sm"
                variant={viewMode === mode ? "default" : "ghost"}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          {/* Sort Controls */}
          <Select
            onValueChange={(value: SortField) => setSortField(value)}
            value={sortField}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateAdded">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="fileSize">Size</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="views">Views</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="h-8 w-8 p-0"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            size="sm"
            variant="outline"
          >
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Media Type Filter */}
              <div>
                <Label className="mb-2 block font-medium text-sm">
                  Media Type
                </Label>
                <Select
                  onValueChange={setMediaTypeFilter}
                  value={mediaTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="photo">Photos</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="virtual-tour">Virtual Tours</SelectItem>
                    <SelectItem value="floor-plan">Floor Plans</SelectItem>
                    <SelectItem value="epc">EPC Certificates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Folder Filter */}
              <div>
                <Label className="mb-2 block font-medium text-sm">Folder</Label>
                <Select
                  onValueChange={setSelectedFolder}
                  value={selectedFolder}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Folders</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name} ({folder.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quality Range */}
              <div>
                <Label className="mb-2 block font-medium text-sm">
                  Quality Range ({qualityRange[0]}-{qualityRange[1]})
                </Label>
                <Slider
                  className="mt-2"
                  max={100}
                  onValueChange={(value) =>
                    setQualityRange(value as [number, number])
                  }
                  step={5}
                  value={qualityRange}
                />
              </div>

              {/* Favorites Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={favoriteOnly}
                  id="favorites"
                  onCheckedChange={(checked) =>
                    setFavoriteOnly(
                      checked === "indeterminate" ? false : checked
                    )
                  }
                />
                <label className="font-medium text-sm" htmlFor="favorites">
                  Favorites only
                </label>
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="mt-4">
                <Label className="mb-2 block font-medium text-sm">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 20).map((tag) => (
                    <Badge
                      className="cursor-pointer"
                      key={tag}
                      onClick={() => {
                        setSelectedTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      variant={
                        selectedTags.includes(tag) ? "default" : "outline"
                      }
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            <div className="mt-4 flex justify-between">
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTags([]);
                  setSelectedFolder("all");
                  setMediaTypeFilter("all");
                  setQualityRange([0, 100]);
                  setFavoriteOnly(false);
                }}
                size="sm"
                variant="outline"
              >
                Clear All Filters
              </Button>
              <span className="text-muted-foreground text-sm">
                {filteredItems.length} of {items.length} items
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {selectionMode && selectedItems.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
          <span className="font-medium text-sm">
            {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleBulkAction("download")}
              size="sm"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={() => handleBulkAction("favorite")}
              size="sm"
              variant="outline"
            >
              <Heart className="mr-2 h-4 w-4" />
              Favorite
            </Button>
            <Button
              onClick={() => handleBulkAction("archive")}
              size="sm"
              variant="outline"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <Button
              onClick={() => handleBulkAction("delete")}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Media Items Grid/List */}
      <div
        className={cn(
          "gap-4",
          viewMode === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            : viewMode === "list"
              ? "space-y-2"
              : "columns-2 md:columns-3 lg:columns-4"
        )}
      >
        {filteredItems.map((item) => (
          <MediaItemCard
            isSelected={selectedItems.has(item.id || "")}
            item={item}
            key={item.id}
            onSelect={() => handleItemSelect(item)}
            onToggleFavorite={(itemId) => {
              // Handle favorite toggle
              console.log("Toggle favorite:", itemId);
            }}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-medium text-lg">No media found</h3>
          <p className="mb-4 text-muted-foreground">
            {searchQuery || selectedTags.length > 0
              ? "Try adjusting your search or filters"
              : "Upload some media to get started"}
          </p>
          {(searchQuery || selectedTags.length > 0) && (
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedTags([]);
                setShowFilters(false);
              }}
              variant="outline"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Individual media item card component
function MediaItemCard({
  item,
  viewMode,
  isSelected,
  onSelect,
  onToggleFavorite,
}: {
  item: MediaItem;
  viewMode: ViewMode;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: (itemId: string) => void;
}) {
  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50",
          isSelected && "border-primary bg-primary/10"
        )}
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
          {item.url && (
            <Image
              alt={item.caption || "Media"}
              className="h-full w-full object-cover"
              height={100}
              loading="lazy"
              src={item.url}
              width={100}
            />
          )}
          <div className="absolute top-1 left-1">
            {getMediaTypeIcon(item.mediaType)}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h4 className="truncate font-medium text-sm">
                {item.caption || `Untitled ${item.mediaType}`}
              </h4>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(item.fileSize)} • {formatDate(item.dateAdded)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {item.quality && (
                <Badge className="text-xs" variant="outline">
                  {item.quality.score}/100
                </Badge>
              )}
              {item.isFavorite && (
                <Heart className="h-4 w-4 fill-current text-red-500" />
              )}
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="mt-1 flex gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge className="text-xs" key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge className="text-xs" variant="secondary">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Button
          className="shrink-0"
          onClick={onSelect}
          size="sm"
          variant="ghost"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        viewMode === "masonry" && "mb-4 break-inside-avoid"
      )}
      onClick={onSelect}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
        {item.url && (
          <Image
            alt={item.caption || "Media"}
            className="h-full w-full object-cover"
            height={100}
            loading="lazy"
            src={item.url}
            width={100}
          />
        )}

        {/* Overlay with icons */}
        <div className="absolute inset-0 bg-black/0 transition-colors hover:bg-black/10">
          <div className="absolute top-2 left-2">
            {getMediaTypeIcon(item.mediaType)}
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            {item.isPrimary && <Badge className="h-5 text-xs">Primary</Badge>}
            {item.isFavorite && (
              <Button
                className="h-6 w-6 bg-black/20 p-0 hover:bg-black/40"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id || "");
                }}
                size="sm"
                variant="ghost"
              >
                <Heart className="h-3 w-3 fill-current text-red-500" />
              </Button>
            )}
          </div>

          {/* Quality indicator */}
          {item.quality && (
            <div className="absolute bottom-2 left-2">
              <Badge
                className="bg-black/50 text-white text-xs"
                variant="secondary"
              >
                {item.quality.score}/100
              </Badge>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-3">
        <h4 className="mb-1 truncate font-medium text-sm">
          {item.caption || `Untitled ${item.mediaType}`}
        </h4>

        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>{formatFileSize(item.fileSize)}</span>
          <span>{formatDate(item.dateAdded)}</span>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <Badge className="text-xs" key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 2 && (
              <Badge className="text-xs" variant="outline">
                +{item.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function formatDate(date: Date): string {
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day"
  );
}
