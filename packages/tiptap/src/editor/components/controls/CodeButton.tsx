import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const CodeButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        active: ctx.editor.isActive("code"),
        disabled: !ctx.editor.can().toggleCode(),
      };
    },
  });

  return (
    <MenuButton
      icon="CodeInline"
      onClick={() => editor.chain().focus().toggleCode().run()}
      shortcuts={["Mod", "E"]}
      tooltip="Inline code"
      {...state}
    />
  );
};

export default CodeButton;
