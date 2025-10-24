"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Coffee,
  Heart,
  Layers,
  MapPin,
  Navigation,
  Settings,
  Star,
  Store,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import ImprovedLocationMarker from "@/components/common/improved-location-marker";
import ImprovedLocationPopup from "@/components/common/improved-location-popup";
import MapControls from "@/components/common/map/map-controls";
import MapSearch from "@/components/common/map/map-search";
import MapStyles from "@/components/common/map/map-styles";
import MapProvider from "@/lib/mapbox/provider";
import type { LocationFeature } from "@/lib/mapbox/utils";

// Sample locations for demonstration
const sampleLocations: LocationFeature[] = [
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-122.4194, 37.7749], // San Francisco
    },
    properties: {
      name: "Downtown Coffee Shop",
      mapbox_id: "sample-1",
      feature_type: "poi",
      full_address: "123 Market St, San Francisco, CA 94105",
      poi_category: ["coffee", "cafe"],
      operational_status: "active",
      maki: "cafe",
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      context: {
        country: {
          name: "United States",
          country_code: "US",
          country_code_alpha_3: "USA",
        },
        region: {
          name: "California",
          region_code: "CA",
          region_code_full: "US-CA",
        },
        place: { name: "San Francisco" },
      },
      external_ids: {
        website: "https://example-coffee.com",
      },
    },
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-122.4094, 37.7849],
    },
    properties: {
      name: "Tech Store",
      mapbox_id: "sample-2",
      feature_type: "poi",
      full_address: "456 Tech Ave, San Francisco, CA 94105",
      poi_category: ["electronics", "retail"],
      operational_status: "active",
      maki: "store",
      coordinates: {
        latitude: 37.7849,
        longitude: -122.4094,
      },
      context: {
        country: {
          name: "United States",
          country_code: "US",
          country_code_alpha_3: "USA",
        },
        region: {
          name: "California",
          region_code: "CA",
          region_code_full: "US-CA",
        },
        place: { name: "San Francisco" },
      },
    },
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-122.3994, 37.7949],
    },
    properties: {
      name: "Favorite Restaurant",
      mapbox_id: "sample-3",
      feature_type: "poi",
      full_address: "789 Food St, San Francisco, CA 94105",
      poi_category: ["restaurant", "food"],
      operational_status: "active",
      maki: "restaurant",
      coordinates: {
        latitude: 37.7949,
        longitude: -122.3994,
      },
      context: {
        country: {
          name: "United States",
          country_code: "US",
          country_code_alpha_3: "USA",
        },
        region: {
          name: "California",
          region_code: "CA",
          region_code_full: "US-CA",
        },
        place: { name: "San Francisco" },
      },
    },
  },
];

export default function EnhancedMapboxExample() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationFeature | null>(null);
  const [hoveredLocation, setHoveredLocation] =
    useState<LocationFeature | null>(null);
  const [savedLocations, setSavedLocations] = useState<LocationFeature[]>([]);
  const [showControls, setShowControls] = useState(true);

  const handleMarkerHover = useCallback(
    (event: { isHovered: boolean; data?: LocationFeature }) => {
      setHoveredLocation(event.isHovered ? event.data || null : null);
    },
    []
  );

  const handleMarkerClick = useCallback((event: { data?: LocationFeature }) => {
    setSelectedLocation(event.data || null);
  }, []);

  const handleSaveLocation = useCallback(async (location: LocationFeature) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSavedLocations((prev) => [...prev, location]);
  }, []);

  const handleDirections = useCallback((location: LocationFeature) => {
    const coords = location.geometry.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`;
    window.open(url, "_blank");
  }, []);

  const getMarkerVariant = (location: LocationFeature) => {
    const categories = location.properties.poi_category || [];
    if (categories.includes("coffee") || categories.includes("cafe")) {
      return {
        variant: "default" as const,
        color: "warning" as const,
        icon: <Coffee className="h-4 w-4" />,
      };
    }
    if (categories.includes("restaurant") || categories.includes("food")) {
      return {
        variant: "pulse" as const,
        color: "danger" as const,
        showPulse: true,
      };
    }
    if (categories.includes("electronics") || categories.includes("retail")) {
      return {
        variant: "minimal" as const,
        color: "success" as const,
        icon: <Store className="h-4 w-4" />,
      };
    }
    return { variant: "default" as const, color: "primary" as const };
  };

  return (
    <div className="relative h-screen w-screen bg-background">
      {/* Map Container */}
      <div
        className="absolute inset-0 h-full w-full"
        id="map-container"
        ref={mapContainerRef}
      />

      <MapProvider
        initialViewState={{
          longitude: -122.4194,
          latitude: 37.7749,
          zoom: 12,
        }}
        mapContainerRef={mapContainerRef}
      >
        {/* Map Controls */}
        {showControls && (
          <>
            <MapSearch />
            <MapControls />
            <MapStyles />
          </>
        )}

        {/* Sample Markers */}
        {sampleLocations.map((location) => {
          const markerProps = getMarkerVariant(location);
          return (
            <ImprovedLocationMarker
              key={location.properties.mapbox_id}
              location={location}
              onClick={handleMarkerClick}
              onHover={handleMarkerHover}
              size="lg"
              {...markerProps}
            />
          );
        })}

        {/* Location Popup */}
        {selectedLocation && (
          <ImprovedLocationPopup
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
            onDirections={handleDirections}
            onSave={handleSaveLocation}
          />
        )}
      </MapProvider>

      {/* Demo Controls Panel */}
      <Card className="absolute top-4 right-4 max-h-[70vh] w-80 overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Enhanced Map Demo</CardTitle>
            <Button
              onClick={() => setShowControls(!showControls)}
              size="sm"
              variant="ghost"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Hovered Location */}
          {hoveredLocation && (
            <div className="rounded-lg bg-muted p-3">
              <h4 className="mb-1 font-semibold text-sm">Hovering:</h4>
              <p className="text-sm">{hoveredLocation.properties.name}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {hoveredLocation.properties.poi_category
                  ?.slice(0, 2)
                  .map((cat, i) => (
                    <Badge
                      className="text-xs"
                      key={i.toString()}
                      variant="secondary"
                    >
                      {cat}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Sample Locations */}
          <div>
            <h4 className="mb-3 font-semibold text-sm">Sample Locations:</h4>
            <div className="space-y-2">
              {sampleLocations.map((location) => (
                <Button
                  className="h-auto w-full justify-start p-3"
                  key={location.properties.mapbox_id}
                  onClick={() => setSelectedLocation(location)}
                  size="sm"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {getMarkerVariant(location).icon || (
                        <MapPin className="h-4 w-4" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">
                        {location.properties.name}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {location.properties.poi_category?.[0]}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Saved Locations */}
          {savedLocations.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-sm">
                <Star className="h-4 w-4" />
                Saved ({savedLocations.length})
              </h4>
              <div className="space-y-1">
                {savedLocations.map((location, index) => (
                  <div
                    className="rounded bg-muted/50 p-2 text-xs"
                    key={index.toString()}
                  >
                    {location.properties.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Highlights */}
          <div className="border-t pt-2">
            <h4 className="mb-3 font-semibold text-sm">Enhanced Features:</h4>
            <div className="space-y-2 text-muted-foreground text-xs">
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3" />
                <span>Save & Share locations</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="h-3 w-3" />
                <span>Get directions</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-3 w-3" />
                <span>Multiple marker styles</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                <span>Keyboard navigation</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
