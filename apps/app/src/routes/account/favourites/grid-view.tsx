"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card } from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Bath, Bed, Heart, MapPin, Maximize } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FavouriteListItem } from "@/modules/properties/favourites";
import {
  useFavouriteStore,
  useRemoveFavourite,
} from "@/modules/properties/favourites";

type FavouriteGridViewProps = {
  favorites: FavouriteListItem[];
};

export const FavouriteGridView = ({ favorites }: FavouriteGridViewProps) => {
  const router = useRouter();
  const { selectedFavourites, toggleFavouriteSelection } = useFavouriteStore();
  const removeFavourite = useRemoveFavourite();

  const handleRemove = async (propertyId: string) => {
    try {
      await removeFavourite.mutateAsync({ propertyId });
      toast.success("Property removed from favourites");
    } catch {
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {favorites.map((favorite) => (
        <Card
          className="group overflow-hidden transition-all hover:shadow-lg"
          key={favorite._id}
        >
          {/* Image */}
          <div className="relative h-48 w-full overflow-hidden bg-gray-100">
            {favorite.property.image ? (
              <Image
                alt={favorite.property.title}
                className="object-cover transition-transform group-hover:scale-105"
                fill
                src={favorite.property.image}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-200">
                <MapPin className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* Overlay actions */}
            <div className="absolute top-2 right-2 left-2 flex items-start justify-between">
              <Checkbox
                checked={selectedFavourites.includes(favorite.property._id)}
                className="bg-white"
                onCheckedChange={() => toggleFavouriteSelection(favorite._id)}
              />
              <Button
                className="h-8 w-8"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  handleRemove(favorite.property._id);
                }}
                size="icon"
                type="button"
                variant="destructive"
              >
                <Heart className="h-4 w-4 fill-current" />
              </Button>
            </div>

            {/* Status badge */}
            {favorite.property.status && (
              <div className="absolute bottom-2 left-2">
                <Badge
                  className="capitalize"
                  variant={
                    favorite.property.isAvailable ? "default" : "secondary"
                  }
                >
                  {favorite.property.status}
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <button
            className="w-full cursor-pointer p-4 text-left"
            onClick={() => router.push(`/properties/${favorite.property._id}`)}
            type="button"
          >
            {/* Price */}
            <div className="mb-2 font-bold text-primary-600 text-xl">
              {formatPrice(favorite.property.price, favorite.property.currency)}
            </div>

            {/* Title */}
            <h3 className="mb-2 line-clamp-1 font-semibold text-gray-900">
              {favorite.property.title}
            </h3>

            {/* Address */}
            <div className="mb-3 flex items-center text-gray-600 text-sm">
              <MapPin className="mr-1 h-4 w-4" />
              <span className="line-clamp-1">{favorite.property.address}</span>
            </div>

            {/* Property details */}
            <div className="flex items-center gap-4 border-gray-200 border-t pt-3 text-gray-600 text-sm">
              {favorite.property.bedrooms !== undefined && (
                <div className="flex items-center">
                  <Bed className="mr-1 h-4 w-4" />
                  <span>{favorite.property.bedrooms}</span>
                </div>
              )}
              {favorite.property.bathrooms !== undefined && (
                <div className="flex items-center">
                  <Bath className="mr-1 h-4 w-4" />
                  <span>{favorite.property.bathrooms}</span>
                </div>
              )}
              {favorite.property.size !== undefined && (
                <div className="flex items-center">
                  <Maximize className="mr-1 h-4 w-4" />
                  <span>{favorite.property.size} sq ft</span>
                </div>
              )}
            </div>

            {/* Property type */}
            <div className="mt-3 flex items-center justify-between">
              <Badge className="capitalize" variant="outline">
                {favorite.property.propertyType}
              </Badge>
              <span className="text-gray-500 text-xs">
                Added {new Date(favorite.property.addedAt).toLocaleDateString()}
              </span>
            </div>
          </button>
        </Card>
      ))}
    </div>
  );
};
