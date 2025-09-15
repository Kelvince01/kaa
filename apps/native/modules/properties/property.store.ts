import { create } from "zustand";
import type { Property, SearchFilters } from "./property.type";

type PropertyState = {
  properties: Property[];
  favorites: string[];
  searchFilters: SearchFilters;
  isLoading: boolean;
  searchQuery: string;
  fetchProperties: () => Promise<void>;
  toggleFavorite: (propertyId: string) => void;
  setSearchFilters: (filters: SearchFilters) => void;
  setSearchQuery: (query: string) => void;
  getFilteredProperties: () => Property[];
};

const mockProperties: Property[] = [
  {
    id: "1",
    title: "Modern Bedsitter in Kilimani",
    description:
      "A beautiful modern bedsitter with all amenities included. Perfect for young professionals.",
    price: 25_000,
    currency: "KES",
    propertyType: "bedsitter",
    location: {
      county: "Nairobi",
      area: "Kilimani",
      estate: "Yaya Center",
      coordinates: { latitude: -1.2921, longitude: 36.8219 },
    },
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    ],
    amenities: ["WiFi", "Parking", "Security", "Water", "Electricity"],
    landlord: {
      id: "l1",
      name: "Mary Wanjiku",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      rating: 4.8,
      verified: true,
    },
    features: {
      bedrooms: 1,
      bathrooms: 1,
      parking: true,
      furnished: true,
      petsAllowed: false,
    },
    utilities: {
      water: true,
      electricity: true,
      internet: true,
      security: true,
    },
    availability: {
      available: true,
      availableFrom: "2024-02-01",
    },
    rating: 4.7,
    reviewCount: 23,
    isFavorite: false,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Spacious 2BR Apartment in Westlands",
    description:
      "Family-friendly apartment with great amenities and close to shopping centers.",
    price: 45_000,
    currency: "KES",
    propertyType: "two-bedroom",
    location: {
      county: "Nairobi",
      area: "Westlands",
      estate: "Parklands",
      coordinates: { latitude: -1.2634, longitude: 36.8084 },
    },
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    ],
    amenities: [
      "WiFi",
      "Parking",
      "Security",
      "Gym",
      "Swimming Pool",
      "Backup Generator",
    ],
    landlord: {
      id: "l2",
      name: "James Mwangi",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 4.9,
      verified: true,
    },
    features: {
      bedrooms: 2,
      bathrooms: 2,
      parking: true,
      furnished: false,
      petsAllowed: true,
    },
    utilities: {
      water: true,
      electricity: true,
      internet: true,
      security: true,
    },
    availability: {
      available: true,
      availableFrom: "2024-02-15",
    },
    rating: 4.9,
    reviewCount: 41,
    isFavorite: false,
    createdAt: "2024-01-10T14:30:00Z",
  },
  {
    id: "3",
    title: "Cozy 1BR in Karen",
    description:
      "Quiet neighborhood perfect for professionals. Close to shopping and restaurants.",
    price: 35_000,
    currency: "KES",
    propertyType: "one-bedroom",
    location: {
      county: "Nairobi",
      area: "Karen",
      estate: "Karen Hardy",
      coordinates: { latitude: -1.3197, longitude: 36.6859 },
    },
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    ],
    amenities: ["WiFi", "Parking", "Security", "Garden", "Quiet Area"],
    landlord: {
      id: "l3",
      name: "Grace Akinyi",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 4.6,
      verified: true,
    },
    features: {
      bedrooms: 1,
      bathrooms: 1,
      parking: true,
      furnished: true,
      petsAllowed: false,
    },
    utilities: {
      water: true,
      electricity: true,
      internet: true,
      security: true,
    },
    availability: {
      available: true,
      availableFrom: "2024-03-01",
    },
    rating: 4.6,
    reviewCount: 18,
    isFavorite: false,
    createdAt: "2024-01-08T09:15:00Z",
  },
];

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  favorites: [],
  searchFilters: {
    priceRange: { min: 0, max: 100_000 },
  },
  isLoading: false,
  searchQuery: "",

  fetchProperties: async () => {
    set({ isLoading: true });
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set({ properties: mockProperties, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  toggleFavorite: (propertyId: string) => {
    const { favorites, properties } = get();
    const isFavorite = favorites.includes(propertyId);

    const newFavorites = isFavorite
      ? favorites.filter((id) => id !== propertyId)
      : [...favorites, propertyId];

    const updatedProperties = properties.map((property) =>
      property.id === propertyId
        ? { ...property, isFavorite: !isFavorite }
        : property
    );

    set({ favorites: newFavorites, properties: updatedProperties });
  },

  setSearchFilters: (filters: SearchFilters) => {
    set({ searchFilters: filters });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  getFilteredProperties: () => {
    const { properties, searchFilters, searchQuery } = get();

    return properties.filter((property) => {
      // Text search
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          property.title.toLowerCase().includes(searchLower) ||
          property.location.area.toLowerCase().includes(searchLower) ||
          property.location.county.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Price range
      if (
        property.price < searchFilters.priceRange.min ||
        property.price > searchFilters.priceRange.max
      ) {
        return false;
      }

      // Property type
      if (
        searchFilters.propertyType &&
        searchFilters.propertyType.length > 0 &&
        !searchFilters.propertyType.includes(property.propertyType)
      ) {
        return false;
      }

      // Location
      if (
        searchFilters.location?.county &&
        property.location.county !== searchFilters.location.county
      ) {
        return false;
      }

      if (
        searchFilters.location?.area &&
        property.location.area !== searchFilters.location.area
      ) {
        return false;
      }

      // Bedrooms
      if (
        searchFilters.bedrooms &&
        searchFilters.bedrooms.length > 0 &&
        !searchFilters.bedrooms.includes(property.features.bedrooms)
      ) {
        return false;
      }

      // Furnished
      if (
        searchFilters.furnished !== undefined &&
        property.features.furnished !== searchFilters.furnished
      ) {
        return false;
      }

      // Pets allowed
      if (
        searchFilters.petsAllowed !== undefined &&
        property.features.petsAllowed !== searchFilters.petsAllowed
      ) {
        return false;
      }

      return true;
    });
  },
}));
