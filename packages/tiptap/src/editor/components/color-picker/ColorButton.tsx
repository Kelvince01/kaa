import Tooltip from "../ui/Tooltip";

type ColorButtonProps = {
  color: string;
  active?: boolean;
  tooltip?: boolean;
  onClick?: (color: string) => void;
};

const ColorButton = ({
  color,
  tooltip = true,
  active,
  onClick,
}: ColorButtonProps) => {
  const content = (
    <button
      className="rte-color__btn"
      data-active={active ? "true" : undefined}
      onClick={() => onClick?.(color)}
      style={{ background: color }}
      tabIndex={-1}
      type="button"
    />
  );
  return tooltip ? <Tooltip content={color}>{content}</Tooltip> : content;
};

export default ColorButton;
