import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const LinkButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: ctx.editor.isActive("link"),
      disabled: !ctx.editor.can().setLink({ href: "" }),
    }),
  });

  return (
    <MenuButton
      icon="Link"
      onClick={() => (editor.commands as any).startEditLink()}
      shortcuts={["Mod", "K"]}
      tooltip="Link"
      {...state}
    />
  );
};

export default LinkButton;
