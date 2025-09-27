import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const RedoButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      disabled: !ctx.editor.can().redo(),
    }),
  });

  return (
    <MenuButton
      icon="Redo"
      onClick={() => editor.chain().focus().redo().run()}
      shortcuts={["Mod", "Y"]}
      tooltip="Redo"
      {...state}
    />
  );
};

export default RedoButton;
