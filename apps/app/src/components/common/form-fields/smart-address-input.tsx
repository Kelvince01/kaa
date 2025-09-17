import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@kaa/ui/components/command";
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import {
  AlertCircle,
  Building2,
  Check,
  Home,
  Landmark,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormMessages } from "@/components/ui/form-messages";
import useDebounce from "@/hooks/use-debounce";
import { locationService } from "@/modules/location/location.service";
import type {
  Address,
  AddressSuggestion,
  Coordinates,
} from "@/modules/location/location.type";

type SmartAddressInputProps = {
  value?: Address;
  onChange: (address: Address, suggestion: AddressSuggestion) => void;
  onCoordinatesChange?: (coordinates: Coordinates) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocation?: boolean;
  showValidation?: boolean;
  showMap?: boolean;
  countryCode?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
};

const categoryIcons = {
  residential: Home,
  commercial: Building2,
  administrative: Landmark,
  landmark: Star,
} as const;

export function SmartAddressInput({
  value,
  onChange,
  onCoordinatesChange,
  placeholder = "Enter an address or place name...",
  className,
  showCurrentLocation = true,
  showValidation = true,
  //   showMap = false,
  countryCode = "ke",
  //   required = false,
  error,
  disabled = false,
}: SmartAddressInputProps) {
  const [searchInput, setSearchInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AddressSuggestion | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearchInput = useDebounce(searchInput, 500);

  // Search query
  const {
    data: suggestions = [],
    isLoading,
    error: searchError,
  } = useQuery({
    queryKey: ["smart-address-search", debouncedSearchInput, countryCode],
    queryFn: () =>
      locationService.searchPlaces(debouncedSearchInput, {
        limit: 10,
        countryCode,
        includeDetails: true,
      }),
    enabled: debouncedSearchInput.length > 2 && !disabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Address validation query
  const { data: validation } = useQuery({
    queryKey: ["address-validation", value],
    queryFn: () => (value ? locationService.validateAddress(value) : null),
    enabled: showValidation && !!value && Object.keys(value).length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Current location query
  const { data: currentLocationAddress, isLoading: isLoadingCurrentLocation } =
    useQuery({
      queryKey: ["current-location-address", currentLocation],
      queryFn: () =>
        currentLocation
          ? locationService.reverseGeocode(currentLocation)
          : null,
      enabled: !!currentLocation,
    });

  const handleInputChange = useCallback(
    (newValue: string) => {
      setSearchInput(newValue);
      if (!isOpen) setIsOpen(true);
    },
    [isOpen]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      setSelectedSuggestion(suggestion);
      setSearchInput(suggestion.displayName);
      setIsOpen(false);

      onChange(suggestion.address, suggestion);

      if (suggestion.coordinates && onCoordinatesChange) {
        onCoordinatesChange(suggestion.coordinates);
      }

      inputRef.current?.blur();
    },
    [onChange, onCoordinatesChange]
  );

  const handleCurrentLocation = useCallback(async () => {
    if (!showCurrentLocation || disabled) return;

    setIsGettingLocation(true);
    try {
      const coordinates = await locationService.getCurrentLocation();
      setCurrentLocation(coordinates);

      if (onCoordinatesChange) {
        onCoordinatesChange(coordinates);
      }
    } catch (error) {
      console.error("Failed to get current location:", error);
    } finally {
      setIsGettingLocation(false);
    }
  }, [showCurrentLocation, disabled, onCoordinatesChange]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    []
  );

  // Auto-fill from current location
  useEffect(() => {
    if (currentLocationAddress && currentLocation) {
      setSelectedSuggestion(currentLocationAddress);
      setSearchInput(currentLocationAddress.displayName);
      onChange(currentLocationAddress.address, currentLocationAddress);
    }
  }, [currentLocationAddress, currentLocation, onChange]);

  // Initialize with existing value
  useEffect(() => {
    if (value && !searchInput) {
      const formattedAddress = locationService.formatAddress(value);
      setSearchInput(formattedAddress);
    }
  }, [value, searchInput]);

  const getCategoryIcon = (category?: string) => {
    if (!category) return MapPin;
    return categoryIcons[category as keyof typeof categoryIcons] || MapPin;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const hasError = error || (searchError && searchInput.length > 2);
  const hasValidation = validation && !validation.isValid;

  return (
    <div className={cn("relative w-full", className)}>
      <Command
        className="overflow-visible"
        onKeyDown={handleKeyDown}
        shouldFilter={false}
      >
        <div
          className={cn(
            "flex w-full items-center rounded-lg border bg-background text-sm ring-offset-background",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            hasError && "border-destructive focus-within:ring-destructive",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex items-center pl-3 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>

          <CommandPrimitive.Input
            className="flex-1 px-3 py-3 outline-none disabled:cursor-not-allowed"
            disabled={disabled}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            onFocus={() => setIsOpen(true)}
            onValueChange={handleInputChange}
            placeholder={placeholder}
            ref={inputRef}
            value={searchInput}
          />

          {/* Loading indicator */}
          {(isLoading || isGettingLocation || isLoadingCurrentLocation) && (
            <div className="flex items-center pr-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Current location button */}
          {showCurrentLocation && !disabled && (
            <>
              <Separator className="mx-1 h-6" orientation="vertical" />
              <Button
                className="mr-2 h-8 w-8 p-0"
                disabled={isGettingLocation}
                onClick={handleCurrentLocation}
                size="sm"
                title="Use current location"
                type="button"
                variant="ghost"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Validation indicator */}
          {selectedSuggestion && (
            <div className="flex items-center pr-3">
              <Check className="h-4 w-4 text-green-600" />
            </div>
          )}
        </div>

        {/* Error messages */}
        {hasError && (
          <FormMessages
            className="pt-1 text-sm"
            messages={[
              error || "Failed to search locations. Please try again.",
            ]}
            type="error"
          />
        )}

        {/* Validation warnings */}
        {hasValidation && validation && (
          <div className="pt-1">
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span>Address validation issues found</span>
            </div>
            {validation.issues && validation.issues.length > 0 && (
              <ul className="mt-1 space-y-1 text-muted-foreground text-xs">
                {validation.issues.map((issue, index) => (
                  <li className="ml-6" key={index.toString()}>
                    {issue.field}: {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Suggestions dropdown */}
        {isOpen && (searchInput.length > 0 || currentLocationAddress) && (
          <div className="fade-in-0 zoom-in-95 relative h-auto animate-in">
            <CommandList>
              <div className="absolute top-1.5 z-50 w-full">
                <CommandGroup className="relative z-50 max-h-80 min-w-[8rem] overflow-auto rounded-md border bg-background shadow-lg">
                  {/* Current location result */}
                  {currentLocationAddress && (
                    <>
                      <div className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                        Current Location
                      </div>
                      <CommandPrimitive.Item
                        className="flex cursor-pointer items-start gap-3 rounded-md p-3 hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                        onMouseDown={(e) => e.preventDefault()}
                        onSelect={() =>
                          handleSuggestionSelect(currentLocationAddress)
                        }
                        value={`current-${currentLocationAddress.displayName}`}
                      >
                        <Navigation className="mt-0.5 h-5 w-5 text-blue-600" />
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">
                            {currentLocationAddress.displayName}
                          </div>
                          <div className="flex items-center gap-2">
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
                              {Math.round(
                                currentLocationAddress.confidence * 100
                              )}
                              % match
                            </span>
                          </div>
                        </div>
                      </CommandPrimitive.Item>
                      {suggestions.length > 0 && <Separator className="my-2" />}
                    </>
                  )}

                  {/* Search results */}
                  {suggestions.length > 0 && searchInput.length > 2 && (
                    <>
                      <div className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                        Search Results
                      </div>
                      {suggestions.map((suggestion) => {
                        const CategoryIcon = getCategoryIcon(
                          suggestion.category
                        );
                        return (
                          <CommandPrimitive.Item
                            className="flex cursor-pointer items-start gap-3 rounded-md p-3 hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                            key={suggestion.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                            value={suggestion.displayName}
                          >
                            <CategoryIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 space-y-1">
                              <div className="font-medium">
                                {suggestion.displayName}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {suggestion.category && (
                                  <Badge
                                    className="text-xs capitalize"
                                    variant="outline"
                                  >
                                    {suggestion.category}
                                  </Badge>
                                )}
                                <span
                                  className={cn(
                                    "text-xs",
                                    getConfidenceColor(suggestion.confidence)
                                  )}
                                >
                                  {Math.round(suggestion.confidence * 100)}%
                                  match
                                </span>
                                {suggestion.coordinates && (
                                  <span className="text-muted-foreground text-xs">
                                    {suggestion.coordinates.lat.toFixed(4)},{" "}
                                    {suggestion.coordinates.lng.toFixed(4)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CommandPrimitive.Item>
                        );
                      })}
                    </>
                  )}

                  {/* Empty state */}
                  <CommandEmpty>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                        <div className="text-muted-foreground text-sm">
                          {searchInput.length === 0
                            ? "Start typing to search for addresses..."
                            : "No addresses found. Try a different search term."}
                        </div>
                        {showCurrentLocation && (
                          <Button
                            className="mt-2 text-xs"
                            disabled={isGettingLocation}
                            onClick={handleCurrentLocation}
                            size="sm"
                            variant="ghost"
                          >
                            <Navigation className="mr-1 h-4 w-4" />
                            Use current location
                          </Button>
                        )}
                      </div>
                    )}
                  </CommandEmpty>
                </CommandGroup>
              </div>
            </CommandList>
          </div>
        )}
      </Command>

      {/* Selected address details */}
      {selectedSuggestion && !isOpen && (
        <div className="mt-2 rounded-md border bg-muted/50 p-3">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 text-green-600" />
            <div className="flex-1 space-y-2">
              <div className="font-medium text-sm">
                {selectedSuggestion.displayName}
              </div>
              {selectedSuggestion.coordinates && (
                <div className="text-muted-foreground text-xs">
                  Coordinates: {selectedSuggestion.coordinates.lat.toFixed(6)},{" "}
                  {selectedSuggestion.coordinates.lng.toFixed(6)}
                </div>
              )}
              {validation && (
                <div className="flex items-center gap-2 text-xs">
                  {validation.isValid ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Address validated</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-600">
                        {Math.round(validation.confidence * 100)}% confidence
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartAddressInput;
