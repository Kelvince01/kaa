import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@kaa/ui/components/command";
import { Input } from "@kaa/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { cn } from "@kaa/ui/lib/utils";
import { AlertCircle, Loader2, MapPin, Navigation } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useDebounce from "@/hooks/use-debounce";

type AddressSuggestion = {
  id: string;
  displayName: string;
  address: {
    line1: string;
    line2?: string;
    town: string;
    county: string;
    constituency?: string;
    postalCode: string;
    country: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  confidence: number;
};

type SmartAddressInputProps = {
  value?: string;
  onChange: (address: AddressSuggestion["address"]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

// Mock geocoding service - replace with actual implementation
const mockGeocodingService = {
  async searchAddresses(query: string): Promise<AddressSuggestion[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!query || query.length < 3) return [];

    // Mock Kenyan addresses
    const mockResults: AddressSuggestion[] = [
      {
        id: "1",
        displayName: "Kilimani, Nairobi",
        address: {
          line1: "Kilimani Road",
          town: "Nairobi",
          county: "Nairobi",
          constituency: "Dagoretti North",
          postalCode: "00100",
          country: "Kenya",
        },
        coordinates: { lat: -1.2958, lng: 36.7825 },
        confidence: 0.95,
      },
      {
        id: "2",
        displayName: "Westlands, Nairobi",
        address: {
          line1: "Westlands Road",
          town: "Nairobi",
          county: "Nairobi",
          constituency: "Westlands",
          postalCode: "00100",
          country: "Kenya",
        },
        coordinates: { lat: -1.2687, lng: 36.8058 },
        confidence: 0.92,
      },
      {
        id: "3",
        displayName: "Karen, Nairobi",
        address: {
          line1: "Karen Road",
          town: "Nairobi",
          county: "Nairobi",
          constituency: "Langata",
          postalCode: "00502",
          country: "Kenya",
        },
        coordinates: { lat: -1.3192, lng: 36.7005 },
        confidence: 0.88,
      },
    ].filter((result) =>
      result.displayName.toLowerCase().includes(query.toLowerCase())
    );

    return mockResults;
  },

  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return await new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => resolve(null),
        { timeout: 10_000 }
      );
    });
  },

  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<AddressSuggestion | null> {
    // Mock reverse geocoding
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: "current",
      displayName: "Current Location",
      address: {
        line1: "Current Location Address",
        town: "Nairobi",
        county: "Nairobi",
        constituency: "Kilimani",
        postalCode: "00100",
        country: "Kenya",
      },
      coordinates: { lat, lng },
      confidence: 0.85,
    };
  },
};

export function SmartAddressInput({
  value,
  onChange,
  placeholder = "Enter address or search location...",
  className,
  disabled,
}: SmartAddressInputProps) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search for addresses when query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 3) {
      setIsLoading(true);
      mockGeocodingService
        .searchAddresses(debouncedQuery)
        .then(setSuggestions)
        .finally(() => setIsLoading(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  const handleSelectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      setQuery(suggestion.displayName);
      onChange(suggestion.address);
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [onChange]
  );

  const handleGetCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);

    try {
      const coords = await mockGeocodingService.getCurrentLocation();
      if (coords) {
        const result = await mockGeocodingService.reverseGeocode(
          coords.lat,
          coords.lng
        );
        if (result) {
          handleSelectSuggestion(result);
        }
      }
    } catch (error) {
      console.error("Failed to get location:", error);
    } finally {
      setIsGettingLocation(false);
    }
  }, [handleSelectSuggestion]);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9)
      return { variant: "default" as const, text: "Exact" };
    if (confidence >= 0.8)
      return { variant: "secondary" as const, text: "Good" };
    return { variant: "outline" as const, text: "Approximate" };
  };

  return (
    <div className={cn("relative", className)}>
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <div className="flex gap-2">
          <PopoverTrigger asChild>
            <div className="relative flex-1">
              <Input
                className="pr-8"
                disabled={disabled}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!isOpen && e.target.value.length >= 3) {
                    setIsOpen(true);
                  }
                }}
                onFocus={() => {
                  if (query.length >= 3) setIsOpen(true);
                }}
                placeholder={placeholder}
                ref={inputRef}
                value={query}
              />
              <MapPin className="-translate-y-1/2 absolute top-1/2 right-2 h-4 w-4 text-gray-400" />
            </div>
          </PopoverTrigger>

          <Button
            disabled={disabled || isGettingLocation}
            onClick={handleGetCurrentLocation}
            size="icon"
            title="Use current location"
            type="button"
            variant="outline"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        <PopoverContent
          align="start"
          className="w-[400px] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandInput
              onValueChange={setQuery}
              placeholder="Search addresses..."
              value={query}
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-gray-500 text-sm">Searching...</span>
                </div>
              )}

              {!isLoading && suggestions.length === 0 && query.length >= 3 && (
                <CommandEmpty>
                  <div className="flex flex-col items-center py-6">
                    <AlertCircle className="mb-2 h-8 w-8 text-gray-400" />
                    <span className="text-gray-500 text-sm">
                      No addresses found
                    </span>
                    <span className="mt-1 text-gray-400 text-xs">
                      Try a different search term
                    </span>
                  </div>
                </CommandEmpty>
              )}

              {suggestions.length > 0 && (
                <CommandGroup heading="Address Suggestions">
                  {suggestions.map((suggestion) => {
                    const badge = getConfidenceBadge(suggestion.confidence);
                    return (
                      <CommandItem
                        className="flex cursor-pointer items-start justify-between p-3"
                        key={suggestion.id}
                        onSelect={() => handleSelectSuggestion(suggestion)}
                        value={suggestion.displayName}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">
                                {suggestion.displayName}
                              </div>
                              <div className="mt-1 text-gray-500 text-xs">
                                {suggestion.address.line1}
                                {suggestion.address.constituency &&
                                  `, ${suggestion.address.constituency}`}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge className="ml-2" variant={badge.variant}>
                          {badge.text}
                        </Badge>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
