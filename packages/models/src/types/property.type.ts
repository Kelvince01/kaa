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
  | "partially furnished"
  | "furnished";

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
// export type PropertyStatus = "draft" | "active" | "let" | "inactive" | "maintenance"; // "available" | "occupied" | "maintenance" | "off_market"
export enum PropertyStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  LET = "let",
  INACTIVE = "inactive",
  MAINTENANCE = "maintenance",
}

/**
 * Property document interface
 */
export interface IProperty extends BaseDocument {
  title: string;
  description: string;
  type: PropertyType;
  slug: string;
  status: PropertyStatus;
  landlord: mongoose.Types.ObjectId;
  agent?: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;

  // Location details (Kenya-specific)
  location: {
    country: string;
    county: string;
    constituency: string;
    ward: string;
    estate: string;
    address: {
      line1: string;
      line2?: string;
      town: string;
      postalCode: string;
      directions?: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
    nearbyAmenities: string[];
  };
  geolocation: IGeoLocation;

  // Property details
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
    tags?: string[];
  };

  // Financial information
  pricing: {
    rentAmount: number;
    currency: "KES" | "USD";
    paymentFrequency: "monthly" | "quarterly" | "annually" | "daily" | "weekly";
    securityDeposit: number;
    serviceCharge?: number;
    rentDueDate?: number;
    lateFee?: number;
    utilitiesIncluded: string[];
    waterBill: "Included" | "Tenant pays" | "Shared";
    electricityBill: "Included" | "Tenant pays" | "Shared";
    negotiable: boolean;
  };

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
  media: {
    photos: Array<{
      url: string;
      caption?: string;
      isPrimary: boolean;
    }>;
    virtualTours?: mongoose.Types.ObjectId[]; // References to VirtualTour documents
    virtualTour?: string; // Deprecated - kept for backward compatibility
    floorPlan?: {
      url: string;
      caption: string;
    };
    epcImage?: {
      url: string;
      caption: string;
      rating?: string;
    };
    videos: string[];
  };

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
  metrics: {
    viewCount: number;
    inquiryCount: number;
    applicationCount: number;
    averageOccupancyRate: number;
    averageRentCollection: number;
    maintenanceRequests: number;
  };

  listingType: ListingType;
  available: boolean;
  availableFrom: Date;
  availableTo?: Date;
  features: string[];
  amenities: Amenity[];
  energyRating?: string;
  rejectionReason?: string;

  governingLaw: string;
  jurisdiction: string;

  featured?: boolean;
  rentPeriod?: string;
  minimumTenancy?: number;
  maxTenants?: number;
  bills?: string[];
  verified?: boolean;
  verifiedAt?: Date;
  viewings?: mongoose.Types.ObjectId; // booking
  applications?: mongoose.Types.ObjectId;
  currentTenants?: mongoose.Types.ObjectId[];
  favoriteCount?: number;
  formattedAddress?: string;
  getMainImage?: () => string | null;
  getTotalMonthlyCost?: () => number;
  getPrimaryVirtualTour?: () => mongoose.Types.ObjectId | null;
  hasVirtualTours?: () => boolean;
}
