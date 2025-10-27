import type mongoose from "mongoose";
import type { Document } from "mongoose";
import type { BaseDocument } from "./base.type";

export interface IAIModel extends BaseDocument {
  memberId?: mongoose.Types.ObjectId; // null for global models
  name: string;
  slug: string;
  type:
    | "classification"
    | "regression"
    | "clustering"
    | "recommendation"
    | "nlp"
    | "custom";
  description?: string;
  version: string;
  status: "training" | "ready" | "error" | "deprecated";
  configuration: {
    algorithm: string;
    parameters: Record<string, any>;
    features: string[];
    target?: string;
    textFeatures?: string[];
    useEmbeddings?: boolean;
    incrementalLearning?: boolean;
  };
  lifecycle: {
    stage?: "development" | "staging" | "production";
    currentVersion?: string;
    lastUpdated?: Date;
  };
  performance: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    rmse?: number;
    mae?: number;
    r2Score?: number;
    customMetrics?: Record<string, number>;
  };
  trainingData: {
    source: string;
    recordCount: number;
    lastTrained: Date;
    epochs?: number;
    seed?: number;
    datasetHash?: string;
  };
  versions: {
    version: string;
    stage?: "staging" | "production" | "development";
    performance?: Record<string, any>;
    savedAt?: Date;
    storagePath?: string;
  }[];
  usage: {
    totalPredictions: number;
    lastUsed?: Date;
  };
  feedback: {
    actualValue: any;
    isCorrect: boolean;
    providedBy: mongoose.Types.ObjectId;
    providedAt: Date;
  }[];
  createdBy: mongoose.Types.ObjectId;
}

export interface IPrediction extends Document {
  modelId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  input: Record<string, any>;
  output: {
    prediction: any;
    confidence?: number;
    probabilities?: Record<string, number>;
  };
  modelVersion?: string;
  feedback?: {
    actualValue: any;
    isCorrect: boolean;
    providedBy: mongoose.Types.ObjectId;
    providedAt: Date;
  };
  processingTime: number; // in milliseconds
  createdAt: Date;
}

export interface IRecommendation extends Document {
  memberId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "feature" | "content" | "action" | "product" | "custom";
  title: string;
  description: string;
  data: Record<string, any>;
  score: number; // 0-1
  reason: string;
  status: "pending" | "shown" | "accepted" | "dismissed";
  expiresAt?: Date;
  shownAt?: Date;
  respondedAt?: Date;
  createdAt: Date;
}

export interface IAIAgent extends BaseDocument {
  name: string;
  type: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
}

export type CreateAIModelData = {
  name: string;
  description: string;
  type:
    | "regression"
    | "classification"
    | "clustering"
    | "recommendation"
    | "nlp"
    | "custom";
  configuration: {
    algorithm: string;
    parameters: Record<string, any>;
    features: string[];
    target?: string;
    textFeatures?: string[];
    useEmbeddings?: boolean;
    incrementalLearning?: boolean;
  };
  trainingDataSource: string;
};
