import type mongoose from "mongoose";

import type { Document } from "mongoose";
import type { BaseDocument } from "./base.type";

export interface ISavedSearch extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  searchParams: Record<string, unknown>;
  emailAlerts: boolean;
  alertFrequency: "daily" | "weekly" | "instant";
  createdAt: Date;
  updatedAt: Date;
}

export interface IFavorite extends BaseDocument {
  user: mongoose.Schema.Types.ObjectId;
  property: mongoose.Schema.Types.ObjectId;
}
