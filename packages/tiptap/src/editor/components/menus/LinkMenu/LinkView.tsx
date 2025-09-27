import useCopyToClipboard from "../../../hooks/useCopyToClipboard";
import MenuButton from "../../MenuButton";
import { Toolbar } from "../../ui/Toolbar";

type LinkViewProps = {
  url: string;
  onEdit?: () => void;
  onRemove?: () => void;
};

const LinkView = ({ url, onEdit, onRemove }: LinkViewProps) => {
  const { copy, isCopied } = useCopyToClipboard();

  return (
    <Toolbar>
      <MenuButton hideText={false} onClick={onEdit} text="Edit link" />
      <MenuButton
        icon="ExternalLink"
        onClick={() => window.open(url, "_blank")}
        text="Open in new tab"
      />
      <MenuButton
        icon={isCopied ? "Check" : "Clipboard"}
        onClick={() => copy(url)}
        text={isCopied ? "Copied" : "Copy link"}
      />
      <MenuButton icon="Unlink" onClick={onRemove} text="Remove link" />
    </Toolbar>
  );
};

export default LinkView;
