import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const BulletListButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        active: ctx.editor.isActive("bulletList"),
        disabled: !ctx.editor.isEditable,
      };
    },
  });

  return (
    <MenuButton
      icon="BulletList"
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      shortcuts={["Mod", "Shift", "8"]}
      tooltip="Bullet List"
      {...state}
    />
  );
};

export default BulletListButton;
