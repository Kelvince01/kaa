import type { User } from "../users/user.type";

export type Address = {
  plotNumber?: string;
  estate?: string;
  line1: string;
  line2?: string;
  town: string;
  postalCode: string;
  formattedAddress?: string;
};

export type GeoLocation = {
  type: string;
  latitude?: number;
  longitude?: number;
};

// Property-related types
export type Amenity = {
  name: string;
  icon?: string;
  description?: string;
};

export type Property = {
  _id: string;
  title: string;
  description: string;
  memberId: string;
  pricing: {
    rentAmount: number;
    currency: "KES" | "USD";
    paymentFrequency: "monthly" | "quarterly" | "annually" | "daily";
    securityDeposit: number;
    serviceCharge?: number;
    waterBill: "Included" | "Tenant pays" | "Shared";
    electricityBill: "Included" | "Tenant pays" | "Shared";
    utilitiesIncluded: string[];
    negotiable: boolean;
    additionalFees?: Record<string, number>;
  };
  location: {
    country: string;
    county: string;
    constituency: string;
    plotNumber?: string;
    estate?: string;
    address: Address;
    neighborhood?: string;
  };
  type:
    | "house"
    | "flat"
    | "apartment"
    | "studio"
    | "other"
    | "villa"
    | "office"
    | "land";
  details: {
    rooms: number;
    bedrooms?: number;
    bathrooms?: number;
    size: number; // in square meters
    furnished: boolean;
    furnishedStatus: "Furnished" | "Unfurnished" | "Semi-furnished";
    parking: boolean;
    garden: boolean;
    security: boolean;
    generator: boolean;
    borehole?: boolean;
    water?: boolean;
    electricity?: boolean;
    internetReady: boolean;
    petFriendly: boolean;
    smokingAllowed: boolean;
    sublettingAllowed: boolean;
    yearBuilt?: number;
    floorLevel?: number;
    totalFloors?: number;
    // petPolicy?: "allowed" | "not_allowed" | "negotiable";
    // smokingPolicy?: "allowed" | "not_allowed" | "outside_only";
    tags?: string[];
  };
  media: {
    photos: {
      url: string;
      caption?: string;
      isPrimary: boolean;
    }[];
    virtualTours?: string[];
    floorPlan?: {
      url: string;
      caption?: string;
    };
    epcImage?: {
      url: string;
      caption?: string;
      rating?: string;
    };
    videos?: string[];
  };
  listingType?: "rent" | "sale";
  available: boolean;
  availableFrom: string;
  availableTo?: string;
  noticePeriod?: number;
  features: string[];
  amenities: Amenity[];
  geolocation: {
    type: "Point";
    coordinates: [number, number];
  };
  energyRating?: string;
  landlord: any; // string | User;
  currentTenants?: User[];
  minTenancy?: string;
  featured?: boolean;
  featuredUntil?: string;
  featuredOrder?: number;
  verified?: boolean;
  isFavorited?: boolean;
  views?: number;
  status:
    | "active"
    | "inactive"
    | "draft"
    | "archived"
    | "available"
    | "rented"
    | "sold"
    | "pending";
  nearbyTransport?: string;
  nearbyAmenities?: string;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
};

export type PropertyInput = Omit<Property, "landlord" | "_id"> & {
  landlord?: string; // Just the ID as string
};

export type UpdatePropertyInput = Partial<PropertyInput> & { id: string };

export type PropertyResponse = {
  property: Property;
};

export type PropertyFilters = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  county?: string;
  location?: string;
  priceRange?: string;
  listingType?: "rent" | "sale";
  type?:
    | "house"
    | "flat"
    | "apartment"
    | "studio"
    | "other"
    | "villa"
    | "office"
    | "land";
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  amenities?: string[];
  features?: string[];
  sort?: "price" | "bedrooms" | "bathrooms" | "size" | "createdAt";
  order?: "asc" | "desc";
  status?: "available" | "rented" | "sold" | "pending" | "inactive";
  verified?: boolean;
  featured?: boolean;
  featuredUntil?: string;
  featuredOrder?: number;
  verifiedAt?: string;
  viewings?: string[];
  applications?: string[];
  createdAt?: string;
};

