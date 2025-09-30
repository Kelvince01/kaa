import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const SuperscriptButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive("superscript"),
      disabled: !ctx.editor.can().toggleSuperscript(),
    }),
  });

  return (
    <MenuButton
      icon="Superscript"
      onClick={() => editor.chain().focus().toggleSuperscript().run()}
      shortcuts={["Mod", "."]}
      tooltip="Superscript"
      {...state}
    />
  );
};

export default SuperscriptButton;
