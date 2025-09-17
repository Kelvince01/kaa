import { config } from "@kaa/config";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { cn } from "@kaa/ui/lib/utils";
import { useTranslations } from "next-intl";

type SelectRoleProps = {
  onChange: (value: string[]) => void;
  value?: string[];
  className?: string;
};

const SelectRoles = ({ onChange, value = [], className }: SelectRoleProps) => {
  const t = useTranslations();

  const handleCheckboxChange = (role: string) => {
    const newValue = value.includes(role)
      ? value.filter((selectedRole) => selectedRole !== role) // Remove role if it already exists
      : [...value, role];
    onChange(newValue);
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {config.rolesByType.entityRoles.map((role) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: role is a string
        <label
          className="inline-flex cursor-pointer items-center gap-2"
          key={role}
        >
          <Checkbox
            checked={value.includes(role)}
            className="h-5 w-5"
            onCheckedChange={() => handleCheckboxChange(role)}
          />
          <span className="font-normal text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {t(`common.${role}`)}
          </span>
        </label>
      ))}
    </div>
  );
};

export default SelectRoles;
