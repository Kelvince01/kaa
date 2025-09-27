import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const BlockquoteButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        active: ctx.editor.isActive("blockquote"),
        disabled: !ctx.editor.can().toggleBlockquote(),
      };
    },
  });

  return (
    <MenuButton
      icon="Quote"
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      shortcuts={["Mod", "Shift", "B"]}
      tooltip="Quote"
      {...state}
    />
  );
};

export default BlockquoteButton;
