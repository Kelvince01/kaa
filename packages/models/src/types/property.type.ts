import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";
import type { IGeoLocation } from "./common.type";

/**
 * Property types
 */
export enum PropertyType {
  HOUSE = "house",
  FLAT = "flat",
  APARTMENT = "apartment",
  STUDIO = "studio",
  OTHER = "other",
  LAND = "land",
  SHOP = "shop",
  OFFICE = "office",
  WAREHOUSE = "warehouse",
  VILLA = "villa",
  COMMERCIAL = "commercial",
  BEDSITTER = "bedsitter",
  PENTHOUSE = "penthouse",
  MAISONETTE = "maisonette",
}

export enum ListingType {
  SALE = "sale",
  RENT = "rent",
  AUCTION = "auction",
  EXCHANGE = "exchange",
}

export enum PriceUnit {
  MONTH = "month",
  WEEK = "week",
  DAY = "day",
  TOTAL = "total",
}

export type Amenity = {
  name: string;
  icon?: string;
  description?: string;
};

/**
 * Rent period type
 */
export type RentPeriod = "week" | "month";

/**
 * Furnished status type
 */
export type FurnishedStatus =
  | "unfurnished"
  | "semi_furnished"
  | "fully_furnished";

/**
 * Property image interface
 */
export type IPropertyImage = {
  url: string;
  key: string;
  isMain: boolean;
};

/**
 * Property feature type
 */
export type PropertyFeature =
  | "garden"
  | "parking"
  | "garage"
  | "balcony"
  | "pets allowed"
  | "smokers allowed"
  | "students allowed"
  | "families allowed"
  | "bills included"
  | "washing machine"
  | "dishwasher"
  | "dryer"
  | "central heating"
  | "double glazing"
  | "broadband included"
  | "tv"
  | "fireplace"
  | "disabled access"
  | "alarm"
  | "intercom";

/**
 * Bill type
 */
export type BillType =
  | "gas"
  | "electricity"
  | "water"
  | "council tax"
  | "tv license"
  | "internet";

/**
 * Property status
 */
export enum PropertyStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  LET = "let",
  INACTIVE = "inactive",
  MAINTENANCE = "maintenance",
}

/**
 * Property condition
 */
export type PropertyCondition =
  | "new"
  | "excellent"
  | "good"
  | "fair"
  | "needs_renovation";

/**
 * Road access type
 */
export type AccessRoadType = "tarmac" | "murram" | "earth";

/**
 * Roof type
 */
export type RoofType = "iron_sheets" | "tiles" | "concrete" | "thatch";

/**
 * Wall type
 */
export type WallType = "stone" | "brick" | "block" | "wood" | "mixed";

/**
 * Floor type
 */
export type FloorType = "tiles" | "concrete" | "wood" | "marble" | "terrazzo";

/**
 * Property amenities and features
 */
export type PropertyAmenities = {
  // Basic amenities
  water: boolean;
  electricity: boolean;
  parking: boolean;
  security: boolean;
  garden: boolean;

  // Luxury amenities
  swimmingPool: boolean;
  gym: boolean;
  lift: boolean;
  generator: boolean;
  solarPower: boolean;

  // Connectivity
  internet: boolean;
  dstv: boolean;
  cableTv: boolean;

  // Storage & Extra Rooms
  storeRoom: boolean;
  servantQuarter: boolean;
  studyRoom: boolean;
  balcony: boolean;

  // Outdoor features
  compound: boolean;
  gate: boolean;
  perimeter: boolean;
  borehole: boolean;

  // Services
  laundry: boolean;
  cleaning: boolean;
  caretaker: boolean;
  cctv: boolean;
};

/**
 * Property pricing structure
 */
export type PropertyPricing = {
  rent: number;
  currency: "KES" | "USD";
  deposit: number; // Usually 1-3 months rent
  serviceFee?: number;
  agentFee?: number;
  legalFee?: number;
  lateFee?: number;

  // Payment terms
  paymentFrequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
  advanceMonths: number; // Months to pay in advance
  depositMonths: number; // Deposit in months of rent

  // Utilities
  utilitiesIncluded: {
    water: boolean;
    electricity: boolean;
    internet: boolean;
    garbage: boolean;
    security: boolean;
  };

  negotiable: boolean;

  // Pricing history
  priceHistory?: Array<{
    price: number;
    changedAt: Date;
    reason?: string;
  }>;
};

