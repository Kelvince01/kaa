import mongoose, { type Document, Schema } from "mongoose";
import type { BaseDocument } from "./types/base.type";

export interface IMarketData extends BaseDocument {
  memberId?: mongoose.Types.ObjectId; // null for global market data

  // Location details
  location: {
    county: string;
    constituency: string;
    ward?: string;
    estate?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // Property type analysis
  propertyType: "apartment" | "house" | "commercial" | "land" | "office";

  // Market metrics
  metrics: {
    averageRent: number;
    medianRent: number;
    rentRange: {
      min: number;
      max: number;
    };
    occupancyRate: number;
    averageDaysOnMarket: number;
    pricePerSqm: number;
    yieldRate: number;
    appreciationRate: number;
  };

  // Market trends
  trends: {
    rentTrend: "increasing" | "decreasing" | "stable";
    demandTrend: "high" | "medium" | "low";
    supplyTrend: "oversupply" | "balanced" | "undersupply";
    seasonalFactors: Array<{
      month: number;
      factor: number;
      description: string;
    }>;
  };

  // Comparable properties
  comparables: Array<{
    propertyId?: mongoose.Types.ObjectId;
    rentAmount: number;
    size: number;
    bedrooms: number;
    amenities: string[];
    distance: number; // in km
    similarity: number; // 0-1 score
  }>;

  // Economic indicators
  economicIndicators: {
    unemploymentRate?: number;
    averageIncome?: number;
    populationGrowth?: number;
    infrastructureDevelopment: string[];
    plannedProjects: Array<{
      name: string;
      type: string;
      expectedCompletion: Date;
      impact: "positive" | "negative" | "neutral";
    }>;
  };

  // AI predictions
  predictions: {
    nextMonthRent: number;
    next6MonthsRent: number;
    nextYearRent: number;
    confidence: number;
    factors: Array<{
      factor: string;
      impact: number;
      weight: number;
    }>;
  };

  // Data sources and quality
  dataQuality: {
    sampleSize: number;
    lastUpdated: Date;
    sources: string[];
    reliability: "high" | "medium" | "low";
  };
}

const marketDataSchema = new Schema<IMarketData>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },

    location: {
      county: { type: String, required: true },
      constituency: { type: String, required: true },
      ward: String,
      estate: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    propertyType: {
      type: String,
      enum: ["apartment", "house", "commercial", "land", "office"],
      required: true,
    },

    metrics: {
      averageRent: { type: Number, required: true },
      medianRent: { type: Number, required: true },
      rentRange: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      occupancyRate: { type: Number, required: true },
      averageDaysOnMarket: { type: Number, required: true },
      pricePerSqm: { type: Number, required: true },
      yieldRate: { type: Number, required: true },
      appreciationRate: { type: Number, required: true },
    },

    trends: {
      rentTrend: { type: String, enum: ["increasing", "decreasing", "stable"] },
      demandTrend: { type: String, enum: ["high", "medium", "low"] },
      supplyTrend: {
        type: String,
        enum: ["oversupply", "balanced", "undersupply"],
      },
      seasonalFactors: [
        {
          month: { type: Number, min: 1, max: 12 },
          factor: Number,
          description: String,
        },
      ],
    },

    comparables: [
      {
        propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
        rentAmount: { type: Number, required: true },
        size: { type: Number, required: true },
        bedrooms: { type: Number, required: true },
        amenities: [String],
        distance: { type: Number, required: true },
        similarity: { type: Number, min: 0, max: 1 },
      },
    ],

    economicIndicators: {
      unemploymentRate: Number,
      averageIncome: Number,
      populationGrowth: Number,
      infrastructureDevelopment: [String],
      plannedProjects: [
        {
          name: { type: String, required: true },
          type: { type: String, required: true },
          expectedCompletion: Date,
          impact: { type: String, enum: ["positive", "negative", "neutral"] },
        },
      ],
    },

    predictions: {
      nextMonthRent: { type: Number, required: true },
      next6MonthsRent: { type: Number, required: true },
      nextYearRent: { type: Number, required: true },
      confidence: { type: Number, min: 0, max: 1 },
      factors: [
        {
          factor: String,
          impact: Number,
          weight: Number,
        },
      ],
    },

    dataQuality: {
      sampleSize: { type: Number, required: true },
      lastUpdated: { type: Date, required: true },
      sources: [String],
      reliability: { type: String, enum: ["high", "medium", "low"] },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
marketDataSchema.index({
  "location.county": 1,
  "location.constituency": 1,
  propertyType: 1,
});
marketDataSchema.index({ "location.coordinates": "2dsphere" });
marketDataSchema.index({ "dataQuality.lastUpdated": -1 });

export const MarketData = mongoose.model<IMarketData>(
  "MarketData",
  marketDataSchema
);

// Investment opportunity model
export interface IInvestmentOpportunity extends Document {
  memberId?: mongoose.Types.ObjectId;

  location: {
    county: string;
    constituency: string;
    ward: string;
    estate: string;
  };

  opportunity: {
    type: "buy" | "develop" | "renovate" | "hold" | "sell";
    propertyType: string;
    description: string;
    investmentRequired: number;
    expectedReturn: number;
    timeframe: number; // in months
    riskLevel: "low" | "medium" | "high";
  };

  analysis: {
    marketScore: number;
    locationScore: number;
    financialScore: number;
    riskScore: number;
    overallScore: number;

    pros: string[];
    cons: string[];
    keyFactors: string[];
  };

  financialProjection: {
    initialInvestment: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netMonthlyIncome: number;
    breakEvenMonths: number;
    roi5Years: number;
    roi10Years: number;
  };

  aiConfidence: number;
  lastUpdated: Date;
  createdAt: Date;
}

const investmentOpportunitySchema = new Schema<IInvestmentOpportunity>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },

    location: {
      county: { type: String, required: true },
      constituency: { type: String, required: true },
      ward: { type: String, required: true },
      estate: { type: String, required: true },
    },

    opportunity: {
      type: {
        type: String,
        enum: ["buy", "develop", "renovate", "hold", "sell"],
        required: true,
      },
      propertyType: { type: String, required: true },
      description: { type: String, required: true },
      investmentRequired: { type: Number, required: true },
      expectedReturn: { type: Number, required: true },
      timeframe: { type: Number, required: true },
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high"],
        required: true,
      },
    },

    analysis: {
      marketScore: { type: Number, required: true },
      locationScore: { type: Number, required: true },
      financialScore: { type: Number, required: true },
      riskScore: { type: Number, required: true },
      overallScore: { type: Number, required: true },

      pros: [String],
      cons: [String],
      keyFactors: [String],
    },

    financialProjection: {
      initialInvestment: { type: Number, required: true },
      monthlyIncome: { type: Number, required: true },
      monthlyExpenses: { type: Number, required: true },
      netMonthlyIncome: { type: Number, required: true },
      breakEvenMonths: { type: Number, required: true },
      roi5Years: { type: Number, required: true },
      roi10Years: { type: Number, required: true },
    },

    aiConfidence: { type: Number, required: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

investmentOpportunitySchema.index({ "analysis.overallScore": -1 });
investmentOpportunitySchema.index({
  "location.county": 1,
  "location.constituency": 1,
});
investmentOpportunitySchema.index({ lastUpdated: -1 });

export const InvestmentOpportunity = mongoose.model<IInvestmentOpportunity>(
  "InvestmentOpportunity",
  investmentOpportunitySchema
);
