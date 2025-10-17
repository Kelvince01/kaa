/**
 * Property condition report model
 */

import mongoose, { type Model, Schema } from "mongoose";
import {
  ConditionStatus,
  type IConditionItem,
  type IPropertyCondition,
} from "./types/property-condition.type";

const ConditionItemSchema = new Schema<IConditionItem>({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(ConditionStatus),
    required: true,
  },
  description: {
    type: String,
  },
  photos: [
    {
      url: String,
      fileName: String,
      fileType: String,
      size: Number,
    },
  ],
  notes: {
    type: String,
  },
});

const PropertyConditionSchema = new Schema<IPropertyCondition>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportType: {
      type: String,
      enum: ["check_in", "check_out", "inspection", "inventory"],
      required: true,
    },
    reportDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    items: [ConditionItemSchema],
    overallCondition: {
      type: String,
      enum: Object.values(ConditionStatus),
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    signedByTenant: {
      type: Boolean,
      default: false,
    },
    signedByLandlord: {
      type: Boolean,
      default: false,
    },
    tenantSignatureDate: {
      type: Date,
    },
    landlordSignatureDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachments: [
      {
        url: String,
        fileName: String,
        fileType: String,
        size: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const PropertyCondition = mongoose.model<
  IPropertyCondition,
  Model<IPropertyCondition>
>("PropertyCondition", PropertyConditionSchema);
