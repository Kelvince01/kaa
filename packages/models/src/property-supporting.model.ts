import mongoose, { Schema } from "mongoose";

import type { IFavorite, ISavedSearch } from "./types/property-supporting.type";

const savedSearchSchema: Schema = new Schema<ISavedSearch>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    searchParams: {
      type: Schema.Types.Mixed,
      required: true,
    },
    emailAlerts: {
      type: Boolean,
      default: false,
    },
    alertFrequency: {
      type: String,
      enum: ["daily", "weekly", "instant"],
      default: "daily",
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick retrieval of searches by user
savedSearchSchema.index({ user: 1, createdAt: -1 });

export const SavedSearch = mongoose.model<ISavedSearch>(
  "SavedSearch",
  savedSearchSchema
);

const favoriteSchema = new Schema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to prevent duplicate favourites
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>("Favorite", favoriteSchema);
