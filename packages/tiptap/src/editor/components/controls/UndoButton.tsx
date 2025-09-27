import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const UndoButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      disabled: !ctx.editor.can().undo(),
    }),
  });

  return (
    <MenuButton
      icon="Undo"
      onClick={() => editor.chain().focus().undo().run()}
      shortcuts={["Mod", "Z"]}
      tooltip="Undo"
      {...state}
    />
  );
};

export default UndoButton;
