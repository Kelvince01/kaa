import mongoose, { Schema } from "mongoose";
import {
  ContractorSpecialty,
  ContractorStatus,
  type IContractor,
  type IContractorRating,
} from "./types/contractor.type";

const contractorRatingSchema = new Schema<IContractorRating>(
  {
    workOrder: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
    },
    ratedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: String,
    qualityRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    timelinessRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    communicationRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    professionalismRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

const contractorSchema = new Schema<IContractor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    specialties: [
      {
        type: String,
        enum: Object.values(ContractorSpecialty),
      },
    ],
    status: {
      type: String,
      enum: Object.values(ContractorStatus),
      default: ContractorStatus.ACTIVE,
    },
    licenseNumber: String,
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
      coverageAmount: Number,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    availability: {
      monday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        available: { type: Boolean, default: true },
      },
      tuesday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        available: { type: Boolean, default: true },
      },
      wednesday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        available: { type: Boolean, default: true },
      },
      thursday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        available: { type: Boolean, default: true },
      },
      friday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        available: { type: Boolean, default: true },
      },
      saturday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        available: { type: Boolean, default: false },
      },
      sunday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        available: { type: Boolean, default: false },
      },
    },
    serviceAreas: [String],
    ratings: [contractorRatingSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    onTimePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    emergencyAvailable: {
      type: Boolean,
      default: false,
    },
    notes: String,
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastActiveDate: Date,
  },
  { timestamps: true }
);

// Indexes for efficient querying
contractorSchema.index({ email: 1 }, { unique: true });
contractorSchema.index({ status: 1 });
contractorSchema.index({ specialties: 1 });
contractorSchema.index({ serviceAreas: 1 });
contractorSchema.index({ averageRating: -1 });
contractorSchema.index({ addedBy: 1 });

// Virtual for completion rate
contractorSchema.virtual("completionRate").get(function () {
  if (this.totalJobs === 0) return 0;
  return (this.completedJobs / this.totalJobs) * 100;
});

// Method to calculate average rating
contractorSchema.methods.calculateAverageRating = function () {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    return 0;
  }

  const sum = this.ratings.reduce(
    (acc: number, rating: IContractorRating) => acc + rating.rating,
    0
  );
  this.averageRating = sum / this.ratings.length;
  return this.averageRating;
};

// Method to check availability for a specific date and time
contractorSchema.methods.isAvailable = function (
  date: Date,
  startTime: string,
  endTime: string
) {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayOfWeek = dayNames[date.getDay()] as keyof typeof this.availability;
  const dayAvailability = this.availability[dayOfWeek];

  if (!dayAvailability.available) return false;

  // Simple time comparison (assumes HH:MM format)
  return startTime >= dayAvailability.start && endTime <= dayAvailability.end;
};

// Static method to find available contractors
contractorSchema.statics.findAvailable = function (
  specialty: ContractorSpecialty,
  serviceArea: string,
  date: Date,
  startTime: string,
  endTime: string
) {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayOfWeek = dayNames[date.getDay()];

  return this.find({
    status: ContractorStatus.ACTIVE,
    specialties: specialty,
    serviceAreas: serviceArea,
    [`availability.${dayOfWeek}.available`]: true,
    [`availability.${dayOfWeek}.start`]: { $lte: startTime },
    [`availability.${dayOfWeek}.end`]: { $gte: endTime },
  }).sort({ averageRating: -1, completedJobs: -1 });
};

// Static method to find emergency contractors
contractorSchema.statics.findEmergencyContractors = function (
  specialty: ContractorSpecialty,
  serviceArea: string
) {
  return this.find({
    status: ContractorStatus.ACTIVE,
    specialties: specialty,
    serviceAreas: serviceArea,
    emergencyAvailable: true,
  }).sort({ averageRating: -1 });
};

// Pre-save middleware to update last active date
contractorSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastActiveDate = new Date();
  }
  next();
});

// TODO: Uncomment this when Elasticsearch is implemented
// Post-save middleware to sync with Elasticsearch
// contractorSchema.post("save", async function (doc) {
// 	try {
// 		const { searchSyncService } = await import("~/features/properties/search/search-sync.service");
// 		await searchSyncService.syncContractor(doc, this.isNew ? "create" : "update");
// 	} catch (error) {
// 		// Log error but don't fail the save operation
// 		console.error("Failed to sync contractor to search index:", error);
// 	}
// });

// // Post-remove middleware to sync with Elasticsearch
// contractorSchema.post("findOneAndDelete", async (doc) => {
// 	if (doc) {
// 		try {
// 			const { searchSyncService } = await import(
// 				"~/features/properties/search/search-sync.service"
// 			);
// 			await searchSyncService.syncContractor(doc, "delete");
// 		} catch (error) {
// 			console.error("Failed to remove contractor from search index:", error);
// 		}
// 	}
// });

export const Contractor = mongoose.model<IContractor>(
  "Contractor",
  contractorSchema
);
