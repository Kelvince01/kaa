import mongoose, { Schema } from "mongoose";
import type { BaseDocument } from "./types/base.type";

export interface IDeviceToken extends BaseDocument {
  userId: mongoose.Types.ObjectId;
  token: string;
  platform: "ios" | "android" | "web";
  deviceId: string;
  appVersion?: string;
  osVersion?: string;
  isActive: boolean;
  lastUsed: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    platform: {
      type: String,
      enum: ["ios", "android", "web"],
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    appVersion: String,
    osVersion: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user and device
deviceTokenSchema.index({ userId: 1, deviceId: 1 });

export const DeviceToken = mongoose.model<IDeviceToken>(
  "DeviceToken",
  deviceTokenSchema
);
