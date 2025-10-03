import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

/**
 * Unit status enum
 */
export enum UnitStatus {
  VACANT = "vacant",
  OCCUPIED = "occupied",
  MAINTENANCE = "maintenance",
  RESERVED = "reserved",
  UNAVAILABLE = "unavailable",
}

/**
 * Unit type enum
 */
export enum UnitType {
  BEDSITTER = "bedsitter",
  SINGLE_ROOM = "single_room",
  DOUBLE_ROOM = "double_room",
  STUDIO = "studio",
  ONE_BEDROOM = "one_bedroom",
  TWO_BEDROOM = "two_bedroom",
  THREE_BEDROOM = "three_bedroom",
  PENTHOUSE = "penthouse",
  SHOP = "shop",
  OFFICE = "office",
  WAREHOUSE = "warehouse",
  OTHER = "other",
}

/**
 * Unit amenity interface
 */
export type IUnitAmenity = {
  name: string;
  icon?: string;
  description?: string;
};

/**
 * Unit utility interface
 */
export type IUnitUtility = {
  name: string; // e.g., water, electricity, internet, garbage
  included: boolean; // whether it's included in the rent
  amount?: number; // additional cost if not included
  paymentFrequency?: string; // monthly, quarterly, etc.
  meterNumber?: string; // for utilities with meters
  provider?: string; // utility provider name
};

/**
 * Unit document interface
 */
export type IUnit = BaseDocument & {
  unitNumber: string;
  property: mongoose.Types.ObjectId;
  floor?: number;
  size?: number; // in square meters
  bedrooms: number;
  bathrooms: number;
  rent: number;
  depositAmount: number;
  description?: string;
  type: UnitType;
  status: UnitStatus;
  amenities?: IUnitAmenity[];
  utilities?: IUnitUtility[];
  images?: Array<{
    url: string;
    key: string;
    isMain?: boolean;
  }>;
  currentTenant?: mongoose.Types.ObjectId;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  lastMaintenanceDate?: Date;
  nextInspectionDate?: Date;
  notes?: string;
  isActive: boolean;
  rentDueDay: number; // day of month when rent is due
  waterMeterReading?: number;
  electricityMeterReading?: number;
  lastMeterReadingDate?: Date;
  meterReadingFrequency?: string; // monthly, quarterly, etc.
  // Virtual properties
  nextRentDueDate?: Date; // Virtual property for upcoming rent due date
  daysUntilRentDue?: number; // Virtual property for days until rent is due
  // Methods
  getMainImage?: () => string | null;
  calculateTotalRent?: () => number; // including utilities
};

/**
 * Unit billing interface
 */
export type IUnitBilling = {
  unit: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  month: number;
  year: number;
  rentAmount: number;
  utilityCharges: {
    water?: number;
    electricity?: number;
    garbage?: number;
    internet?: number;
    other?: number;
  };
  totalAmount: number;
  isPaid: boolean;
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  receiptNumber?: string;
  lateFee?: number;
  balance?: number;
  notes?: string;
};
