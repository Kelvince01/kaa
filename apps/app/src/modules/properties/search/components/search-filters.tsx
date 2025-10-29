/**
 * Advanced search filters component
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import { Slider } from "@kaa/ui/components/slider";
import { cn } from "@kaa/ui/lib/utils";
import {
  Bath,
  Bed,
  Building,
  ChevronDown,
  ChevronUp,
  Dog,
  Home,
  MapPin,
  Sofa,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import type { PropertySearchParams } from "../search.types";

type SearchFiltersProps = {
  filters: PropertySearchParams;
  onFiltersChange: (filters: Partial<PropertySearchParams>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
  variant?: "full" | "compact";
};

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "house", label: "House", icon: Home },
  { value: "studio", label: "Studio", icon: Building },
  { value: "townhouse", label: "Townhouse", icon: Home },
  { value: "villa", label: "Villa", icon: Home },
];

const BEDROOM_OPTIONS = [
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

const FEATURES = [
  { value: "parking", label: "Parking" },
  { value: "gym", label: "Gym" },
  { value: "pool", label: "Swimming Pool" },
  { value: "security", label: "24/7 Security" },
  { value: "elevator", label: "Elevator" },
  { value: "balcony", label: "Balcony" },
  { value: "garden", label: "Garden" },
  { value: "wifi", label: "WiFi" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "bedrooms-desc", label: "Most Bedrooms" },
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
];

export default function SearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  className,
  variant = "full",
}: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    propertyType: true,
    price: true,
    rooms: true,
    features: false,
    location: false,
  });

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handlePropertyTypeChange = useCallback(
    (type: string) => {
      onFiltersChange({ propertyType: type as any });
    },
    [onFiltersChange]
  );

  const handlePriceChange = useCallback(
    (range: [number, number]) => {
      onFiltersChange({
        minPrice: range[0] === 0 ? undefined : range[0],
        maxPrice: range[1] >= 500_000 ? undefined : range[1],
      });
    },
    [onFiltersChange]
  );

  const handleBedroomsChange = useCallback(
    (bedrooms: number) => {
      onFiltersChange({ bedrooms });
    },
    [onFiltersChange]
  );

  const handleBathroomsChange = useCallback(
    (bathrooms: number) => {
      onFiltersChange({ bathrooms });
    },
    [onFiltersChange]
  );

  const handleFeatureToggle = useCallback(
    (feature: string) => {
      const currentFeatures = filters.features || [];
      const newFeatures = currentFeatures.includes(feature)
        ? currentFeatures.filter((f) => f !== feature)
        : [...currentFeatures, feature];
      onFiltersChange({
        features: newFeatures.length > 0 ? newFeatures : undefined,
      });
    },
    [filters.features, onFiltersChange]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const [sortBy, sortOrder] = value.split("-");
      onFiltersChange({
        sortBy: sortBy as any,
        sortOrder: (sortOrder || "desc") as "asc" | "desc",
      });
    },
    [onFiltersChange]
  );

  const priceRange: [number, number] = [
    filters.minPrice || 0,
    filters.maxPrice || 500_000,
  ];

  const activeFilterCount = [
    filters.propertyType,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
    filters.bathrooms,
    filters.furnished,
    filters.petsAllowed,
    filters.features?.length,
  ].filter(Boolean).length;

  if (variant === "compact") {
    return (
      <div className={cn("rounded-lg border bg-card p-4", className)}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Filters</h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button onClick={onClearFilters} size="sm" variant="ghost">
              Clear all
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Property Type - Compact */}
          <div>
            <Label className="mb-2 block text-sm">Property Type</Label>
            <Select
              onValueChange={handlePropertyTypeChange}
              value={filters.propertyType as string}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any type</SelectItem>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm">Price Range</Label>
              <span className="text-muted-foreground text-xs">
                KES {priceRange[0].toLocaleString()} -{" "}
                {priceRange[1] >= 500_000
                  ? "∞"
                  : priceRange[1].toLocaleString()}
              </span>
            </div>
            <Slider
              max={500_000}
              min={0}
              onValueChange={handlePriceChange as any}
              step={10_000}
              value={priceRange}
            />
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              className={cn("justify-start", filters.bedrooms && "bg-accent")}
              onClick={() => handleBedroomsChange(filters.bedrooms || 2)}
              size="sm"
              variant="outline"
            >
              <Bed className="mr-2 h-4 w-4" />
              {filters.bedrooms || "Any"} Beds
            </Button>
            <Button
              className={cn("justify-start", filters.bathrooms && "bg-accent")}
              onClick={() => handleBathroomsChange(filters.bathrooms || 1)}
              size="sm"
              variant="outline"
            >
              <Bath className="mr-2 h-4 w-4" />
              {filters.bathrooms || "Any"} Baths
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button onClick={onClearFilters} size="sm" variant="ghost">
            <X className="mr-2 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Sort */}
      <div>
        <Label className="mb-2 block">Sort By</Label>
        <Select
          onValueChange={handleSortChange}
          value={`${filters.sortBy || "relevance"}-${filters.sortOrder || "desc"}`}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Property Type */}
      <Collapsible
        onOpenChange={() => toggleSection("propertyType")}
        open={expandedSections.propertyType}
      >
        <CollapsibleTrigger asChild>
          <Button className="w-full justify-between" variant="ghost">
            <span className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Property Type
            </span>
            {expandedSections.propertyType ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {PROPERTY_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                className={cn(
                  "w-full justify-start",
                  filters.propertyType === type.value && "bg-accent"
                )}
                key={type.value}
                onClick={() => handlePropertyTypeChange(type.value)}
                size="sm"
                variant="ghost"
              >
                <Icon className="mr-2 h-4 w-4" />
                {type.label}
              </Button>
            );
          })}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Price Range */}
      <Collapsible
        onOpenChange={() => toggleSection("price")}
        open={expandedSections.price}
      >
        <CollapsibleTrigger asChild>
          <Button className="w-full justify-between" variant="ghost">
            <span>Price Range</span>
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>KES {priceRange[0].toLocaleString()}</span>
              <span>
                KES{" "}
                {priceRange[1] >= 500_000
                  ? "500,000+"
                  : priceRange[1].toLocaleString()}
              </span>
            </div>
            <Slider
              className="mt-2"
              max={500_000}
              min={0}
              onValueChange={handlePriceChange as any}
              step={10_000}
              value={priceRange}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs" htmlFor="minPrice">
                Min Price
              </Label>
              <Input
                id="minPrice"
                min={0}
                onChange={(e) =>
                  onFiltersChange({
                    minPrice: Number(e.target.value) || undefined,
                  })
                }
                placeholder="Min"
                type="number"
                value={filters.minPrice || ""}
              />
            </div>
            <div>
              <Label className="text-xs" htmlFor="maxPrice">
                Max Price
              </Label>
              <Input
                id="maxPrice"
                min={0}
                onChange={(e) =>
                  onFiltersChange({
                    maxPrice: Number(e.target.value) || undefined,
                  })
                }
                placeholder="Max"
                type="number"
                value={filters.maxPrice || ""}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Rooms */}
      <Collapsible
        onOpenChange={() => toggleSection("rooms")}
        open={expandedSections.rooms}
      >
        <CollapsibleTrigger asChild>
          <Button className="w-full justify-between" variant="ghost">
            <span className="flex items-center gap-2">
              <Bed className="h-4 w-4" />
              Bedrooms & Bathrooms
            </span>
            {expandedSections.rooms ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-4">
          <div>
            <Label className="mb-2 block text-sm">Bedrooms</Label>
            <div className="grid grid-cols-3 gap-2">
              {BEDROOM_OPTIONS.map((option) => (
                <Button
                  className={cn(
                    filters.bedrooms === option.value && "bg-accent"
                  )}
                  key={option.value}
                  onClick={() => handleBedroomsChange(option.value)}
                  size="sm"
                  variant="outline"
                >
                  {option.value}+
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block text-sm">Bathrooms</Label>
            <div className="grid grid-cols-4 gap-2">
              {BATHROOM_OPTIONS.map((option) => (
                <Button
                  className={cn(
                    filters.bathrooms === option.value && "bg-accent"
                  )}
                  key={option.value}
                  onClick={() => handleBathroomsChange(option.value)}
                  size="sm"
                  variant="outline"
                >
                  {option.value}+
                </Button>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Features & Amenities */}
      <Collapsible
        onOpenChange={() => toggleSection("features")}
        open={expandedSections.features}
      >
        <CollapsibleTrigger asChild>
          <Button className="w-full justify-between" variant="ghost">
            <span>Features & Amenities</span>
            {expandedSections.features ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {FEATURES.map((feature) => (
            <label
              className="flex cursor-pointer items-center space-x-2 rounded-md p-2 hover:bg-accent"
              htmlFor={`feature-${feature.value}`}
              key={feature.value}
            >
              <Checkbox
                checked={filters.features?.includes(feature.value)}
                id={`feature-${feature.value}`}
                onCheckedChange={() => handleFeatureToggle(feature.value)}
              />
              <span className="flex-1 text-sm">{feature.label}</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Additional Filters */}
      <div className="space-y-2">
        <label
          className="flex cursor-pointer items-center space-x-2 rounded-md p-2 hover:bg-accent"
          htmlFor="furnished"
        >
          <Checkbox
            checked={filters.furnished}
            id="furnished"
            onCheckedChange={(checked) =>
              onFiltersChange({ furnished: checked ? true : undefined })
            }
          />
          <Sofa className="h-4 w-4" />
          <span className="flex-1 text-sm">Furnished</span>
        </label>

        <label
          className="flex cursor-pointer items-center space-x-2 rounded-md p-2 hover:bg-accent"
          htmlFor="petsAllowed"
        >
          <Checkbox
            checked={filters.petsAllowed}
            id="petsAllowed"
            onCheckedChange={(checked) =>
              onFiltersChange({ petsAllowed: checked ? true : undefined })
            }
          />
          <Dog className="h-4 w-4" />
          <span className="flex-1 text-sm">Pets Allowed</span>
        </label>
      </div>

      {/* Location Search */}
      <div>
        <Label className="mb-2 block" htmlFor="location">
          Location
        </Label>
        <div className="relative">
          <MapPin className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            id="location"
            onChange={(e) =>
              onFiltersChange({ location: e.target.value || undefined })
            }
            placeholder="City, neighborhood, or area"
            value={filters.location || ""}
          />
        </div>
      </div>
    </div>
  );
}
