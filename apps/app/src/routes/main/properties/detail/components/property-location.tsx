/**
 * Property location and map component
 */
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Building,
  Bus,
  Coffee,
  Compass,
  GraduationCap,
  Hospital,
  MapPin,
  Navigation,
  Plane,
  ShoppingCart,
  Train,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { Property } from "@/modules/properties/property.type";
import { InteractiveMap } from "./interactive-map";
import { InteractiveMapMapbox } from "./interactive-map-mapbox";

type PropertyLocationProps = {
  property: Property;
  className?: string;
};

// Mock nearby places data - in real app this would come from API
const getNearbyPlaces = (_lat: number, _lng: number) => ({
  transport: [
    {
      name: "Central Bus Station",
      type: "bus",
      distance: "0.8 km",
      walkTime: "10 min",
    },
    {
      name: "Metro Green Line",
      type: "train",
      distance: "1.2 km",
      walkTime: "15 min",
    },
    {
      name: "City Airport",
      type: "plane",
      distance: "25 km",
      driveTime: "30 min",
    },
  ],
  education: [
    {
      name: "Riverside Elementary",
      type: "school",
      distance: "0.5 km",
      walkTime: "6 min",
    },
    {
      name: "Tech University",
      type: "university",
      distance: "3.2 km",
      driveTime: "12 min",
    },
    {
      name: "Community College",
      type: "college",
      distance: "2.1 km",
      walkTime: "25 min",
    },
  ],
  shopping: [
    {
      name: "Corner Mart",
      type: "grocery",
      distance: "0.3 km",
      walkTime: "4 min",
    },
    {
      name: "Mall Plaza",
      type: "mall",
      distance: "1.8 km",
      driveTime: "8 min",
    },
    {
      name: "Night Market",
      type: "market",
      distance: "0.7 km",
      walkTime: "9 min",
    },
  ],
  healthcare: [
    {
      name: "City General Hospital",
      type: "hospital",
      distance: "2.5 km",
      driveTime: "10 min",
    },
    {
      name: "Family Clinic",
      type: "clinic",
      distance: "0.6 km",
      walkTime: "7 min",
    },
    {
      name: "Dental Care Center",
      type: "dental",
      distance: "1.1 km",
      walkTime: "13 min",
    },
  ],
  lifestyle: [
    {
      name: "Central Park",
      type: "park",
      distance: "0.4 km",
      walkTime: "5 min",
    },
    {
      name: "Coffee Bean Cafe",
      type: "cafe",
      distance: "0.2 km",
      walkTime: "2 min",
    },
    {
      name: "Fitness Plus Gym",
      type: "gym",
      distance: "0.9 km",
      walkTime: "11 min",
    },
  ],
});

const getPlaceIcon = (type: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    bus: Bus,
    train: Train,
    plane: Plane,
    school: GraduationCap,
    university: GraduationCap,
    college: GraduationCap,
    grocery: ShoppingCart,
    mall: Building,
    market: ShoppingCart,
    hospital: Hospital,
    clinic: Hospital,
    dental: Hospital,
    park: Compass,
    cafe: Coffee,
    gym: Building,
    default: MapPin,
  };

  return iconMap[type] || iconMap.default;
};

