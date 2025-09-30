import { useTranslations } from "next-intl";
import Combobox from "@/components/ui/combobox";
import timezones from "@/json/timezones.json" with { type: "json" };

const SelectTimezone = ({
  onChange,
}: {
  onChange: (value: string) => void;
}) => {
  const t = useTranslations();

  const options = getTimezones(timezones) as { value: string; label: string }[];

  return (
    <Combobox
      contentWidthMatchInput={true}
      name="timezone"
      onChange={onChange}
      options={options}
      placeholder={t("common.placeholder.select_timezone")}
      searchPlaceholder={t("common.placeholder.search_timezone")}
    />
  );
};

export default SelectTimezone;

const getTimezones = (timezonesArray: { utc: string[]; text: string }[]) =>
  timezonesArray.map((timezone) => ({
    value: timezone.utc[0],
    label: timezone.text,
  }));
