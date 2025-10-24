"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Dialog, DialogContent } from "@kaa/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { Progress } from "@kaa/ui/components/progress";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { cn } from "@kaa/ui/lib/utils";
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Grid3X3,
  Maximize,
  MessageSquare,
  Minimize,
  MousePointer,
  Printer,
  RotateCw,
  ScanLine,
  Search,
  Share2,
  Square,
  Target,
  Trash2,
  Type,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import { useDocument } from "../document.queries";
import { useDocumentStore } from "../document.store";
import { DocumentStatus, type IDocument } from "../document.type";
import {
  formatFileSize,
  formatRelativeDate,
  getDocumentIcon,
} from "../utils/document-utils";

type DocumentViewerProps = {
  documentId?: string;
  document?: IDocument;
  isOpen?: boolean;
  onClose?: () => void;
  mode?: "modal" | "embedded";
  showToolbar?: boolean;
  showSidebar?: boolean;
  enableAnnotations?: boolean;
  enableSearch?: boolean;
  className?: string;
};

type Annotation = {
  id: string;
  type: "highlight" | "note" | "rectangle" | "circle" | "arrow" | "text";
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  content?: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
};

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];
const DEFAULT_ZOOM = 1;
const ANNOTATION_COLORS = [
  "#FFE066", // Yellow
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Light Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
  "#F7DC6F", // Gold
  "#BB8FCE", // Light Purple
];

