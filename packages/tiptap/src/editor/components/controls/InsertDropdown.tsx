import MenuButton from "../MenuButton";
import { useTiptapContext } from "../Provider";
import { DropdownMenuItem } from "../ui/DropdownMenu";

const InsertDropdown = () => {
  const { editor } = useTiptapContext();

  const insertCodeBlock = () => editor.chain().focus().setCodeBlock().run();

  const insertBlockquote = () => editor.chain().focus().setBlockquote().run();

  const insertYoutube = () => {
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
      disabled={!editor.isEditable}
      dropdownStyle={{ minWidth: "8rem" }}
      icon="Plus"
      tooltip="Insert"
      type="dropdown"
    >
      <DropdownMenuItem asChild>
        <MenuButton
          hideText={false}
          icon="Quote"
          onClick={insertBlockquote}
          text="Blockquote"
          tooltip={false}
        />
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <MenuButton
          hideText={false}
          icon="CodeBlock"
          onClick={insertCodeBlock}
          text="Code block"
          tooltip={false}
        />
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <MenuButton
          hideText={false}
          icon="Youtube"
          onClick={insertYoutube}
          text="Youtube"
          tooltip={false}
        />
      </DropdownMenuItem>
    </MenuButton>
  );
};

export default InsertDropdown;
