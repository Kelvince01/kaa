"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@kaa/ui/components/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@kaa/ui/components/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import { cn } from "@kaa/ui/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  Grid,
  List,
  MoreHorizontal,
  RefreshCw,
  Search,
  Share2,
  SortAsc,
  SortDesc,
  Star,
  StarOff,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import { Empty } from "@/components/ui/empty";
import {
  useDeleteDocument,
  useDocuments,
  useDownloadDocument,
  useShareDocument,
  useUpdateDocument,
} from "../document.queries";
import { useDocumentStore } from "../document.store";
import {
  DocumentCategory,
  DocumentPriority,
  DocumentStatus,
  type IDocument,
} from "../document.type";
import { formatFileSize, getDocumentIcon } from "../utils/document-utils";

type DocumentListProps = {
  className?: string;
  category?: DocumentCategory;
  showHeader?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  maxHeight?: string;
  onDocumentClick?: (document: IDocument) => void;
  onDocumentSelect?: (document: IDocument) => void;
};

const statusIcons = {
  [DocumentStatus.PENDING]: Clock,
  [DocumentStatus.PROCESSING]: RefreshCw,
  [DocumentStatus.VERIFIED]: CheckCircle,
  [DocumentStatus.REJECTED]: XCircle,
  [DocumentStatus.EXPIRED]: AlertTriangle,
  [DocumentStatus.ERROR]: AlertTriangle,
};

const priorityLabels = {
  [DocumentPriority.LOW]: "Low",
  [DocumentPriority.NORMAL]: "Normal",
  [DocumentPriority.HIGH]: "High",
  [DocumentPriority.URGENT]: "Urgent",
};

const categoryLabels = {
  [DocumentCategory.GENERAL]: "General",
  [DocumentCategory.IDENTITY]: "Identity",
  [DocumentCategory.ADDRESS]: "Address",
  [DocumentCategory.INCOME]: "Income",
  [DocumentCategory.REFERENCES]: "References",
  [DocumentCategory.OTHER]: "Other",
};

