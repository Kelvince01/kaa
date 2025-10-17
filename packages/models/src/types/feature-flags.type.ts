import type mongoose from "mongoose";
import type { Document } from "mongoose";
import type { BaseDocument } from "./base.type";

export interface IFeatureFlag extends BaseDocument {
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  conditions: {
    userIds?: string[];
    memberIds?: string[];
    roles?: string[];
    plans?: string[];
    countries?: string[];
  };
  variants: {
    name: string;
    value: any;
    percentage: number;
  }[];
  metadata: Record<string, any>;
}

export interface IFeatureFlagEvaluation extends Document {
  flagKey: string;
  userId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  enabled: boolean;
  variant?: string;
  value?: any;
  evaluatedAt: Date;
  createdAt: Date;
}