export function DocumentViewer({
  documentId,
  document: providedDocument,
  isOpen: providedIsOpen,
  onClose: providedOnClose,
  mode = "modal",
  showToolbar: propShowToolbar = true,
  showSidebar: propShowSidebar = false,
  enableAnnotations = true,
  enableSearch = true,
  className,
}: DocumentViewerProps) {
  const {
    currentDocument,
    isViewerModalOpen,
    setViewerModalOpen,
    setCurrentDocument,
  } = useDocumentStore();

  // Use provided props or store state
  const isOpen = providedIsOpen ?? isViewerModalOpen;
  const document = providedDocument ?? currentDocument;
  const onClose =
    providedOnClose ??
    (() => {
      setViewerModalOpen(false);
      setCurrentDocument(null);
    });

  // Fetch document if only ID is provided
  const { data: fetchedDocument, isLoading: isDocumentLoading } = useDocument(
    documentId || "",
    !!documentId && !providedDocument
  );

  const activeDocument = document || fetchedDocument?.data;
  console.log(activeDocument);

  // Download mutation
  // Download functionality - simplified for now
  const downloadDocument = React.useCallback((document: IDocument) => {
    if (document.file) {
      const link = window.document.createElement("a");
      link.href = document.file;
      link.download = document.name;
      link.click();
    }
  }, []);

  // Viewer state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [zoom, setZoom] = React.useState(DEFAULT_ZOOM);
  const [rotation, setRotation] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [fitMode, setFitMode] = React.useState<
    "width" | "height" | "page" | "auto"
  >("auto");

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [currentSearchResult, setCurrentSearchResult] = React.useState(0);
  const [isSearching, setIsSearching] = React.useState(false);

  // Annotation state
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = React.useState<
    string | null
  >(null);
  const [annotationMode, setAnnotationMode] = React.useState<
    Annotation["type"] | "select"
  >("select");
  const [showAnnotations, setShowAnnotations] = React.useState(true);
  const [annotationColor, setAnnotationColor] = React.useState(
    ANNOTATION_COLORS[0]
  );

  // UI state - use props if provided, otherwise use state
  const [showToolbarState, setShowToolbarState] =
    React.useState(propShowToolbar);
  const [showSidebarState, setShowSidebarState] =
    React.useState(propShowSidebar);
  const showToolbar =
    propShowToolbar !== undefined ? propShowToolbar : showToolbarState;
  const showSidebar =
    propShowSidebar !== undefined ? propShowSidebar : showSidebarState;
  const [sidebarTab, setSidebarTab] = React.useState<
    "thumbnails" | "annotations" | "info"
  >("thumbnails");
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingProgress, setLoadingProgress] = React.useState(0);

  // Refs
  const viewerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Keyboard shortcuts
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "=":
          case "+":
            e.preventDefault();
            handleZoomIn();
            break;
          case "-":
            e.preventDefault();
            handleZoomOut();
            break;
          case "0":
            e.preventDefault();
            setZoom(DEFAULT_ZOOM);
            break;
          case "f":
            e.preventDefault();
            handleToggleFullscreen();
            break;
          case "s":
            e.preventDefault();
            handleDownload();
            break;
          case "p":
            e.preventDefault();
            handlePrint();
            break;
          default:
            break;
        }
      } else {
        switch (e.key) {
          case "ArrowLeft":
            if (currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
            break;
          case "ArrowRight":
            if (currentPage < totalPages) {
              setCurrentPage(currentPage + 1);
            }
            break;
          case "Home":
            setCurrentPage(1);
            break;
          case "End":
            setCurrentPage(totalPages);
            break;
          case "Escape":
            if (isFullscreen) {
              setIsFullscreen(false);
            } else {
              onClose();
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentPage, totalPages, isFullscreen, onClose]);

  // Zoom handlers
  const handleZoomIn = React.useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1] ?? 0);
    }
  }, [zoom]);

  const handleZoomOut = React.useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1] ?? 0);
    }
  }, [zoom]);

  const handleZoomToFit = React.useCallback((mode: typeof fitMode) => {
    setFitMode(mode);
    // Calculate appropriate zoom based on container size
    // This would normally integrate with PDF.js or similar
    if (mode === "width") {
      setZoom(1.2);
    } else if (mode === "height") {
      setZoom(0.8);
    } else if (mode === "page") {
      setZoom(1);
    }
  }, []);

  // Navigation handlers
  const handlePrevPage = React.useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = React.useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const handleGoToPage = React.useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  // Document actions
  const handleDownload = React.useCallback(() => {
    if (!activeDocument) return;

    downloadDocument(activeDocument);
  }, [activeDocument, downloadDocument]);

  const handlePrint = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  const handleShare = React.useCallback(() => {
    if (!activeDocument) return;

    if (navigator.share) {
      navigator.share({
        title: activeDocument.name,
        text: `Check out this document: ${activeDocument.name}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  }, [activeDocument]);

  // Fullscreen handlers
  const handleToggleFullscreen = React.useCallback(() => {
    if (window.document?.fullscreenElement) {
      window.document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  // Search handlers
  const handleSearch = React.useCallback(
    (query: string) => {
      if (!enableSearch) return;

      setSearchQuery(query);
      setIsSearching(true);

      // Simulate search - would integrate with PDF.js text search
      setTimeout(() => {
        const mockResults = query
          ? [
              { page: 1, x: 100, y: 200, width: 80, height: 20 },
              { page: 2, x: 150, y: 300, width: 90, height: 20 },
            ]
          : [];
        setSearchResults(mockResults);
        setCurrentSearchResult(0);
        setIsSearching(false);
      }, 500);
    },
    [enableSearch]
  );

  const handleNextSearchResult = React.useCallback(() => {
    if (searchResults.length > 0) {
      const next = (currentSearchResult + 1) % searchResults.length;
      setCurrentSearchResult(next);
      setCurrentPage(searchResults[next].page);
    }
  }, [searchResults, currentSearchResult]);

  const handlePrevSearchResult = React.useCallback(() => {
    if (searchResults.length > 0) {
      const prev =
        currentSearchResult === 0
          ? searchResults.length - 1
          : currentSearchResult - 1;
      setCurrentSearchResult(prev);
      setCurrentPage(searchResults[prev].page);
    }
  }, [searchResults, currentSearchResult]);

  // Annotation handlers
  const handleAddAnnotation = React.useCallback(
    (annotation: Omit<Annotation, "id" | "author" | "createdAt">) => {
      if (!enableAnnotations) return;

      const newAnnotation: Annotation = {
        ...annotation,
        id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        author: "Current User", // Would come from auth context
        createdAt: new Date().toISOString(),
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
    },
    [enableAnnotations]
  );

  const handleDeleteAnnotation = React.useCallback(
    (id: string) => {
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      if (selectedAnnotation === id) {
        setSelectedAnnotation(null);
      }
    },
    [selectedAnnotation]
  );

  const handleUpdateAnnotation = React.useCallback(
    (id: string, updates: Partial<Annotation>) => {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, ...updates, updatedAt: new Date().toISOString() }
            : a
        )
      );
    },
    []
  );

  // Mock document loading simulation
  React.useEffect(() => {
    if (activeDocument && isOpen) {
      setIsLoading(true);
      setLoadingProgress(0);

      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsLoading(false);
            setTotalPages(5); // Mock page count
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [activeDocument, isOpen]);

  // For embedded mode, don't check isOpen
  if (mode === "modal" && !isOpen) {
    return null;
  }

  if (!activeDocument) {
    return null;
  }

  console.log(isOpen);

  const isPDF = activeDocument.mimeType === "application/pdf";
  const isImage = activeDocument.mimeType.startsWith("image/");
  const isVideo = activeDocument.mimeType.startsWith("video/");
  const isAudio = activeDocument.mimeType.startsWith("audio/");

  console.log(isImage);

  // For now, we'll use a simple file icon - this could be enhanced with lucide icons
  const statusIcon = getDocumentIcon(
    activeDocument.mimeType,
    activeDocument.category
  );

  const renderToolbar = () => (
    <div className="flex items-center justify-between border-b bg-background p-2">
      <div className="flex items-center space-x-2">
        {/* Navigation */}
        <div className="flex items-center space-x-1 border-r pr-2">
          <Button
            disabled={currentPage === 1}
            onClick={handlePrevPage}
            size="sm"
            variant="ghost"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-1">
            <Input
              className="h-8 w-16 text-center"
              max={totalPages}
              min={1}
              onChange={(e) => handleGoToPage(Number(e.target.value))}
              type="number"
              value={currentPage}
            />
            <span className="text-muted-foreground text-sm">
              of {totalPages}
            </span>
          </div>

          <Button
            disabled={currentPage === totalPages}
            onClick={handleNextPage}
            size="sm"
            variant="ghost"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            size="sm"
            variant="ghost"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            size="sm"
            variant="ghost"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center space-x-1 border-r pr-2">
          <Button
            disabled={zoom === ZOOM_LEVELS[0]}
            onClick={handleZoomOut}
            size="sm"
            variant="ghost"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Select
            onValueChange={(value) => setZoom(Number(value))}
            value={zoom.toString()}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZOOM_LEVELS.map((level) => (
                <SelectItem key={level} value={level.toString()}>
                  {Math.round(level * 100)}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            disabled={zoom === ZOOM_LEVELS.at(-1)}
            onClick={handleZoomIn}
            size="sm"
            variant="ghost"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Fit options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <Target className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleZoomToFit("width")}>
                Fit Width
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomToFit("height")}>
                Fit Height
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomToFit("page")}>
                Fit Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setZoom(DEFAULT_ZOOM)}>
                Actual Size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tools */}
        <div className="flex items-center space-x-1 border-r pr-2">
          <Button
            onClick={() => setRotation((rotation + 90) % 360)}
            size="sm"
            variant="ghost"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Annotation tools */}
          {isPDF && enableAnnotations && (
            <>
              <Button
                onClick={() => setAnnotationMode("select")}
                size="sm"
                variant={annotationMode === "select" ? "default" : "ghost"}
              >
                <MousePointer className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant={annotationMode !== "select" ? "default" : "ghost"}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => setAnnotationMode("highlight")}
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Highlight
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAnnotationMode("note")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Note
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setAnnotationMode("rectangle")}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Rectangle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAnnotationMode("circle")}>
                    <Circle className="mr-2 h-4 w-4" />
                    Circle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAnnotationMode("arrow")}>
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Arrow
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAnnotationMode("text")}>
                    <Type className="mr-2 h-4 w-4" />
                    Text
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Color picker for annotations */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="p-1" size="sm" variant="ghost">
                    <div
                      className="h-4 w-4 rounded border"
                      style={{ backgroundColor: annotationColor }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40">
                  <div className="grid grid-cols-5 gap-1">
                    {ANNOTATION_COLORS.map((color) => (
                      <Button
                        className="h-8 w-8 p-1"
                        key={color}
                        onClick={() => setAnnotationColor(color)}
                        size="sm"
                        variant="ghost"
                      >
                        <div
                          className="h-full w-full rounded border-2"
                          style={{
                            backgroundColor: color,
                            borderColor:
                              color === annotationColor
                                ? "#000"
                                : "transparent",
                          }}
                        />
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                onClick={() => setShowAnnotations(!showAnnotations)}
                size="sm"
                variant="ghost"
              >
                {showAnnotations ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>

        {/* Search */}
        {enableSearch && (
          <div className="flex items-center space-x-1">
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3 w-3 transform text-muted-foreground" />
              <Input
                className="h-8 w-48 pl-7"
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search document..."
                value={searchQuery}
              />
            </div>

            {searchResults.length > 0 && (
              <>
                <Button
                  onClick={handlePrevSearchResult}
                  size="sm"
                  variant="ghost"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-muted-foreground text-xs">
                  {currentSearchResult + 1} of {searchResults.length}
                </span>
                <Button
                  onClick={handleNextSearchResult}
                  size="sm"
                  variant="ghost"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {propShowSidebar === undefined && (
          <Button
            onClick={() => setShowSidebarState(!showSidebarState)}
            size="sm"
            variant="ghost"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        )}

        <Button
          disabled={false}
          onClick={handleDownload}
          size="sm"
          variant="ghost"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button onClick={handleShare} size="sm" variant="ghost">
          <Share2 className="h-4 w-4" />
        </Button>

        <Button onClick={handlePrint} size="sm" variant="ghost">
          <Printer className="h-4 w-4" />
        </Button>

        <Button onClick={handleToggleFullscreen} size="sm" variant="ghost">
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>

        {mode === "modal" && onClose && (
          <Button onClick={onClose} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="flex w-80 flex-col border-r bg-muted/20">
      <div className="border-b p-2">
        <Tabs
          onValueChange={(value) => setSidebarTab(value as any)}
          value={sidebarTab}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger className="text-xs" value="thumbnails">
              Pages
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="annotations">
              Notes
            </TabsTrigger>
            <TabsTrigger className="text-xs" value="info">
              Info
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <Tabs className="w-full" value={sidebarTab}>
          <TabsContent className="space-y-2 p-2" value="thumbnails">
            {/* Page thumbnails */}
            {Array.from({ length: totalPages }, (_, i) => (
              <Card
                className={cn(
                  "cursor-pointer transition-shadow hover:shadow-sm",
                  currentPage === i + 1 && "ring-2 ring-primary"
                )}
                key={(i + 1).toString()}
                onClick={() => setCurrentPage(i + 1)}
              >
                <CardContent className="p-2">
                  <div className="mb-2 flex aspect-3/4 items-center justify-center rounded bg-muted">
                    <span className="h-8 w-8 text-muted-foreground">
                      {statusIcon}
                    </span>
                  </div>
                  <div className="text-center text-muted-foreground text-xs">
                    Page {i + 1}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent className="space-y-2 p-2" value="annotations">
            {annotations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No annotations yet
              </div>
            ) : (
              annotations.map((annotation) => (
                <Card
                  className={cn(
                    "cursor-pointer transition-shadow hover:shadow-sm",
                    selectedAnnotation === annotation.id &&
                      "ring-1 ring-primary"
                  )}
                  key={annotation.id}
                  onClick={() => {
                    setSelectedAnnotation(annotation.id);
                    setCurrentPage(annotation.page);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: annotation.color }}
                        />
                        <Badge className="text-xs" variant="outline">
                          {annotation.type}
                        </Badge>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnnotation(annotation.id);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {annotation.content && (
                      <p className="mb-2 text-muted-foreground text-xs">
                        {annotation.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Page {annotation.page}</span>
                      <span>{formatRelativeDate(annotation.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent className="space-y-4 p-2" value="info">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{activeDocument.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Label className="text-muted-foreground">Size</Label>
                  <div>{formatFileSize(activeDocument.size)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div>{activeDocument.mimeType}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    className="text-xs"
                    variant={
                      activeDocument.status === DocumentStatus.VERIFIED
                        ? "default"
                        : "secondary"
                    }
                  >
                    {activeDocument.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pages</Label>
                  <div>{totalPages}</div>
                </div>
              </div>
            </div>

            {activeDocument.metadata?.extractedData && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Extracted Data</h4>
                <div className="space-y-1 text-xs">
                  {Object.entries(activeDocument.metadata.extractedData).map(
                    ([key, value]) => (
                      <div className="flex justify-between" key={key}>
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span>{String(value)}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {activeDocument.tags && activeDocument.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {activeDocument.tags.map((tag) => (
                    <Badge className="text-xs" key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );

  const renderViewer = () => (
    <div className="relative flex-1 overflow-hidden">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <div className="space-y-4 text-center">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
            <div>
              <div className="font-medium text-sm">Loading document...</div>
              <div className="mb-2 text-muted-foreground text-xs">
                {activeDocument.name}
              </div>
              <Progress className="w-64" value={loadingProgress} />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full overflow-auto bg-gray-100 dark:bg-gray-900">
          <div
            className="flex min-h-full items-center justify-center p-4"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          >
            {isPDF ? (
              // PDF viewer placeholder - would integrate with PDF.js
              <div className="w-full max-w-4xl bg-white shadow-lg dark:bg-gray-800">
                <div className="relative flex aspect-[8.5/11] items-center justify-center border">
                  <FileText className="h-32 w-32 text-muted-foreground" />
                  <div className="absolute top-4 left-4 font-medium text-sm">
                    Page {currentPage} of {totalPages}
                  </div>

                  {/* Mock search highlights */}
                  {searchResults
                    .filter((result) => result.page === currentPage)
                    .map((result, index) => (
                      <div
                        className="pointer-events-none absolute bg-yellow-300 opacity-50"
                        key={index.toString()}
                        style={{
                          left: result.x,
                          top: result.y,
                          width: result.width,
                          height: result.height,
                        }}
                      />
                    ))}

                  {/* Mock annotations */}
                  {showAnnotations &&
                    annotations
                      .filter((annotation) => annotation.page === currentPage)
                      .map((annotation) => (
                        <div
                          className={cn(
                            "absolute cursor-pointer border-2",
                            selectedAnnotation === annotation.id
                              ? "border-black"
                              : "border-transparent"
                          )}
                          key={annotation.id}
                          onClick={() => setSelectedAnnotation(annotation.id)}
                          style={{
                            left: annotation.x,
                            top: annotation.y,
                            width: annotation.width,
                            height: annotation.height,
                            backgroundColor: `${annotation.color}80`, // 50% opacity
                          }}
                        >
                          {annotation.content && (
                            <div className="-top-6 absolute left-0 max-w-32 truncate rounded bg-black px-1 py-0.5 text-white text-xs">
                              {annotation.content}
                            </div>
                          )}
                        </div>
                      ))}
                </div>
              </div>
            ) : isImage ? (
              // Image viewer
              <div className="max-h-full max-w-full">
                <Image
                  alt={activeDocument.name}
                  className="max-h-full max-w-full object-contain"
                  fill
                  src={activeDocument.file}
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </div>
            ) : isVideo ? (
              // Video player
              <div className="max-h-full max-w-full">
                {/* biome-ignore lint/a11y/useMediaCaption: ignore */}
                <video
                  className="max-h-full max-w-full"
                  controls
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <source
                    src={activeDocument.file}
                    type={activeDocument.mimeType}
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : isAudio ? (
              // Audio player
              <div className="flex items-center justify-center">
                <div className="space-y-4 text-center">
                  <FileText className="mx-auto h-32 w-32 text-muted-foreground" />
                  {/* biome-ignore lint/a11y/useMediaCaption: ignore */}
                  <audio className="w-96" controls>
                    <source
                      src={activeDocument.file}
                      type={activeDocument.mimeType}
                    />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            ) : (
              // Generic file viewer
              <div className="space-y-4 text-center">
                <FileText className="mx-auto h-32 w-32 text-muted-foreground" />
                <div>
                  <div className="font-medium text-lg">
                    {activeDocument.name}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {formatFileSize(activeDocument.size)} •{" "}
                    {activeDocument.mimeType}
                  </div>
                </div>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download to View
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const viewerContent = (
    <div className="flex h-full flex-col" ref={viewerRef}>
      {showToolbar && renderToolbar()}

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && renderSidebar()}
        {renderViewer()}
      </div>
    </div>
  );

  if (mode === "embedded") {
    return (
      <div className={cn("h-full w-full", className)}>{viewerContent}</div>
    );
  }

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent
        className={cn("h-screen max-h-full w-screen max-w-full p-0", className)}
      >
        {viewerContent}
      </DialogContent>
    </Dialog>
  );
}
