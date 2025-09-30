import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import CodeMirrorBase from "@uiw/react-codemirror";
import { handlebarsLanguage } from "@xiechao/codemirror-lang-handlebars";
import { Copy, Download, Eye, Upload } from "lucide-react";
import { forwardRef, useMemo, useState } from "react";
import { HandlebarsPreviewDialog } from "./handlebars-preview";

export type HandlebarsEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
};

export type HandlebarsEditorRef = {
  focus: () => void;
  getValue: () => string;
};

const HandlebarsEditor = forwardRef<HandlebarsEditorRef, HandlebarsEditorProps>(
  ({ onChange, placeholder, className, required, value }, _ref) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [template, setTemplate] = useState(value);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (newValue: string) => {
      onChange(newValue);
    };

    const isValid = useMemo(() => true, []);

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
    };

    const downloadFile = (content: string, filename: string) => {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    const loadFile = (callback: (content: string) => void) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".hbs,.handlebars,.html,.txt";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement)?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => callback(e.target?.result as string);
          reader.readAsText(file);
        }
      };
      input.click();
    };

    return (
      <div className={className}>
        <div className="flex gap-2">
          <Button
            onClick={() => loadFile(setTemplate)}
            size="sm"
            variant="outline"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => downloadFile(template, "template.hbs")}
            size="sm"
            variant="outline"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => copyToClipboard(template)}
            size="sm"
            variant="outline"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <CodeMirrorBase
          basicSetup={{}}
          extensions={[handlebarsLanguage]}
          onChange={handleChange}
          placeholder={placeholder}
          value={value}
        />

        {required && !value && (
          <div className="mt-1 text-destructive text-sm">
            MJML content is required
          </div>
        )}
        {value && !isValid && (
          <div className="mt-1 text-amber-600 text-sm dark:text-amber-400">
            Warning: Content may not be valid MJML. Please include &lt;mjml&gt;
            and &lt;mj-body&gt; tags.
          </div>
        )}

        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview Button */}
        <div className="mt-3 flex justify-end">
          <Button
            disabled={!value || value.trim().length === 0}
            onClick={() => setIsPreviewOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview Handlebars
          </Button>
        </div>

        {/* Preview Dialog */}
        <HandlebarsPreviewDialog
          data={{}}
          handlebarsContent={value}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Handlebars Template Preview"
        />
      </div>
    );
  }
);

HandlebarsEditor.displayName = "HandlebarsEditor";

export default HandlebarsEditor;
