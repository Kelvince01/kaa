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
import { useSimilarProperties } from "@/modules/properties/property.queries";
import type { Property } from "@/modules/properties/property.type";
import { formatCurrency } from "@/shared/utils/format.util";

type SimilarPropertiesProps = {
  currentPropertyId: string;
  className?: string;
};

export function SimilarProperties({
  currentPropertyId,
  className,
}: SimilarPropertiesProps) {
  const {
    data: similarProperties,
    isLoading,
    error,
    refetch,
  } = useSimilarProperties(currentPropertyId, 6);

  const handleRefresh = () => {
    refetch();
  };

  // Filter out the current property and limit to 6 similar properties
  const displayProperties = similarProperties
    ?.filter((property) => property._id !== currentPropertyId)
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

  if (displayProperties?.length === 0) {
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
          <Badge variant="secondary">{similarProperties?.length}</Badge>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/properties">View All</Link>
        </Button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {similarProperties?.map((property) => (
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
