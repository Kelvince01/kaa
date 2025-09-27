import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const AlignJustifyButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive({ textAlign: "justify" }),
      disabled: !ctx.editor.can().setTextAlign("justify"),
    }),
  });

  return (
    <MenuButton
      icon="AlignJustify"
      onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      shortcuts={["Mod", "Shift", "F"]}
      tooltip="Justify"
      {...state}
    />
  );
};

export default AlignJustifyButton;
