import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar as CalendarComponent } from "@kaa/ui/components/calendar";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import { format } from "date-fns";
import {
  Calendar,
  Download,
  Eye,
  EyeOff,
  FileTypeIcon,
  Filter,
  Grid,
  List,
  Search,
  Share,
  SortAsc,
  SortDesc,
  Trash,
  X,
} from "lucide-react";
import { useState } from "react";
import { useFileStore } from "../file.store";
import type {
  FileCategory,
  FileFilter,
  FileStatus,
  FileType,
} from "../file.type";

type FileToolbarProps = {
  files: FileType[];
  onFiltersChange?: (filters: FileFilter) => void;
  onBulkAction?: (action: string, fileIds: string[]) => void;
  onExport?: () => void;
  showViewToggle?: boolean;
  showBulkActions?: boolean;
};

export function FileToolbar({
  files,
  onFiltersChange,
  onBulkAction,
  onExport,
  showViewToggle = true,
  showBulkActions = true,
}: FileToolbarProps) {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const {
    selectedFiles,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    clearFilters,
    clearSelectedFiles,
    selectedCount,
  } = useFileStore();

  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [minSize, setMinSize] = useState<string>("");
  const [maxSize, setMaxSize] = useState<string>("");
  const [selectedMimeTypes, setSelectedMimeTypes] = useState<string[]>([]);

  // Get unique mime types from files
  const uniqueMimeTypes = Array.from(
    new Set(files.map((f) => f.mimeType))
  ).sort();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateFilters({ search: value });
  };

  const handleCategoryChange = (category: string) => {
    const newCategory = category === "all" ? null : (category as FileCategory);
    setFilterCategory(newCategory);
    updateFilters({ mimeType: newCategory || undefined });
  };

  const handleStatusChange = (status: string) => {
    const newStatus = status === "all" ? null : (status as FileStatus);
    setFilterStatus(newStatus);
    updateFilters({ status: newStatus || undefined });
  };

  const handleSortChange = (field: string) => {
    if (field === sortBy) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
      updateFilters({ sortBy: field, sortOrder: newOrder });
    } else {
      setSortBy(field);
      setSortOrder("desc");
      updateFilters({ sortBy: field, sortOrder: "desc" });
    }
  };

  const updateFilters = (newFilters: Partial<FileFilter>) => {
    const filters: FileFilter = {
      search: searchQuery,
      sortBy,
      sortOrder,
      ...newFilters,
    };

    if (filterCategory) {
      filters.mimeType = filterCategory;
    }

    if (minSize) {
      filters.sizeFrom = Number.parseInt(minSize, 10) * 1024; // Convert KB to bytes
    }

    if (maxSize) {
      filters.sizeTo = Number.parseInt(maxSize, 10) * 1024; // Convert KB to bytes
    }

    if (dateFrom) {
      filters.uploadedFrom = dateFrom.toISOString();
    }

    if (dateTo) {
      filters.uploadedTo = dateTo.toISOString();
    }

    onFiltersChange?.(filters);
  };

  const handleClearFilters = () => {
    clearFilters();
    setSortBy("createdAt");
    setSortOrder("desc");
    setMinSize("");
    setMaxSize("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedMimeTypes([]);
    onFiltersChange?.({});
  };

  const handleBulkAction = (action: string) => {
    if (selectedFiles.length === 0) return;
    onBulkAction?.(action, selectedFiles);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const hasActiveFilters =
    searchQuery ||
    filterCategory ||
    filterStatus ||
    minSize ||
    maxSize ||
    dateFrom ||
    dateTo ||
    selectedMimeTypes.length > 0;

  return (
    <div className="space-y-4">
      {/* Main toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search and basic filters */}
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search files..."
              value={searchQuery}
            />
            {searchQuery && (
              <Button
                className="absolute top-1 right-1 h-7 w-7 p-0"
                onClick={() => handleSearchChange("")}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Category filter */}
          <Select
            onValueChange={handleCategoryChange}
            value={filterCategory || "all"}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="archive">Archives</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge
                    className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                    variant="secondary"
                  >
                    !
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Advanced Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      onClick={handleClearFilters}
                      size="sm"
                      variant="ghost"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* File size */}
                <div className="space-y-2">
                  <label className="font-medium text-sm" htmlFor="minSize">
                    File Size (KB)
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      onChange={(e) => setMinSize(e.target.value)}
                      placeholder="Min"
                      type="number"
                      value={minSize}
                    />
                    <Input
                      onChange={(e) => setMaxSize(e.target.value)}
                      placeholder="Max"
                      type="number"
                      value={maxSize}
                    />
                  </div>
                </div>

                {/* Date range */}
                <div className="space-y-2">
                  <label className="font-medium text-sm" htmlFor="dateFrom">
                    Upload Date
                  </label>
                  <Popover
                    onOpenChange={setIsCalendarOpen}
                    open={isCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        className="w-full justify-start text-left"
                        variant="outline"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateFrom && dateTo
                          ? `${format(dateFrom, "MMM d")} - ${format(dateTo, "MMM d")}`
                          : dateFrom
                            ? `From ${format(dateFrom, "MMM d")}`
                            : dateTo
                              ? `Until ${format(dateTo, "MMM d")}`
                              : "Select date range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <div className="flex">
                        <CalendarComponent
                          initialFocus
                          mode="single"
                          onSelect={setDateFrom}
                          selected={dateFrom}
                        />
                        <CalendarComponent
                          mode="single"
                          onSelect={setDateTo}
                          selected={dateTo}
                        />
                      </div>
                      <div className="border-t p-3">
                        <Button
                          onClick={() => {
                            setDateFrom(undefined);
                            setDateTo(undefined);
                            setIsCalendarOpen(false);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          Clear dates
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* MIME types */}
                <div className="space-y-2">
                  <label className="font-medium text-sm" htmlFor="mimeTypes">
                    File Types
                  </label>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {uniqueMimeTypes.slice(0, 8).map((mimeType) => (
                      <div
                        className="flex items-center space-x-2"
                        key={mimeType}
                      >
                        <Checkbox
                          checked={selectedMimeTypes.includes(mimeType)}
                          id={mimeType}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMimeTypes((prev) => [
                                ...prev,
                                mimeType,
                              ]);
                            } else {
                              setSelectedMimeTypes((prev) =>
                                prev.filter((t) => t !== mimeType)
                              );
                            }
                          }}
                        />
                        <label className="truncate text-sm" htmlFor={mimeType}>
                          {mimeType}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={() => updateFilters({})}>
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* View controls and actions */}
        <div className="flex items-center space-x-2">
          {/* Bulk actions */}
          {showBulkActions && selectedCount() > 0 && (
            <>
              <Badge variant="secondary">{selectedCount()} selected</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("download")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("share")}>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("makePublic")}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Make Public
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("makePrivate")}
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Make Private
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleBulkAction("delete")}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={clearSelectedFiles} size="sm" variant="outline">
                Clear
              </Button>
              <Separator className="h-6" orientation="vertical" />
            </>
          )}

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {sortOrder === "asc" ? (
                  <SortAsc className="mr-2 h-4 w-4" />
                ) : (
                  <SortDesc className="mr-2 h-4 w-4" />
                )}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleSortChange("name")}>
                <FileTypeIcon className="mr-2 h-4 w-4" />
                Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("size")}>
                <FileTypeIcon className="mr-2 h-4 w-4" />
                Size {sortBy === "size" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("createdAt")}>
                <Calendar className="mr-2 h-4 w-4" />
                Upload Date{" "}
                {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("mimeType")}>
                <FileTypeIcon className="mr-2 h-4 w-4" />
                Type{" "}
                {sortBy === "mimeType" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          {onExport && (
            <Button onClick={onExport} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}

          {/* View toggle */}
          {showViewToggle && (
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
          )}
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Active filters:</span>

          {searchQuery && (
            <Badge className="flex items-center space-x-1" variant="secondary">
              <span>Search: {searchQuery}</span>
              <Button
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleSearchChange("")}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filterCategory && (
            <Badge className="flex items-center space-x-1" variant="secondary">
              <span>Category: {filterCategory}</span>
              <Button
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleCategoryChange("all")}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {(minSize || maxSize) && (
            <Badge className="flex items-center space-x-1" variant="secondary">
              <span>
                Size: {minSize && `${minSize}KB`}
                {minSize && maxSize && " - "}
                {maxSize && `${maxSize}KB`}
              </span>
              <Button
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => {
                  setMinSize("");
                  setMaxSize("");
                  updateFilters({});
                }}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {(dateFrom || dateTo) && (
            <Badge className="flex items-center space-x-1" variant="secondary">
              <span>
                Date: {dateFrom && format(dateFrom, "MMM d")}
                {dateFrom && dateTo && " - "}
                {dateTo && format(dateTo, "MMM d")}
              </span>
              <Button
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  updateFilters({});
                }}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          <Button
            className="text-muted-foreground hover:text-foreground"
            onClick={handleClearFilters}
            size="sm"
            variant="ghost"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
