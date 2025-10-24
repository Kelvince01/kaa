"use client";

import { Alert, AlertDescription, AlertTitle } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar as CalendarComponent } from "@kaa/ui/components/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import { Textarea } from "@kaa/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import { cn } from "@kaa/ui/lib/utils";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Copy,
  DollarSign,
  Edit3,
  FileText,
  Home,
  Info,
  Loader2,
  Plus,
  Save,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { useUpdateDocument } from "../document.queries";
import {
  DocumentCategory,
  DocumentPriority,
  DocumentStatus,
  type DocumentUpdateInput,
  type IDocument,
} from "../document.type";

type DocumentMetadataEditorProps = {
  document: IDocument;
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (data: DocumentUpdateInput) => void;
  className?: string;
  variant?: "dialog" | "sheet" | "inline";
  showAdvanced?: boolean;
  mode?: "edit" | "view";
  showAdvancedFields?: boolean;
  onUpdate?: (data: DocumentUpdateInput) => void;
};

const categoryConfig = {
  [DocumentCategory.GENERAL]: {
    label: "General",
    icon: FileText,
    color: "bg-gray-100",
  },
  [DocumentCategory.IDENTITY]: {
    label: "Identity",
    icon: Users,
    color: "bg-blue-100",
  },
  [DocumentCategory.ADDRESS]: {
    label: "Address",
    icon: Home,
    color: "bg-green-100",
  },
  [DocumentCategory.INCOME]: {
    label: "Income",
    icon: DollarSign,
    color: "bg-yellow-100",
  },
  [DocumentCategory.REFERENCES]: {
    label: "References",
    icon: Star,
    color: "bg-purple-100",
  },
  [DocumentCategory.OTHER]: {
    label: "Other",
    icon: FileText,
    color: "bg-gray-100",
  },
};

const priorityConfig = {
  [DocumentPriority.LOW]: { label: "Low", color: "bg-gray-100" },
  [DocumentPriority.NORMAL]: { label: "Normal", color: "bg-blue-100" },
  [DocumentPriority.HIGH]: { label: "High", color: "bg-yellow-100" },
  [DocumentPriority.URGENT]: { label: "Urgent", color: "bg-red-100" },
};

