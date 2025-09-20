import mongoose, { Schema } from "mongoose";
import type {
  IAIAgent,
  IAIModel,
  IPrediction,
  IRecommendation,
} from "./types/ai.type";

const aiModelSchema = new Schema<IAIModel>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "classification",
        "regression",
        "clustering",
        "recommendation",
        "nlp",
        "custom",
      ],
      required: true,
    },
    description: String,
    version: { type: String, required: true },
    status: {
      type: String,
      enum: ["training", "ready", "error", "deprecated"],
      default: "training",
    },
    configuration: {
      algorithm: { type: String, required: true },
      parameters: { type: Schema.Types.Mixed, default: {} },
      features: [String],
      target: String,
      textFeatures: [String],
      useEmbeddings: { type: Boolean, default: false },
      incrementalLearning: { type: Boolean, default: false },
    },
    lifecycle: {
      stage: {
        type: String,
        enum: ["development", "staging", "production"],
        default: "development",
      },
      currentVersion: { type: String, default: "1.0.0" },
      lastUpdated: { type: Date, default: Date.now },
    },
    performance: {
      accuracy: Number,
      precision: Number,
      recall: Number,
      f1Score: Number,
      mse: Number,
      rmse: Number,
      mae: Number,
      r2Score: Number,
      customMetrics: { type: Schema.Types.Mixed },
    },
    trainingData: {
      source: { type: String, required: true },
      recordCount: { type: Number, required: true },
      lastTrained: { type: Date, required: true },
      epochs: { type: Number, default: 0 },
      seed: { type: Number },
      datasetHash: { type: String },
    },
    versions: [
      new Schema(
        {
          version: { type: String, required: true },
          stage: {
            type: String,
            enum: ["development", "staging", "production"],
            default: "development",
          },
          performance: { type: Schema.Types.Mixed },
          savedAt: { type: Date, default: Date.now },
          storagePath: { type: String },
        },
        { _id: false }
      ),
    ],
    usage: {
      totalPredictions: { type: Number, default: 0 },
      lastUsed: Date,
    },
    feedback: [
      new Schema(
        {
          actualValue: { type: Schema.Types.Mixed },
          isCorrect: Boolean,
          providedBy: { type: Schema.Types.ObjectId, ref: "User" },
          providedAt: Date,
        },
        { _id: false }
      ),
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes and constraints
// Ensure uniqueness per tenant (member) + slug instead of a global slug uniqueness
aiModelSchema.index({ memberId: 1, slug: 1 }, { unique: true });
aiModelSchema.index({ memberId: 1, status: 1 });
aiModelSchema.index({ createdAt: -1 });

export const AIModel = mongoose.model<IAIModel>("AIModel", aiModelSchema);

const predictionSchema = new Schema<IPrediction>(
  {
    modelId: { type: Schema.Types.ObjectId, ref: "AIModel", required: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    input: { type: Schema.Types.Mixed, required: true },
    output: {
      prediction: { type: Schema.Types.Mixed, required: true },
      confidence: Number,
      probabilities: { type: Schema.Types.Mixed },
    },
    modelVersion: { type: String },
    feedback: {
      actualValue: { type: Schema.Types.Mixed },
      isCorrect: Boolean,
      providedBy: { type: Schema.Types.ObjectId, ref: "User" },
      providedAt: Date,
    },
    processingTime: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics
predictionSchema.index({ modelId: 1, createdAt: -1 });
predictionSchema.index({ memberId: 1, createdAt: -1 });

export const Prediction = mongoose.model<IPrediction>(
  "Prediction",
  predictionSchema
);

const recommendationSchema = new Schema<IRecommendation>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["feature", "content", "action", "product", "custom"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    score: { type: Number, required: true, min: 0, max: 1 },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "shown", "accepted", "dismissed"],
      default: "pending",
    },
    expiresAt: Date,
    shownAt: Date,
    respondedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
recommendationSchema.index({ userId: 1, status: 1, score: -1 });
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Recommendation = mongoose.model<IRecommendation>(
  "Recommendation",
  recommendationSchema
);

const aiAgentSchema = new Schema<IAIAgent>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes (non-TTL by default; adjust if lifecycle requires auto-expiry)
aiAgentSchema.index({ name: 1 }, { unique: true });
aiAgentSchema.index({ type: 1 });
aiAgentSchema.index({ createdAt: -1 });

export const AIAgent = mongoose.model<IAIAgent>("AIAgent", aiAgentSchema);
