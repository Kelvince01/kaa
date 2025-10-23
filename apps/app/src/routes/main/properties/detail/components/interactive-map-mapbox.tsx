/**
 * Interactive Property Map - Mapbox GL Version
 * Uses existing Mapbox components from components/common/map
 */
"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Coffee,
  Dumbbell,
  GraduationCap,
  Home,
  Hospital,
  MapPin,
  Navigation,
  Shield,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImprovedMapMarker } from "@/components/common/map/improved-map-marker";
import MapControls from "@/components/common/map/map-controls";
import Popup from "@/components/common/map/map-popup";
import MapStyles from "@/components/common/map/map-styles";
// Import existing Mapbox components
import MapProvider from "@/lib/mapbox/provider";
import type { Property } from "@/modules/properties/property.type";

// Property location marker component
type PropertyMarkerProps = {
  property: Property;
};

function PropertyMarker({ property }: PropertyMarkerProps) {
  const [showPopup, setShowPopup] = useState(false);

  if (!property.geolocation?.coordinates) return null;

  const [lng, lat] = property.geolocation.coordinates;

  return (
    <>
      <ImprovedMapMarker
        ariaLabel={`Property: ${property.title}`}
        className="z-10"
        data={property}
        latitude={lat || 0}
        longitude={lng || 0}
        onClick={() => setShowPopup(true)}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-white">
          <Home className="h-5 w-5" />
        </div>
      </ImprovedMapMarker>

      {showPopup && (
        <Popup
          className="property-popup"
          closeButton={true}
          latitude={lat}
          longitude={lng}
          offset={15}
          onClose={() => setShowPopup(false)}
        >
          <div className="w-[300px]">
            <div className="space-y-2">
              <h3 className="font-semibold text-base">{property.title}</h3>
              <p className="text-muted-foreground text-sm">
                <MapPin className="mr-1 inline h-3 w-3" />
                {property.location.address.line1},{" "}
                {property.location.address.town}
              </p>
              {property.pricing?.rent && (
                <p className="font-medium text-primary">
                  KES {property.pricing.rent.toLocaleString()}/
                  {property.pricing.paymentFrequency || "month"}
                </p>
              )}
              <div className="flex gap-2 text-muted-foreground text-sm">
                {property.specifications.bedrooms && (
                  <span>{property.specifications.bedrooms} bed</span>
                )}
                {property.specifications.bathrooms && (
                  <span>{property.specifications.bathrooms} bath</span>
                )}
                {property.specifications.totalArea && (
                  <span>{property.specifications.totalArea} sqft</span>
                )}
              </div>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

// Mock nearby places data
type NearbyPlace = {
  id: string;
  name: string;
  category:
    | "restaurant"
    | "school"
    | "hospital"
    | "shopping"
    | "coffee"
    | "gym"
    | "transport"
    | "safety";
  coordinates: [number, number];
  distance: number;
  rating?: number;
  description?: string;
};

const categoryConfig = {
  restaurant: { icon: Utensils, color: "bg-orange-500", label: "Restaurant" },
  school: { icon: GraduationCap, color: "bg-blue-500", label: "School" },
  hospital: { icon: Hospital, color: "bg-red-500", label: "Hospital" },
  shopping: { icon: ShoppingBag, color: "bg-purple-500", label: "Shopping" },
  coffee: { icon: Coffee, color: "bg-amber-500", label: "Café" },
  gym: { icon: Dumbbell, color: "bg-green-500", label: "Gym" },
  transport: { icon: Navigation, color: "bg-blue-600", label: "Transport" },
  safety: { icon: Shield, color: "bg-gray-600", label: "Safety" },
};

// Generate mock nearby places based on property location
function generateNearbyPlaces(property: Property): NearbyPlace[] {
  if (!property.geolocation?.coordinates) return [];

  const [baseLng, baseLat] = property.geolocation.coordinates;
  const places: NearbyPlace[] = [];

  // Generate different types of places around the property
  const placeTemplates = [
    {
      category: "restaurant" as const,
      names: [
        "Bella Vista Restaurant",
        "The Corner Bistro",
        "Mama's Kitchen",
        "Urban Grill",
      ],
    },
    {
      category: "school" as const,
      names: [
        "Greenfield Primary School",
        "Valley High School",
        "Sunrise Academy",
      ],
    },
    {
      category: "hospital" as const,
      names: ["City General Hospital", "Medical Center", "Health Clinic"],
    },
    {
      category: "shopping" as const,
      names: [
        "Central Mall",
        "Local Market",
        "Shopping Plaza",
        "Grocery Store",
      ],
    },
    {
      category: "coffee" as const,
      names: [
        "Coffee Bean",
        "Morning Brew",
        "Café Central",
        "The Coffee House",
      ],
    },
    {
      category: "gym" as const,
      names: ["Fitness First", "PowerGym", "Active Life Center"],
    },
    {
      category: "transport" as const,
      names: ["Bus Station", "Metro Stop", "Taxi Stand"],
    },
    {
      category: "safety" as const,
      names: ["Police Station", "Fire Department", "Security Post"],
    },
  ];

  let id = 1;
  for (const template of placeTemplates) {
    const count =
      template.category === "restaurant"
        ? 3
        : template.category === "coffee"
          ? 2
          : 1;

    for (let i = 0; i < count; i++) {
      if (template.names[i]) {
        // Generate coordinates within ~2km radius
        const latOffset = (Math.random() - 0.5) * 0.02; // ~2km
        const lngOffset = (Math.random() - 0.5) * 0.02;

        places.push({
          id: id.toString(),
          name: template.names[i] || "",
          category: template.category,
          coordinates: [(baseLng || 0) + lngOffset, (baseLat || 0) + latOffset],
          distance: Math.round(Math.random() * 1500 + 100), // 100m to 1.6km
          rating:
            template.category === "restaurant" || template.category === "coffee"
              ? Math.round((Math.random() * 2 + 3) * 10) / 10
              : undefined, // 3.0 to 5.0
          description: `${template.names[i]} is located ${Math.round(Math.random() * 1500 + 100)}m from the property`,
        });
      }
      id++;
    }
  }

  return places.sort((a, b) => a.distance - b.distance);
}

// Nearby place marker component
type NearbyPlaceMarkerProps = {
  place: NearbyPlace;
};

function NearbyPlaceMarker({ place }: NearbyPlaceMarkerProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [lng, lat] = place.coordinates;
  const config = categoryConfig[place.category];
  const Icon = config.icon;

  return (
    <>
      <ImprovedMapMarker
        ariaLabel={`${place.name} - ${config.label}`}
        data={place}
        hoverScale={1.2}
        latitude={lat}
        longitude={lng}
        onClick={() => setShowPopup(true)}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${config.color} text-white shadow-md transition-shadow hover:shadow-lg`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </ImprovedMapMarker>

      {showPopup && (
        <Popup
          className="nearby-place-popup"
          closeButton={true}
          latitude={lat}
          longitude={lng}
          offset={15}
          onClose={() => setShowPopup(false)}
        >
          <div className="w-[280px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`rounded-full p-1.5 ${config.color} text-white`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{place.name}</h3>
                  <p className="text-muted-foreground text-xs">
                    {config.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {place.distance}m away
                </span>
                {place.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span>{place.rating}</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                  window.open(url, "_blank");
                }}
                size="sm"
                variant="outline"
              >
                <Navigation className="mr-2 h-3 w-3" />
                Get Directions
              </Button>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

// Map legend component
type MapLegendProps = {
  places: NearbyPlace[];
};

function MapLegend({ places }: MapLegendProps) {
  const categoryCounts = places.reduce(
    (acc, place) => {
      acc[place.category] = (acc[place.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Card className="absolute top-4 right-4 z-10 w-64 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Nearby Places</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {Object.entries(categoryCounts).map(([category, count]) => {
            const config =
              categoryConfig[category as keyof typeof categoryConfig];
            const Icon = config.icon;

            return (
              <div
                className="flex items-center justify-between text-sm"
                key={category}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`rounded-full p-1 ${config.color} text-white`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <span>{config.label}</span>
                </div>
                <Badge className="text-xs" variant="secondary">
                  {count}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Main interactive map component
type InteractiveMapMapboxProps = {
  property: Property;
  className?: string;
};

export function InteractiveMapMapbox({
  property,
  className,
}: InteractiveMapMapboxProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);

  // Check if property has valid coordinates
  const hasValidCoordinates =
    property.geolocation?.coordinates &&
    Array.isArray(property.geolocation.coordinates) &&
    property.geolocation.coordinates.length === 2 &&
    !property.geolocation.coordinates.some((coord) => Number.isNaN(coord));

  useEffect(() => {
    if (!hasValidCoordinates) {
      setError("Property location coordinates are not available");
      setIsLoading(false);
      return;
    }

    try {
      // Generate nearby places
      const places = generateNearbyPlaces(property);
      setNearbyPlaces(places);
      setError(null);
    } catch (err) {
      setError("Failed to load map data");
    } finally {
      setIsLoading(false);
    }
  }, [property, hasValidCoordinates]);

  if (isLoading) {
    return (
      <div className={`relative h-96 ${className || ""}`}>
        <Skeleton className="h-full w-full rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      </div>
    );
  }

  if (error || !hasValidCoordinates) {
    return (
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          {error || "Map location not available for this property"}
        </AlertDescription>
      </Alert>
    );
  }

  const [lng, lat] = property.geolocation.coordinates;

  return (
    <div
      className={`relative h-96 overflow-hidden rounded-lg ${className || ""}`}
    >
      <div className="absolute inset-0 h-full w-full" ref={mapContainerRef} />

      <MapProvider
        initialViewState={{
          longitude: lng || 0,
          latitude: lat || 0,
          zoom: 14,
        }}
        mapContainerRef={mapContainerRef}
      >
        {/* Property marker */}
        <PropertyMarker property={property} />

        {/* Nearby place markers */}
        {nearbyPlaces.map((place) => (
          <NearbyPlaceMarker key={place.id} place={place} />
        ))}

        {/* Map controls */}
        <MapControls />

        {/* Map styles */}
        <MapStyles />

        {/* Map legend */}
        <MapLegend places={nearbyPlaces} />
      </MapProvider>
    </div>
  );
}

export default InteractiveMapMapbox;