/**
 * Property location with Kenyan specifics
 */
export type PropertyLocation = {
  // Administrative divisions
  country: string;
  county: string;
  constituency: string;
  ward: string;
  estate: string;
  neighborhood?: string;

  // Address details
  address: {
    line1: string;
    line2?: string;
    town: string;
    postalCode: string;
    directions?: string;
  };

  // Geographic coordinates
  coordinates: {
    latitude: number;
    longitude: number;
  };

  // Enhanced location data
  plotNumber?: string;
  buildingName?: string;
  floor?: number;
  unitNumber?: string;

  // Transportation
  nearbyTransport: string[]; // Matatu, bus stops, SGR, etc.
  walkingDistanceToRoad: number; // meters
  accessRoad: AccessRoadType;

  // Nearby facilities
  nearbySchools?: string[];
  nearbyHospitals?: string[];
  nearbyShopping?: string[];
  nearbyChurches?: string[];
  nearbyAmenities: string[];

  // Bounding box for searches
  boundingBox?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
};

/**
 * Property media
 */
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
  virtualTours?: mongoose.Types.ObjectId[]; // References to VirtualTour documents

  floorPlans?: Array<{
    id: string;
    url: string;
    name: string;
    uploadedAt: Date;
  }>;
};

/**
 * Property specifications
 */
export type PropertySpecs = {
  // Basic specs
  bedrooms: number;
  bathrooms: number;
  halfBaths: number;
  kitchens: number;
  livingRooms: number;
  diningRooms: number;

  // Measurements
  totalArea?: number; // square meters
  builtUpArea?: number;
  plotSize?: number;

  // Building details
  floors: number;
  yearBuilt?: number;
  condition: PropertyCondition;
  furnished: FurnishedStatus;

  // Construction details
  roofType?: RoofType;
  wallType?: WallType;
  floorType?: FloorType;
};

/**
 * Property rules and policies
 */
export type PropertyRules = {
  petsAllowed: boolean;
  smokingAllowed: boolean;
  partiesAllowed: boolean;
  childrenAllowed: boolean;

  // Specific restrictions
  maxOccupants?: number;
  quietHours?: {
    start: string; // HH:mm format
    end: string;
  };

  // Lease terms
  minimumLease: number; // months
  maximumLease?: number; // months
  renewalTerms?: string;

  // Special requirements
  creditCheckRequired: boolean;
  employmentVerification: boolean;
  previousLandlordReference: boolean;

  customRules: string[];
};

/**
 * Property availability
 */
export type PropertyAvailability = {
  isAvailable: boolean;
  availableFrom?: Date;
  availableTo?: Date;

  // Viewing schedule
  viewingDays: Array<{
    day:
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday";
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }>;

  // Contact for viewing
  viewingContact: {
    name: string;
    phone: string;
    alternativePhone?: string;
    preferredMethod: "call" | "whatsapp" | "sms";
  };

  // Booking requirements
  viewingFee?: number;
  bookingDeposit?: number;
};

/**
 * Property document interface
 */
export type IProperty = BaseDocument & {
  title: string;
  description: string;
  type: PropertyType;
  slug: string;
  status: PropertyStatus;
  landlord: mongoose.Types.ObjectId;
  agent?: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;

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
  moderatedBy?: mongoose.Types.ObjectId; // Admin user ID
  moderatedAt?: Date;

  // Relationships
  viewings?: mongoose.Types.ObjectId; // booking
  currentTenants?: mongoose.Types.ObjectId[];

  // Timestamps
  publishedAt?: Date;
  lastUpdatedAt: Date;
  expiresAt?: Date;

  // Computed fields
  pricePerSqm?: number;
  isPromoted: boolean;
  distanceFromCenter?: number; // km from city center

  // Methods
  getMainImage?: () => string | null;
  getTotalMonthlyCost?: () => number;
  getPrimaryVirtualTour?: () => mongoose.Types.ObjectId | null;
  hasVirtualTours?: () => boolean;
  canBeEditedBy: (userId: string, userRole: string) => boolean;
};

