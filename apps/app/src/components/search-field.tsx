import { Input } from "@kaa/ui/components/input";
import { Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { useHotkeys } from "react-hotkeys-hook";

type Props = {
  placeholder: string;
  shallow?: boolean;
};

export function SearchField({ placeholder, shallow = false }: Props) {
  const [search, setSearch] = useQueryState("q", {
    shallow,
  });

  useHotkeys("esc", () => setSearch(null), {
    enableOnFormTags: true,
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setSearch(value);
    } else {
      setSearch(null);
    }
  };

  return (
    <div className="relative w-full items-center justify-center md:max-w-[380px]">
      <Search className="pointer-events-none absolute top-[11px] left-3 size-4" />
      <Input
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className="w-full pl-9"
        onChange={handleSearch}
        placeholder={placeholder}
        spellCheck="false"
        value={search ?? ""}
      />
    </div>
  );
}
