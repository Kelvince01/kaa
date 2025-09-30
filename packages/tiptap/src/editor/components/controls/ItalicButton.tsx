import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const ItalicButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive("italic"),
      disabled: !ctx.editor.can().toggleItalic(),
    }),
  });

  return (
    <MenuButton
      icon="Italic"
      onClick={() => editor.chain().focus().toggleItalic().run()}
      shortcuts={["Mod", "I"]}
      tooltip="Italic"
      {...state}
    />
  );
};

export default ItalicButton;
