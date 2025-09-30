import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const CodeBlockButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive("codeBlock"),
      disabled: !ctx.editor.can().toggleCodeBlock(),
    }),
  });

  return (
    <MenuButton
      icon="Code"
      onClick={() => editor.chain().focus().setCodeBlock().run()}
      tooltip="Code block"
      {...state}
    />
  );
};

export default CodeBlockButton;
