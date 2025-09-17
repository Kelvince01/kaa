import mongoose, { Schema } from "mongoose";
import type { IOrganization } from "./types/org.type";

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    type: {
      type: String,
      enum: ["landlord", "property_manager", "agency", "other"],
      required: true,
    },
    registrationNumber: { type: String },
    kraPin: { type: String },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String },
    logo: { type: String },
    address: {
      country: { type: String, required: true, default: "Kenya" },
      county: { type: String },
      town: { type: String },
      street: { type: String },
      postalCode: { type: String },
    },
    settings: {
      language: { type: String, default: "en" },
      currency: { type: String, default: "KES" },
      branding: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema
);
