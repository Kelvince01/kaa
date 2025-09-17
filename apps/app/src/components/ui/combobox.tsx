"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@kaa/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { ScrollArea, ScrollBar } from "@kaa/ui/components/scroll-area";
import { cn } from "@kaa/ui/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Virtualizer } from "virtua";
import { AvatarWrap } from "@/components/common/avatar-wrap";
import ContentPlaceholder from "@/components/common/content-placeholder";
import { useBreakpoints } from "@/hooks/use-breakpoints";
import useDebounce from "@/hooks/use-debounce";
import { useMeasure } from "@/hooks/use-measure";

type ComboBoxOption = {
  value: string;
  label: string;
  url?: string | null;
};

type ComboboxProps = {
  options: ComboBoxOption[];
  name: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  renderOption?: (option: ComboBoxOption) => React.ReactNode;
  contentWidthMatchInput?: boolean;
  disabled?: boolean;
  value?: string;
  className?: string;
};

const Combobox: React.FC<ComboboxProps> = ({
  options,
  name,
  onChange,
  placeholder,
  searchPlaceholder,
  renderOption,
  contentWidthMatchInput,
  disabled,
  value,
  className,
}) => {
  const t = useTranslations();
  const formValue = useFormContext()?.getValues(name);
  const isMobile = useBreakpoints("max", "sm");
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  const { ref, bounds } = useMeasure<HTMLButtonElement>();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<ComboBoxOption | null>(
    options.find((o) => o.value === formValue || o.value === value) || null
  );

  const excludeAvatarWrapFields = ["timezone", "country"];
  const debouncedSearchQuery = useDebounce(searchValue, 300);

  const filteredOptions = useMemo(
    () =>
      options.filter(({ label }) =>
        label.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      ),
    [options, debouncedSearchQuery]
  );

  const handleSelect = (newResult: string) => {
    const result = options.find((o) => o.label === newResult);
    if (!result) return;
    setSelectedOption(result);
    onChange(result.value);
    setOpen(false);
    setSearchValue("");
  };

  // Whenever the form value changes (also on reset), update the internal state
  useEffect(() => {
    const selected = options.find((o) => o.value === formValue);
    setSelectedOption(selected || null);
  }, [formValue, options]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "w-full justify-between truncate font-normal",
            className
          )}
          disabled={disabled}
          ref={ref}
          role="combobox"
          variant="input"
        >
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {!excludeAvatarWrapFields.includes(name) && (
                <AvatarWrap
                  className="h-6 w-6 shrink-0 text-xs"
                  id={selectedOption.value}
                  name={name}
                  url={selectedOption.url}
                />
              )}
              {renderOption?.(selectedOption) ?? (
                <span className="truncate">{selectedOption.label}</span>
              )}
            </div>
          ) : (
            <span className="truncate">
              {placeholder || t("common.select")}
            </span>
          )}
          <ChevronDown
            className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${open ? "-rotate-90" : "rotate-0"}`}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="p-0"
        style={{ width: contentWidthMatchInput ? `${bounds.width}px` : "100%" }}
      >
        <Command shouldFilter={false}>
          {!isMobile && (
            <CommandInput
              clearValue={setSearchValue}
              onValueChange={setSearchValue}
              placeholder={searchPlaceholder || t("common.search")}
              value={searchValue}
            />
          )}

          <CommandList className="h-[30vh]">
            <CommandEmpty>
              <ContentPlaceholder
                Icon={Search}
                title={t("common.no_resource_found", {
                  resource: t(`common.${name}`).toLowerCase(),
                })}
              />
            </CommandEmpty>

            <CommandGroup>
              {/* To avoid conflicts between ScrollArea and Virtualizer, do not set a max-h value on ScrollArea. 
              As this will cause all list elements to render at once in Virtualizer*/}
              <ScrollArea className="h-[30vh]" viewPortRef={scrollViewportRef}>
                <ScrollBar />

                <Virtualizer
                  as="ul"
                  item="li"
                  overscan={2}
                  scrollRef={scrollViewportRef}
                >
                  {filteredOptions.map((option, index) => (
                    <CommandItem
                      className="group flex w-full items-center justify-between rounded-md leading-normal"
                      key={`${option.value}-${index}`}
                      onSelect={handleSelect}
                      value={option.label}
                    >
                      <div className="flex items-center gap-2">
                        {!excludeAvatarWrapFields.includes(name) && (
                          <AvatarWrap
                            id={option.value}
                            name={name}
                            url={option.url}
                          />
                        )}
                        {renderOption?.(option) ?? option.label}
                      </div>
                      <Check
                        className={`text-success ${formValue !== option.value && "invisible"}`}
                        size={16}
                      />
                    </CommandItem>
                  ))}
                </Virtualizer>
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Combobox;
