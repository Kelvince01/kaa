/**
 * Property features and amenities component
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Building,
  Car,
  Check,
  Droplets,
  Gamepad2,
  Home,
  Mountain,
  Shield,
  Star,
  TreePine,
  Tv,
  Users,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  Zap,
} from "lucide-react";
import type React from "react";
import type { Property } from "@/modules/properties/property.type";

type PropertyFeaturesProps = {
  property: Property;
  className?: string;
};

// Icon mapping for different feature types
const getFeatureIcon = (feature: string): React.ComponentType<any> => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    // Connectivity
    wifi: Wifi,
    internet: Wifi,
    broadband: Wifi,

    // Parking & Transport
    parking: Car,
    garage: Car,

    // Utilities
    electricity: Zap,
    water: Droplets,

    // Security
    security: Shield,
    cctv: Shield,
    alarm: Shield,

    // Entertainment
    tv: Tv,
    cable: Tv,
    satellite: Tv,

    // Kitchen & Dining
    kitchen: UtensilsCrossed,
    dining: UtensilsCrossed,

    // Laundry
    laundry: WashingMachine,
    washing: WashingMachine,

    // Outdoor
    garden: TreePine,
    balcony: Mountain,
    terrace: Mountain,
    patio: Mountain,

    // Social
    gym: Users,
    pool: Users,
    clubhouse: Users,

    // Gaming & Entertainment
    gaming: Gamepad2,
    entertainment: Gamepad2,

    // Default
    default: Check,
  };

  const key = feature.toLowerCase();
  return iconMap[key] || iconMap.default || Check;
};

const getAmenityIcon = (amenity: string): React.ComponentType<any> => {
  // Reuse the same icon mapping for amenities
  return getFeatureIcon(amenity);
};

export function PropertyFeatures({
  property,
  className,
}: PropertyFeaturesProps) {
  const features = Object.keys(property.amenities) || [];
  const amenities = Object.keys(property.amenities) || [];

  // Categorize features and amenities
  const categorizeItems = (items: string[]) => {
    const categories: Record<string, string[]> = {
      Essential: [],
      Connectivity: [],
      Security: [],
      Entertainment: [],
      Outdoor: [],
      Other: [],
    };

    for (const item of items) {
      const lower = item.toLowerCase();
      if (["wifi", "internet", "broadband"].some((k) => lower.includes(k))) {
        categories.Connectivity?.push(item);
      } else if (
        ["security", "cctv", "alarm", "guard"].some((k) => lower.includes(k))
      ) {
        categories.Security?.push(item);
      } else if (
        ["tv", "cable", "satellite", "gaming", "entertainment"].some((k) =>
          lower.includes(k)
        )
      ) {
        categories.Entertainment?.push(item);
      } else if (
        ["garden", "balcony", "terrace", "patio", "pool", "gym"].some((k) =>
          lower.includes(k)
        )
      ) {
        categories.Outdoor?.push(item);
      } else if (
        ["parking", "electricity", "water", "kitchen", "laundry"].some((k) =>
          lower.includes(k)
        )
      ) {
        categories.Essential?.push(item);
      } else {
        categories.Other?.push(item);
      }
    }

    // Remove empty categories
    for (const key of Object.keys(categories)) {
      if (categories[key]?.length === 0) {
        delete categories[key];
      }
    }

    return categories;
  };

  const categorizedFeatures = categorizeItems(features);
  const categorizedAmenities = categorizeItems(amenities.map((a: string) => a));

  const renderItemGrid = (items: string[], type: "feature" | "amenity") => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const IconComponent =
          type === "feature" ? getFeatureIcon(item) : getAmenityIcon(item);
        return (
          <div
            className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
            key={index.toString()}
          >
            <div className="shrink-0 rounded-full bg-primary/10 p-2">
              <IconComponent className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-sm capitalize">{item}</span>
          </div>
        );
      })}
    </div>
  );

  const renderCategorizedItems = (
    categorized: Record<string, string[]>,
    type: "feature" | "amenity"
  ) => (
    <div className="space-y-6">
      {Object.entries(categorized).map(([category, items]) => (
        <div key={category}>
          <div className="mb-3 flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{category}</h4>
            <Badge className="text-xs" variant="secondary">
              {items.length}
            </Badge>
          </div>
          {renderItemGrid(items, type)}
        </div>
      ))}
    </div>
  );

  if (features.length === 0 && amenities.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold">No Features Listed</h3>
            <p className="text-muted-foreground text-sm">
              Features and amenities information is not available for this
              property.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Property Features */}
      {features.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Property Features
              <Badge variant="secondary">{features.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {Object.keys(categorizedFeatures).length > 1
              ? renderCategorizedItems(categorizedFeatures, "feature")
              : renderItemGrid(features, "feature")}
          </CardContent>
        </Card>
      )}

      {/* Building Amenities */}
      {amenities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Building Amenities
              <Badge variant="secondary">{amenities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {Object.keys(categorizedAmenities).length > 1
              ? renderCategorizedItems(categorizedAmenities, "amenity")
              : renderItemGrid(
                  amenities.map((a: string) => a),
                  "amenity"
                )}
          </CardContent>
        </Card>
      )}

      {/* Quick Features Summary */}
      {(property.specifications.furnished ||
        property.amenities.parking ||
        property.rules.petsAllowed !== undefined) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Quick Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {property.specifications.furnished !== undefined && (
                <div className="rounded-lg bg-muted/30 p-4 text-center">
                  <Home className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="font-medium text-sm">Furnishing</p>
                  <p className="text-muted-foreground text-xs">
                    {property.specifications.furnished
                      ? "Furnished"
                      : "Unfurnished"}
                  </p>
                </div>
              )}
              {property.amenities.parking !== undefined && (
                <div className="rounded-lg bg-muted/30 p-4 text-center">
                  <Car className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="font-medium text-sm">Parking</p>
                  <p className="text-muted-foreground text-xs">
                    {property.amenities.parking ? "Available" : "Not Available"}
                  </p>
                </div>
              )}
              {property.rules.petsAllowed !== undefined && (
                <div className="rounded-lg bg-muted/30 p-4 text-center">
                  <Users className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="font-medium text-sm">Pets</p>
                  <p className="text-muted-foreground text-xs">
                    {property.rules.petsAllowed ? "Allowed" : "Not Allowed"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