export function DocumentList({
  className,
  category,
  showHeader = true,
  showFilters = true,
  showPagination = true,
  maxHeight,
  onDocumentClick,
  onDocumentSelect,
}: DocumentListProps) {
  const {
    filter,
    viewMode,
    selectedDocuments,
    setFilter,
    setViewMode,
    toggleDocumentSelection,
    clearSelection,
    selectAll,
    hasSelection,
    selectionCount,
    isFavorite,
    toggleFavorite,
    setCurrentDocument,
    setViewerModalOpen,
  } = useDocumentStore();

  // Apply category filter if provided
  const currentFilter = React.useMemo(() => {
    if (category) {
      return { ...filter, category: [category] };
    }
    if (filter.category) {
      return {
        ...filter,
        category:
          filter.category.length > 0
            ? filter.category
            : [DocumentCategory.GENERAL],
      };
    }
    if (filter.category === undefined) {
      return { ...filter, category: [DocumentCategory.GENERAL] };
    }

    return filter;
  }, [filter, category]);

  const { data, isLoading, isError, refetch } = useDocuments(currentFilter);

  const documents = data?.data || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  // Search handling
  const [searchTerm, setSearchTerm] = React.useState(filter.search || "");
  const [sortBy, setSortBy] = React.useState(filter.sortBy || "uploadedAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">(
    filter.sortOrder || "desc"
  );

  const handleSearch = React.useCallback(
    (value: string) => {
      setSearchTerm(value);
      setFilter({ search: value || undefined, page: 1 });
    },
    [setFilter]
  );

  const handleSort = React.useCallback(
    (field: string) => {
      const newOrder =
        sortBy === field && sortOrder === "desc" ? "asc" : "desc";
      setSortBy(field);
      setSortOrder(newOrder);
      setFilter({ sortBy: field, sortOrder: newOrder, page: 1 });
    },
    [sortBy, sortOrder, setFilter]
  );

  const handlePageChange = React.useCallback(
    (page: number) => {
      setFilter({ page });
    },
    [setFilter]
  );

  // Mutations
  const downloadMutation = useDownloadDocument();
  const deleteMutation = useDeleteDocument();
  const shareMutation = useShareDocument();
  const updateMutation = useUpdateDocument();

  // Modal states
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedDocumentForAction, setSelectedDocumentForAction] =
    React.useState<IDocument | null>(null);

  // Share form state
  const [shareSettings, setShareSettings] = React.useState({
    isPublic: false,
    allowDownload: true,
    expiresAt: "",
    passwordProtected: false,
    password: "",
  });

  // Edit form state
  const [editForm, setEditForm] = React.useState({
    name: "",
    description: "",
    tags: [] as string[],
    expiryDate: "",
  });

  const handleSelectAll = React.useCallback(() => {
    if (hasSelection()) {
      clearSelection();
    } else {
      selectAll(documents.map((doc) => doc._id));
    }
  }, [documents, hasSelection, clearSelection, selectAll]);

  const handleDocumentClick = React.useCallback(
    (document: IDocument) => {
      if (onDocumentClick) {
        onDocumentClick(document);
      } else {
        setCurrentDocument(document);
        setViewerModalOpen(true);
      }
    },
    [onDocumentClick, setCurrentDocument, setViewerModalOpen]
  );

  const handleDocumentSelect = React.useCallback(
    (document: IDocument, event: React.MouseEvent) => {
      event.stopPropagation();
      if (onDocumentSelect) {
        onDocumentSelect(document);
      } else {
        toggleDocumentSelection(document._id);
      }
    },
    [onDocumentSelect, toggleDocumentSelection]
  );

  // Document action handlers
  const handleDownload = React.useCallback(
    (document: IDocument) => {
      downloadMutation.mutate({
        id: document._id,
        filename: document.name,
      });
    },
    [downloadMutation]
  );

  const handleDelete = React.useCallback((document: IDocument) => {
    setSelectedDocumentForAction(document);
    setDeleteDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((document: IDocument) => {
    setSelectedDocumentForAction(document);
    setEditForm({
      name: document.name,
      description: document.metadata?.description || "",
      tags: document.tags || [],
      expiryDate: document.expiryDate
        ? new Date(document.expiryDate).toISOString().split("T")[0] || ""
        : "",
    });
    setEditDialogOpen(true);
  }, []);

  const handleShare = React.useCallback((document: IDocument) => {
    setSelectedDocumentForAction(document);
    setShareSettings({
      isPublic: false,
      allowDownload: true,
      expiresAt: "",
      passwordProtected: false,
      password: "",
    });
    setShareDialogOpen(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (selectedDocumentForAction) {
      deleteMutation.mutate(selectedDocumentForAction._id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedDocumentForAction(null);
        },
      });
    }
  }, [selectedDocumentForAction, deleteMutation]);

  const confirmShare = React.useCallback(() => {
    if (selectedDocumentForAction) {
      shareMutation.mutate(
        {
          id: selectedDocumentForAction._id,
          settings: shareSettings,
        },
        {
          onSuccess: (response) => {
            if (response.shareLink) {
              // Copy share link to clipboard
              navigator.clipboard
                .writeText(response.shareLink)
                .then(() => toast.success("Share link copied to clipboard!"))
                .catch(() => toast.info(`Share link: ${response.shareLink}`));
            }
            setShareDialogOpen(false);
            setSelectedDocumentForAction(null);
          },
        }
      );
    }
  }, [selectedDocumentForAction, shareMutation, shareSettings]);

  const confirmEdit = React.useCallback(() => {
    if (selectedDocumentForAction) {
      updateMutation.mutate(
        {
          id: selectedDocumentForAction._id,
          input: {
            name: editForm.name,
            metadata: {
              description: editForm.description || undefined,
            },
            expiryDate: editForm.expiryDate || undefined,
            tags: editForm.tags.length > 0 ? editForm.tags : undefined,
          },
        },
        {
          onSuccess: () => {
            setEditDialogOpen(false);
            setSelectedDocumentForAction(null);
          },
        }
      );
    }
  }, [selectedDocumentForAction, updateMutation, editForm]);

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <SortAsc className="h-3 w-3" />
    ) : (
      <SortDesc className="h-3 w-3" />
    );
  };

  const renderDocumentCard = (document: IDocument) => {
    const StatusIcon = statusIcons[document.status];
    const fileIcon = getDocumentIcon(document.mimeType, document.category);
    const isSelected = selectedDocuments.includes(document._id);
    const isFav = isFavorite(document._id);

    return (
      <Card
        className={cn(
          "group relative cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected && "shadow-md ring-2 ring-primary",
          className
        )}
        key={document._id}
        onClick={() => handleDocumentClick(document)}
      >
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(_checked) =>
              handleDocumentSelect(document, {
                stopPropagation: () => {
                  return;
                },
              } as React.MouseEvent)
            }
            onClick={(e) => handleDocumentSelect(document, e)}
          />
        </div>

        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                size="sm"
                variant="ghost"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDocumentClick(document);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(document);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(document._id);
                }}
              >
                {isFav ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" />
                    Remove from favorites
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Add to favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(document);
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(document);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(document);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardContent className="p-4">
          <div className="flex flex-col space-y-3">
            {/* File icon and preview */}
            <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {document.preview ? (
                <Image
                  alt={document.name}
                  className="h-full w-full object-cover"
                  height={100}
                  src={document.preview}
                  width={100}
                />
              ) : (
                <FileText className="h-12 w-12 text-muted-foreground" />
              )}

              {/* Status indicator */}
              <div className="absolute right-2 bottom-2">
                <Badge className="text-xs" variant="secondary">
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {document.status}
                </Badge>
              </div>

              {/* Favorite indicator */}
              {isFav && (
                <div className="absolute top-2 left-2">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                </div>
              )}
            </div>

            {/* Document info */}
            <div className="space-y-2">
              <div>
                <h4 className="truncate font-medium" title={document.name}>
                  {document.name}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {formatFileSize(document.size)} • {document.type}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Badge className="text-xs" variant="outline">
                  {categoryLabels[document.category]}
                </Badge>

                {document.priority &&
                  document.priority > DocumentPriority.NORMAL && (
                    <Badge
                      variant={
                        document.priority === DocumentPriority.URGENT
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {priorityLabels[document.priority]}
                    </Badge>
                  )}
              </div>

              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {document.tags.slice(0, 2).map((tag) => (
                    <Badge className="text-xs" key={tag} variant="outline">
                      <Tag className="mr-1 h-2 w-2" />
                      {tag}
                    </Badge>
                  ))}
                  {document.tags.length > 2 && (
                    <Badge className="text-xs" variant="outline">
                      +{document.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              <div className="text-muted-foreground text-xs">
                Uploaded{" "}
                {formatDistanceToNow(new Date(document.uploadedAt), {
                  addSuffix: true,
                })}
              </div>

              {document.expiryDate && (
                <div className="flex items-center text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  Expires{" "}
                  {format(new Date(document.expiryDate), "MMM dd, yyyy")}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDocumentRow = (document: IDocument) => {
    const StatusIcon = statusIcons[document.status];
    const fileIcon = getDocumentIcon(document.mimeType, document.category);
    const isSelected = selectedDocuments.includes(document._id);
    const isFav = isFavorite(document._id);

    return (
      <TableRow
        className={cn("group cursor-pointer", isSelected && "bg-muted/50")}
        key={document._id}
        onClick={() => handleDocumentClick(document)}
      >
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(_checked) =>
              handleDocumentSelect(document, {
                stopPropagation: () => {
                  return;
                },
              } as React.MouseEvent)
            }
            onClick={(e) => handleDocumentSelect(document, e)}
          />
        </TableCell>

        <TableCell>
          <div className="flex items-center space-x-3">
            <div className="relative">
              {document.preview ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage alt={document.name} src={document.preview} />
                  <AvatarFallback>
                    <FileText className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                  <FileText className="h-4 w-4" />
                </div>
              )}
              {isFav && (
                <Star className="-top-1 -right-1 absolute h-3 w-3 fill-yellow-500 text-yellow-500" />
              )}
            </div>
            <div>
              <div className="font-medium">{document.name}</div>
              <div className="text-muted-foreground text-sm">
                {formatFileSize(document.size)} • {document.type}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <Badge className="text-xs" variant="outline">
            {categoryLabels[document.category]}
          </Badge>
        </TableCell>

        <TableCell>
          <Badge className="text-xs" variant="secondary">
            <StatusIcon className="mr-1 h-3 w-3" />
            {document.status}
          </Badge>
        </TableCell>

        <TableCell>
          {document.priority && document.priority > DocumentPriority.NORMAL && (
            <Badge
              variant={
                document.priority === DocumentPriority.URGENT
                  ? "destructive"
                  : "secondary"
              }
            >
              {priorityLabels[document.priority]}
            </Badge>
          )}
        </TableCell>

        <TableCell>
          {document.tags && document.tags.length > 0 && (
            <div className="flex max-w-32 flex-wrap gap-1">
              {document.tags.slice(0, 1).map((tag) => (
                <Badge className="text-xs" key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 1 && (
                <Badge className="text-xs" variant="outline">
                  +{document.tags.length - 1}
                </Badge>
              )}
            </div>
          )}
        </TableCell>

        <TableCell>
          <div className="text-sm">
            {formatDistanceToNow(new Date(document.uploadedAt), {
              addSuffix: true,
            })}
          </div>
        </TableCell>

        <TableCell>
          {document.expiryDate && (
            <div className="text-sm">
              {format(new Date(document.expiryDate), "MMM dd, yyyy")}
            </div>
          )}
        </TableCell>

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                size="sm"
                variant="ghost"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDocumentClick(document);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(document);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(document._id);
                }}
              >
                {isFav ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" />
                    Remove from favorites
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Add to favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(document);
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(document);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(document);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  if (isError) {
    return (
      <div className="space-y-4">
        <Empty
          action={
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          }
          description="There was an error loading your documents. Please try again."
          title="Failed to load documents"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">Documents</h2>
            {summary && (
              <p className="text-muted-foreground">
                {summary.totalDocuments} documents
                {summary.pendingVerification > 0 && (
                  <span className="text-orange-600">
                    {" "}
                    • {summary.pendingVerification} pending verification
                  </span>
                )}
                {summary.expiringThisMonth > 0 && (
                  <span className="text-red-600">
                    {" "}
                    • {summary.expiringThisMonth} expiring this month
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            <div className="flex rounded-lg border p-1">
              <Button
                onClick={() => setViewMode("grid")}
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setViewMode("list")}
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setViewMode("table")}
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>

            <Button
              disabled={isLoading}
              onClick={() => refetch()}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 space-x-2">
          {/* Search */}
          <div className="relative min-w-64 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search documents..."
              value={searchTerm}
            />
          </div>

          {/* Category filter */}
          {!category && (
            <Select
              onValueChange={(value) =>
                setFilter({
                  category:
                    value === "all" ? undefined : [value as DocumentCategory],
                  page: 1,
                })
              }
              value={filter.category?.[0] || "all"}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status filter */}
          <Select
            onValueChange={(value) =>
              setFilter({
                status: value === "all" ? undefined : [value as DocumentStatus],
                page: 1,
              })
            }
            value={filter.status?.[0] || "all"}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.values(DocumentStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Items per page */}
          <Select
            onValueChange={(value) =>
              setFilter({ limit: Number.parseInt(value, 10), page: 1 })
            }
            value={filter.limit?.toString() || "20"}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Bulk actions */}
      {hasSelection() && (
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-sm">
              {selectionCount()} document{selectionCount() === 1 ? "" : "s"}{" "}
              selected
            </span>
            <Button onClick={clearSelection} size="sm" variant="outline">
              Clear selection
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button size="sm" variant="outline">
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button size="sm" variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(maxHeight && "overflow-auto")} style={{ maxHeight }}>
        {isLoading ? (
          <div className="space-y-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i.toString()}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <div className="flex justify-between">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-12" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton className="h-16 w-full" key={i.toString()} />
                ))}
              </div>
            )}
          </div>
        ) : documents.length === 0 ? (
          <Empty
            action={
              filter.search || filter.category || filter.status ? (
                <Button onClick={() => setFilter({})} variant="outline">
                  Clear filters
                </Button>
              ) : undefined
            }
            description={
              filter.search || filter.category || filter.status
                ? "No documents match your current filters. Try adjusting your search criteria."
                : "You haven't uploaded any documents yet. Upload your first document to get started."
            }
            title="No documents found"
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map(renderDocumentCard)}
          </div>
        ) : viewMode === "table" ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        hasSelection() && selectionCount() === documents.length
                          ? true
                          : "indeterminate"
                      }
                      // indeterminate={hasSelection() && selectionCount() < documents.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("name")}
                      variant="ghost"
                    >
                      Name
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>
                    <Button
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort("uploadedAt")}
                      variant="ghost"
                    >
                      Uploaded
                      {getSortIcon("uploadedAt")}
                    </Button>
                  </TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>{documents.map(renderDocumentRow)}</TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((document) => (
              <Card
                className={cn(
                  "group cursor-pointer transition-shadow hover:shadow-sm",
                  selectedDocuments.includes(document._id) &&
                    "ring-1 ring-primary"
                )}
                key={document._id}
                onClick={() => handleDocumentClick(document)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedDocuments.includes(document._id)}
                      onCheckedChange={(_checked) =>
                        handleDocumentSelect(document, {
                          stopPropagation: () => {
                            return;
                          },
                        } as React.MouseEvent)
                      }
                      onClick={(e) => handleDocumentSelect(document, e)}
                    />

                    <div className="flex flex-1 items-center space-x-3">
                      <div className="relative">
                        {document.preview ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              alt={document.name}
                              src={document.preview}
                            />
                            <AvatarFallback>
                              <FileText className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <FileText className="h-5 w-5" />
                          </div>
                        )}
                        {isFavorite(document._id) && (
                          <Star className="-top-1 -right-1 absolute h-3 w-3 fill-yellow-500 text-yellow-500" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{document.name}</h4>
                          <Badge className="text-xs" variant="outline">
                            {categoryLabels[document.category]}
                          </Badge>
                          <Badge className="text-xs" variant="secondary">
                            {/* <StatusIcon className="mr-1 h-3 w-3" /> */}
                            {document.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {formatFileSize(document.size)} • {document.type} •
                          Uploaded{" "}
                          {formatDistanceToNow(new Date(document.uploadedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(document._id);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        {isFavorite(document._id) ? (
                          <StarOff className="h-4 w-4" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            onClick={(e) => e.stopPropagation()}
                            size="sm"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentClick(document);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle download
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle share
                            }}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle edit
                            }}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {showPagination && pagination && documents.length > 0 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              {pagination.hasPrevPage && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pagination.page - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum =
                  Math.max(
                    1,
                    Math.min(
                      pagination.pages - 4,
                      pagination.page - Math.floor(5 / 2)
                    )
                  ) + i;

                if (pageNum > pagination.pages) return null;

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={pageNum === pagination.page}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* Show ellipsis if there are more pages */}
              {pagination.pages > 5 &&
                pagination.page < pagination.pages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

              {pagination.hasNextPage && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pagination.page + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDocumentForAction?.name}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog onOpenChange={setShareDialogOpen} open={shareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Configure sharing settings for "{selectedDocumentForAction?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={shareSettings.isPublic}
                id="public"
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    isPublic: checked as boolean,
                  }))
                }
              />
              <label className="font-medium text-sm" htmlFor="public">
                Make public (anyone with link can view)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={shareSettings.allowDownload}
                id="download"
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    allowDownload: checked as boolean,
                  }))
                }
              />
              <label className="font-medium text-sm" htmlFor="download">
                Allow downloads
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={shareSettings.passwordProtected}
                id="password"
                onCheckedChange={(checked) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    passwordProtected: checked as boolean,
                  }))
                }
              />
              <label className="font-medium text-sm" htmlFor="password">
                Password protect
              </label>
            </div>
            {shareSettings.passwordProtected && (
              <Input
                onChange={(e) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="Enter password"
                type="password"
                value={shareSettings.password}
              />
            )}
            <div>
              <label className="font-medium text-sm" htmlFor="expires">
                Expires at (optional)
              </label>
              <Input
                className="mt-1"
                id="expires"
                onChange={(e) =>
                  setShareSettings((prev) => ({
                    ...prev,
                    expiresAt: e.target.value,
                  }))
                }
                type="datetime-local"
                value={shareSettings.expiresAt}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={shareMutation.isPending} onClick={confirmShare}>
              {shareMutation.isPending ? "Creating..." : "Create Share Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog onOpenChange={setEditDialogOpen} open={editDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update the metadata for "{selectedDocumentForAction?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-medium text-sm" htmlFor="name">
                Name
              </label>
              <Input
                className="mt-1"
                id="name"
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                value={editForm.name}
              />
            </div>
            <div>
              <label className="font-medium text-sm" htmlFor="description">
                Description (optional)
              </label>
              <Input
                className="mt-1"
                id="description"
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                value={editForm.description}
              />
            </div>
            <div>
              <label className="font-medium text-sm" htmlFor="tags">
                Tags (comma-separated, optional)
              </label>
              <Input
                className="mt-1"
                id="tags"
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  }))
                }
                value={editForm.tags.join(", ")}
              />
            </div>
            <div>
              <label className="font-medium text-sm" htmlFor="expiryDate">
                Expiry Date (optional)
              </label>
              <Input
                className="mt-1"
                id="expiryDate"
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
                type="date"
                value={editForm.expiryDate}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={updateMutation.isPending || !editForm.name.trim()}
              onClick={confirmEdit}
            >
              {updateMutation.isPending ? "Updating..." : "Update Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
