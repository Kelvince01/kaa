/**
 * Property card component for grid and list views
 */
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import { cn } from "@kaa/ui/lib/utils";
import {
  Bath,
  Bed,
  Bookmark,
  Calendar,
  Car,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Share2,
  Shield,
  Square,
  Star,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { useTogglePropertyFavorite } from "@/modules/properties/property.mutations";
import type { Property } from "@/modules/properties/property.type";

type PropertyCardProps = {
  property: Property;
  viewMode?: "grid" | "list";
  onHover?: (property: Property | null) => void;
  onClick?: (property: Property) => void;
  isSelected?: boolean;
  className?: string;
};

const FEATURE_ICONS = {
  parking: Car,
  wifi: Wifi,
  security: Shield,
  generator: Shield,
  garden: Shield,
};

export function PropertyCard({
  property,
  viewMode = "grid",
  onHover,
  onClick,
  isSelected,
  className,
}: PropertyCardProps) {
  const [imageError, setImageError] = useState(false);

  const toggleFavorite = useTogglePropertyFavorite();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate(property._id);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(property);
    }
  };

  const handleMouseEnter = () => {
    if (onHover) {
      onHover(property);
    }
  };

  const handleMouseLeave = () => {
    if (onHover) {
      onHover(null);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: `/properties/${property._id}`,
      });
    }
  };

  const primaryImage =
    property.media.images.find((photo) => photo.isPrimary) ||
    property.media.images[0];
  const imageUrl = primaryImage?.url || "/placeholder-property.jpg";

  const formattedPrice = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: property.pricing.currency,
    maximumFractionDigits: 0,
  }).format(property.pricing.rent);

  const formattedLocation = `${property.location.constituency}, ${property.location.county}`;

  const features = Object.keys(property.amenities).slice(0, 3);
  const hasMoreFeatures = Object.keys(property.amenities).length > 3;

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "group cursor-pointer border-0 shadow-sm transition-all duration-200 hover:shadow-lg",
          isSelected && "ring-2 ring-primary",
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardContent className="p-0">
          <div className="flex gap-4">
            {/* Property Image */}
            <div className="relative h-48 w-64 shrink-0">
              <Image
                alt={property.title}
                className="rounded-l-lg object-cover"
                fill
                onError={() => setImageError(true)}
                src={imageError ? "/placeholder-property.jpg" : imageUrl}
              />

              {/* Status badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {property.featured && (
                  <Badge className="bg-yellow-500 text-white">
                    <Star className="mr-1 h-3 w-3" />
                    Featured
                  </Badge>
                )}
                {property.verified && (
                  <Badge variant="secondary">Verified</Badge>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <TooltipProvider>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="h-8 w-8 bg-white/90 hover:bg-white"
                          onClick={handleFavoriteClick}
                          size="icon"
                          variant="secondary"
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              property.isFavorited &&
                                "fill-red-500 text-red-500"
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {property.isFavorited
                          ? "Remove from favorites"
                          : "Add to favorites"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="h-8 w-8 bg-white/90 hover:bg-white"
                          onClick={handleShare}
                          size="icon"
                          variant="secondary"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Share property</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>

              {/* Photo count */}
              {property.media.images.length > 1 && (
                <div className="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-1 text-white text-xs">
                  {property.media.images.length} photos
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="flex-1 p-6">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg transition-colors group-hover:text-primary">
                    {property.title}
                  </h3>
                  <div className="mt-1 flex items-center text-muted-foreground text-sm">
                    <MapPin className="mr-1 h-4 w-4" />
                    {formattedLocation}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 text-xl">
                    {formattedPrice}
                    <span className="font-normal text-muted-foreground text-sm">
                      /{property.pricing.paymentFrequency}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
                {property.description}
              </p>

              {/* Property specs */}
              <div className="mb-4 flex items-center gap-6 text-muted-foreground text-sm">
                {property.specifications.bedrooms !== undefined && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    <span>
                      {property.specifications.bedrooms} bed
                      {property.specifications.bedrooms !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {property.specifications.bathrooms !== undefined && (
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    <span>
                      {property.specifications.bathrooms} bath
                      {property.specifications.bathrooms !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Square className="h-4 w-4" />
                  <span>{property.specifications.totalArea} sqm</span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4 flex items-center gap-2">
                {features?.map((feature) => {
                  const Icon =
                    FEATURE_ICONS[feature as keyof typeof FEATURE_ICONS] ||
                    Shield;
                  return (
                    <Badge
                      className="text-xs"
                      key={feature}
                      variant="secondary"
                    >
                      <Icon className="mr-1 h-3 w-3" />
                      {feature}
                    </Badge>
                  );
                })}
                {hasMoreFeatures && (
                  <Badge className="text-xs" variant="outline">
                    +{Object.keys(property.amenities).length - 3} more
                  </Badge>
                )}
              </div>

              {/* Landlord */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={(property.landlord as any).personalInfo.avatar}
                    />
                    <AvatarFallback className="text-xs">
                      {(property.landlord as any).personalInfo.firstName?.[0]}
                      {(property.landlord as any).personalInfo.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground text-sm">
                    {(property.landlord as any).personalInfo.firstName}{" "}
                    {(property.landlord as any).personalInfo.lastName}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="mr-1 h-4 w-4" />
                    Call
                  </Button>
                  <Button size="sm" variant="default">
                    <MessageCircle className="mr-1 h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden border-0 shadow-sm transition-all duration-200 hover:shadow-lg",
        isSelected && "ring-2 ring-primary",
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardContent className="p-0">
        {/* Property Image */}
        <div className="relative h-48">
          <Image
            alt={property.title}
            className="object-cover"
            fill
            onError={() => setImageError(true)}
            src={imageError ? "/placeholder-property.jpg" : imageUrl}
          />

          {/* Status badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {property.featured && (
              <Badge className="bg-yellow-500 text-white">
                <Star className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            )}
            {property.verified && <Badge variant="secondary">Verified</Badge>}
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                      onClick={handleFavoriteClick}
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
                  </TooltipTrigger>
                  <TooltipContent>
                    {property.isFavorited
                      ? "Remove from favorites"
                      : "Add to favorites"}
                  </TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                      onClick={(e) => e.stopPropagation()}
                      size="icon"
                      variant="secondary"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bookmark className="mr-2 h-4 w-4" />
                      Save Search
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Viewing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipProvider>
          </div>

          {/* Photo count */}
          {property.media.images.length > 1 && (
            <div className="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-1 text-white text-xs">
              {property.media.images.length} photos
            </div>
          )}

          {/* Price */}
          <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-white">
            <div className="font-bold">
              {formattedPrice}
              <span className="font-normal text-xs">
                /{property.pricing.paymentFrequency}
              </span>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="p-4">
          <div className="mb-2">
            <h3 className="line-clamp-1 font-semibold text-base text-gray-900 transition-colors group-hover:text-primary">
              {property.title}
            </h3>
            <div className="mt-1 flex items-center text-muted-foreground text-sm">
              <MapPin className="mr-1 h-3 w-3" />
              <span className="line-clamp-1">{formattedLocation}</span>
            </div>
          </div>

          {/* Property specs */}
          <div className="mb-3 flex items-center gap-4 text-muted-foreground text-sm">
            {property.specifications.bedrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.specifications.bedrooms}</span>
              </div>
            )}
            {property.specifications.bathrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.specifications.bathrooms}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{property.specifications.totalArea}m²</span>
            </div>
          </div>

          {/* Features */}
          <div className="mb-3 flex flex-wrap gap-1">
            {features?.map((feature) => {
              const Icon =
                FEATURE_ICONS[feature as keyof typeof FEATURE_ICONS] || Shield;
              return (
                <Badge className="text-xs" key={feature} variant="secondary">
                  <Icon className="mr-1 h-3 w-3" />
                  {feature}
                </Badge>
              );
            })}
            {hasMoreFeatures && (
              <Badge className="text-xs" variant="outline">
                +{Object.keys(property.amenities).length - 3}
              </Badge>
            )}
          </div>

          {/* Landlord */}
          <div className="flex items-center justify-between border-t pt-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={(property.landlord as any).personalInfo.avatar}
                />
                <AvatarFallback className="text-xs">
                  {(property.landlord as any).personalInfo.firstName?.[0]}
                  {(property.landlord as any).personalInfo.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">
                {(property.landlord as any).personalInfo.firstName}{" "}
                {(property.landlord as any).personalInfo.lastName}
              </span>
            </div>

            {property.stats.views && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Eye className="h-3 w-3" />
                <span>{property.stats.views}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
