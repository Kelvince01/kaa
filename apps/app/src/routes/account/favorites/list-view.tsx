"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Bath, Bed, ExternalLink, Heart, MapPin, Maximize } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FavouriteListItem } from "@/modules/properties/favourites";
import {
  useFavouriteStore,
  useRemoveFavourite,
} from "@/modules/properties/favourites";

type FavouriteListViewProps = {
  favourites: FavouriteListItem[];
};

export const FavouriteListView = ({ favourites }: FavouriteListViewProps) => {
  const router = useRouter();
  const { selectedFavourites, toggleFavouriteSelection } = useFavouriteStore();
  const removeFavourite = useRemoveFavourite();

  const handleRemove = async (propertyId: string) => {
    try {
      await removeFavourite.mutateAsync({ propertyId });
      toast.success("Property removed from favourites");
    } catch (error) {
      toast.error("Failed to remove property");
    }
  };

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "KES",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="space-y-4">
      {favourites.map((favourite) => (
        <div
          className="group flex gap-4 overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-lg"
          key={favourite._id}
        >
          {/* Checkbox */}
          <div className="flex items-start pt-1">
            <Checkbox
              checked={selectedFavourites.includes(favourite.property._id)}
              onCheckedChange={() => toggleFavouriteSelection(favourite._id)}
            />
          </div>

          {/* Image */}
          <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-md bg-gray-100">
            {favourite.property.image ? (
              <Image
                alt={favourite.property.title}
                className="object-cover transition-transform group-hover:scale-105"
                fill
                src={favourite.property.image}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-200">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {favourite.property.status && (
              <div className="absolute bottom-2 left-2">
                <Badge
                  className="text-xs capitalize"
                  variant={
                    favourite.property.isAvailable ? "default" : "secondary"
                  }
                >
                  {favourite.property.status}
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between">
              <button
                className="flex-1 cursor-pointer text-left"
                onClick={() =>
                  router.push(`/properties/${favourite.property._id}`)
                }
                type="button"
              >
                <h3 className="mb-1 font-semibold text-gray-900 text-lg">
                  {favourite.property.title}
                </h3>
                <div className="mb-2 flex items-center text-gray-600 text-sm">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>{favourite.property.address}</span>
                </div>
              </button>

              {/* Price */}
              <div className="text-right">
                <div className="font-bold text-primary-600 text-xl">
                  {formatPrice(
                    favourite.property.price,
                    favourite.property.currency
                  )}
                </div>
              </div>
            </div>

            {/* Property details */}
            <div className="mt-2 flex items-center gap-6 text-gray-600 text-sm">
              {favourite.property.bedrooms !== undefined && (
                <div className="flex items-center">
                  <Bed className="mr-1 h-4 w-4" />
                  <span>{favourite.property.bedrooms} beds</span>
                </div>
              )}
              {favourite.property.bathrooms !== undefined && (
                <div className="flex items-center">
                  <Bath className="mr-1 h-4 w-4" />
                  <span>{favourite.property.bathrooms} baths</span>
                </div>
              )}
              {favourite.property.size !== undefined && (
                <div className="flex items-center">
                  <Maximize className="mr-1 h-4 w-4" />
                  <span>{favourite.property.size} sq ft</span>
                </div>
              )}
              <Badge className="capitalize" variant="outline">
                {favourite.property.propertyType}
              </Badge>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-gray-200 border-t pt-3">
              <span className="text-gray-500 text-xs">
                Added{" "}
                {new Date(favourite.property.addedAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    router.push(`/properties/${favourite.property._id}`)
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Property
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(favourite.property._id);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Heart className="h-4 w-4 fill-current text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
