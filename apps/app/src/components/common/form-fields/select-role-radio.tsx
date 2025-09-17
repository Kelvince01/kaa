import { type ContextEntity, config } from "@kaa/config";
import { RadioGroup, RadioGroupItem } from "@kaa/ui/components/radio-group";
import { cn } from "@kaa/ui/lib/utils";
import { useTranslations } from "next-intl";

type SelectRoleProps = {
  entityType?: ContextEntity;
  onChange: (value?: string) => void;
  value?: (typeof config.rolesByType.allRoles)[number];
  className?: string;
};

const SelectRole = ({
  entityType,
  onChange,
  value,
  className,
}: SelectRoleProps) => {
  const t = useTranslations();

  const roles = entityType ? config.rolesByType.entityRoles : ["user"];

  return (
    <RadioGroup
      className={cn("inline-flex items-center gap-4", className)}
      onValueChange={onChange}
      value={value}
    >
      {roles.map((role) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: role is a string
        <label
          className="inline-flex cursor-pointer items-center gap-2"
          key={role}
        >
          <RadioGroupItem key={role} value={role} />
          <span className="font-normal text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {t(`common.${role}`)}
          </span>
        </label>
      ))}
    </RadioGroup>
  );
};

export default SelectRole;
