"use client";

import { cn } from "@kaa/ui/lib/utils";
import { Circle, MapPin } from "lucide-react";
import { memo, useRef } from "react";
import type { LocationFeature } from "@/lib/mapbox/utils";
import ImprovedMapMarker, {
  type MapMarkerProps,
} from "./map/improved-map-marker";

export interface ImprovedLocationMarkerProps
  extends Omit<MapMarkerProps, "longitude" | "latitude" | "children"> {
  location: LocationFeature;
  variant?: "default" | "minimal" | "pulse" | "custom";
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
  showPulse?: boolean;
  customIcon?: React.ReactNode;
  customContent?: React.ReactNode;
  onHover?: (event: {
    isHovered: boolean;
    position: { longitude: number; latitude: number };
    marker: mapboxgl.Marker;
    data?: any;
  }) => void;
  onClick?: (event: {
    position: { longitude: number; latitude: number };
    marker: mapboxgl.Marker;
    data?: any;
  }) => void;
}

const sizeClasses = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
  xl: "size-12",
};

const colorClasses = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-green-500 text-white",
  warning: "bg-yellow-500 text-white",
  danger: "bg-red-500 text-white",
};

const pulseClasses = {
  primary: "animate-ping bg-primary/75",
  secondary: "animate-ping bg-secondary/75",
  success: "animate-ping bg-green-500/75",
  warning: "animate-ping bg-yellow-500/75",
  danger: "animate-ping bg-red-500/75",
};

function ImprovedLocationMarkerComponent({
  location,
  variant = "default",
  size = "md",
  color = "primary",
  showPulse = false,
  customIcon,
  customContent,
  onHover,
  onClick,
  className,
  ...markerProps
}: ImprovedLocationMarkerProps) {
  const coordinates = location.geometry.coordinates;
  const marker = useRef<mapboxgl.Marker | null>(null);

  const handleHover = ({ isHovered }: { isHovered: boolean }) => {
    if (onHover) {
      onHover({
        isHovered,
        position: { longitude: coordinates[0], latitude: coordinates[1] },
        marker: marker.current as mapboxgl.Marker,
        data: location,
      });
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick({
        position: { longitude: coordinates[0], latitude: coordinates[1] },
        marker: marker.current as mapboxgl.Marker,
        data: location,
      });
    }
  };

  const renderMarkerContent = () => {
    if (customContent) {
      return customContent;
    }

    switch (variant) {
      case "minimal":
        return (
          <div
            className={cn(
              "rounded-full border-2 border-white shadow-lg transition-all duration-200",
              sizeClasses[size],
              colorClasses[color],
              className
            )}
          >
            <div className="flex h-full w-full items-center justify-center">
              {customIcon || <Circle className="h-1/2 w-1/2 fill-current" />}
            </div>
          </div>
        );

      case "pulse":
        return (
          <div className="relative">
            {showPulse && (
              <div
                className={cn(
                  "absolute inset-0 rounded-full",
                  sizeClasses[size],
                  pulseClasses[color]
                )}
              />
            )}
            <div
              className={cn(
                "relative rounded-full border-2 border-white shadow-lg transition-all duration-200",
                sizeClasses[size],
                colorClasses[color],
                className
              )}
            >
              <div className="flex h-full w-full items-center justify-center">
                {customIcon || <MapPin className="h-1/2 w-1/2" />}
              </div>
            </div>
          </div>
        );

      case "custom":
        return (
          <div className={cn("transition-all duration-200", className)}>
            {customIcon || customContent || (
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 border-white shadow-lg",
                  sizeClasses[size],
                  colorClasses[color]
                )}
              >
                <MapPin className="h-1/2 w-1/2" />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="relative">
            {showPulse && (
              <div
                className={cn(
                  "absolute inset-0 rounded-full opacity-75",
                  sizeClasses[size],
                  pulseClasses[color]
                )}
              />
            )}
            <div
              className={cn(
                "relative flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-200 hover:scale-110",
                sizeClasses[size],
                colorClasses[color],
                className
              )}
            >
              {customIcon || <MapPin className="h-1/2 w-1/2 stroke-[2.5px]" />}
            </div>
          </div>
        );
    }
  };

  return (
    <ImprovedMapMarker
      ariaLabel={`Location marker for ${location.properties.name || "Unknown location"}`}
      data={location}
      latitude={coordinates[1]}
      longitude={coordinates[0]}
      onClick={handleClick}
      onHover={handleHover}
      {...markerProps}
    >
      {renderMarkerContent()}
    </ImprovedMapMarker>
  );
}

export const ImprovedLocationMarker = memo(ImprovedLocationMarkerComponent);
export default ImprovedLocationMarker;
