"use client";

import { Card } from "@kaa/ui/components/card";
import { Heart, Home, MapPin, TrendingUp } from "lucide-react";
import type { FavouriteStats } from "@/modules/properties/favourites";

type FavouriteStatsCardProps = {
  stats: FavouriteStats;
};

export const FavouriteStatsCard = ({ stats }: FavouriteStatsCardProps) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-4">
      {/* Total Favourites */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Total Favourites</p>
            <p className="mt-1 font-bold text-2xl text-gray-900">
              {stats.total}
            </p>
          </div>
          <div className="rounded-full bg-red-100 p-3">
            <Heart className="h-6 w-6 text-red-500" />
          </div>
        </div>
      </Card>

      {/* Available Properties */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Available</p>
            <p className="mt-1 font-bold text-2xl text-gray-900">
              {stats.availableProperties}
            </p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <Home className="h-6 w-6 text-green-500" />
          </div>
        </div>
      </Card>

      {/* Average Price */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Avg. Price</p>
            <p className="mt-1 font-bold text-gray-900 text-xl">
              {formatPrice(stats.averagePrice)}
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <TrendingUp className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </Card>

      {/* Locations */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Locations</p>
            <p className="mt-1 font-bold text-2xl text-gray-900">
              {Object.keys(stats.byLocation || {}).length}
            </p>
          </div>
          <div className="rounded-full bg-purple-100 p-3">
            <MapPin className="h-6 w-6 text-purple-500" />
          </div>
        </div>
      </Card>
    </div>
  );
};
