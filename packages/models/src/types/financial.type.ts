import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export interface IFinancialReport extends BaseDocument {
  reportType: "profit_loss" | "tax_summary" | "cash_flow" | "balance_sheet";
  period: {
    startDate: Date;
    endDate: Date;
    type: "monthly" | "quarterly" | "yearly" | "custom";
  };
  landlord: mongoose.Types.ObjectId;
  property?: mongoose.Types.ObjectId;
  data: {
    income: IIncomeData;
    expenses: IExpenseData;
    summary: IFinancialSummary;
  };
  generatedAt: Date;
  status: "draft" | "final" | "archived";
}

export type IIncomeData = {
  rental: {
    amount: number;
    count: number;
    properties: Array<{
      propertyId: string;
      propertyName: string;
      amount: number;
      payments: number;
    }>;
  };
  deposits: {
    amount: number;
    count: number;
  };
  fees: {
    amount: number;
    count: number;
    breakdown: {
      application: number;
      late: number;
      service: number;
      other: number;
    };
  };
  other: {
    amount: number;
    count: number;
    description: string[];
  };
  total: number;
};

export type IExpenseData = {
  maintenance: {
    amount: number;
    count: number;
    breakdown: Array<{
      category: string;
      amount: number;
      count: number;
    }>;
  };
  utilities: {
    amount: number;
    count: number;
    breakdown: {
      electricity: number;
      water: number;
      gas: number;
      internet: number;
      other: number;
    };
  };
  insurance: {
    amount: number;
    count: number;
  };
  taxes: {
    amount: number;
    breakdown: {
      property: number;
      income: number;
      vat: number;
    };
  };
  management: {
    amount: number;
    platformFees: number;
    professionalServices: number;
  };
  marketing: {
    amount: number;
    count: number;
  };
  depreciation: {
    amount: number;
    assets: Array<{
      assetId: string;
      assetName: string;
      depreciationAmount: number;
    }>;
  };
  other: {
    amount: number;
    count: number;
    description: string[];
  };
  total: number;
};

export type IFinancialSummary = {
  grossIncome: number;
  totalExpenses: number;
  netIncome: number;
  profitMargin: number;
  taxableIncome: number;
  estimatedTax: number;
  cashFlow: number;
  roi: number; // Return on Investment
};

export interface ITaxReport extends BaseDocument {
  taxYear: number;
  landlord: mongoose.Types.ObjectId;
  properties: mongoose.Types.ObjectId[];
  income: {
    rental: number;
    deposits: number;
    fees: number;
    other: number;
    total: number;
  };
  deductions: {
    mortgage: number;
    maintenance: number;
    utilities: number;
    insurance: number;
    depreciation: number;
    professionalFees: number;
    advertising: number;
    travel: number;
    other: number;
    total: number;
  };
  taxableIncome: number;
  estimatedTax: number;
  quarterlyPayments: Array<{
    quarter: 1 | 2 | 3 | 4;
    dueDate: Date;
    amount: number;
    paid: boolean;
    paidDate?: Date;
  }>;
  status: "draft" | "submitted" | "approved";
  submittedAt?: Date;
}

export interface IExpenseCategory extends BaseDocument {
  name: string;
  description: string;
  taxDeductible: boolean;
  depreciationRate?: number;
  landlord: mongoose.Types.ObjectId;
  isDefault: boolean;
}

export interface IExpense extends BaseDocument {
  amount: number;
  currency: string;
  category: string;
  subcategory?: string;
  description: string;
  date: Date;
  property?: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  receipt?: {
    url: string;
    filename: string;
    uploadedAt: Date;
  };
  taxDeductible: boolean;
  recurring: {
    isRecurring: boolean;
    frequency?: "monthly" | "quarterly" | "yearly";
    nextDue?: Date;
    endDate?: Date;
  };
  vendor?: {
    name: string;
    contact: string;
    vatNumber?: string;
  };
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
}

export interface IAsset extends BaseDocument {
  name: string;
  description: string;
  category: "property" | "equipment" | "furniture" | "vehicle" | "other";
  purchasePrice: number;
  purchaseDate: Date;
  currentValue: number;
  depreciationMethod:
    | "straight_line"
    | "declining_balance"
    | "units_of_production";
  usefulLife: number; // in years
  salvageValue: number;
  property?: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  status: "active" | "disposed" | "fully_depreciated";
  disposalDate?: Date;
  disposalPrice?: number;
}

export interface IFinancialSettings extends BaseDocument {
  landlord: mongoose.Types.ObjectId;
  currency: string;
  taxYear: {
    startMonth: number; // 1-12
    endMonth: number; // 1-12
  };
  taxRates: {
    income: number; // percentage
    property: number; // percentage
    vat: number; // percentage
  };
  depreciationRates: {
    [category: string]: number; // percentage per year
  };
  reportingPreferences: {
    frequency: "monthly" | "quarterly" | "yearly";
    autoGenerate: boolean;
    emailReports: boolean;
  };
}

export enum FinancialReportType {
  PROFIT_LOSS = "profit_loss",
  TAX_SUMMARY = "tax_summary",
  CASH_FLOW = "cash_flow",
  BALANCE_SHEET = "balance_sheet",
}

export enum ExpenseStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum AssetStatus {
  ACTIVE = "active",
  DISPOSED = "disposed",
  FULLY_DEPRECIATED = "fully_depreciated",
}
