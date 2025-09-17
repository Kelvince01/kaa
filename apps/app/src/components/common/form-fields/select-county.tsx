import { useTranslations } from "next-intl";
import Combobox from "@/components/ui/combobox";
import counties from "@/json/counties.json" with { type: "json" };

const SelectCounty = ({
  onChange,
  disabled,
}: {
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const t = useTranslations();
  const options = getCounties(counties);

  const renderCountyOption = (option: { value: string; label: string }) => (
    <div className="flex flex-nowrap items-center truncate">
      <span className="truncate">{option.label}</span>
    </div>
  );
  return (
    <Combobox
      contentWidthMatchInput={true}
      disabled={disabled}
      name="county"
      onChange={onChange}
      options={options}
      placeholder={t("common.placeholder.select_county")}
      renderOption={renderCountyOption}
      searchPlaceholder={t("common.placeholder.search_county")}
    />
  );
};

export default SelectCounty;

const getCounties = (countiesArray: { code: string; name: string }[]) => {
  return countiesArray.map((county) => ({
    value: county.name,
    label: county.name,
  }));
};
