/**
 * Property marker component for map view
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import { cn } from "@kaa/ui/lib/utils";
import { Building, Home, Star } from "lucide-react";
import Marker from "@/components/common/map/map-marker";
import type { Property } from "@/modules/properties/property.type";

type PropertyMarkerProps = {
  property: Property;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: (property: Property) => void;
  onHover?: (property: Property | null) => void;
};

const PROPERTY_TYPE_ICONS = {
  house: Home,
  apartment: Building,
  flat: Building,
  studio: Building,
  villa: Home,
  office: Building,
};

export function PropertyMarker({
  property,
  isSelected,
  isHovered,
  onClick,
  onHover,
}: PropertyMarkerProps) {
  const formattedPrice = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: property.pricing.currency,
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(property.pricing.rent);

  const coordinates = property.geolocation?.coordinates || [0, 0];
  const longitude = coordinates[1];
  const latitude = coordinates[0];

  const PropertyIcon =
    PROPERTY_TYPE_ICONS[property.type as keyof typeof PROPERTY_TYPE_ICONS] ||
    Building;

  const handleMarkerClick = () => {
    if (onClick) {
      onClick(property);
    }
  };

  const handleMarkerHover = (isHovered: boolean) => {
    if (onHover) {
      onHover(isHovered ? property : null);
    }
  };

  // Enhanced marker for selected/hovered state
  if (isSelected || isHovered) {
    return (
      <Marker
        data={property}
        latitude={latitude || 0}
        longitude={longitude || 0}
        onClick={handleMarkerClick}
        onHover={({ isHovered }) => handleMarkerHover(isHovered)}
      >
        <div className="relative">
          {/* Enhanced marker container */}
          <div
            className={cn(
              "flex transform flex-col items-center transition-all duration-200",
              isSelected ? "z-50 scale-110" : "z-40 scale-105"
            )}
          >
            {/* Property card popup */}
            <div className="mb-2 min-w-[200px] max-w-[250px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
              <div className="flex items-start gap-2">
                {/* Property image */}
                {property.media.images[0] && (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded">
                    {/** biome-ignore lint/nursery/useImageSize: we don't need to specify the size of the image */}
                    {/** biome-ignore lint/performance/noImgElement: we don't need to specify the size of the image */}
                    <img
                      alt={property.title}
                      className="h-full w-full object-cover"
                      src={property.media.images[0].url}
                    />
                  </div>
                )}

                {/* Property details */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1">
                    {property.featured && (
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                    )}
                    <h4 className="truncate font-semibold text-gray-900 text-sm">
                      {property.title}
                    </h4>
                  </div>

                  <div className="mb-1 truncate text-gray-600 text-xs">
                    {property.location.constituency}, {property.location.county}
                  </div>

                  <div className="mb-1 flex items-center gap-2 text-gray-500 text-xs">
                    {property.specifications.bedrooms !== undefined && (
                      <span>{property.specifications.bedrooms}br</span>
                    )}
                    {property.specifications.bathrooms !== undefined && (
                      <span>{property.specifications.bathrooms}ba</span>
                    )}
                    <span>{property.specifications.totalArea}m²</span>
                  </div>

                  <div className="font-semibold text-primary text-sm">
                    {formattedPrice}
                    <span className="font-normal text-gray-500 text-xs">
                      /{property.pricing.paymentFrequency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow pointing down */}
            <div className="h-0 w-0 border-transparent border-t-8 border-t-white border-r-8 border-l-8 drop-shadow-sm" />

            {/* Main marker */}
            <div
              className={cn(
                "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all duration-200",
                isSelected
                  ? "border-2 border-white bg-primary shadow-xl"
                  : "border-2 border-primary bg-white"
              )}
            >
              <PropertyIcon
                className={cn(
                  "h-5 w-5",
                  isSelected ? "text-white" : "text-primary"
                )}
              />
            </div>
          </div>
        </div>
      </Marker>
    );
  }

  // Default marker
  return (
    <Marker
      data={property}
      latitude={latitude || 0}
      longitude={longitude || 0}
      onClick={handleMarkerClick}
      onHover={({ isHovered }) => handleMarkerHover(isHovered)}
    >
      <div className="relative">
        {/* Price badge */}
        <div className="-top-8 -translate-x-1/2 absolute left-1/2 transform whitespace-nowrap">
          <Badge
            className={cn(
              "border bg-white text-gray-900 shadow-md transition-colors duration-200 hover:bg-primary hover:text-white",
              property.featured && "border-yellow-400"
            )}
          >
            {property.featured && (
              <Star className="mr-1 h-3 w-3 fill-current text-yellow-500" />
            )}
            {formattedPrice}
          </Badge>
        </div>

        {/* Main marker */}
        <div
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200 hover:scale-110",
            property.featured
              ? "border-yellow-600 bg-yellow-500 shadow-yellow-500/25"
              : "border-primary-600 bg-primary shadow-primary/25"
          )}
        >
          <PropertyIcon className="h-4 w-4 text-white" />
        </div>
      </div>
    </Marker>
  );
}
