import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const BoldButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive("bold"),
      disabled: !ctx.editor.can().toggleBold(),
    }),
  });

  return (
    <MenuButton
      icon="Bold"
      onClick={() => editor.chain().focus().toggleBold().run()}
      shortcuts={["Mod", "B"]}
      tooltip="Bold"
      {...state}
    />
  );
};

export default BoldButton;
