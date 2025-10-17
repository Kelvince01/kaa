import mongoose, { Schema } from "mongoose";
import type {
  IFeatureFlag,
  IFeatureFlagEvaluation,
} from "./types/feature-flags.type";

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    rolloutPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    conditions: {
      userIds: [String],
      memberIds: [String],
      roles: [String],
      plans: [String],
      countries: [String],
    },
    variants: [
      {
        name: {
          type: String,
          required: true,
        },
        value: {
          type: Schema.Types.Mixed,
          required: true,
        },
        percentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

featureFlagSchema.index({ isEnabled: 1 });

export const FeatureFlag = mongoose.model<IFeatureFlag>(
  "FeatureFlag",
  featureFlagSchema
);

const featureFlagEvaluationSchema = new Schema<IFeatureFlagEvaluation>(
  {
    flagKey: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    enabled: {
      type: Boolean,
      required: true,
    },
    variant: {
      type: String,
    },
    value: {
      type: Schema.Types.Mixed,
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

featureFlagEvaluationSchema.index({ flagKey: 1, userId: 1, memberId: 1 });
featureFlagEvaluationSchema.index({ evaluatedAt: 1 });

export const FeatureFlagEvaluation = mongoose.model<IFeatureFlagEvaluation>(
  "FeatureFlagEvaluation",
  featureFlagEvaluationSchema
);
