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
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Label } from "@kaa/ui/components/label";
import { Progress } from "@kaa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  Archive,
  CheckSquare,
  Copy,
  DollarSign,
  Download,
  FileText,
  FolderOpen,
  Home,
  Loader2,
  Minus,
  MoreHorizontal,
  Share2,
  Square,
  Star,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { useBulkDocumentOperation } from "../document.queries";
import { useDocumentStore } from "../document.store";
import { type BulkDocumentOperation, DocumentCategory } from "../document.type";

type DocumentBulkActionsProps = {
  selectedDocuments: string[];
  totalDocuments?: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onAction?: (action: string, documentIds: string[], parameters?: any) => void;
  className?: string;
  variant?: "compact" | "expanded" | "dropdown";
  disabled?: boolean;
  showSelectAll?: boolean;
};

const categoryConfig = {
  [DocumentCategory.GENERAL]: { label: "General", icon: FileText },
  [DocumentCategory.IDENTITY]: { label: "Identity", icon: Users },
  [DocumentCategory.ADDRESS]: { label: "Address", icon: Home },
  [DocumentCategory.INCOME]: { label: "Income", icon: DollarSign },
  [DocumentCategory.REFERENCES]: { label: "References", icon: Star },
  [DocumentCategory.OTHER]: { label: "Other", icon: FileText },
};

