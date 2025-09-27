import { PopoverClose } from "@radix-ui/react-popover";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { COLORS, MORE_COLORS } from "../../constants/color";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import Input from "../ui/Input";
import Label from "../ui/Label";
import ColorButton from "./ColorButton";

type ColorPickerProps = {
  color: string;
  onChange?: (value: string) => void;
  onReset?: () => void;
};

const ColorPicker = (props: ColorPickerProps) => {
  const [activeTab, setActiveTab] = useState<"swatches" | "custom">("swatches");
  const [color, setColor] = useState(props.color);

  const normalizeColor = (color: string): string => {
    const normalized = color.startsWith("#") ? color : `#${color}`;
    return normalized.length === 4
      ? `${normalized}${normalized.slice(1)}`
      : normalized;
  };

  const isColorEqual = (a: string, b: string): boolean =>
    normalizeColor(a).toUpperCase() === normalizeColor(b).toUpperCase();

  const handleColorChange = (color: string) => {
    setColor(color);
  };

  const handleApply = () => {
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const regex = /^#?[0-9A-F]{3,6}$/i;
    if (color && regex.test(color)) {
      props.onChange?.(normalizeColor(color));
    }
  };

  const renderColorList = (colors: string[], label: string) => (
    <div>
      <Label as="span">{label}</Label>
      <div className="rte-color__list">
        {colors.map((item) => (
          <ColorButton
            active={isColorEqual(item, color)}
            color={item}
            key={item}
            onClick={() => handleColorChange(item)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="rte-cp">
      <div className="rte-cp__tabs">
        {["swatches", "custom"].map((tab) => (
          <Button
            className={"rte-cp__tab"}
            data-active={activeTab === tab || undefined}
            key={tab}
            onClick={() => setActiveTab(tab as "swatches" | "custom")}
            variant="ghost"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      <div className="rte-cp__main">
        {activeTab === "swatches" && (
          <div className="rte-cp-swatches">
            {renderColorList(COLORS, "Default Colors")}
            {renderColorList(MORE_COLORS, "More Colors")}
          </div>
        )}

        {activeTab === "custom" && (
          <div className="rte-cp-custom">
            <HexColorPicker
              className="rte-cp-custom__picker"
              color={color}
              onChange={handleColorChange}
              style={{ width: "100%" }}
            />
            <div className="rte-cp-custom__preview">
              <ColorButton color={color} tooltip={false} />
              <Input
                autoFocus
                onChange={(e) => handleColorChange(e.target.value)}
                style={{ textTransform: "uppercase" }}
                value={color}
              />
            </div>
          </div>
        )}
      </div>

      <PopoverClose asChild>
        <div className="rte-cp__actions">
          <Button iconOnly onClick={props.onReset} variant="secondary">
            <Icon name="PaletteOff" />
          </Button>
          <Button onClick={handleApply} style={{ width: "100%" }}>
            Apply
          </Button>
        </div>
      </PopoverClose>
    </div>
  );
};

export default ColorPicker;
