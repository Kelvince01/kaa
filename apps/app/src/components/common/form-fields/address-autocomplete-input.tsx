import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@kaa/ui/components/command";
import { useQuery } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { FormMessages } from "@/components/ui/form-messages";
import useDebounce from "@/hooks/use-debounce";
import { locationService } from "@/modules/location/location.service";

type CommonProps = {
  selectedPlaceId: string;
  setSelectedPlaceId: (placeId: string) => void;
  setIsOpenDialog: (isOpen: boolean) => void;
  showInlineError?: boolean;
  searchInput: string;
  setSearchInput: (searchInput: string) => void;
  placeholder?: string;
};

function AddressAutoCompleteInput(props: CommonProps) {
  const {
    setSelectedPlaceId,
    selectedPlaceId,
    setIsOpenDialog,
    showInlineError,
    searchInput,
    setSearchInput,
    placeholder,
  } = props;

  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      close();
    }
  };

  const debouncedSearchInput = useDebounce(searchInput, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["location-search", debouncedSearchInput],
    queryFn: () =>
      locationService.searchPlaces(debouncedSearchInput, {
        limit: 10,
        countryCode: "ke",
        includeDetails: true,
      }),
    enabled: debouncedSearchInput.length > 2,
  });

  const suggestions = data || [];

  return (
    <Command
      className="overflow-visible"
      onKeyDown={handleKeyDown}
      shouldFilter={false}
    >
      <div className="flex w-full items-center justify-between rounded-lg border bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <CommandPrimitive.Input
          className="w-full rounded-lg p-3 outline-none"
          onBlur={close}
          onFocus={open}
          onValueChange={setSearchInput}
          placeholder={placeholder || "Enter address"}
          value={searchInput}
        />
      </div>
      {searchInput !== "" && !isOpen && !selectedPlaceId && showInlineError && (
        <FormMessages
          className="pt-1 text-sm"
          messages={["Select a valid address from the list"]}
          type="error"
        />
      )}

      {isOpen && (
        <div className="fade-in-0 zoom-in-95 relative h-auto animate-in">
          <CommandList>
            <div className="absolute top-1.5 z-50 w-full">
              <CommandGroup className="relative z-50 h-auto min-w-[8rem] overflow-hidden rounded-md border bg-background shadow-md">
                {isLoading ? (
                  <div className="flex h-28 items-center justify-center">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                ) : (
                  suggestions.map((suggestion) => (
                    <CommandPrimitive.Item
                      className="flex h-max cursor-pointer select-text flex-col items-start gap-0.5 rounded-md p-2 px-3 hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                      key={suggestion.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onSelect={() => {
                        setSearchInput(suggestion.displayName);
                        setSelectedPlaceId(suggestion.id);
                        setIsOpenDialog(true);
                      }}
                      value={suggestion.displayName}
                    >
                      <div className="font-medium">
                        {suggestion.displayName}
                      </div>
                      {suggestion.category && (
                        <div className="text-muted-foreground text-xs capitalize">
                          {suggestion.category}
                        </div>
                      )}
                    </CommandPrimitive.Item>
                  ))
                )}

                <CommandEmpty>
                  {!isLoading && suggestions.length === 0 && (
                    <div className="flex items-center justify-center py-4">
                      {searchInput === ""
                        ? "Please enter an address"
                        : "No address found"}
                    </div>
                  )}
                </CommandEmpty>
              </CommandGroup>
            </div>
          </CommandList>
        </div>
      )}
    </Command>
  );
}

export default AddressAutoCompleteInput;
