// Use project path aliases for imports from the types index
import type {
  CreatePropertyData,
  FurnishedStatus,
  IGeoLocation,
  ListingType,
  PropertyAmenities,
  PropertyAvailability,
  PropertyLocation,
  PropertyPricing,
  PropertyRules,
  PropertySearchFilters,
  PropertySpecs,
  PropertyStatus,
  PropertyType,
  UpdatePropertyData,
} from "@kaa/models/types";
import type { User } from "../users/user.type";

export type PropertyMedia = {
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    caption?: string;
    isPrimary: boolean;
    order: number;
    uploadedAt: Date;
  }>;

  videos?: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    duration?: number;
    caption?: string;
    uploadedAt: Date;
  }>;
  virtualTours?: string[]; // References to VirtualTour documents

  floorPlans?: Array<{
    id: string;
    url: string;
    name: string;
    uploadedAt: Date;
  }>;
};

export type BaseProperty = {
  _id: string;
  title: string;
  description: string;
  type: PropertyType;
  slug: string;
  status: PropertyStatus;
  landlord: string;
  agent?: string;
  memberId: string;
  organizationId?: string;

  // Location details (Enhanced with Kenyan specifics)
  location: PropertyLocation;
  geolocation: IGeoLocation;

  // Property specifications
  specifications: PropertySpecs;

  // Property amenities
  amenities: PropertyAmenities;

  // Financial information
  pricing: PropertyPricing;

  // Property rules and policies
  rules: PropertyRules;

  // Property availability
  availability: PropertyAvailability;

  // AI-powered insights
  aiInsights: {
    marketValue: number;
    rentPrediction: number;
    occupancyScore: number;
    investmentScore: number;
    maintenanceRisk: "low" | "medium" | "high";
    lastUpdated: Date;
  };

  // Media
  media: PropertyMedia;

  // Utilities and services
  utilities: {
    electricity: {
      provider: string;
      meterNumber?: string;
      averageMonthlyBill?: number;
    };
    water: {
      provider: string;
      meterNumber?: string;
      averageMonthlyBill?: number;
    };
    internet: {
      available: boolean;
      providers: string[];
    };
    waste: {
      collectionDay?: string;
      provider?: string;
    };
  };

  // Compliance and legal
  compliance: {
    titleDeed: boolean;
    occupancyCertificate: boolean;
    fireCompliance: boolean;
    environmentalCompliance: boolean;
    countyApprovals: string[];
    insurancePolicy?: string;
    lastInspection?: Date;
  };

  // Performance metrics
  listingType: ListingType;

  energyRating?: string;
  rejectionReason?: string;

  // Legal
  governingLaw: string;
  jurisdiction: string;

  // SEO & Marketing
  tags: string[];
  featured: boolean;

  // Verification
  verified: boolean;
  verifiedAt?: Date;

  // Statistics
  stats: {
    views: number;
    inquiries: number;
    applications: number;
    bookmarks: number;
    averageRating?: number;
    totalReviews?: number;
  };

  // Moderation
  moderationStatus: "pending" | "approved" | "rejected" | "flagged";
  moderationNotes?: string;
  moderatedBy?: string; // Admin user ID
  moderatedAt?: Date;

  // Relationships
  viewings?: string; // booking
  currentTenants?: string[];

  // Timestamps
  publishedAt?: Date;
  lastUpdatedAt: Date;
  expiresAt?: Date;

  // Computed fields
  pricePerSqm?: number;
  isPromoted: boolean;
  distanceFromCenter?: number; // km from city center

  createdAt: Date;
  updatedAt: Date;
};

// Redefine Property to extend the base from models with app-specific fields
export type Property = BaseProperty & {
  isFavorited?: boolean;
  createdBy?: User;
  updatedBy?: User;
  landlord?: string | User; // Allow both ID and full User
  viewings?: string[]; // Array of viewing IDs
  applications?: string[]; // Array of application IDs
  verifiedAt?: string;
  featuredUntil?: string;
  featuredOrder?: number;
  nearbyTransport?: string;
  nearbyAmenities?: string;
  minTenancy?: string;
  noticePeriod?: number;
  energyRating?: string;
  rejectionReason?: string;
};

// Update other types to use imported ones where possible
export type Address = BaseProperty["location"]["address"];

export type GeoLocation = IGeoLocation;

export type Amenity = {
  name: string;
  icon?: string;
  description?: string;
};

// Keep app-specific input types but align with models
export type PropertyInput = CreatePropertyData & {
  landlord?: string;
};

export type UpdatePropertyInput = UpdatePropertyData & { id: string };

export type PropertyResponse = {
  property: Property;
};

// Align filters with models
export type PropertyFilters = PropertySearchFilters & {
  city?: string;
  search?: string;
  listingType?: ListingType;
  verified?: boolean;
  featured?: boolean;
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
    statusCounts?: Record<PropertyStatus, number>;
  };
};

export interface RecentlyViewedProperty extends Property {
  viewedAt: string;
}

// App-specific search params, extending models
export type PropertySearchParams = PropertySearchFilters & {
  query?: string;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  furnished?: FurnishedStatus; // Use imported type
  petsAllowed?: boolean;
  billsIncluded?: boolean;
  availableFrom?: string;
  features?: string[];
};

// Keep other app-specific types unchanged or minimally updated
export type PropertyFilterOptions = {
  propertyTypes: PropertyType[];
  features: string[];
  priceRange: {
    min: number;
    max: number;
  };
  bedroomRange: {
    min: number;
    max: number;
  };
  sortOptions: Array<{
    value: string;
    label: string;
  }>;
};

export type PropertyInquiryRequest = {
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  moveInDate?: string;
  message: string;
  scheduleViewing?: boolean;
  viewingDate?: string;
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

// Re-export key types using export from
export type {
  FurnishedStatus,
  ListingType,
  PropertyCondition,
  PropertyStatus,
  PropertyType,
} from "@kaa/models/types";