export function DocumentMetadataEditor({
  document,
  isOpen = false,
  onClose,
  onSave,
  className,
  variant = "dialog",
  showAdvanced = true,
  mode = "edit",
  showAdvancedFields = true,
  onUpdate,
}: DocumentMetadataEditorProps) {
  const updateMutation = useUpdateDocument();

  // Form state
  const [formData, setFormData] = React.useState({
    name: document.name || "",
    category: document.category || DocumentCategory.GENERAL,
    expiryDate: document.expiryDate || "",
    description: document.metadata?.description || "",
    tags: document.tags || [],
    priority: document.priority || DocumentPriority.NORMAL,
  });

  // UI state
  const [newTag, setNewTag] = React.useState("");
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Check for changes
  React.useEffect(() => {
    const hasNameChanged = formData.name !== (document.name || "");
    const hasCategoryChanged = formData.category !== document.category;
    const hasExpiryChanged =
      formData.expiryDate !== (document.expiryDate || "");
    const hasDescriptionChanged =
      formData.description !== (document.metadata?.description || "");
    const hasPriorityChanged =
      formData.priority !== (document.priority || DocumentPriority.NORMAL);
    const hasTagsChanged =
      JSON.stringify(formData.tags) !== JSON.stringify(document.tags || []);

    setHasChanges(
      hasNameChanged ||
        hasCategoryChanged ||
        hasExpiryChanged ||
        hasDescriptionChanged ||
        hasPriorityChanged ||
        hasTagsChanged
    );
  }, [formData, document]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Document name is required";
    }

    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        newErrors.expiryDate = "Expiry date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const updateData: DocumentUpdateInput = {
      name: formData.name,
      category: formData.category,
      expiryDate: formData.expiryDate || undefined,
      //   priority: formData.priority as DocumentPriority,
      metadata: {
        ...document.metadata,
        description: formData.description,
      },
    };

    // Add tags to metadata
    if (formData.tags.length > 0) {
      updateData.metadata = {
        ...updateData.metadata,
        tags: formData.tags,
      };
    }

    try {
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate(updateData);
      }

      if (onSave) {
        onSave(updateData);
      } else {
        await updateMutation.mutateAsync({
          id: document._id,
          input: updateData,
        });
      }

      toast.success("Document updated successfully");
      onClose?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    const trimmedTag = newTag.trim();
    if (formData.tags.includes(trimmedTag)) {
      toast.error("Tag already exists");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, trimmedTag],
    }));
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        expiryDate: format(date, "yyyy-MM-dd"),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        expiryDate: "",
      }));
    }
    setIsCalendarOpen(false);
  };

  const handleReset = () => {
    setFormData({
      name: document.name || "",
      category: document.category || DocumentCategory.GENERAL,
      expiryDate: document.expiryDate || "",
      description: document.metadata?.description || "",
      tags: document.tags || [],
      priority: document.priority || DocumentPriority.NORMAL,
    });
    setErrors({});
    setNewTag("");
  };

  const renderFormFields = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <h3 className="font-medium text-sm">Basic Information</h3>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Document Name *</Label>
            <Input
              className={errors.name ? "border-destructive" : ""}
              disabled={mode === "view"}
              id="name"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter document name"
              readOnly={mode === "view"}
              value={formData.name}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              disabled={mode === "view"}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  category: value as DocumentCategory,
                }))
              }
              value={formData.category}
            >
              <SelectTrigger>
                <SelectValue />
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

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              disabled={mode === "view"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Add a description (optional)"
              readOnly={mode === "view"}
              rows={3}
              value={formData.description}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4" />
          <h3 className="font-medium text-sm">Tags</h3>
        </div>

        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              className="flex-1"
              disabled={mode === "view"}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add a tag"
              readOnly={mode === "view"}
              value={newTag}
            />
            <Button
              disabled={!newTag.trim() || mode === "view"}
              onClick={handleAddTag}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge className="pr-1 pl-2" key={tag} variant="secondary">
                  {tag}
                  {mode !== "view" && (
                    <Button
                      className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveTag(tag)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && showAdvancedFields && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <h3 className="font-medium text-sm">Advanced Settings</h3>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  disabled={mode === "view"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: Number.parseInt(value, 10) as DocumentPriority,
                    }))
                  }
                  value={formData.priority.toString()}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center space-x-2">
                          <div
                            className={cn("h-2 w-2 rounded-full", config.color)}
                          />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <div className="flex space-x-2">
                  <Popover
                    onOpenChange={setIsCalendarOpen}
                    open={isCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !formData.expiryDate && "text-muted-foreground",
                          errors.expiryDate && "border-destructive"
                        )}
                        disabled={mode === "view"}
                        variant="outline"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.expiryDate
                          ? format(parseISO(formData.expiryDate), "PPP")
                          : "Pick a date (optional)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <CalendarComponent
                        disabled={(date) => date < new Date()}
                        initialFocus
                        mode="single"
                        onSelect={handleDateSelect}
                        selected={
                          formData.expiryDate
                            ? parseISO(formData.expiryDate)
                            : undefined
                        }
                      />
                    </PopoverContent>
                  </Popover>

                  {formData.expiryDate && mode !== "view" && (
                    <Button
                      onClick={() => handleDateSelect(undefined)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {errors.expiryDate && (
                  <p className="text-destructive text-xs">
                    {errors.expiryDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Document Info (Read-only) */}
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4" />
          <h3 className="font-medium text-sm">Document Information</h3>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge
              variant={
                document.status === DocumentStatus.VERIFIED
                  ? "default"
                  : "secondary"
              }
            >
              {document.status}
            </Badge>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Size:</span>
            <span>{(document.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span>{document.type}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Uploaded:</span>
            <span>{format(new Date(document.uploadedAt), "PPP")}</span>
          </div>

          {document.verifiedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verified:</span>
              <span>{format(new Date(document.verifiedAt), "PPP")}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">ID:</span>
            <div className="flex items-center space-x-2">
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {document._id.slice(-8)}
              </code>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-4 w-4 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(document._id);
                        toast.success("Document ID copied");
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy full ID</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDialogFooter = () => (
    <DialogFooter>
      {mode === "edit" && (
        <>
          <Button
            disabled={updateMutation.isPending || !hasChanges}
            onClick={handleReset}
            type="button"
            variant="outline"
          >
            Reset
          </Button>
          <Button
            disabled={updateMutation.isPending || !hasChanges}
            onClick={handleSave}
            type="button"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </>
      )}
      <Button
        disabled={updateMutation.isPending}
        onClick={onClose}
        type="button"
        variant="outline"
      >
        Cancel
      </Button>
    </DialogFooter>
  );

  if (variant === "dialog") {
    return (
      <Dialog onOpenChange={onClose} open={isOpen}>
        <DialogContent
          className={cn("max-h-[90vh] max-w-2xl overflow-y-auto", className)}
        >
          <DialogHeader>
            <DialogTitle>Edit Document Metadata</DialogTitle>
            <DialogDescription>
              Update the document information, tags, and settings.
            </DialogDescription>
          </DialogHeader>

          {renderFormFields()}
          {renderDialogFooter()}
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === "sheet") {
    return (
      <Sheet onOpenChange={onClose} open={isOpen}>
        <SheetContent
          className={cn("w-[400px] sm:w-[600px]", className)}
          side="right"
        >
          <SheetHeader>
            <SheetTitle>Edit Document Metadata</SheetTitle>
            <SheetDescription>
              Update the document information, tags, and settings.
            </SheetDescription>
          </SheetHeader>

          <div className="max-h-[calc(100vh-200px)] overflow-y-auto py-6">
            {renderFormFields()}
          </div>

          <SheetFooter>
            {mode === "edit" && (
              <>
                <Button
                  disabled={updateMutation.isPending || !hasChanges}
                  onClick={handleReset}
                  type="button"
                  variant="outline"
                >
                  Reset
                </Button>
                <Button
                  disabled={updateMutation.isPending || !hasChanges}
                  onClick={handleSave}
                  type="button"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // Inline variant
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Edit3 className="h-5 w-5" />
          <span>Edit Document Metadata</span>
        </CardTitle>
        <CardDescription>
          Update the document information, tags, and settings.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {renderFormFields()}

        {/* Action buttons for inline variant */}
        {mode === "edit" && (
          <div className="flex justify-end space-x-2">
            <Button
              disabled={updateMutation.isPending || !hasChanges}
              onClick={handleReset}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
            <Button
              disabled={updateMutation.isPending || !hasChanges}
              onClick={handleSave}
              type="button"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}

        {/* Show unsaved changes warning */}
        {hasChanges && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unsaved Changes</AlertTitle>
            <AlertDescription>
              You have unsaved changes. Click "Save Changes" to apply them or
              "Reset" to discard.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
