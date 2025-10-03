import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Property,
  RecentlyViewedProperty,
} from "@/modules/properties/property.type";

const MAX_RECENTLY_VIEWED = 10; // Maximum number of properties to keep in history

export type RecentlyViewedStoreState = {
  recentlyViewed: RecentlyViewedProperty[];
  addToRecentlyViewed: (property: Property) => void;
  clearRecentlyViewed: () => void;
  removeFromRecentlyViewed: (propertyId: string) => void;
};

export const useRecentlyViewedStore = create<RecentlyViewedStoreState>()(
  persist(
    (set) => ({
      recentlyViewed: [],
      addToRecentlyViewed: (property: Property) => {
        if (!property?._id) return;

        set((state) => {
          const filtered = state.recentlyViewed.filter(
            (p) => p._id !== property._id
          );
          const newItem: RecentlyViewedProperty = {
            _id: property._id,
            title: property.title,
            location: property.location,
            pricing: property.pricing,
            details: property.details,
            media: property.media,
            type: property.type,
            description: property.description,
            memberId: property.memberId,
            available: property.available,
            availableFrom: property.availableFrom,
            features: property.features,
            amenities: property.amenities,
            geolocation: property.geolocation,
            landlord: property.landlord,
            status: property.status,
            createdAt: property.createdAt,
            updatedAt: property.updatedAt,
            viewedAt: new Date().toISOString(),
          };
          return {
            recentlyViewed: [newItem, ...filtered].slice(
              0,
              MAX_RECENTLY_VIEWED
            ),
          };
        });
      },
      clearRecentlyViewed: () => set({ recentlyViewed: [] }),
      removeFromRecentlyViewed: (propertyId: string) =>
        set((state) => ({
          recentlyViewed: state.recentlyViewed.filter(
            (p) => p._id !== propertyId
          ),
        })),
    }),
    {
      name: "recently-viewed-properties",
      partialize: (state) => ({ recentlyViewed: state.recentlyViewed }),
    }
  )
);
