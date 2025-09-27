import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const AlignCenterButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive({ textAlign: "center" }),
      disabled: !ctx.editor.can().setTextAlign("center"),
    }),
  });

  return (
    <MenuButton
      icon="AlignCenter"
      onClick={() => editor.chain().focus().setTextAlign("center").run()}
      shortcuts={["Mod", "Shift", "E"]}
      tooltip="Center"
      {...state}
    />
  );
};

export default AlignCenterButton;
