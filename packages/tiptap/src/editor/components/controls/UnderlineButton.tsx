import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const UnderlineButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        active: ctx.editor.isActive("underline"),
        disabled: !ctx.editor.can().toggleUnderline(),
      };
    },
  });

  return (
    <MenuButton
      icon="Underline"
      onClick={() => editor.chain().focus().toggleUnderline().run()}
      shortcuts={["Mod", "U"]}
      tooltip="Underline"
      {...state}
    />
  );
};

export default UnderlineButton;
