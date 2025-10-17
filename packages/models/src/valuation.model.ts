import mongoose, { Schema } from "mongoose";
import {
  type IPropertyValuation,
  ValuationMethod,
  ValuationStatus,
} from "./types/valuation.type";

const PropertyValuationSchema = new Schema<IPropertyValuation>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Valuation details
    estimatedValue: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "KES",
    },
    valuationDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      enum: Object.values(ValuationMethod),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ValuationStatus),
      default: ValuationStatus.PENDING,
    },

    // Market analysis
    marketAnalysis: {
      averageRentPerSqft: { type: Number, required: true },
      averagePropertyValue: { type: Number, required: true },
      marketTrend: {
        type: String,
        enum: ["increasing", "decreasing", "stable"],
        required: true,
      },
      demandLevel: {
        type: String,
        enum: ["high", "medium", "low"],
        required: true,
      },
      supplyLevel: {
        type: String,
        enum: ["high", "medium", "low"],
        required: true,
      },
      priceGrowthRate: { type: Number, required: true },
      comparableProperties: [
        {
          propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
          address: String,
          size: Number,
          rentAmount: Number,
          salePrice: Number,
          distance: Number,
          similarity: Number,
        },
      ],
    },

    // Income approach data
    incomeAnalysis: {
      monthlyRent: Number,
      annualRent: Number,
      occupancyRate: Number,
      operatingExpenses: Number,
      netOperatingIncome: Number,
      capitalizationRate: Number,
      grossRentMultiplier: Number,
    },

    // Cost approach data
    costAnalysis: {
      landValue: Number,
      constructionCost: Number,
      depreciation: Number,
      replacementCost: Number,
      reproductionCost: Number,
    },

    // AI insights
    aiInsights: {
      confidenceScore: { type: Number, min: 0, max: 100 },
      riskFactors: [String],
      investmentScore: { type: Number, min: 0, max: 100 },
      liquidityScore: { type: Number, min: 0, max: 100 },
      appreciationPotential: {
        type: String,
        enum: ["high", "medium", "low"],
      },
      recommendedActions: [String],
      marketPosition: {
        type: String,
        enum: ["undervalued", "fairly_valued", "overvalued"],
      },
    },

    // External data sources
    dataSources: [
      {
        source: String,
        dataType: String,
        lastUpdated: Date,
        reliability: { type: Number, min: 0, max: 100 },
      },
    ],

    // Professional appraisal
    professionalAppraisal: {
      appraiserName: String,
      appraiserLicense: String,
      appraisalFirm: String,
      reportUrl: String,
      certificationDate: Date,
    },

    // Historical data
    priceHistory: [
      {
        date: Date,
        value: Number,
        source: String,
        event: String,
      },
    ],

    // Metadata
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PropertyValuationSchema.index({ property: 1, valuationDate: -1 });
PropertyValuationSchema.index({ landlord: 1, status: 1 });
PropertyValuationSchema.index({ status: 1, expiryDate: 1 });
PropertyValuationSchema.index({ method: 1, status: 1 });

export const PropertyValuation = mongoose.model<IPropertyValuation>(
  "PropertyValuation",
  PropertyValuationSchema
);
