import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const SubscriptButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive("subscript"),
      disabled: !ctx.editor.can().toggleSubscript(),
    }),
  });

  return (
    <MenuButton
      icon="Subscript"
      onClick={() => editor.chain().focus().toggleSubscript().run()}
      shortcuts={["Mod", ","]}
      tooltip="Subscript"
      {...state}
    />
  );
};

export default SubscriptButton;