/**
 * Property creation data
 */
export type CreatePropertyData = {
  title: string;
  description: string;
  type: PropertyType;

  // Location
  county: string;
  estate: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  nearbyAmenities?: string[];
  plotNumber?: string;
  buildingName?: string;

  // Specifications
  bedrooms: number;
  bathrooms: number;
  furnished: FurnishedStatus;
  totalArea?: number;
  condition: PropertyCondition;

  // Pricing
  rent: number;
  deposit: number;
  serviceFee?: number;
  paymentFrequency: "monthly" | "quarterly" | "annually";
  advanceMonths: number;
  depositMonths: number;

  // Amenities (selected ones)
  amenities: string[];

  // Images (URLs)
  images: string[];

  // Availability
  availableFrom?: Date;

  // Contact
  viewingContact: {
    name: string;
    phone: string;
  };

  // Rules
  petsAllowed: boolean;
  minimumLease: number;

  tags?: string[];
};

/**
 * Property update data
 */
export type UpdatePropertyData = {
  title?: string;
  description?: string;

  // Pricing updates
  rent?: number;
  deposit?: number;
  serviceFee?: number;

  // Specifications
  bedrooms?: number;
  bathrooms?: number;
  furnished?: FurnishedStatus;
  condition?: PropertyCondition;

  // Amenities
  amenities?: string[];

  // Media
  images?: string[];

  // Availability
  isAvailable?: boolean;
  availableFrom?: Date;

  // Contact
  viewingContact?: {
    name: string;
    phone: string;
  };

  // Rules
  petsAllowed?: boolean;
  minimumLease?: number;

  tags?: string[];
};

/**
 * Property search filters
 */
export type PropertySearchFilters = {
  // Basic filters
  type?: PropertyType | PropertyType[];
  status?: PropertyStatus;

  // Location
  county?: string;
  estate?: string;
  coordinates?: { latitude: number; longitude: number };
  radius?: number; // km

  // Price range
  minRent?: number;
  maxRent?: number;
  currency?: "KES" | "USD";

  // Property specs
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  furnished?: FurnishedStatus;

  // Amenities (any of these)
  amenities?: string[];

  // Availability
  availableFrom?: Date;
  availableTo?: Date;

  // Features
  hasImages?: boolean;
  verified?: boolean;
  featured?: boolean;

  // Owner filters
  owner?: string; // User ID
  agent?: string; // Agent ID

  // Date filters
  publishedAfter?: Date;
  publishedBefore?: Date;

  // Pagination
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

/**
 * Property response data
 */
export type PropertyResponse = {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;

  // Location
  location: {
    county: string;
    estate: string;
    address: string;
    coordinates: { latitude: number; longitude: number };
    nearbyAmenities: string[];
  };

  // Specs
  bedrooms: number;
  bathrooms: number;
  furnished: string;
  totalArea?: number;
  condition: string;

  // Pricing
  rent: number;
  deposit: number;
  currency: string;
  paymentFrequency: string;

  // Amenities
  amenities: string[];

  // Media
  images: Array<{
    url: string;
    thumbnailUrl?: string;
    isPrimary: boolean;
  }>;

  // Availability
  isAvailable: boolean;
  availableFrom?: Date;

  // Owner info
  owner: {
    id: string;
    name: string;
    phone?: string;
    verified: boolean;
    rating?: number;
  };

  // Statistics
  views: number;
  verified: boolean;
  featured: boolean;

  // Timestamps
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Property card response (for lists)
 */
export type PropertyCardResponse = {
  id: string;
  title: string;
  type: PropertyType;

  // Location
  county: string;
  estate: string;

  // Basic specs
  bedrooms: number;
  bathrooms: number;

  // Pricing
  rent: number;
  currency: string;

  // Media
  primaryImage?: string;
  imageCount: number;

  // Status
  isAvailable: boolean;
  verified: boolean;
  featured: boolean;

  // Owner
  ownerName: string;
  ownerVerified: boolean;

  // Stats
  views: number;

  // Distance (if coordinates provided in search)
  distance?: number;

  publishedAt?: Date;
};