export function PropertyLocation({
  property,
  className,
}: PropertyLocationProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [mapError, setMapError] = useState(false);
  const [mapProvider, setMapProvider] = useState<"leaflet" | "mapbox">(
    "leaflet"
  );

  const location = property.location;
  const coordinates = property.geolocation?.coordinates || [0, 0];
  const [lng, lat] = coordinates; // GeoJSON format is [longitude, latitude]

  const nearbyPlaces = lat && lng ? getNearbyPlaces(lat, lng) : null;

  const handleDirections = () => {
    if (lat && lng) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(googleMapsUrl, "_blank");
    } else {
      toast.error("Location coordinates not available");
    }
  };

  const handleViewOnMap = () => {
    if (lat && lng) {
      const googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},15z`;
      window.open(googleMapsUrl, "_blank");
    } else {
      toast.error("Location coordinates not available");
    }
  };

  const renderNearbySection = (
    title: string,
    places: any[],
    icon: React.ComponentType<any>
  ) => {
    const IconComponent = icon;

    return (
      <div className="space-y-3">
        <div className="mb-3 flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-primary" />
          <h4 className="font-semibold">{title}</h4>
          <Badge className="text-xs" variant="secondary">
            {places.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {places.map((place, index) => (
            <div
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              key={index.toString()}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  {React.createElement(getPlaceIcon(place.type) || MapPin, {
                    className: "h-3 w-3 text-primary",
                  })}
                </div>
                <div>
                  <p className="font-medium text-sm">{place.name}</p>
                  <p className="text-muted-foreground text-xs capitalize">
                    {place.type}
                  </p>
                </div>
              </div>
              <div className="text-right text-muted-foreground text-xs">
                <p className="font-medium">{place.distance}</p>
                <p>{place.walkTime || place.driveTime}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location & Neighborhood
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Address and Quick Actions */}
          <div className="mb-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h3 className="mb-2 font-semibold">Property Address</h3>
                <div className="space-y-1 text-muted-foreground text-sm">
                  {location?.address && <p>{location.address.line1}</p>}
                  <p>
                    {location?.address.town && `${location.address.town}, `}
                    {location?.county && `${location.county} `}
                    {location?.constituency && `${location.constituency} `}
                    {location?.address.postalCode &&
                      location.address.postalCode}
                  </p>
                  {location?.country && <p>{location.country}</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  className="flex items-center gap-2"
                  onClick={handleDirections}
                  size="sm"
                  variant="outline"
                >
                  <Navigation className="h-4 w-4" />
                  Directions
                </Button>
                <Button
                  className="flex items-center gap-2"
                  onClick={handleViewOnMap}
                  size="sm"
                  variant="outline"
                >
                  <MapPin className="h-4 w-4" />
                  View Map
                </Button>
              </div>
            </div>

            {/* Coordinates Display */}
            {lat && lng && (
              <div className="text-muted-foreground text-xs">
                <span>Coordinates: </span>
                <code className="rounded bg-muted px-2 py-1">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </code>
              </div>
            )}
          </div>

          {/* Map Provider Toggle */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Interactive Map</h3>
            <div className="flex items-center gap-2">
              <Button
                className="text-xs"
                onClick={() => setMapProvider("leaflet")}
                size="sm"
                variant={mapProvider === "leaflet" ? "default" : "outline"}
              >
                Leaflet
              </Button>
              <Button
                className="text-xs"
                onClick={() => setMapProvider("mapbox")}
                size="sm"
                variant={mapProvider === "mapbox" ? "default" : "outline"}
              >
                Mapbox GL
              </Button>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="mb-6">
            {mapProvider === "leaflet" ? (
              <InteractiveMap
                height="aspect-video"
                property={property}
                showNearbyPlaces={true}
              />
            ) : (
              <InteractiveMapMapbox
                property={property}
                // className="aspect-video"
                // showNearbyPlaces={true}
              />
            )}
          </div>

          {/* Nearby Places */}
          {nearbyPlaces && (
            <Tabs
              className="w-full"
              onValueChange={setActiveTab}
              value={activeTab}
            >
              <TabsList className="mb-6 grid w-full grid-cols-5">
                <TabsTrigger className="text-xs" value="overview">
                  Overview
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="transport">
                  Transport
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="education">
                  Education
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="shopping">
                  Shopping
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="healthcare">
                  Health
                </TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-4" value="overview">
                <h4 className="mb-3 font-semibold">Area Highlights</h4>
                <div className="grid gap-4">
                  {nearbyPlaces.transport.slice(0, 2).length > 0 && (
                    <div>
                      <h5 className="mb-2 flex items-center gap-2 font-medium text-sm">
                        <Bus className="h-3 w-3 text-primary" />
                        Transport
                      </h5>
                      <div className="grid gap-2">
                        {nearbyPlaces.transport
                          .slice(0, 2)
                          .map((place, index) => (
                            <div
                              className="flex justify-between rounded bg-muted/30 p-2 text-sm"
                              key={index.toString()}
                            >
                              <span>{place.name}</span>
                              <span className="text-muted-foreground">
                                {place.distance}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {nearbyPlaces.education.slice(0, 2).length > 0 && (
                    <div>
                      <h5 className="mb-2 flex items-center gap-2 font-medium text-sm">
                        <GraduationCap className="h-3 w-3 text-primary" />
                        Education
                      </h5>
                      <div className="grid gap-2">
                        {nearbyPlaces.education
                          .slice(0, 2)
                          .map((place, index) => (
                            <div
                              className="flex justify-between rounded bg-muted/30 p-2 text-sm"
                              key={index.toString()}
                            >
                              <span>{place.name}</span>
                              <span className="text-muted-foreground">
                                {place.distance}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {nearbyPlaces.lifestyle.slice(0, 2).length > 0 && (
                    <div>
                      <h5 className="mb-2 flex items-center gap-2 font-medium text-sm">
                        <Coffee className="h-3 w-3 text-primary" />
                        Lifestyle
                      </h5>
                      <div className="grid gap-2">
                        {nearbyPlaces.lifestyle
                          .slice(0, 2)
                          .map((place, index) => (
                            <div
                              className="flex justify-between rounded bg-muted/30 p-2 text-sm"
                              key={index.toString()}
                            >
                              <span>{place.name}</span>
                              <span className="text-muted-foreground">
                                {place.distance}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="transport">
                {renderNearbySection(
                  "Public Transport",
                  nearbyPlaces.transport,
                  Bus
                )}
              </TabsContent>

              <TabsContent value="education">
                {renderNearbySection(
                  "Schools & Education",
                  nearbyPlaces.education,
                  GraduationCap
                )}
              </TabsContent>

              <TabsContent value="shopping">
                {renderNearbySection(
                  "Shopping & Dining",
                  nearbyPlaces.shopping,
                  ShoppingCart
                )}
              </TabsContent>

              <TabsContent value="healthcare">
                {renderNearbySection(
                  "Healthcare Facilities",
                  nearbyPlaces.healthcare,
                  Hospital
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
