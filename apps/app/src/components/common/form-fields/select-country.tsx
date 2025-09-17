import { useTranslations } from "next-intl";
import CountryFlag from "@/components/common/country-flag";
import Combobox from "@/components/ui/combobox";
import countries from "@/json/countries.json" with { type: "json" };

const SelectCountry = ({
  onChange,
  disabled,
  defaultValue,
}: {
  onChange: (value: string) => void;
  disabled?: boolean;
  defaultValue?: string;
}) => {
  const t = useTranslations();
  const options = getCountries(countries);

  const renderCountryOption = (option: { value: string; label: string }) => (
    <div className="flex flex-nowrap items-center truncate">
      <CountryFlag
        className="mr-2 shrink-0"
        countryCode={option.value}
        imgType="png"
      />
      <span className="truncate">{option.label}</span>
    </div>
  );

  return (
    <Combobox
      contentWidthMatchInput={true}
      disabled={disabled}
      name="country"
      onChange={onChange}
      options={options}
      placeholder={t("common.placeholder.select_country")}
      renderOption={renderCountryOption}
      searchPlaceholder={t("common.placeholder.search_country")}
      value={defaultValue}
    />
  );
};

export default SelectCountry;

const getCountries = (countriesArray: { code: string; name: string }[]) => {
  return countriesArray.map((country) => ({
    value: country.code,
    label: country.name,
  }));
};
