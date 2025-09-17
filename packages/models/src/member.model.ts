import mongoose, { Schema } from "mongoose";
import type { IMember } from "./types/member.type";

const memberSchema = new Schema<IMember>(
  {
    type: {
      type: String,
      // required: true,
      // trim: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
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
      type: String,
      enum: ["free", "starter", "professional", "enterprise"],
      default: "free",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
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
  },
  {
    timestamps: true,
  }
);

export const Member = mongoose.model<IMember>("Member", memberSchema);
