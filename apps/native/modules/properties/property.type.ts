export type Property = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: "KES";
  propertyType:
    | "bedsitter"
    | "one-bedroom"
    | "two-bedroom"
    | "three-bedroom"
    | "house"
    | "apartment";
  location: {
    county: string;
    area: string;
    estate?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  images: string[];
  amenities: string[];
  landlord: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    verified: boolean;
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    parking: boolean;
    furnished: boolean;
    petsAllowed: boolean;
  };
  utilities: {
    water: boolean;
    electricity: boolean;
    internet: boolean;
    security: boolean;
  };
  availability: {
    available: boolean;
    availableFrom: string;
  };
  rating: number;
  reviewCount: number;
  isFavorite: boolean;
  createdAt: string;
};

export type SearchFilters = {
  propertyType?: string[];
  priceRange: {
    min: number;
    max: number;
  };
  location?: {
    county?: string;
    area?: string;
  };
  bedrooms?: number[];
  amenities?: string[];
  furnished?: boolean;
  petsAllowed?: boolean;
};
