import { cn } from "@kaa/ui/lib/utils";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import Combobox from "@/components/ui/combobox";
import constituencies from "@/json/constituencies.json" with { type: "json" };

type SelectConstituencyProps = {
  onChange: (value: string) => void;
  countyCode?: string;
  value?: string;
  disabled?: boolean;
};

const SelectConstituency = ({
  onChange,
  countyCode,
  value,
  disabled,
}: SelectConstituencyProps) => {
  const t = useTranslations();

  // Filter constituencies based on selected county
  const filteredConstituencies = useMemo(() => {
    if (!countyCode) return constituencies;
    return constituencies.filter((c) => c.county_code === countyCode);
  }, [countyCode]);

  const options = useMemo(() => {
    return getConstituencies(filteredConstituencies);
  }, [filteredConstituencies]);

  const renderConstituencyOption = (option: {
    value: string;
    label: string;
  }) => (
    <div className="flex flex-nowrap items-center gap-2 truncate">
      <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{option.label}</span>
    </div>
  );

  const placeholder = countyCode
    ? filteredConstituencies.length === 0
      ? t("common.placeholder.no_constituencies", {
          defaultValue: "No constituencies found",
        })
      : t("common.placeholder.select_constituency")
    : t("common.placeholder.select_county_first", {
        defaultValue: "Please select a county first",
      });

  return (
    <Combobox
      className={cn(
        !countyCode && "cursor-not-allowed opacity-50",
        filteredConstituencies.length === 0 && countyCode && "opacity-50"
      )}
      contentWidthMatchInput={true}
      disabled={disabled || !countyCode || filteredConstituencies.length === 0}
      name="constituency"
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      renderOption={renderConstituencyOption}
      searchPlaceholder={t("common.placeholder.search_constituency")}
      value={value}
    />
  );
};

export default SelectConstituency;

const getConstituencies = (
  constituenciesArray: { county_code: string; name: string }[]
) => {
  return constituenciesArray.map((constituency) => ({
    value: constituency.name,
    label: constituency.name,
  }));
};
