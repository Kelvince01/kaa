"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import {
  Clock,
  Copy,
  Globe,
  LocateIcon,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Star,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { iconMap, type LocationFeature } from "@/lib/mapbox/utils";
import Popup from "./map/map-popup";

export type ImprovedLocationPopupProps = {
  location: LocationFeature;
  onClose?: () => void;
  onSave?: (location: LocationFeature) => void;
  onDirections?: (location: LocationFeature) => void;
  className?: string;
  showActions?: boolean;
  maxWidth?: string | number;
};

export function ImprovedLocationPopup({
  location,
  onClose,
  onSave,
  onDirections,
  className,
  showActions = true,
  maxWidth = 350,
}: ImprovedLocationPopupProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!location) return null;

  const { properties, geometry } = location;

  // Enhanced data extraction with fallbacks
  const name =
    properties?.name_preferred || properties?.name || "Unknown Location";
  const address =
    properties?.full_address ||
    properties?.address ||
    properties?.place_formatted ||
    "";
  const categories = properties?.poi_category || [];
  const brand = properties?.brand?.[0] || "";
  const status = properties?.operational_status || "";
  const maki = properties?.maki || "";
  const phone = properties?.tel || properties?.phone || "";
  const website = properties?.external_ids?.website || "";
  const hours = properties?.hours || "";

  const lat = geometry?.coordinates?.[1] || properties?.coordinates?.latitude;
  const lng = geometry?.coordinates?.[0] || properties?.coordinates?.longitude;

  // biome-ignore lint/correctness/useHookAtTopLevel: ignore
  const getIcon = useCallback(() => {
    const allKeys = [maki, ...(categories || [])];

    for (const key of allKeys) {
      const lower = key?.toLowerCase();
      if (iconMap[lower]) return iconMap[lower];
    }

    return <LocateIcon className="h-5 w-5" />;
  }, [maki, categories]);

  const handleSave = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (onSave) {
        await onSave(location);
      } else {
        // Default save behavior (e.g., localStorage)
        const savedLocations = JSON.parse(
          localStorage.getItem("savedLocations") || "[]"
        );
        const exists = savedLocations.some(
          (loc: LocationFeature) =>
            loc.properties.mapbox_id === location.properties.mapbox_id
        );

        if (exists) {
          toast.error("This location is already in your favorites.");
        } else {
          savedLocations.push(location);
          localStorage.setItem(
            "savedLocations",
            JSON.stringify(savedLocations)
          );
          setIsSaved(true);
          toast.success(`${name} has been saved to your favorites.`);
        }
      }
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirections = () => {
    if (onDirections) {
      onDirections(location);
    } else {
      // Default directions behavior
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, "_blank");
    }
  };

  const handleCopyCoordinates = async () => {
    const coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    try {
      await navigator.clipboard.writeText(coordinates);
      toast.success(coordinates);
    } catch (error) {
      console.error("Failed to copy coordinates:", error);
      toast.error("Failed to copy coordinates.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: name,
      text: `Check out ${name}${address ? ` at ${address}` : ""}`,
      url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        toast.success("Location details copied to clipboard.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;

    const isOpen = status === "active" || status === "open";
    return (
      <Badge
        className={cn(
          "flex items-center gap-1 text-xs",
          isOpen ? "border-green-200 bg-green-100 text-green-800" : ""
        )}
        variant={isOpen ? "default" : "secondary"}
      >
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            isOpen ? "bg-green-500" : "bg-gray-400"
          )}
        />
        {isOpen ? "Open" : status}
      </Badge>
    );
  };

  return (
    <Popup
      className={cn("location-popup", className)}
      closeButton={true}
      closeOnClick={false}
      focusAfterOpen={false}
      latitude={lat}
      longitude={lng}
      offset={15}
      onClose={onClose}
    >
      <div
        className="fade-in-0 zoom-in-95 animate-in duration-200"
        style={{
          width: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-1">
          <div className="shrink-0 rounded-full bg-primary/10 p-2.5 transition-colors">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base text-foreground leading-tight">
                {name}
              </h3>
              {getStatusBadge()}
            </div>
            {brand && brand !== name && (
              <p className="mt-1 font-medium text-muted-foreground text-sm">
                {brand}
              </p>
            )}
            {address && (
              <div className="mt-2 flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {address}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mt-4 px-1">
            <div className="flex flex-wrap gap-1.5">
              {categories.slice(0, 4).map((category, index) => (
                <Badge
                  className="bg-secondary/60 text-xs capitalize"
                  key={index.toString()}
                  variant="secondary"
                >
                  {category.replace(/[_-]/g, " ")}
                </Badge>
              ))}
              {categories.length > 4 && (
                <Badge className="text-xs" variant="secondary">
                  +{categories.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {(phone || website || hours) && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2 px-1">
              {hours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{hours}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    className="text-primary hover:underline"
                    href={`tel:${phone}`}
                  >
                    {phone}
                  </a>
                </div>
              )}
              {website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    className="truncate text-primary hover:underline"
                    href={website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        {showActions && (
          <>
            <Separator className="my-4" />

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 px-1">
              <Button
                className="flex items-center justify-center gap-2"
                onClick={handleDirections}
                size="sm"
                variant="outline"
              >
                <Navigation className="h-4 w-4" />
                Directions
              </Button>

              <Button
                className={cn(
                  "flex items-center justify-center gap-2",
                  isSaved && "border-primary/20 bg-primary/10 text-primary"
                )}
                disabled={isLoading}
                onClick={handleSave}
                size="sm"
                variant="outline"
              >
                <Star className={cn("h-4 w-4", isSaved && "fill-current")} />
                {isSaved ? "Saved" : "Save"}
              </Button>

              <Button
                className="flex items-center justify-center gap-2"
                onClick={handleCopyCoordinates}
                size="sm"
                variant="ghost"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>

              <Button
                className="flex items-center justify-center gap-2"
                onClick={handleShare}
                size="sm"
                variant="ghost"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-4 border-t px-1 pt-3 text-muted-foreground text-xs">
          <div className="flex items-center justify-between">
            <span className="truncate">
              ID: {properties?.mapbox_id?.substring(0, 8)}...
            </span>
            <Button
              className="cursor-pointer transition-colors hover:text-foreground"
              onClick={handleCopyCoordinates}
              title="Click to copy coordinates"
            >
              {lat?.toFixed(4)}, {lng?.toFixed(4)}
            </Button>
          </div>
        </div>
      </div>
    </Popup>
  );
}

export default ImprovedLocationPopup;
