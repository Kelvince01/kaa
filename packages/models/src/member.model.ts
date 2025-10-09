import mongoose, { Schema } from "mongoose";
import type { IMember } from "./types/member.type";

const memberSchema = new Schema<IMember>(
  {
    type: {
      type: String,
      enum: ["admin", "agent", "caretaker", "viewer"],
      default: "viewer",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    domain: {
      type: String,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      maxUsers: { type: Number, default: 5 },
      features: [{ type: String }],
      customBranding: { type: Boolean, default: false },
      allowInvites: { type: Boolean, default: true },
      requireEmailVerification: { type: Boolean, default: true },
      twoFactorRequired: { type: Boolean, default: false },
    },
    usage: {
      users: { type: Number, default: 0 },
      apiCalls: { type: Number, default: 0 },
      storage: { type: Number, default: 0 },
      bandwidth: { type: Number, default: 0 },
    },
    limits: {
      users: { type: Number, default: 5 },
      apiCalls: { type: Number, default: 1000 },
      storage: { type: Number, default: 1_073_741_824 }, // 1GB
      bandwidth: { type: Number, default: 10_737_418_240 }, // 10GB
    },

    // Permissions Override (for fine-grained control)
    customPermissions: [{ type: String }], // e.g., ['approve_tenants']
  },
  {
    timestamps: true,
  }
);

export const Member = mongoose.model<IMember>("Member", memberSchema);
