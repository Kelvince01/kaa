import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const ClearFormatButton = () => {
  const { editor } = useTiptapContext();

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      disabled: !ctx.editor.isEditable,
    }),
  });

  return (
    <MenuButton
      icon="Eraser"
      onClick={() => editor.chain().focus().unsetAllMarks().run()}
      tooltip="Clear Format"
      {...state}
    />
  );
};

export default ClearFormatButton;
