import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { formatHtml } from "./format";
import { useCodeMirror } from "./useCodeMirror";
import "./CodeMirror.scss";

type SourceEditorProps = {
  initialContent: string;
  onChange?: (content: string) => void;
};

const SourceEditor = forwardRef<HTMLDivElement, SourceEditorProps>(
  ({ initialContent, onChange }, ref) => {
    const [formattedContent, setFormattedContent] = useState<string>("");
    const editorRef = useCodeMirror({
      initialContent: formattedContent,
      onChange,
    });

    useEffect(() => {
      formatHtml(initialContent).then(setFormattedContent);
    }, [initialContent]);

    // biome-ignore lint/style/noNonNullAssertion: false positive
    useImperativeHandle(ref, () => editorRef.current!, [editorRef]);

    return <div ref={editorRef} />;
  }
);

SourceEditor.displayName = "SourceEditor";

export default SourceEditor;
