import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const OrderedListButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive("orderedList"),
      disabled: !ctx.editor.isEditable,
    }),
  });

  return (
    <MenuButton
      icon="OrderedList"
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      shortcuts={["Mod", "Shift", "7"]}
      tooltip="Numbered List"
      {...state}
    />
  );
};

export default OrderedListButton;
