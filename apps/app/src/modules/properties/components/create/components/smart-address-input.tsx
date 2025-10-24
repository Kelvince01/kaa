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
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  Home,
  Landmark,
  Loader2,
  MapPin,
  Navigation,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useDebounce from "@/hooks/use-debounce";
import { locationService } from "@/modules/location/location.service";
import type {
  Address,
  AddressSuggestion,
  Coordinates,
} from "@/modules/location/location.type";

// Category icons for different place types
const categoryIcons = {
  residential: Home,
  commercial: Building2,
  administrative: Landmark,
  landmark: Star,
} as const;

type SmartAddressInputProps = {
  value?: string;
  onChange: (address: Address, suggestion?: AddressSuggestion) => void;
  onCoordinatesChange?: (coordinates: Coordinates) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  countryCode?: string;
  showCurrentLocation?: boolean;
  showValidation?: boolean;
};

export function SmartAddressInput({
  value,
  onChange,
  onCoordinatesChange,
  placeholder = "Enter address or search location...",
  className,
  disabled = false,
  countryCode = "ke",
  showCurrentLocation = true,
}: SmartAddressInputProps) {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AddressSuggestion | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null
  );
  const debouncedQuery = useDebounce(query, 500);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search query using real location service
  const {
    data: suggestions = [],
    isLoading,
    error: searchError,
  } = useQuery({
    queryKey: ["smart-address-search", debouncedQuery, countryCode],
    queryFn: () =>
      locationService.searchPlaces(debouncedQuery, {
        limit: 10,
        countryCode,
        includeDetails: true,
      }),
    enabled: debouncedQuery.length >= 3 && !disabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Current location reverse geocoding
  const { data: currentLocationAddress, isLoading: isLoadingCurrentLocation } =
    useQuery({
      queryKey: ["current-location-address", currentLocation],
      queryFn: () =>
        currentLocation
          ? locationService.reverseGeocode(currentLocation)
          : null,
      enabled: !!currentLocation,
    });

  const handleSelectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      setQuery(suggestion.displayName);
      setSelectedSuggestion(suggestion);
      onChange(suggestion.address, suggestion);

      // Pass coordinates if available
      if (suggestion.coordinates && onCoordinatesChange) {
        onCoordinatesChange(suggestion.coordinates);
      }

      setIsOpen(false);
      inputRef.current?.focus();
    },
    [onChange, onCoordinatesChange]
  );

  const handleGetCurrentLocation = useCallback(async () => {
    if (!showCurrentLocation || disabled) return;

    setIsGettingLocation(true);
    try {
      const coordinates = await locationService.getCurrentLocation();
      setCurrentLocation(coordinates);

      if (onCoordinatesChange) {
        onCoordinatesChange(coordinates);
      }
    } catch (error) {
      console.error("Failed to get location:", error);
    } finally {
      setIsGettingLocation(false);
    }
  }, [showCurrentLocation, disabled, onCoordinatesChange]);

  // Auto-fill from current location
  useEffect(() => {
    if (currentLocationAddress && currentLocation) {
      handleSelectSuggestion(currentLocationAddress);
    }
  }, [currentLocationAddress, currentLocation, handleSelectSuggestion]);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9)
      return { variant: "default" as const, text: "Exact" };
    if (confidence >= 0.8)
      return { variant: "secondary" as const, text: "Good" };
    return { variant: "outline" as const, text: "Approximate" };
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return MapPin;
    return categoryIcons[category as keyof typeof categoryIcons] || MapPin;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
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
              {/* Current location result */}
              {currentLocationAddress && (
                <CommandGroup heading="📍 Current Location">
                  <CommandItem
                    className="flex cursor-pointer items-start gap-3 border border-blue-200 bg-blue-50 p-3"
                    key="current-location"
                    onSelect={() =>
                      handleSelectSuggestion(currentLocationAddress)
                    }
                    value={`current-${currentLocationAddress.displayName}`}
                  >
                    <Navigation className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {currentLocationAddress.displayName}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge className="text-xs" variant="secondary">
                          Current Location
                        </Badge>
                        <span
                          className={cn(
                            "text-xs",
                            getConfidenceColor(
                              currentLocationAddress.confidence
                            )
                          )}
                        >
                          {Math.round(currentLocationAddress.confidence * 100)}%
                          match
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Loading state */}
              {(isLoading || isLoadingCurrentLocation) && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-gray-500 text-sm">Searching...</span>
                </div>
              )}

              {/* Search results */}
              {suggestions.length > 0 && (
                <CommandGroup
                  heading={
                    currentLocationAddress
                      ? "🔍 Search Results"
                      : "Address Suggestions"
                  }
                >
                  {suggestions.map((suggestion) => {
                    const badge = getConfidenceBadge(suggestion.confidence);
                    const CategoryIcon = getCategoryIcon(suggestion.category);
                    return (
                      <CommandItem
                        className="flex cursor-pointer items-start gap-3 p-3"
                        key={suggestion.id}
                        onSelect={() => handleSelectSuggestion(suggestion)}
                        value={suggestion.displayName}
                      >
                        <CategoryIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {suggestion.displayName}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {suggestion.category && (
                              <Badge
                                className="text-xs capitalize"
                                variant="outline"
                              >
                                {suggestion.category}
                              </Badge>
                            )}
                            <Badge className="text-xs" variant={badge.variant}>
                              {badge.text}
                            </Badge>
                            {suggestion.coordinates && (
                              <span className="text-muted-foreground text-xs">
                                {suggestion.coordinates.lat.toFixed(4)},{" "}
                                {suggestion.coordinates.lng.toFixed(4)}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-gray-500 text-xs">
                            {suggestion.address.line1}
                            {suggestion.address.constituency &&
                              `, ${suggestion.address.constituency}`}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {/* Empty state */}
              {!(isLoading || isLoadingCurrentLocation) &&
                suggestions.length === 0 &&
                !currentLocationAddress &&
                query.length >= 3 && (
                  <CommandEmpty>
                    <div className="flex flex-col items-center py-6">
                      <AlertCircle className="mb-2 h-8 w-8 text-gray-400" />
                      <span className="text-gray-500 text-sm">
                        No addresses found
                      </span>
                      <span className="mt-1 text-gray-400 text-xs">
                        Try a different search term
                      </span>
                      {showCurrentLocation && (
                        <Button
                          className="mt-2 text-xs"
                          disabled={isGettingLocation}
                          onClick={handleGetCurrentLocation}
                          size="sm"
                          variant="ghost"
                        >
                          <Navigation className="mr-1 h-4 w-4" />
                          Use current location
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
