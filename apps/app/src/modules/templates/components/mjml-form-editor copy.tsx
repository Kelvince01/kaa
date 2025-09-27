import { Button } from "@kaa/ui/components/button";
import CodeMirrorBase, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { handlebarsLanguage } from "@xiechao/codemirror-lang-handlebars";
import { Eye } from "lucide-react";
import { useTheme } from "next-themes";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useMJMLProcessor } from "@/hooks/use-mjml-processor";
import { MJMLPreviewDialog } from "./mjml-preview-dialog";

export type MJMLFormEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
};

export type MJMLFormEditorRef = {
  focus: () => void;
  getValue: () => string;
};

const MJMLFormEditor = forwardRef<MJMLFormEditorRef, MJMLFormEditorProps>(
  ({ onChange, placeholder, className, required, value }, ref) => {
    const { theme } = useTheme();
    const editorRef = useRef<ReactCodeMirrorRef>(null);
    const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light");
    const [hasBasicMJMLStructure, setHasBasicMJMLStructure] = useState(true);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const { autoSave, setAutoSave, setContent, content, forceSave } =
      useMJMLProcessor();

    useEffect(() => {
      setEditorTheme(
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme === "dark"
            ? "dark"
            : "light"
      );
    }, [theme]);

    // Basic MJML validation
    useEffect(() => {
      if (content) {
        const hasMJML =
          content.includes("<mjml>") && content.includes("</mjml>");
        const hasMJBody =
          content.includes("<mj-body>") && content.includes("</mj-body>");
        setHasBasicMJMLStructure(hasMJML && hasMJBody);
      } else {
        setHasBasicMJMLStructure(true); // Empty is valid
      }
    }, [content]);

    const handleChange = (newValue: string) => {
      value = newValue;
      onChange(newValue);
      setContent(newValue);
    };

    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.view?.focus();
      },
      getValue: () => content,
    }));

    return (
      <div className={className}>
        <CodeMirrorBase
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          // disabled={disabled}
          extensions={[handlebarsLanguage]}
          onChange={handleChange}
          placeholder={placeholder}
          ref={editorRef}
          style={{
            minHeight: "400px",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: "14px",
          }}
          theme={editorTheme}
          value={content}
        />
        {required && !content && (
          <div className="mt-1 text-destructive text-sm">
            MJML content is required
          </div>
        )}
        {content && !hasBasicMJMLStructure && (
          <div className="mt-1 text-amber-600 text-sm dark:text-amber-400">
            Warning: Content may not be valid MJML. Please include &lt;mjml&gt;
            and &lt;mj-body&gt; tags.
          </div>
        )}

        {/* Preview Button */}
        <div className="mt-3 flex justify-end">
          <Button
            disabled={!content || content.trim().length === 0}
            onClick={() => setIsPreviewOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview MJML
          </Button>
        </div>

        {/* Preview Dialog */}
        <MJMLPreviewDialog
          isOpen={isPreviewOpen}
          mjmlContent={content}
          onClose={() => setIsPreviewOpen(false)}
          title="MJML Template Preview"
        />
      </div>
    );
  }
);

MJMLFormEditor.displayName = "MJMLFormEditor";

export default MJMLFormEditor;
