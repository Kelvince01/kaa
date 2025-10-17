import mongoose, { Schema } from "mongoose";
import {
  InspectionStatus,
  InspectionType,
  type IPropertyInspection,
} from "./types/property-inspection.type";

const propertyInspectionSchema = new Schema<IPropertyInspection>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    actualDate: {
      type: Date,
    },
    inspector: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: Object.values(InspectionType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(InspectionStatus),
      default: InspectionStatus.SCHEDULED,
    },
    notes: {
      type: String,
    },
    findings: {
      type: String,
    },
    recommendations: {
      type: String,
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    tenantConfirmed: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        fileName: String,
        fileType: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    conditionReportId: {
      type: Schema.Types.ObjectId,
      ref: "PropertyCondition",
    },
  },
  {
    timestamps: true,
  }
);

export const PropertyInspection = mongoose.model<IPropertyInspection>(
  "PropertyInspection",
  propertyInspectionSchema
);

export default PropertyInspection;
