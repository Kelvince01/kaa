import { useMemo, useState } from "react";
import { CODE_BLOCK_LANGUAGUES } from "../../../constants/code-languages";
import MenuButton from "../../MenuButton";
import { useTiptapContext } from "../../Provider";
import Icon from "../../ui/Icon";
import Input from "../../ui/Input";
import { PopoverClose } from "../../ui/Popover";

type CodeDropdownProps = {
  value: string;
  onSelect: (value: string) => void;
};

const CodeDropdown = ({ value, onSelect }: CodeDropdownProps) => {
  const { contentElement } = useTiptapContext();
  const [search, setSearch] = useState("");

  const options = CODE_BLOCK_LANGUAGUES.map((item: any) => ({
    label: item.label,
    value: item.syntax,
  }));
  const filterOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((item: any) => item.label.includes(search));
  }, [options, search]);

  return (
    <MenuButton
      buttonStyle={{ minWidth: "6rem" }}
      dropdownClass="rte-code-dropdown"
      dropdownStyle={{
        minWidth: "10rem",
      }}
      hideText={false}
      text={options.find((item: any) => item.value === value)?.label}
      tooltip={false}
      type="popover"
    >
      <Input
        className="code-search"
        onChange={(e) => setSearch(e.target.value.trim())}
        placeholder="Seach language..."
        style={{ width: "10rem" }}
        value={search}
      />
      <div
        className="code-list"
        style={{
          maxHeight: `${((contentElement.current as HTMLElement)?.clientHeight || 0) * 0.375}px`,
        }}
      >
        {filterOptions.map((item: any) => (
          <PopoverClose asChild key={item.value}>
            {/** biome-ignore lint/a11y/noStaticElementInteractions: false positive */}
            {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: false positive */}
            {/** biome-ignore lint/a11y/useKeyWithClickEvents: false positive */}
            <div
              className="code-item"
              onClick={() => {
                onSelect(item.value);
                setSearch("");
              }}
            >
              {item.label}
              {item.value === value && (
                <Icon
                  className="code-item__indicator"
                  name="Check"
                  size={14}
                  strokeWidth={2.5}
                />
              )}
            </div>
          </PopoverClose>
        ))}
      </div>
    </MenuButton>
  );
};

export default CodeDropdown;
