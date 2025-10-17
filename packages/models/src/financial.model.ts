import mongoose, { Schema } from "mongoose";
import {
  AssetStatus,
  ExpenseStatus,
  FinancialReportType,
  type IAsset,
  type IExpense,
  type IExpenseCategory,
  type IFinancialReport,
  type IFinancialSettings,
  type ITaxReport,
} from "./types/financial.type";

const FinancialReportSchema = new Schema<IFinancialReport>(
  {
    reportType: {
      type: String,
      enum: Object.values(FinancialReportType),
      required: true,
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      type: {
        type: String,
        enum: ["monthly", "quarterly", "yearly", "custom"],
        required: true,
      },
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    data: {
      income: {
        rental: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          properties: [
            {
              propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
              propertyName: String,
              amount: Number,
              payments: Number,
            },
          ],
        },
        deposits: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
        },
        fees: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          breakdown: {
            application: { type: Number, default: 0 },
            late: { type: Number, default: 0 },
            service: { type: Number, default: 0 },
            other: { type: Number, default: 0 },
          },
        },
        other: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          description: [String],
        },
        total: { type: Number, default: 0 },
      },
      expenses: {
        maintenance: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          breakdown: [
            {
              category: String,
              amount: Number,
              count: Number,
            },
          ],
        },
        utilities: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          breakdown: {
            electricity: { type: Number, default: 0 },
            water: { type: Number, default: 0 },
            gas: { type: Number, default: 0 },
            internet: { type: Number, default: 0 },
            other: { type: Number, default: 0 },
          },
        },
        insurance: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
        },
        taxes: {
          amount: { type: Number, default: 0 },
          breakdown: {
            property: { type: Number, default: 0 },
            income: { type: Number, default: 0 },
            vat: { type: Number, default: 0 },
          },
        },
        management: {
          amount: { type: Number, default: 0 },
          platformFees: { type: Number, default: 0 },
          professionalServices: { type: Number, default: 0 },
        },
        marketing: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
        },
        depreciation: {
          amount: { type: Number, default: 0 },
          assets: [
            {
              assetId: { type: Schema.Types.ObjectId, ref: "Asset" },
              assetName: String,
              depreciationAmount: Number,
            },
          ],
        },
        other: {
          amount: { type: Number, default: 0 },
          count: { type: Number, default: 0 },
          description: [String],
        },
        total: { type: Number, default: 0 },
      },
      summary: {
        grossIncome: { type: Number, default: 0 },
        totalExpenses: { type: Number, default: 0 },
        netIncome: { type: Number, default: 0 },
        profitMargin: { type: Number, default: 0 },
        taxableIncome: { type: Number, default: 0 },
        estimatedTax: { type: Number, default: 0 },
        cashFlow: { type: Number, default: 0 },
        roi: { type: Number, default: 0 },
      },
    },
    generatedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["draft", "final", "archived"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const TaxReportSchema = new Schema<ITaxReport>(
  {
    taxYear: { type: Number, required: true },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    properties: [
      {
        type: Schema.Types.ObjectId,
        ref: "Property",
      },
    ],
    income: {
      rental: { type: Number, default: 0 },
      deposits: { type: Number, default: 0 },
      fees: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    deductions: {
      mortgage: { type: Number, default: 0 },
      maintenance: { type: Number, default: 0 },
      utilities: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      depreciation: { type: Number, default: 0 },
      professionalFees: { type: Number, default: 0 },
      advertising: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    taxableIncome: { type: Number, default: 0 },
    estimatedTax: { type: Number, default: 0 },
    quarterlyPayments: [
      {
        quarter: {
          type: Number,
          enum: [1, 2, 3, 4],
          required: true,
        },
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        paid: { type: Boolean, default: false },
        paidDate: Date,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "submitted", "approved"],
      default: "draft",
    },
    submittedAt: Date,
  },
  { timestamps: true }
);

const ExpenseCategorySchema = new Schema<IExpenseCategory>(
  {
    name: { type: String, required: true },
    description: String,
    taxDeductible: { type: Boolean, default: true },
    depreciationRate: Number,
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ExpenseSchema = new Schema<IExpense>(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    category: { type: String, required: true },
    subcategory: String,
    description: { type: String, required: true },
    date: { type: Date, required: true },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receipt: {
      url: String,
      filename: String,
      uploadedAt: Date,
    },
    taxDeductible: { type: Boolean, default: true },
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ["monthly", "quarterly", "yearly"],
      },
      nextDue: Date,
      endDate: Date,
    },
    vendor: {
      name: String,
      contact: String,
      vatNumber: String,
    },
    status: {
      type: String,
      enum: Object.values(ExpenseStatus),
      default: ExpenseStatus.PENDING,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
  },
  { timestamps: true }
);

const AssetSchema = new Schema<IAsset>(
  {
    name: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ["property", "equipment", "furniture", "vehicle", "other"],
      required: true,
    },
    purchasePrice: { type: Number, required: true },
    purchaseDate: { type: Date, required: true },
    currentValue: { type: Number, required: true },
    depreciationMethod: {
      type: String,
      enum: ["straight_line", "declining_balance", "units_of_production"],
      default: "straight_line",
    },
    usefulLife: { type: Number, required: true },
    salvageValue: { type: Number, default: 0 },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AssetStatus),
      default: AssetStatus.ACTIVE,
    },
    disposalDate: Date,
    disposalPrice: Number,
  },
  { timestamps: true }
);

const FinancialSettingsSchema = new Schema<IFinancialSettings>(
  {
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currency: { type: String, default: "KES" },
    taxYear: {
      startMonth: { type: Number, default: 1 },
      endMonth: { type: Number, default: 12 },
    },
    taxRates: {
      income: { type: Number, default: 30 },
      property: { type: Number, default: 1.5 },
      vat: { type: Number, default: 16 },
    },
    depreciationRates: {
      type: Map,
      of: Number,
      default: {
        property: 2.5,
        equipment: 20,
        furniture: 10,
        vehicle: 25,
        other: 10,
      },
    },
    reportingPreferences: {
      frequency: {
        type: String,
        enum: ["monthly", "quarterly", "yearly"],
        default: "monthly",
      },
      autoGenerate: { type: Boolean, default: false },
      emailReports: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Indexes
FinancialReportSchema.index({
  landlord: 1,
  reportType: 1,
  "period.startDate": -1,
});
TaxReportSchema.index({ landlord: 1, taxYear: -1 });
ExpenseSchema.index({ landlord: 1, date: -1 });
ExpenseSchema.index({ property: 1, date: -1 });
AssetSchema.index({ landlord: 1, status: 1 });

export const FinancialReport = mongoose.model<IFinancialReport>(
  "FinancialReport",
  FinancialReportSchema
);
export const TaxReport = mongoose.model<ITaxReport>(
  "TaxReport",
  TaxReportSchema
);
export const ExpenseCategory = mongoose.model<IExpenseCategory>(
  "ExpenseCategory",
  ExpenseCategorySchema
);
export const Expense = mongoose.model<IExpense>("Expense", ExpenseSchema);
export const Asset = mongoose.model<IAsset>("Asset", AssetSchema);
export const FinancialSettings = mongoose.model<IFinancialSettings>(
  "FinancialSettings",
  FinancialSettingsSchema
);
