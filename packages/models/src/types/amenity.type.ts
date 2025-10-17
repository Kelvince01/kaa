import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";
import type { IGeoLocation } from "./common.type";
import type { IBusinessHours } from "./location.type";

/**
 * Amenity categories specific to Kenya
 */
export enum AmenityCategory {
  EDUCATION = "education",
  HEALTHCARE = "healthcare",
  SHOPPING = "shopping",
  TRANSPORT = "transport",
  BANKING = "banking", // FINANCIAL = "financial",
  ENTERTAINMENT = "entertainment",
  RELIGIOUS = "religious",
  GOVERNMENT = "government",
  UTILITIES = "utilities",
  FOOD = "food", // DINING = "dining",
  SECURITY = "security",
  SPORTS = "sports", // RECREATIONAL = "recreational",
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

/**
 * Amenity interface
 */
export interface IAmenity extends BaseDocument {
  name: string;
  type: AmenityType;
  category: AmenityCategory;
  description?: string;

  // Source and discovery tracking
  source: AmenitySource;
  isAutoDiscovered: boolean; // Simple flag to distinguish auto vs manual
  approvalStatus: AmenityApprovalStatus;
  discoveredAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Enhanced verification tracking
  verificationLevel: "unverified" | "basic" | "full" | "community_verified";
  verificationNotes?: string;
  lastVerificationDate?: Date;
  verificationHistory?: Array<{
    verifiedBy: mongoose.Types.ObjectId;
    verifiedAt: Date;
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
  geolocation: IGeoLocation;
  distance?: number; // in meters

  // Additional details
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  // Operating hours
  operatingHours?: IBusinessHours;

  // Ratings and reviews
  rating?: number;
  reviewCount?: number;

  // Verification status
  verified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;

  // Additional metadata
  tags?: string[];
  isActive: boolean;

  findNearby(
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<IAmenity[]>;
  findNearbyGrouped(
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<GroupedAmenities[]>;
}

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
 * Amenity with distance information
 */
export interface AmenityWithDistance extends IAmenity {
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
