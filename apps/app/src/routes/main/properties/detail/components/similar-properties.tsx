/**
 * Similar properties component showing related recommendations
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { cn } from "@kaa/ui/lib/utils";
import {
  Bath,
  Bed,
  Heart,
  Loader2,
  MapPin,
  Maximize,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Property } from "@/modules/properties/property.type";
import { formatCurrency } from "@/shared/utils/format.util";

type SimilarPropertiesProps = {
  properties: Property[];
  currentPropertyId: string;
  currentProperty?: Property;
  className?: string;
};

export function SimilarProperties({
  properties,
  currentPropertyId,
  currentProperty,
  className,
}: SimilarPropertiesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [similarProperties, setSimilarProperties] =
    useState<Property[]>(properties);
  const [error, setError] = useState<string | null>(null);
  // const {} = useSimilarProperties();

  // Generate mock similar properties if the provided array is empty
  useEffect(() => {
    if (properties.length === 0 && currentProperty) {
      setIsLoading(true);
      // Simulate API call delay
      const timer = setTimeout(() => {
        const mockProperties = generateMockSimilarProperties(
          currentProperty,
          currentPropertyId
        );
        setSimilarProperties(mockProperties);
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    setSimilarProperties(
      properties
        .filter((property) => property._id !== currentPropertyId)
        .slice(0, 6)
    );
  }, [properties, currentProperty, currentPropertyId]);

  const handleRefresh = () => {
    if (currentProperty) {
      setIsLoading(true);
      setError(null);
      const timer = setTimeout(() => {
        const mockProperties = generateMockSimilarProperties(
          currentProperty,
          currentPropertyId
        );
        setSimilarProperties(mockProperties);
        setIsLoading(false);
      }, 1000);
    }
  };

  // Filter out the current property and limit to 6 similar properties
  const displayProperties = similarProperties
    .filter((property) => property._id !== currentPropertyId)
    .slice(0, 6);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-xl">Similar Properties</h2>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card className="overflow-hidden" key={i.toString()}>
              <Skeleton className="aspect-4/3 w-full" />
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (displayProperties.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-xl">Similar Properties</h2>
          </div>
          <Button onClick={handleRefresh} size="sm" variant="ghost">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold">No Similar Properties</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              We couldn't find similar properties at the moment.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-xl">Similar Properties</h2>
          <Badge variant="secondary">{similarProperties.length}</Badge>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/properties">View All</Link>
        </Button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {similarProperties.map((property) => (
          <PropertyCard key={property._id} property={property} />
        ))}
      </div>
    </div>
  );
}

type PropertyCardProps = {
  property: Property;
};

function PropertyCard({ property }: PropertyCardProps) {
  const primaryPhoto =
    property.media?.images?.find((photo) => photo.isPrimary) ||
    property.media?.images?.[0];

  const getPropertyTypeDisplay = (type: string) =>
    type
      .replace(/([A-Z])/g, " $1")
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      .replace(/^./, (str) => str.toUpperCase());

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/properties/${property._id}`}>
        {/* Property Image */}
        <div className="relative aspect-4/3 overflow-hidden">
          {primaryPhoto?.url ? (
            // biome-ignore lint/performance/noImgElement: ignore
            // biome-ignore lint/nursery/useImageSize: ignore
            <img
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              src={primaryPhoto.url}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {/* Property Type Badge */}
          <div className="absolute top-3 left-3">
            <Badge
              className="border-0 bg-black/70 text-white"
              variant="secondary"
            >
              {getPropertyTypeDisplay(property.type)}
            </Badge>
          </div>

          {/* Favorite Button */}
          <Button
            className="absolute top-3 right-3 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              // Handle favorite toggle
            }}
            size="icon"
            variant="secondary"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                property.isFavorited && "fill-red-500 text-red-500"
              )}
            />
          </Button>

          {/* Status Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge
              className="border-green-200 bg-green-50 text-green-700"
              variant="outline"
            >
              {property.status}
            </Badge>
          </div>
        </div>

        {/* Property Details */}
        <CardContent className="space-y-3 p-4">
          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg text-primary">
                {formatCurrency(property.pricing?.rent || 0, "KES")}
                <span className="ml-1 font-normal text-muted-foreground text-sm">
                  /{property.pricing?.paymentFrequency || "month"}
                </span>
              </div>
              {property.pricing?.negotiable && (
                <Badge className="mt-1 text-xs" variant="outline">
                  Negotiable
                </Badge>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className="line-clamp-1 font-semibold transition-colors group-hover:text-primary">
              {property.title}
            </h3>
            <p className="line-clamp-1 flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-3 w-3" />
              {property.location?.address.town}, {property.location?.county}
            </p>
          </div>

          {/* Property Features */}
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            {property.specifications.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                <span>{property.specifications.bedrooms}</span>
              </div>
            )}
            {property.specifications.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                <span>{property.specifications.bathrooms}</span>
              </div>
            )}
            {property.specifications.totalArea && (
              <div className="flex items-center gap-1">
                <Maximize className="h-3 w-3" />
                <span>{property.specifications.totalArea} sqft</span>
              </div>
            )}
          </div>

          {/* Key Features */}
          {(property.specifications.furnished ||
            property.amenities.parking ||
            Object.values(property.amenities)?.length) && (
            <div className="flex flex-wrap gap-1">
              {property.specifications.furnished && (
                <Badge className="text-xs" variant="outline">
                  Furnished
                </Badge>
              )}
              {property.amenities.parking && (
                <Badge className="text-xs" variant="outline">
                  Parking
                </Badge>
              )}
              {Object.values(property.amenities)
                ?.slice(0, 2)
                .map((feature, index) => (
                  <Badge
                    className="text-xs capitalize"
                    key={index.toString()}
                    variant="outline"
                  >
                    {feature}
                  </Badge>
                ))}
              {Object.values(property.amenities)?.length > 2 && (
                <Badge className="text-xs" variant="outline">
                  +{Object.values(property.amenities)?.length - 2} more
                </Badge>
              )}
            </div>
          )}

          {/* Availability */}
          {property.availability.availableFrom && (
            <div className="text-muted-foreground text-xs">
              Available from{" "}
              {new Date(property.availability.availableFrom).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                }
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

// Mock data generation function
function generateMockSimilarProperties(
  currentProperty: Property,
  _currentPropertyId: string
): Property[] {
  const mockProperties: Property[] = [
    {
      ...currentProperty,
      _id: "mock-1",
      title: "Modern 2BR Apartment in Kilimani",
      pricing: {
        ...currentProperty.pricing,
        rent: currentProperty.pricing.rent * 0.9,
      },
      location: {
        ...currentProperty.location,
        address: {
          ...currentProperty.location.address,
          line1: "Muthangari Gardens",
        },
      },
      media: {
        ...currentProperty.media,
        images: [
          {
            id: "mock-1",
            order: 0,
            uploadedAt: new Date(),
            url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
            caption: "Modern apartment",
            isPrimary: true,
          },
        ],
      },
      status: "available" as any,
      isFavorited: false,
    },
    {
      ...currentProperty,
      _id: "mock-2",
      title: "Spacious Garden Apartment",
      pricing: {
        ...currentProperty.pricing,
        rent: currentProperty.pricing.rent * 1.1,
      },
      specifications: {
        ...currentProperty.specifications,
        bedrooms: (currentProperty.specifications.bedrooms || 2) + 1,
        // garden: true,
      },
      location: {
        ...currentProperty.location,
        address: {
          ...currentProperty.location.address,
          line1: "Riverside Drive",
        },
      },
      media: {
        ...currentProperty.media,
        images: [
          {
            id: "mock-2",
            order: 0,
            uploadedAt: new Date(),
            url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
            caption: "Garden apartment",
            isPrimary: true,
          },
        ],
      },
      status: "available" as any,
      isFavorited: true,
    },
    {
      ...currentProperty,
      _id: "mock-3",
      title: "Luxury Penthouse with City View",
      type: "apartment" as any,
      pricing: {
        ...currentProperty.pricing,
        rent: currentProperty.pricing.rent * 1.5,
      },
      specifications: {
        ...currentProperty.specifications,
        bedrooms: (currentProperty.specifications.bedrooms || 2) + 1,
        bathrooms: (currentProperty.specifications.bathrooms || 1) + 1,
        totalArea: (currentProperty.specifications.totalArea || 1000) * 1.3,
        furnished: true,
      },
      location: {
        ...currentProperty.location,
        address: {
          ...currentProperty.location.address,
          line1: "Upper Hill Heights",
        },
      },
      media: {
        ...currentProperty.media,
        images: [
          {
            id: "mock-3",
            order: 0,
            uploadedAt: new Date(),
            url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
            caption: "Luxury penthouse",
            isPrimary: true,
          },
        ],
      },
      status: "available" as any,
      isFavorited: false,
    },
    {
      ...currentProperty,
      _id: "mock-4",
      title: "Cozy Studio Near CBD",
      type: "studio" as any,
      pricing: {
        ...currentProperty.pricing,
        rent: currentProperty.pricing.rent * 0.6,
      },
      specifications: {
        ...currentProperty.specifications,
        bedrooms: 0,
        bathrooms: 1,
        totalArea: (currentProperty.specifications.totalArea || 1000) * 0.5,
        furnished: "fully_furnished" as any,
      },
      location: {
        ...currentProperty.location,
        address: {
          ...currentProperty.location.address,
          line1: "Westlands Square",
        },
      },
      media: {
        ...currentProperty.media,
        images: [
          {
            id: "mock-4",
            order: 0,
            uploadedAt: new Date(),
            url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
            caption: "Cozy studio",
            isPrimary: true,
          },
        ],
      },
      status: "available" as any,
      isFavorited: false,
    },
    {
      ...currentProperty,
      _id: "mock-5",
      title: "Family House with Parking",
      type: "house" as any,
      pricing: {
        ...currentProperty.pricing,
        rent: currentProperty.pricing.rent * 1.3,
      },
      specifications: {
        ...currentProperty.specifications,
        bedrooms: (currentProperty.specifications.bedrooms || 2) + 2,
        bathrooms: (currentProperty.specifications.bathrooms || 1) + 1,
        totalArea: (currentProperty.specifications.totalArea || 1000) * 1.5,
      },
      location: {
        ...currentProperty.location,
        address: {
          ...currentProperty.location.address,
          line1: "Karen Blixen",
          town: "Karen",
        },
      },
      media: {
        ...currentProperty.media,
        images: [
          {
            id: "mock-5",
            order: 0,
            uploadedAt: new Date(),
            url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
            caption: "Family house",
            isPrimary: true,
          },
        ],
      },
      status: "available" as any,
      isFavorited: false,
    },
    {
      ...currentProperty,
      _id: "mock-6",
      title: "Budget-Friendly Flat",
      type: "flat" as any,
      pricing: {
        ...currentProperty.pricing,
        rent: currentProperty.pricing.rent * 0.7,
      },
      specifications: {
        ...currentProperty.specifications,
        bedrooms: currentProperty.specifications.bedrooms || 2,
        bathrooms: 1,
        totalArea: (currentProperty.specifications.totalArea || 1000) * 0.8,
        // furnished: false,
      },
      location: {
        ...currentProperty.location,
        address: {
          ...currentProperty.location.address,
          line1: "Ngong Road Estate",
        },
      },
      media: {
        ...currentProperty.media,
        images: [
          {
            id: "mock-6",
            order: 0,
            uploadedAt: new Date(),
            url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
            caption: "Budget flat",
            isPrimary: true,
          },
        ],
      },
      status: "available" as any,
      isFavorited: false,
    },
  ];

  return mockProperties;
}
