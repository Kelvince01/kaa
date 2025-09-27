import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { AlertCircle, FolderOpen, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useImportTemplates } from "../template.queries";

type TemplateImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const TEMPLATE_CATEGORIES = [
  { value: "email", label: "Email" },
  { value: "document", label: "Document" },
  { value: "report", label: "Report" },
  { value: "notification", label: "Notification" },
  { value: "welcome", label: "Welcome" },
  { value: "payment", label: "Payment" },
  { value: "reminder", label: "Reminder" },
  { value: "verification", label: "Verification" },
  { value: "maintenance", label: "Maintenance" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
] as const;

export function TemplateImportModal({
  isOpen,
  onClose,
}: TemplateImportModalProps) {
  const [importMethod, setImportMethod] = useState<"directory" | "files">(
    "directory"
  );
  const [category, setCategory] = useState<string>("");
  const [directory, setDirectory] = useState<string>("");
  const [overwrite, setOverwrite] = useState(false);

  const { mutateAsync: importTemplates, isPending } = useImportTemplates();

  const handleImport = async () => {
    try {
      if (importMethod === "directory" && !directory.trim()) {
        toast.error("Please specify a directory path");
        return;
      }

      const result = await importTemplates({
        category: category || undefined,
        overwrite,
        directory: importMethod === "directory" ? directory : undefined,
      });

      toast.success(
        `Successfully imported ${result.success} templates${result.failed > 0 ? `, ${result.failed} failed` : ""}`
      );

      // Reset form
      setCategory("");
      setDirectory("");
      setOverwrite(false);

      onClose();
    } catch (error) {
      toast.error("Failed to import templates");
      console.error("Import error:", error);
    }
  };

  const handleDirectorySelect = () => {
    // In a real implementation, this would open a directory picker
    // For now, we'll just show a placeholder
    toast.info("Directory selection would open a file picker dialog");
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Templates
          </DialogTitle>
          <DialogDescription>
            Import templates from your file system. Supports .hbs, .ejs, .pug,
            and .json files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Method Selection */}
          <div className="space-y-3">
            <Label className="font-medium text-base">Import Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                  importMethod === "directory"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
                onClick={() => setImportMethod("directory")}
                type="button"
              >
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-medium">From Directory</div>
                  <div className="text-muted-foreground text-sm">
                    Import all templates from a folder
                  </div>
                </div>
              </button>

              <button
                className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                  importMethod === "files"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
                onClick={() => setImportMethod("files")}
                type="button"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-medium">From Files</div>
                  <div className="text-muted-foreground text-sm">
                    Upload individual template files
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category for imported templates" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="">No specific category</SelectItem> */}
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Directory Path */}
          {importMethod === "directory" && (
            <div className="space-y-2">
              <Label htmlFor="directory">Directory Path *</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  id="directory"
                  onChange={(e) => setDirectory(e.target.value)}
                  placeholder="/path/to/templates"
                  value={directory}
                />
                <Button
                  onClick={handleDirectorySelect}
                  type="button"
                  variant="outline"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                Path to the directory containing template files (.hbs, .ejs,
                .pug, .json)
              </p>
            </div>
          )}

          {/* Files Upload Placeholder */}
          {importMethod === "files" && (
            <div className="space-y-2">
              <Label>File Upload</Label>
              <div className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground text-sm">
                  File upload functionality would be implemented here
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Supports .hbs, .ejs, .pug, and .json files
                </p>
              </div>
            </div>
          )}

          {/* Overwrite Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={overwrite}
              id="overwrite"
              onCheckedChange={(checked) =>
                setOverwrite(checked === "indeterminate" ? false : checked)
              }
            />
            <Label className="text-sm" htmlFor="overwrite">
              Overwrite existing templates with the same name
            </Label>
          </div>

          {/* Warning */}
          {overwrite && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="text-sm">
                <strong>Warning:</strong> Enabling overwrite will replace
                existing templates. This action cannot be undone.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handleImport}>
            {isPending ? "Importing..." : "Import Templates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
