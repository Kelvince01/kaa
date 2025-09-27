import MenuButton from "../../MenuButton";
import { DropdownMenuItem } from "../../ui/DropdownMenu";

type SizeDropdownProps = {
  value: number;
  onChange: (value: number | null) => void;
};

const SizeDropdown = ({ value, onChange }: SizeDropdownProps) => {
  const options = [null, 25, 50, 75, 100];
  return (
    <MenuButton
      buttonStyle={{ width: "6.5rem" }}
      dropdownStyle={{ width: "7rem" }}
      hideText={false}
      icon="Ruler"
      text={value ? `${value}%` : "Default"}
      tooltip={false}
      type="dropdown"
    >
      {options.map((option, index) => (
        <DropdownMenuItem
          data-active={option === value || undefined}
          key={index.toString()}
          onSelect={() => onChange(option)}
        >
          {option ? `${option}% width` : "Default"}
        </DropdownMenuItem>
      ))}
    </MenuButton>
  );
};

export default SizeDropdown;