export function DocumentBulkActions({
  selectedDocuments,
  totalDocuments,
  onSelectAll,
  onClearSelection,
  onAction,
  className,
  variant = "expanded",
  disabled = false,
  showSelectAll = true,
}: DocumentBulkActionsProps) {
  const bulkOperationMutation = useBulkDocumentOperation();
  const { clearSelection } = useDocumentStore();

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = React.useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = React.useState(false);

  // Form states
  const [selectedCategory, setSelectedCategory] = React.useState<
    DocumentCategory | ""
  >("");
  const [newTags, setNewTags] = React.useState("");
  const [operationInProgress, setOperationInProgress] = React.useState(false);
  const [operationProgress, setOperationProgress] = React.useState(0);

  const hasSelection = selectedDocuments.length > 0;
  const isAllSelected =
    totalDocuments && selectedDocuments.length === totalDocuments;
  const isPartiallySelected = hasSelection && !isAllSelected;

  const handleBulkOperation = async (operation: BulkDocumentOperation) => {
    try {
      setOperationInProgress(true);
      setOperationProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setOperationProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await bulkOperationMutation.mutateAsync(operation);

      clearInterval(progressInterval);
      setOperationProgress(100);

      // Notify parent component
      onAction?.(
        operation.operation,
        operation.documentIds,
        operation.parameters
      );

      // Clear selection after successful operation
      onClearSelection?.();
      clearSelection();

      // Close any open dialogs
      setIsDeleteDialogOpen(false);
      setIsCategoryDialogOpen(false);
      setIsTagsDialogOpen(false);
      setIsArchiveDialogOpen(false);

      // Reset form states
      setSelectedCategory("");
      setNewTags("");

      setTimeout(() => {
        setOperationInProgress(false);
        setOperationProgress(0);
      }, 1000);
    } catch (error) {
      setOperationInProgress(false);
      setOperationProgress(0);
      // Error is already handled by the mutation
    }
  };

  const handleDelete = () => {
    handleBulkOperation({
      operation: "delete",
      documentIds: selectedDocuments,
    });
  };

  const handleArchive = () => {
    handleBulkOperation({
      operation: "archive",
      documentIds: selectedDocuments,
    });
  };

  const handleCategoryChange = () => {
    if (!selectedCategory) return;

    handleBulkOperation({
      operation: "update-category",
      documentIds: selectedDocuments,
      parameters: {
        category: selectedCategory,
      },
    });
  };

  const handleAddTags = () => {
    if (!newTags.trim()) return;

    const tags = newTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tags.length === 0) return;

    handleBulkOperation({
      operation: "add-tags",
      documentIds: selectedDocuments,
      parameters: {
        tags,
      },
    });
  };

  const handleDownload = () => {
    // This would typically trigger a download of all selected documents
    onAction?.("download", selectedDocuments);
    toast.success("Download started for selected documents");
  };

  const handleShare = () => {
    // This would open a share dialog or copy share links
    onAction?.("share", selectedDocuments);
    toast.success("Share links generated for selected documents");
  };

  const renderSelectionControls = () => (
    <div className="flex items-center space-x-2">
      {showSelectAll && totalDocuments && (
        <Button
          className="h-8"
          disabled={disabled}
          onClick={
            isPartiallySelected || isAllSelected
              ? onClearSelection
              : onSelectAll
          }
          size="sm"
          variant="ghost"
        >
          {isAllSelected ? (
            <CheckSquare className="h-4 w-4" />
          ) : isPartiallySelected ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          <span className="ml-2 text-sm">
            {isAllSelected
              ? "Deselect all"
              : isPartiallySelected
                ? "Select all"
                : "Select all"}
          </span>
        </Button>
      )}

      {hasSelection && (
        <>
          <Separator className="h-6" orientation="vertical" />
          <span className="text-muted-foreground text-sm">
            {selectedDocuments.length} document
            {selectedDocuments.length === 1 ? "" : "s"} selected
          </span>
          {onClearSelection && (
            <Button
              className="h-6 px-2 text-xs"
              disabled={disabled}
              onClick={onClearSelection}
              size="sm"
              variant="ghost"
            >
              Clear
            </Button>
          )}
        </>
      )}
    </div>
  );

  const renderActionButtons = () => (
    <div className="flex items-center space-x-1">
      <Button
        className="h-8"
        disabled={disabled || operationInProgress}
        onClick={handleDownload}
        size="sm"
        variant="outline"
      >
        <Download className="mr-1 h-4 w-4" />
        Download
      </Button>

      <Button
        className="h-8"
        disabled={disabled || operationInProgress}
        onClick={handleShare}
        size="sm"
        variant="outline"
      >
        <Share2 className="mr-1 h-4 w-4" />
        Share
      </Button>

      <Button
        className="h-8"
        disabled={disabled || operationInProgress}
        onClick={() => setIsCategoryDialogOpen(true)}
        size="sm"
        variant="outline"
      >
        <FolderOpen className="mr-1 h-4 w-4" />
        Category
      </Button>

      <Button
        className="h-8"
        disabled={disabled || operationInProgress}
        onClick={() => setIsTagsDialogOpen(true)}
        size="sm"
        variant="outline"
      >
        <Tag className="mr-1 h-4 w-4" />
        Tags
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-8"
            disabled={disabled || operationInProgress}
            size="sm"
            variant="outline"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>More Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsArchiveDialogOpen(true)}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAction?.("export", selectedDocuments)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAction?.("duplicate", selectedDocuments)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderCompactView = () => (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg bg-muted p-2",
        className
      )}
    >
      {renderSelectionControls()}
      {hasSelection && renderActionButtons()}
    </div>
  );

  const renderExpandedView = () => (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg bg-muted p-3",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        {renderSelectionControls()}
      </div>
      {hasSelection && (
        <div className="flex items-center space-x-2">
          {renderActionButtons()}
        </div>
      )}
    </div>
  );

  const renderDropdownView = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn("h-8", className)}
          disabled={disabled || !hasSelection}
          size="sm"
          variant="outline"
        >
          <MoreHorizontal className="mr-1 h-4 w-4" />
          Actions
          {hasSelection && (
            <Badge className="ml-1" variant="secondary">
              {selectedDocuments.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {selectedDocuments.length} document
          {selectedDocuments.length === 1 ? "" : "s"} selected
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setIsCategoryDialogOpen(true)}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Change Category
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsTagsDialogOpen(true)}>
          <Tag className="mr-2 h-4 w-4" />
          Add Tags
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsArchiveDialogOpen(true)}>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!hasSelection && variant !== "expanded") {
    return null;
  }

  return (
    <>
      {/* Main component */}
      {variant === "compact" && renderCompactView()}
      {variant === "expanded" && renderExpandedView()}
      {variant === "dropdown" && renderDropdownView()}

      {/* Operation progress */}
      {operationInProgress && (
        <div className="fixed right-4 bottom-4 w-80 rounded-lg border bg-background p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <div className="flex-1">
              <div className="font-medium text-sm">Processing documents...</div>
              <div className="text-muted-foreground text-xs">
                {selectedDocuments.length} document
                {selectedDocuments.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <Progress className="mt-2" value={operationProgress} />
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedDocuments.length}{" "}
              document
              {selectedDocuments.length === 1 ? "" : "s"}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={operationInProgress}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={operationInProgress}
              onClick={handleDelete}
            >
              {operationInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive confirmation dialog */}
      <AlertDialog
        onOpenChange={setIsArchiveDialogOpen}
        open={isArchiveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Archive {selectedDocuments.length} document
              {selectedDocuments.length === 1 ? "" : "s"}? Archived documents
              can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={operationInProgress}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={operationInProgress}
              onClick={handleArchive}
            >
              {operationInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category change dialog */}
      <Dialog
        onOpenChange={setIsCategoryDialogOpen}
        open={isCategoryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>
              Select a new category for {selectedDocuments.length} document
              {selectedDocuments.length === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">New Category</Label>
              <Select
                onValueChange={(value) =>
                  setSelectedCategory(value as DocumentCategory)
                }
                value={selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([value, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={operationInProgress}
              onClick={() => setIsCategoryDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedCategory || operationInProgress}
              onClick={handleCategoryChange}
            >
              {operationInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add tags dialog */}
      <Dialog onOpenChange={setIsTagsDialogOpen} open={isTagsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
            <DialogDescription>
              Add tags to {selectedDocuments.length} document
              {selectedDocuments.length === 1 ? "" : "s"}. Separate multiple
              tags with commas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Textarea
                disabled={operationInProgress}
                id="tags"
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
                value={newTags}
              />
              <div className="text-muted-foreground text-xs">
                Tags will be added to existing tags, not replace them.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={operationInProgress}
              onClick={() => setIsTagsDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!newTags.trim() || operationInProgress}
              onClick={handleAddTags}
            >
              {operationInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Tags"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
