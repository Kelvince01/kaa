import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Label } from "@kaa/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@kaa/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { AlertCircle, Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useExportTemplates } from "../template.queries";
import type { TemplateType } from "../template.type";

type TemplateExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplates?: string[];
  allTemplates?: TemplateType[];
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

const EXPORT_FORMATS = [
  { value: "json", label: "JSON", description: "Complete template data" },
  { value: "hbs", label: "Handlebars", description: "Template content only" },
  { value: "ejs", label: "EJS", description: "Template content only" },
  { value: "pug", label: "Pug", description: "Template content only" },
] as const;

export function TemplateExportModal({
  isOpen,
  onClose,
  selectedTemplates = [],
  allTemplates = [],
}: TemplateExportModalProps) {
  const [exportScope, setExportScope] = useState<
    "selected" | "category" | "all"
  >(selectedTemplates.length > 0 ? "selected" : "all");
  const [category, setCategory] = useState<string>("");
  const [format, setFormat] = useState<"json" | "hbs" | "ejs" | "pug">("json");

  const { mutateAsync: exportTemplates, isPending } = useExportTemplates();

  const handleExport = async () => {
    try {
      let templateIds: string[] | undefined;
      let exportCategory: string | undefined;

      switch (exportScope) {
        case "selected":
          templateIds = selectedTemplates;
          break;
        case "category":
          exportCategory = category;
          break;
        default: // case "all":
          // Export all templates
          break;
      }

      const result = await exportTemplates({
        templateIds,
        category: exportCategory,
        format,
      });

      toast.success(
        `Successfully exported ${result.exportedCount} templates to ${result.filePath}`
      );

      // Reset form
      setExportScope("all");
      setCategory("");
      setFormat("json");

      onClose();
    } catch (error) {
      toast.error("Failed to export templates");
      console.error("Export error:", error);
    }
  };

  const getExportSummary = () => {
    switch (exportScope) {
      case "selected":
        return `${selectedTemplates.length} selected template${selectedTemplates.length !== 1 ? "s" : ""}`;
      case "category": {
        const categoryTemplates = allTemplates.filter(
          (t) => t.category === category
        );
        return `${categoryTemplates.length} ${category || "uncategorized"} templates`;
      }
      default: // case "all":
        return `${allTemplates.length} total templates`;
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Templates
          </DialogTitle>
          <DialogDescription>
            Export templates to files for backup, sharing, or version control.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Scope Selection */}
          <div className="space-y-3">
            <Label className="font-medium text-base">What to Export</Label>
            <RadioGroup
              onValueChange={(value) =>
                setExportScope(value as typeof exportScope)
              }
              value={exportScope}
            >
              {selectedTemplates.length > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="selected" value="selected" />
                  <Label className="flex-1" htmlFor="selected">
                    Selected templates ({selectedTemplates.length})
                  </Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <RadioGroupItem id="category" value="category" />
                <Label className="flex-1" htmlFor="category">
                  Templates by category
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem id="all" value="all" />
                <Label className="flex-1" htmlFor="all">
                  All templates
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Category Selection */}
          {exportScope === "category" && (
            <div className="space-y-2">
              <Label htmlFor="export-category">Category</Label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="font-medium text-base">Export Format</Label>
            <RadioGroup
              onValueChange={(value) => setFormat(value as typeof format)}
              value={format}
            >
              {EXPORT_FORMATS.map((fmt) => (
                <div className="flex items-center space-x-2" key={fmt.value}>
                  <RadioGroupItem id={fmt.value} value={fmt.value} />
                  <Label className="flex-1" htmlFor={fmt.value}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{fmt.label}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {fmt.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Export Summary */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Export Summary</span>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              {getExportSummary()} will be exported in {format.toUpperCase()}{" "}
              format
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="text-sm">
              <strong>Note:</strong> Templates will be exported to your
              downloads folder or the configured export directory.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handleExport}>
            {isPending ? "Exporting..." : "Export Templates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
