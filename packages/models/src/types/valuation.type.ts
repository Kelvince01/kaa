import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum ValuationMethod {
  COMPARATIVE_MARKET_ANALYSIS = "comparative_market_analysis",
  INCOME_APPROACH = "income_approach",
  COST_APPROACH = "cost_approach",
  AI_AUTOMATED = "ai_automated",
  PROFESSIONAL_APPRAISAL = "professional_appraisal",
}

export enum ValuationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  EXPIRED = "expired",
  DISPUTED = "disputed",
}

export interface IPropertyValuation extends BaseDocument {
  property: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;

  // Valuation details
  estimatedValue: number;
  currency: string;
  valuationDate: Date;
  expiryDate: Date;
  method: ValuationMethod;
  status: ValuationStatus;

  // Market analysis
  marketAnalysis: {
    averageRentPerSqft: number;
    averagePropertyValue: number;
    marketTrend: "increasing" | "decreasing" | "stable";
    demandLevel: "high" | "medium" | "low";
    supplyLevel: "high" | "medium" | "low";
    priceGrowthRate: number; // percentage
    comparableProperties: Array<{
      propertyId: mongoose.Types.ObjectId;
      address: string;
      size: number;
      rentAmount: number;
      salePrice?: number;
      distance: number; // in km
      similarity: number; // percentage
    }>;
  };

  // Income approach data
  incomeAnalysis?: {
    monthlyRent: number;
    annualRent: number;
    occupancyRate: number;
    operatingExpenses: number;
    netOperatingIncome: number;
    capitalizationRate: number;
    grossRentMultiplier: number;
  };

  // Cost approach data
  costAnalysis?: {
    landValue: number;
    constructionCost: number;
    depreciation: number;
    replacementCost: number;
    reproductionCost: number;
  };

  // AI insights
  aiInsights: {
    confidenceScore: number; // 0-100
    riskFactors: string[];
    investmentScore: number; // 0-100
    liquidityScore: number; // 0-100
    appreciationPotential: "high" | "medium" | "low";
    recommendedActions: string[];
    marketPosition: "undervalued" | "fairly_valued" | "overvalued";
  };

  // External data sources
  dataSources: Array<{
    source: string;
    dataType: string;
    lastUpdated: Date;
    reliability: number; // 0-100
  }>;

  // Professional appraisal (if applicable)
  professionalAppraisal?: {
    appraiserName: string;
    appraiserLicense: string;
    appraisalFirm: string;
    reportUrl: string;
    certificationDate: Date;
  };

  // Historical data
  priceHistory: Array<{
    date: Date;
    value: number;
    source: string;
    event?: string; // renovation, market_change, etc.
  }>;

  // Metadata
  requestedBy: mongoose.Types.ObjectId;
  notes?: string;
  metadata?: Record<string, any>;
}
