"use client";

import { html } from "@codemirror/lang-html";
import CodeMirrorBase, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { RotateCcw, Save } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useMJMLProcessor } from "@/hooks/use-mjml-processor";
import { useUIState } from "@/hooks/use-ui-state";
import { DEFAULT_MJML, HOTKEYS, UI_STATE } from "@/lib/constants";

export type MJMLEditorProps = {
  value: string;
};

export const MJMLEditor = () => {
  const { theme } = useTheme();
  const { autoSave, setAutoSave, setContent, content, forceSave } =
    useMJMLProcessor();
  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light");
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const { onOpenChange } = useUIState(
    UI_STATE.MJML_EDITOR as keyof typeof UI_STATE
  );

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

  const toggleAutoSave = () => {
    const newAutoSaveState = !autoSave;
    setAutoSave(newAutoSaveState);
    if (newAutoSaveState) {
      forceSave();
    }
  };

  const resetStorage = () => {
    setContent(DEFAULT_MJML);
    if (autoSave) {
      setContent(DEFAULT_MJML);
    }
  };

  useHotkeys(
    HOTKEYS.FOCUS_EDITOR?.key as string,
    (e) => {
      e.preventDefault();
      onOpenChange(true);
      setTimeout(() => {
        editorRef.current?.view?.focus();
      }, 300);
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  return (
    <div className="relative h-full">
      <CodeMirrorBase
        className="h-full"
        extensions={[html()]}
        height="100%"
        onChange={setContent}
        ref={editorRef}
        theme={editorTheme}
        value={content}
      />

      <div className="absolute right-4 bottom-4 flex gap-2">
        <button
          className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          onClick={resetStorage}
          title="Reset content"
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          className={`relative rounded-full p-2 ${
            autoSave
              ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
              : "bg-gray-100 dark:bg-gray-800"
          } transition-colors hover:bg-opacity-80`}
          onClick={toggleAutoSave}
          title="Toggle auto-save"
          type="button"
        >
          <Save className="h-4 w-4" />
          {autoSave && (
            <span className="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MJMLEditor;
