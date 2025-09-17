import { Badge } from "@kaa/ui/components/badge";
import { SquarePen } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * A badge to indicate that there are unsaved changes.
 */
function UnsavedBadge({ title }: { title?: string | React.ReactNode }) {
  const t = useTranslations();
  return (
    <div className="flex flex-row gap-2">
      {typeof title === "string" ? <span>{title}</span> : title}
      <Badge className="w-fit" variant="plain">
        <SquarePen className="mr-2" size={12} />
        <span className="font-light">{t("common.unsaved_changes")}</span>
      </Badge>
    </div>
  );
}

export default UnsavedBadge;
