import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const StrikeButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive("strike"),
      disabled: !ctx.editor.can().toggleStrike(),
    }),
  });

  return (
    <MenuButton
      icon="Strike"
      onClick={() => editor.chain().focus().toggleStrike().run()}
      shortcuts={["Mod", "Shift", "S"]}
      tooltip="Strikethrough"
      {...state}
    />
  );
};

export default StrikeButton;
