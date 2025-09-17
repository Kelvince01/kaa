import { config } from "@kaa/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { cn } from "@kaa/ui/lib/utils";
import { useTranslations } from "next-intl";
import { useOnlineManager } from "@/hooks/use-online-manager";

type SelectRoleProps = {
  entity?: boolean;
  onChange: (value?: string) => void;
  value?: string;
  className?: string;
};

const SelectRole = ({
  entity = false,
  onChange,
  value,
  className,
}: SelectRoleProps) => {
  const t = useTranslations();
  const { isOnline } = useOnlineManager();

  const roles = entity
    ? config.rolesByType.entityRoles
    : config.rolesByType.systemRoles;

  return (
    <Select
      onValueChange={(role) => onChange(role === "all" ? undefined : role)}
      value={value === undefined || value === "all" ? "all" : value}
    >
      <SelectTrigger className={cn("w-full", className)} disabled={!isOnline}>
        <SelectValue placeholder={t("common.placeholder.select_role")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={"all"}> {t("common.all")}</SelectItem>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            {t(`common.${role}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectRole;
