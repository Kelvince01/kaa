import { useEditorState } from "@tiptap/react";
import { memo, useCallback } from "react";
import useCopyToClipboard from "../../../hooks/useCopyToClipboard";
import { getNodeContainer } from "../../../utils/getNodeContainer";
import { BubbleMenu } from "../../BubbleMenu";
import MenuButton from "../../MenuButton";
import { useTiptapContext } from "../../Provider";
import { Toolbar, ToolbarDivider } from "../../ui/Toolbar";
import CodeDropdown from "./CodeDropdown";

export const CodeBlockMenu = () => {
  const { editor, contentElement } = useTiptapContext();
  const { isCopied, copy } = useCopyToClipboard();

  const language = useEditorState({
    editor,
    selector: (ctx) => {
      if (ctx.editor.isActive("codeBlock"))
        return ctx.editor.getAttributes("codeBlock").language;
      return null;
    },
  });

  const shouldShow = useCallback(
    ({ editor }: any) => editor.isActive("codeBlock"),
    []
  );

  const handleSelect = useCallback(
    (value: string) =>
      editor.commands.updateAttributes("codeBlock", { language: value }),
    [editor.commands]
  );

  const handleCopy = useCallback(() => {
    const node = getNodeContainer(editor, "pre");
    if (node?.textContent) {
      copy(node.textContent);
    }
  }, [editor, copy]);

  const handleDelete = useCallback(() => {
    editor.chain().focus().deleteNode("codeBlock").run();
  }, [editor]);

  const getReferenceClientRect = useCallback(() => {
    const node = getNodeContainer(editor, "pre");
    return node?.getBoundingClientRect() || new DOMRect(-1000, -1000, 0, 0);
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={"code-block-bubble"}
      shouldShow={shouldShow}
      // TODO: fix tippy
      // tippyOptions={{
      //   placement: "top",
      //   maxWidth: "auto",
      //   // biome-ignore lint/style/noNonNullAssertion: false positive
      //   appendTo: () => contentElement.current!,
      //   getReferenceClientRect,
      // }}
      updateDelay={100}
    >
      <Toolbar>
        <CodeDropdown onSelect={handleSelect} value={language} />
        <ToolbarDivider />
        <MenuButton
          icon={isCopied ? "Check" : "Clipboard"}
          onClick={handleCopy}
          tooltip="Copy code"
        />
        <MenuButton icon="Trash" onClick={handleDelete} tooltip="Delete code" />
      </Toolbar>
    </BubbleMenu>
  );
};

export default memo(CodeBlockMenu);
