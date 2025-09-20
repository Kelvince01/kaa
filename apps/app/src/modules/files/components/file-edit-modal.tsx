import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Separator } from "@kaa/ui/components/separator";
import { SpinnerV2 } from "@kaa/ui/components/spinner";
import { Switch } from "@kaa/ui/components/switch";
import { Textarea } from "@kaa/ui/components/textarea";
import { Eye, EyeOff, Plus, Save, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUpdateFile } from "../file.queries";
import type { FileType, FileUpdateInput } from "../file.type";

type FileEditModalProps = {
  file: FileType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function FileEditModal({
  file,
  isOpen,
  onClose,
  onSuccess,
}: FileEditModalProps) {
  const [formData, setFormData] = useState<FileUpdateInput>({});
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: updateFile } = useUpdateFile();

  // Initialize form data when file changes
  useEffect(() => {
    if (file) {
      setFormData({
        name: file.name,
        description: file.description || "",
        tags: file.tags || [],
        isPublic: file.isPublic,
      });
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setIsSubmitting(true);

      // Prepare update data (only include changed fields)
      const updateData: FileUpdateInput = {};

      if (formData.name && formData.name !== file.name) {
        updateData.name = formData.name;
      }

      if (formData.description !== file.description) {
        updateData.description = formData.description;
      }

      if (JSON.stringify(formData.tags) !== JSON.stringify(file.tags)) {
        updateData.tags = formData.tags;
      }

      if (formData.isPublic !== file.isPublic) {
        updateData.isPublic = formData.isPublic;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes detected");
        onClose();
        return;
      }

      await updateFile({ id: file._id, data: updateData });
      toast.success("File updated successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to update file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    const currentTags = formData.tags || [];
    if (currentTags.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...currentTags, newTag.trim()],
    }));
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  if (!file) return null;

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* File Preview */}
          <div className="flex items-center space-x-4 rounded-lg bg-muted/50 p-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-muted">
              {file.mimeType.startsWith("image/") ? (
                // biome-ignore lint/nursery/useImageSize: by author
                // biome-ignore lint/performance/noImgElement: by author
                <img
                  alt={file.name}
                  className="h-full w-full rounded-md object-cover"
                  src={file.url}
                />
              ) : (
                <div className="text-2xl">📄</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{file.name}</p>
              <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                <span>{formatBytes(file.size)}</span>
                <span>•</span>
                <span>{file.mimeType}</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Uploaded {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">File Name</Label>
              <Input
                disabled={isSubmitting}
                id="name"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter file name"
                value={formData.name || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                disabled={isSubmitting}
                id="description"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter file description (optional)"
                rows={3}
                value={formData.description || ""}
              />
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex space-x-2">
                <Input
                  disabled={isSubmitting}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag"
                  value={newTag}
                />
                <Button
                  disabled={!newTag.trim() || isSubmitting}
                  onClick={handleAddTag}
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    className="flex items-center space-x-1"
                    key={index.toString()}
                    variant="secondary"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                    <Button
                      className="h-auto p-0 hover:bg-transparent"
                      disabled={isSubmitting}
                      onClick={() => handleRemoveTag(tag)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center space-x-2">
                  {formData.isPublic ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  <span>Public Access</span>
                </Label>
                <p className="text-muted-foreground text-sm">
                  {formData.isPublic
                    ? "Anyone with the link can view this file"
                    : "Only you can access this file"}
                </p>
              </div>
              <Switch
                checked={formData.isPublic}
                disabled={isSubmitting}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPublic: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* File Information (Read-only) */}
          <div className="space-y-3">
            <Label>File Information</Label>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">File ID:</span>
                <p className="break-all font-mono text-xs">{file._id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">File Size:</span>
                <p>{formatBytes(file.size)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">MIME Type:</span>
                <p>{file.mimeType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Modified:</span>
                <p>{new Date(file.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <SpinnerV2 className="h-4 w-4" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
