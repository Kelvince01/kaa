/**
 * Interactive Map Component using Leaflet for property location
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { cn } from "@kaa/ui/lib/utils";
import { Loader2, MapPin, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Property } from "@/modules/properties/property.type";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.MapContainer })),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.TileLayer })),
  {
    ssr: false,
  }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Marker })),
  {
    ssr: false,
  }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Popup })),
  {
    ssr: false,
  }
);

const Circle = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Circle })),
  {
    ssr: false,
  }
);

type InteractiveMapProps = {
  property: Property;
  className?: string;
  height?: string;
  showNearbyPlaces?: boolean;
};

type NearbyPlace = {
  id: string;
  name: string;
  type: string;
  distance: number;
  lat: number;
  lng: number;
  category:
    | "transport"
    | "education"
    | "healthcare"
    | "shopping"
    | "entertainment";
};

function MapSkeleton() {
  return (
    <div className="flex h-96 w-full animate-pulse items-center justify-center rounded-lg bg-muted">
      <div className="text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Loading map...</p>
      </div>
    </div>
  );
}

export function InteractiveMap({
  property,
  className,
  height = "h-96",
  showNearbyPlaces = false,
}: InteractiveMapProps) {
  const [isMapReady, setIsMapReady] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  const coordinates = property.geolocation?.coordinates || [0, 0];
  const [lng, lat] = coordinates; // GeoJSON format is [longitude, latitude]

  // Mock nearby places data - in real implementation, this would come from an API
  const mockNearbyPlaces: NearbyPlace[] = [
    {
      id: "1",
      name: "Central Bus Station",
      type: "Bus Stop",
      distance: 0.8,
      lat: lat || 0 + 0.007,
      lng: lng || 0 + 0.007,
      category: "transport",
    },
    {
      id: "2",
      name: "Riverside Elementary",
      type: "School",
      distance: 0.5,
      lat: lat || 0 - 0.004,
      lng: lng || 0 + 0.006,
      category: "education",
    },
    {
      id: "3",
      name: "Corner Mart",
      type: "Grocery Store",
      distance: 0.3,
      lat: lat || 0 + 0.003,
      lng: lng || 0 - 0.004,
      category: "shopping",
    },
    {
      id: "4",
      name: "City General Hospital",
      type: "Hospital",
      distance: 2.5,
      lat: lat || 0 - 0.02,
      lng: lng || 0 + 0.015,
      category: "healthcare",
    },
    {
      id: "5",
      name: "Central Park",
      type: "Park",
      distance: 0.4,
      lat: lat || 0 + 0.004,
      lng: lng || 0 - 0.006,
      category: "entertainment",
    },
  ];

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    // Simulate loading nearby places
    if (lat && lng && showNearbyPlaces) {
      const timer = setTimeout(() => {
        setNearbyPlaces(mockNearbyPlaces);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lat, lng, showNearbyPlaces]);

  useEffect(() => {
    // Mark map as ready after component mounts
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDirections = () => {
    if (lat && lng) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(googleMapsUrl, "_blank");
    } else {
      toast.error("Location coordinates not available");
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      transport: "#3b82f6", // blue
      education: "#10b981", // green
      healthcare: "#ef4444", // red
      shopping: "#f59e0b", // amber
      entertainment: "#8b5cf6", // purple
    };
    return colors[category as keyof typeof colors] || "#6b7280"; // gray as fallback
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport":
        return "🚌";
      case "education":
        return "🏫";
      case "healthcare":
        return "🏥";
      case "shopping":
        return "🛒";
      case "entertainment":
        return "🌳";
      default:
        return "📍";
    }
  };

  if (!(lat && lng)) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-muted",
          height,
          className
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Location not available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-1000 flex gap-2">
        <Button
          className="bg-white/90 hover:bg-white"
          onClick={handleDirections}
          size="sm"
          variant="secondary"
        >
          <Navigation className="mr-1 h-4 w-4" />
          Directions
        </Button>
      </div>

      {/* Loading State */}
      {!isMapReady && <MapSkeleton />}

      {/* Map Container */}
      {isMapReady && (
        <div className={cn(height, "w-full")}>
          <MapContainer
            center={[lat, lng]}
            className="rounded-lg"
            style={{ height: "100%", width: "100%" }}
            zoom={15}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Property Marker */}
            <Marker position={[lat, lng]}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm">{property.title}</h3>
                  <p className="text-muted-foreground text-xs">
                    {property.location?.address.line1}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {property.location?.address.town},{" "}
                    {property.location?.county}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Property Area Circle */}
            <Circle
              center={[lat, lng]}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
                weight: 2,
              }}
              radius={500}
            />

            {/* Nearby Places Markers */}
            {showNearbyPlaces &&
              nearbyPlaces.map((place) => (
                <Marker
                  eventHandlers={{
                    click: () => setSelectedPlace(place),
                  }}
                  key={place.id}
                  position={[place.lat, place.lng]}
                >
                  <Popup>
                    <div className="p-2">
                      <div className="mb-1 flex items-center gap-2">
                        <span>{getCategoryIcon(place.category)}</span>
                        <h4 className="font-semibold text-sm">{place.name}</h4>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {place.type}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {place.distance}km away
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      )}

      {/* Nearby Places Legend */}
      {showNearbyPlaces && nearbyPlaces.length > 0 && (
        <div className="absolute bottom-4 left-4 z-1000">
          <Card className="bg-white/90">
            <CardContent className="p-3">
              <h4 className="mb-2 font-semibold text-sm">Nearby Places</h4>
              <div className="space-y-1">
                {nearbyPlaces.slice(0, 5).map((place) => (
                  <div
                    className="flex cursor-pointer items-center gap-2 rounded p-1 text-xs hover:bg-muted/50"
                    key={place.id}
                    onClick={() => setSelectedPlace(place)}
                  >
                    <span>{getCategoryIcon(place.category)}</span>
                    <span className="font-medium">{place.name}</span>
                    <Badge className="text-xs" variant="secondary">
                      {place.distance}km
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Property Info Overlay */}
      <div className="absolute right-4 bottom-4 z-1000">
        <Card className="bg-white/90">
          <CardContent className="p-3">
            <div className="space-y-1 text-xs">
              <p className="font-semibold">{property.location?.address.town}</p>
              <p className="text-muted-foreground">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
