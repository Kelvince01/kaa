/**
 * Advanced property search component with filters
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kaa/ui/components/collapsible";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Separator } from "@kaa/ui/components/separator";
import { Slider } from "@kaa/ui/components/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { cn } from "@kaa/ui/lib/utils";
import {
  Bath,
  Bed,
  Building,
  Car,
  ChevronDown,
  ChevronUp,
  Dog,
  Home,
  MapPin,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Star,
  Trees,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import type { PropertySearchFilters } from "../types";

type PropertySearchProps = {
  filters: PropertySearchFilters;
  onFiltersChange: (filters: Partial<PropertySearchFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isLoading?: boolean;
  compact?: boolean;
};

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "house", label: "House", icon: Home },
  { value: "studio", label: "Studio", icon: Building },
  { value: "villa", label: "Villa", icon: Home },
  { value: "flat", label: "Flat", icon: Building },
  { value: "office", label: "Office", icon: Building },
];

const FEATURES = [
  { value: "parking", label: "Parking", icon: Car },
  { value: "garden", label: "Garden", icon: Trees },
  { value: "security", label: "Security", icon: Shield },
  { value: "generator", label: "Generator", icon: Zap },
  { value: "borehole", label: "Borehole", icon: Settings },
  { value: "internet", label: "Internet Ready", icon: Wifi },
];

const AMENITIES = [
  { value: "gym", label: "Gym", icon: Star },
  { value: "pool", label: "Swimming Pool", icon: Star },
  { value: "playground", label: "Playground", icon: Star },
  { value: "laundry", label: "Laundry", icon: Star },
  { value: "elevator", label: "Elevator", icon: Star },
  { value: "cctv", label: "CCTV", icon: Shield },
];

const BEDROOM_OPTIONS = [
  { value: 0, label: "Studio" },
  { value: 1, label: "1 Bedroom" },
  { value: 2, label: "2 Bedrooms" },
  { value: 3, label: "3 Bedrooms" },
  { value: 4, label: "4 Bedrooms" },
  { value: 5, label: "5+ Bedrooms" },
];

const BATHROOM_OPTIONS = [
  { value: 1, label: "1 Bathroom" },
  { value: 2, label: "2 Bathrooms" },
  { value: 3, label: "3 Bathrooms" },
  { value: 4, label: "4+ Bathrooms" },
];

export function PropertySearch({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  compact = false,
}: PropertySearchProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0,
    filters.maxPrice || 200_000,
  ]);

  const handleQueryChange = useCallback(
    (query: string) => {
      onFiltersChange({ query: query || undefined });
    },
    [onFiltersChange]
  );

  const handleLocationChange = useCallback(
    (location: string) => {
      onFiltersChange({ location: location || undefined });
    },
    [onFiltersChange]
  );

  const handleTypeChange = useCallback(
    (type: string) => {
      onFiltersChange({ type: type || undefined });
    },
    [onFiltersChange]
  );

  const handleBedroomsChange = useCallback(
    (bedrooms: number) => {
      onFiltersChange({
        minBedrooms: bedrooms === 0 ? undefined : bedrooms,
        maxBedrooms: bedrooms === 5 ? undefined : bedrooms === 0 ? 0 : bedrooms,
      });
    },
    [onFiltersChange]
  );

  const handleBathroomsChange = useCallback(
    (bathrooms: number) => {
      onFiltersChange({
        minBathrooms: bathrooms,
        maxBathrooms: bathrooms === 4 ? undefined : bathrooms,
      });
    },
    [onFiltersChange]
  );

  const handlePriceRangeCommit = useCallback(
    (range: [number, number]) => {
      onFiltersChange({
        minPrice: range[0] === 0 ? undefined : range[0],
        maxPrice: range[1] === 200_000 ? undefined : range[1],
      });
    },
    [onFiltersChange]
  );

  const handleFeatureToggle = useCallback(
    (feature: string, checked: boolean) => {
      const currentFeatures = filters.features || [];
      const newFeatures = checked
        ? [...currentFeatures, feature]
        : currentFeatures.filter((f) => f !== feature);

      onFiltersChange({
        features: newFeatures.length > 0 ? newFeatures : undefined,
      });
    },
    [filters.features, onFiltersChange]
  );

  const handleAmenityToggle = useCallback(
    (amenity: string, checked: boolean) => {
      const currentAmenities = filters.amenities || [];
      const newAmenities = checked
        ? [...currentAmenities, amenity]
        : currentAmenities.filter((a) => a !== amenity);

      onFiltersChange({
        amenities: newAmenities.length > 0 ? newAmenities : undefined,
      });
    },
    [filters.amenities, onFiltersChange]
  );

  const handleFurnishedToggle = useCallback(
    (checked: boolean) => {
      onFiltersChange({ furnished: checked || undefined });
    },
    [onFiltersChange]
  );

  const handlePetsAllowedToggle = useCallback(
    (checked: boolean) => {
      onFiltersChange({ petsAllowed: checked || undefined });
    },
    [onFiltersChange]
  );

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.location) count++;
    if (filters.type) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minBedrooms || filters.maxBedrooms) count++;
    if (filters.minBathrooms || filters.maxBathrooms) count++;
    if (filters.features?.length) count++;
    if (filters.amenities?.length) count++;
    if (filters.furnished) count++;
    if (filters.petsAllowed) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      {/* Main Search Bar */}
      <div className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search properties, locations, or keywords..."
              value={filters.query || ""}
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Enter city, area, or address..."
              value={filters.location || ""}
            />
          </div>

          {/* Advanced Filters Toggle */}
          <Collapsible onOpenChange={setIsExpanded} open={isExpanded}>
            <CollapsibleTrigger asChild>
              <Button className="shrink-0" size="default" variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    className="ml-2 h-5 px-1.5 text-xs"
                    variant="secondary"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4">
              <Separator />
              <div className="pt-4">
                <Tabs className="w-full" defaultValue="basic">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                  </TabsList>

                  <TabsContent className="mt-4 space-y-6" value="basic">
                    {/* Property Type */}
                    <div>
                      <Label className="mb-3 block font-medium text-sm">
                        Property Type
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {PROPERTY_TYPES.map((type) => (
                          <Button
                            className="justify-start"
                            key={type.value}
                            onClick={() =>
                              handleTypeChange(
                                filters.type === type.value ? "" : type.value
                              )
                            }
                            size="sm"
                            variant={
                              filters.type === type.value
                                ? "default"
                                : "outline"
                            }
                          >
                            <type.icon className="mr-2 h-4 w-4" />
                            {type.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Bedrooms */}
                      <div>
                        <Label className="mb-3 block font-medium text-sm">
                          Bedrooms
                        </Label>
                        <div className="grid grid-cols-2 gap-1">
                          {BEDROOM_OPTIONS.map((option) => (
                            <Button
                              key={option.value}
                              onClick={() => handleBedroomsChange(option.value)}
                              size="sm"
                              variant={
                                (option.value === 0 &&
                                  filters.maxBedrooms === 0) ||
                                (option.value > 0 &&
                                  filters.minBedrooms === option.value)
                                  ? "default"
                                  : "outline"
                              }
                            >
                              <Bed className="mr-1 h-4 w-4" />
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Bathrooms */}
                      <div>
                        <Label className="mb-3 block font-medium text-sm">
                          Bathrooms
                        </Label>
                        <div className="grid grid-cols-2 gap-1">
                          {BATHROOM_OPTIONS.map((option) => (
                            <Button
                              key={option.value}
                              onClick={() =>
                                handleBathroomsChange(option.value)
                              }
                              size="sm"
                              variant={
                                filters.minBathrooms === option.value
                                  ? "default"
                                  : "outline"
                              }
                            >
                              <Bath className="mr-1 h-4 w-4" />
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <Label className="mb-3 block font-medium text-sm">
                        Price Range (KES)
                        <span className="ml-2 text-muted-foreground text-xs">
                          {priceRange[0].toLocaleString()} -{" "}
                          {priceRange[1].toLocaleString()}
                        </span>
                      </Label>
                      <div className="px-2">
                        <Slider
                          className="w-full"
                          max={200_000}
                          min={0}
                          onValueChange={(value) =>
                            setPriceRange(value as [number, number])
                          }
                          onValueCommit={handlePriceRangeCommit}
                          step={5000}
                          value={priceRange}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent className="mt-4" value="features">
                    <div>
                      <Label className="mb-3 block font-medium text-sm">
                        Property Features
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {FEATURES.map((feature) => (
                          // biome-ignore lint/a11y/noLabelWithoutControl: ignore
                          <label
                            className={cn(
                              "flex cursor-pointer items-center space-x-2 rounded-md border p-2 transition-colors hover:bg-muted/50",
                              filters.features?.includes(feature.value) &&
                                "border-primary bg-primary/5"
                            )}
                            key={feature.value}
                          >
                            <Checkbox
                              checked={filters.features?.includes(
                                feature.value
                              )}
                              onCheckedChange={(checked) =>
                                handleFeatureToggle(
                                  feature.value,
                                  checked as boolean
                                )
                              }
                            />
                            <feature.icon className="h-4 w-4" />
                            <span className="text-sm">{feature.label}</span>
                          </label>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      {/* Additional Options */}
                      <div className="space-y-3">
                        {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                        <label className="flex cursor-pointer items-center space-x-2">
                          <Checkbox
                            checked={filters.furnished}
                            onCheckedChange={handleFurnishedToggle}
                          />
                          <span className="text-sm">Furnished</span>
                        </label>
                        {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                        <label className="flex cursor-pointer items-center space-x-2">
                          <Checkbox
                            checked={filters.petsAllowed}
                            onCheckedChange={handlePetsAllowedToggle}
                          />
                          <Dog className="h-4 w-4" />
                          <span className="text-sm">Pets Allowed</span>
                        </label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent className="mt-4" value="amenities">
                    <div>
                      <Label className="mb-3 block font-medium text-sm">
                        Building Amenities
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {AMENITIES.map((amenity) => (
                          // biome-ignore lint/a11y/noLabelWithoutControl: ignore
                          <label
                            className={cn(
                              "flex cursor-pointer items-center space-x-2 rounded-md border p-2 transition-colors hover:bg-muted/50",
                              filters.amenities?.includes(amenity.value) &&
                                "border-primary bg-primary/5"
                            )}
                            key={amenity.value}
                          >
                            <Checkbox
                              checked={filters.amenities?.includes(
                                amenity.value
                              )}
                              onCheckedChange={(checked) =>
                                handleAmenityToggle(
                                  amenity.value,
                                  checked as boolean
                                )
                              }
                            />
                            <amenity.icon className="h-4 w-4" />
                            <span className="text-sm">{amenity.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Active Filters & Actions */}
        {(isExpanded || hasActiveFilters) && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <>
                  <span className="text-muted-foreground text-sm">
                    {activeFiltersCount} filter
                    {activeFiltersCount !== 1 ? "s" : ""} applied
                  </span>
                  <Button
                    className="h-7 text-xs"
                    onClick={onClearFilters}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear All
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
