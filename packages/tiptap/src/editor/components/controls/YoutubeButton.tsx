import { useEditorState } from "@tiptap/react";
import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";

const YoutubeButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        active: ctx.editor.isActive("youtube"),
        disabled: !ctx.editor.isEditable,
      };
    },
  });

  const handleClick = () => {
    const src = prompt(
      "Embed Youtube Video",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    if (src) {
      (editor.chain().focus() as any).embedYoutube({ src }).run();
    }
  };

  return (
    <MenuButton
      icon="Youtube"
      onClick={handleClick}
      tooltip="Youtube"
      {...state}
    />
  );
};

export default YoutubeButton;
