import mongoose, { type Model, model, Schema } from "mongoose";
import { type IUnit, UnitStatus, UnitType } from "./types/unit.type";

/**
 * Unit amenity schema
 */
const unitAmenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
  description: { type: String },
});

/**
 * Unit utility schema
 */
const unitUtilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  included: { type: Boolean, default: false },
  amount: { type: Number },
  paymentFrequency: { type: String },
  meterNumber: { type: String },
  provider: { type: String },
});

/**
 * Unit schema definition
 */
const unitSchema = new Schema<IUnit>(
  {
    unitNumber: {
      type: String,
      required: true,
      trim: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    floor: {
      type: Number,
    },
    size: {
      type: Number, // in square meters
    },
    bedrooms: {
      type: Number,
      required: true,
      default: 1,
    },
    bathrooms: {
      type: Number,
      required: true,
      default: 1,
    },
    rent: {
      type: Number,
      required: true,
    },
    depositAmount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: Object.values(UnitType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(UnitStatus),
      default: UnitStatus.VACANT,
    },
    amenities: [unitAmenitySchema],
    utilities: [unitUtilitySchema],
    images: [
      {
        url: String,
        key: String,
        isMain: {
          type: Boolean,
          default: false,
        },
      },
    ],
    currentTenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
    },
    leaseStartDate: {
      type: Date,
    },
    leaseEndDate: {
      type: Date,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextInspectionDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rentDueDay: {
      type: Number,
      default: 5, // 5th day of the month by default
      min: 1,
      max: 31,
    },
    waterMeterReading: {
      type: Number,
    },
    electricityMeterReading: {
      type: Number,
    },
    lastMeterReadingDate: {
      type: Date,
    },
    meterReadingFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "biannually", "annually"],
      default: "monthly",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create a compound index for property and unitNumber to ensure uniqueness
unitSchema.index({ property: 1, unitNumber: 1 }, { unique: true });

// Index for faster querying by status
unitSchema.index({ status: 1 });

// Index for faster querying by currentTenant
unitSchema.index({ currentTenant: 1 });

/**
 * Method to get main image URL
 * @returns URL of the main image or first image or null
 */
unitSchema.methods.getMainImage = function (): string | null {
  if (!this.images || this.images.length === 0) {
    return null;
  }

  const mainImage = this.images.find((img: { isMain: any }) => img.isMain);
  return mainImage ? mainImage.url : this.images[0].url;
};

/**
 * Method to calculate total rent including utilities
 * @returns Total rent amount including utilities
 */
unitSchema.methods.calculateTotalRent = function (): number {
  let totalRent = this.rent;

  // Add utility costs that are not included in the rent
  if (this.utilities && this.utilities.length > 0) {
    const utilityCharges = this.utilities
      .filter(
        (utility: { included: any; amount: any }) =>
          !utility.included && utility.amount
      )
      .reduce(
        (sum: number, utility: { amount: any }) => sum + (utility.amount || 0),
        0
      );

    totalRent += utilityCharges;
  }

  return totalRent;
};

// Virtual for upcoming rent due date
unitSchema.virtual("nextRentDueDate").get(function () {
  const today = new Date();
  let nextDueDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    this.rentDueDay
  );

  // If today is past the due date for this month, set to next month
  if (today.getDate() > this.rentDueDay) {
    nextDueDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      this.rentDueDay
    );
  }

  return nextDueDate;
});

// Virtual for days until rent is due
unitSchema.virtual("daysUntilRentDue").get(function () {
  const today = new Date();
  const nextDueDate = this.nextRentDueDate;

  // Check if nextDueDate is defined before using it
  if (!nextDueDate) {
    return 0; // Return 0 or another default value if nextDueDate is undefined
  }

  const timeDiff = nextDueDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for lease remaining days
unitSchema.virtual("leaseRemainingDays").get(function () {
  if (!this.leaseEndDate) return null;

  const today = new Date();
  const endDate = new Date(this.leaseEndDate);
  const timeDiff = endDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Create and export the Unit model
export const Unit: Model<IUnit> = model<IUnit>("Unit", unitSchema);
