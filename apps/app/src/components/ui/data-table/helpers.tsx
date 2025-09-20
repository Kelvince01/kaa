import { Button } from "@kaa/ui/components/button";
import { FilterX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type TableCountProps = {
  count?: number;

  type: string;
  isFiltered?: boolean;
  onResetFilters?: () => void;
  children?: ReactNode;
};
/**
 * Displays the count of items in a table
 */
const TableCount = ({
  count,
  type,
  isFiltered,
  children,
  onResetFilters,
}: TableCountProps) => {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm max-sm:hidden">
      {isFiltered && (
        <Button
          className="max-sm:hidden"
          onClick={onResetFilters}
          variant="ghost"
        >
          <FilterX className="mr-1" size={16} />
          {t("common.clear")}
        </Button>
      )}
      {count !== undefined && (
        <div>
          {new Intl.NumberFormat("en-KE").format(count)}{" "}
          {t(`common.${type}${count === 1 ? "" : "s"}`).toLowerCase()}
          {isFiltered && ` ${t("common.found")}`}
        </div>
      )}
      {children}
    </div>
  );
};

export { TableCount };