export type PropertyListResponse = {
  properties: Property[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: PropertyFilters;
  meta: {
    queryTimeMs: number;
    statusCounts?: Record<string, number>;
  };
};

export interface RecentlyViewedProperty extends Property {
  viewedAt: string;
}

/**
 * Property search params
 */
export type PropertySearchParams = {
  /** Page number */
  page?: number;
  /** Limit */
  limit?: number;
  /** Search query/keyword */
  query?: string;
  /** Location search */
  location?: string;
  /** Minimum price */
  minPrice?: number;
  /** Maximum price */
  maxPrice?: number;
  /** Minimum number of bedrooms */
  minBedrooms?: number;
  /** Maximum number of bedrooms */
  maxBedrooms?: number;
  /** Property type */
  propertyType?: string;
  /** Furnished status */
  furnished?: boolean;
  /** Pets allowed */
  petsAllowed?: boolean;
  /** Bills included */
  billsIncluded?: boolean;
  /** Available from date */
  availableFrom?: string;
  /** Latitude for distance-based search */
  lat?: number;
  /** Longitude for distance-based search */
  lng?: number;
  /** Radius in miles for distance-based search */
  radius?: number;
  /** Property features to filter by */
  features?: string[];
};

/**
 * Property filtering options
 */
export type PropertyFilterOptions = {
  /** Property types available */
  propertyTypes: string[];
  /** Available features for filtering */
  features: string[];
  /** Price range */
  priceRange: {
    /** Minimum price in the system */
    min: number;
    /** Maximum price in the system */
    max: number;
  };
  /** Bedroom range */
  bedroomRange: {
    /** Minimum bedrooms in the system */
    min: number;
    /** Maximum bedrooms in the system */
    max: number;
  };
  /** Available sort options */
  sortOptions: Array<{
    /** Sort option identifier */
    value: string;
    /** Sort option display label */
    label: string;
  }>;
};

/**
 * Property inquiry submission
 */
export type PropertyInquiryRequest = {
  /** ID of the property being inquired about */
  propertyId: string;
  /** Inquirer's name */
  name: string;
  /** Inquirer's email */
  email: string;
  /** Inquirer's phone */
  phone: string;
  /** Desired move-in date */
  moveInDate?: string;
  /** Inquiry message content */
  message: string;
  /** Whether to schedule a viewing */
  scheduleViewing?: boolean;
  /** Preferred viewing date */
  viewingDate?: string;
  /** Additional notes for viewing */
  viewingNotes?: string;
};

export type FavoritesResponse = {
  properties: Property[];
  totalProperties: number;
  totalPages: number;
  currentPage: number;
};

export type Photo = {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  tags: string[];
  quality: "excellent" | "good" | "fair" | "poor";
  uploadProgress?: number;
  file?: File;
  thumbnail?: string;
  metadata?: {
    size: number;
    dimensions: { width: number; height: number };
    format: string;
    location?: { lat: number; lng: number };
  };
};

export type Video = {
  id: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  uploadProgress?: number;
  file?: File;
  metadata?: {
    size: number;
    format: string;
    duration: number;
  };
};

export type MediaFormData = {
  photos: Photo[];
  videos: Video[];
  virtualTours?: string[];
  floorPlan?: {
    id: string;
    url: string;
    caption?: string;
    uploadProgress?: number;
  };
  epcImage?: {
    id: string;
    url: string;
    caption?: string;
    rating?: string;
    uploadProgress?: number;
  };
};

export type UploadStats = {
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  totalSize: number;
  uploadedSize: number;
};

export type PropertyAnalytics = {
  views: {
    total: number;
    last7Days: number;
    last30Days: number;
    trend: "increasing" | "decreasing" | "stable";
  };
  favorites: {
    total: number;
    last7Days: number;
    last30Days: number;
  };
  inquiries: {
    total: number;
    last7Days: number;
    last30Days: number;
    conversionRate: number;
  };
  marketPosition: {
    priceRank: number;
    pricePercentile: number;
    daysOnMarket: number;
    competitionLevel: "low" | "medium" | "high";
  };
  roi: {
    estimatedAnnualReturn: number;
    capitalAppreciation: number;
    rentalYield: number;
  };
};

export type MarketInsights = {
  location: {
    county: string;
    constituency: string;
    coordinates: [number, number];
  };
  marketMetrics: {
    averageRent: number;
    medianRent: number;
    rentRange: {
      min: number;
      max: number;
    };
    occupancyRate: number;
    averageDaysOnMarket: number;
    pricePerSqm: number;
    yieldRate: number;
    appreciationRate: number;
  };
  trends: {
    rentTrend: "increasing" | "decreasing" | "stable";
    demandTrend: "high" | "medium" | "low";
    supplyTrend: "oversupply" | "balanced" | "undersupply";
  };
  predictions: {
    nextMonthRent: number;
    next6MonthsRent: number;
    nextYearRent: number;
    confidence: number;
  };
  comparables: Array<{
    propertyId: string;
    rentAmount: number;
    size: number;
    bedrooms: number;
    distance: number;
    similarity: number;
  }>;
};

export type AIRecommendation = {
  property: Property;
  score: number;
  reason: string;
  matchFactors: string[];
  confidence: number;
};

export type ImageAnalysisResult = {
  images: Array<{
    url: string;
    tags: string[];
    quality: "excellent" | "good" | "fair" | "poor";
    roomType?:
      | "bedroom"
      | "bathroom"
      | "kitchen"
      | "living"
      | "exterior"
      | "other";
    issues?: string[];
    suggestions?: string[];
  }>;
  overallQuality: number;
  recommendations: string[];
};

export type AddressValidationResult = {
  isValid: boolean;
  formattedAddress: string;
  coordinates: [number, number];
  confidence: number;
  suggestions: string[];
  issues: string[];
};

export type NearbyAmenity = {
  name: string;
  type:
    | "school"
    | "hospital"
    | "transport"
    | "shopping"
    | "restaurant"
    | "park"
    | "bank"
    | "other";
  distance: number; // in meters
  rating?: number;
  coordinates: [number, number];
};

export type SavedSearch = {
  _id: string;
  userId: string;
  name: string;
  filters: PropertySearchParams;
  notifications: boolean;
  lastUsed: string;
  createdAt: string;
};

export type PropertyComparison = {
  properties: Property[];
  comparisonFields: Array<{
    field: string;
    label: string;
    values: any[];
  }>;
};
