import type { GeoLocation } from "../property.type";

/**
 * Amenity categories specific to Kenya
 */
export enum AmenityCategory {
  EDUCATION = "education",
  HEALTHCARE = "healthcare",
  SHOPPING = "shopping",
  TRANSPORT = "transport",
  BANKING = "banking",
  ENTERTAINMENT = "entertainment",
  RELIGIOUS = "religious",
  GOVERNMENT = "government",
  UTILITIES = "utilities",
  FOOD = "food",
  SECURITY = "security",
  SPORTS = "sports",
}

/**
 * Amenity types common in Kenya
 */
export enum AmenityType {
  // Education
  PRIMARY_SCHOOL = "primary_school",
  SECONDARY_SCHOOL = "secondary_school",
  UNIVERSITY = "university",
  COLLEGE = "college",
  NURSERY = "nursery",

  // Healthcare
  HOSPITAL = "hospital",
  CLINIC = "clinic",
  PHARMACY = "pharmacy",
  DISPENSARY = "dispensary",

  // Shopping
  SUPERMARKET = "supermarket",
  SHOPPING_MALL = "shopping_mall",
  MARKET = "market",
  KIOSK = "kiosk",

  // Transport
  MATATU_STAGE = "matatu_stage",
  BUS_STOP = "bus_stop",
  RAILWAY_STATION = "railway_station",
  AIRPORT = "airport",
  BODA_BODA_STAGE = "boda_boda_stage",

  // Banking
  BANK = "bank",
  ATM = "atm",
  MPESA_AGENT = "mpesa_agent",
  SACCO = "sacco",

  // Entertainment
  RESTAURANT = "restaurant",
  BAR = "bar",
  CLUB = "club",
  CINEMA = "cinema",
  PARK = "park",

  // Religious
  CHURCH = "church",
  MOSQUE = "mosque",
  TEMPLE = "temple",

  // Government
  POLICE_STATION = "police_station",
  GOVERNMENT_OFFICE = "government_office",
  POST_OFFICE = "post_office",

  // Utilities
  WATER_POINT = "water_point",
  ELECTRICITY_SUBSTATION = "electricity_substation",

  // Food
  BUTCHERY = "butchery",
  BAKERY = "bakery",
  HOTEL = "hotel",

  // Security
  SECURITY_COMPANY = "security_company",

  // Sports
  GYM = "gym",
  SPORTS_GROUND = "sports_ground",
}

/**
 * Amenity source type
 */
export enum AmenitySource {
  MANUAL = "manual",
  AUTO_DISCOVERED_GOOGLE = "auto_discovered_google",
  AUTO_DISCOVERED_OSM = "auto_discovered_osm",
  BULK_IMPORT = "bulk_import",
  USER_SUBMITTED = "user_submitted",
}

/**
 * Amenity approval status
 */
export enum AmenityApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  NEEDS_REVIEW = "needs_review",
}

export type TimeSlot = {
  open: string;
  close: string;
  closed?: boolean;
};

export type OperatingHours = {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
};

/**
 * Amenity interface
 */
export type Amenity = {
  _id: string;
  name: string;
  type: AmenityType;
  category: AmenityCategory;
  description?: string;

  // Source and discovery tracking
  source: AmenitySource;
  isAutoDiscovered: boolean; // Simple flag to distinguish auto vs manual
  approvalStatus: AmenityApprovalStatus;
  discoveredAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // Enhanced verification tracking
  verificationLevel: "unverified" | "basic" | "full" | "community_verified";
  verificationNotes?: string;
  lastVerificationDate?: string;
  verificationHistory?: Array<{
    verifiedBy: string;
    verifiedAt: string;
    verificationLevel: "basic" | "full" | "community_verified";
    notes?: string;
  }>;

  // Location details
  location: {
    country: string;
    county: string;
    constituency?: string;
    ward?: string;
    estate?: string;
    address: {
      line1: string;
      line2?: string;
      town: string;
      postalCode?: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };

  // Additional details
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  // Operating hours
  operatingHours?: OperatingHours;

  // Ratings and reviews
  rating?: number;
  reviewCount?: number;

  // Verification status
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;

  // Additional metadata
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Amenity with distance information
 */
export interface AmenityWithDistance extends Amenity {
  distance: number; // in kilometers
  walkingTime?: number; // estimated walking time in minutes
  drivingTime?: number; // estimated driving time in minutes
}

/**
 * Grouped amenities response
 */
export type GroupedAmenities = {
  category: AmenityCategory;
  amenities: AmenityWithDistance[];
  count: number;
};

/**
 * Nearby amenities search parameters
 */
export type NearbyAmenitiesQuery = {
  latitude: number;
  longitude: number;
  radius?: number; // in kilometers, default 5km
  categories?: AmenityCategory[];
  types?: AmenityType[];
  limit?: number;
  verified?: boolean;
};

/**
 * Create amenity request
 */
export type CreateAmenityRequest = {
  name: string;
  type: AmenityType;
  category: AmenityCategory;
  description?: string;
  location: {
    country: string;
    county: string;
    constituency?: string;
    ward?: string;
    estate?: string;
    address: {
      line1: string;
      line2?: string;
      town: string;
      postalCode?: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  geolocation: GeoLocation;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  operatingHours?: {
    monday?: TimeSlot[];
    tuesday?: TimeSlot[];
    wednesday?: TimeSlot[];
    thursday?: TimeSlot[];
    friday?: TimeSlot[];
    saturday?: TimeSlot[];
    sunday?: TimeSlot[];
  };
  tags?: string[];
};

/**
 * Amenity approval request
 */
export type AmenityApprovalRequest = {
  amenityId: string;
  action: "approve" | "reject";
  notes?: string;
  reason?: string;
};

/**
 * Bulk approval request
 */
export type BulkApprovalRequest = {
  amenityIds: string[];
  action: "approve" | "reject";
  reason?: string;
};

/**
 * Discovery request
 */
export type DiscoveryRequest = {
  latitude: number;
  longitude: number;
  radius?: number;
  sources?: ("google" | "osm")[];
  autoSave?: boolean;
};

/**
 * Amenity metadata
 */
export type AmenityMetadata = {
  categories: AmenityCategory[];
  types: AmenityType[];
  categoryTypeMapping: Record<AmenityCategory, AmenityType[]>;
};
