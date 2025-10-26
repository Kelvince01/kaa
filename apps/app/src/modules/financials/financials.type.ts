// Financial Report Types
export type FinancialReport = {
  _id: string;
  reportType: "profit_loss" | "tax_summary" | "cash_flow" | "balance_sheet";
  period: {
    startDate: string;
    endDate: string;
    type: "monthly" | "quarterly" | "yearly" | "custom";
  };
  landlord: string;
  property?: string;
  data: {
    income: IncomeData;
    expenses: ExpenseData;
    summary: FinancialSummary;
  };
  generatedAt: string;
  status: "draft" | "final" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type IncomeData = {
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

export type ExpenseData = {
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

export type FinancialSummary = {
  grossIncome: number;
  totalExpenses: number;
  netIncome: number;
  profitMargin: number;
  taxableIncome: number;
  estimatedTax: number;
  cashFlow: number;
  roi: number;
};

// Tax Report Types
export type TaxReport = {
  _id: string;
  taxYear: number;
  landlord: string;
  properties: string[];
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
    dueDate: string;
    amount: number;
    paid: boolean;
    paidDate?: string;
  }>;
  status: "draft" | "submitted" | "approved";
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// Expense Types
export type Expense = {
  _id: string;
  amount: number;
  currency: string;
  category: string;
  subcategory?: string;
  description: string;
  date: string;
  property?: string;
  landlord: string;
  receipt?: {
    url: string;
    filename: string;
    uploadedAt: string;
  };
  taxDeductible: boolean;
  recurring: {
    isRecurring: boolean;
    frequency?: "monthly" | "quarterly" | "yearly";
    nextDue?: string;
    endDate?: string;
  };
  vendor?: {
    name: string;
    contact: string;
    vatNumber?: string;
  };
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// Asset Types
export type Asset = {
  _id: string;
  name: string;
  description?: string;
  category: "property" | "equipment" | "furniture" | "vehicle" | "other";
  purchasePrice: number;
  purchaseDate: string;
  currentValue: number;
  depreciationMethod:
    | "straight_line"
    | "declining_balance"
    | "units_of_production";
  usefulLife: number;
  salvageValue: number;
  property?: string;
  landlord: string;
  status: "active" | "disposed" | "fully_depreciated";
  disposalDate?: string;
  disposalPrice?: number;
  createdAt: string;
  updatedAt: string;
};

// Financial Settings Types
export type FinancialSettings = {
  _id: string;
  landlord: string;
  currency: string;
  taxYear: {
    startMonth: number;
    endMonth: number;
  };
  taxRates: {
    income: number;
    property: number;
    vat: number;
  };
  depreciationRates: Record<string, number>;
  reportingPreferences: {
    frequency: "monthly" | "quarterly" | "yearly";
    autoGenerate: boolean;
    emailReports: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

// Request Types
export type GenerateReportRequest = {
  reportType: "profit_loss" | "tax_summary" | "cash_flow" | "balance_sheet";
  period: {
    startDate: string;
    endDate: string;
    type: "monthly" | "quarterly" | "yearly" | "custom";
  };
  propertyId?: string;
};

export type CreateExpenseRequest = {
  amount: number;
  currency?: string;
  category: string;
  subcategory?: string;
  description: string;
  date: string;
  property?: string;
  taxDeductible?: boolean;
  recurring?: {
    isRecurring: boolean;
    frequency?: "monthly" | "quarterly" | "yearly";
    nextDue?: string;
    endDate?: string;
  };
  vendor?: {
    name: string;
    contact: string;
    vatNumber?: string;
  };
};

export type UpdateExpenseRequest = {
  status: "pending" | "approved" | "rejected";
};

export type CreateAssetRequest = {
  name: string;
  description?: string;
  category: "property" | "equipment" | "furniture" | "vehicle" | "other";
  purchasePrice: number;
  purchaseDate: string;
  depreciationMethod?:
    | "straight_line"
    | "declining_balance"
    | "units_of_production";
  usefulLife: number;
  salvageValue?: number;
  property?: string;
};

export type UpdateFinancialSettingsRequest = {
  currency?: string;
  taxYear?: {
    startMonth: number;
    endMonth: number;
  };
  taxRates?: {
    income: number;
    property: number;
    vat: number;
  };
  depreciationRates?: Record<string, number>;
  reportingPreferences?: {
    frequency: "monthly" | "quarterly" | "yearly";
    autoGenerate: boolean;
    emailReports: boolean;
  };
};

// Filter Types
export type ReportFilters = {
  reportType?: string;
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type ExpenseFilters = {
  category?: string;
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  status?: string;
  taxDeductible?: boolean;
  page?: number;
  limit?: number;
};

export type AssetFilters = {
  category?: string;
  propertyId?: string;
  status?: string;
  page?: number;
  limit?: number;
};

// Dashboard Data Types
export type FinancialDashboardData = {
  summary: FinancialSummary;
  income: IncomeData;
  expenses: ExpenseData;
  recentExpenses: Expense[];
  pendingExpenses: number;
  period: {
    startDate: string;
    endDate: string;
    type: "monthly" | "quarterly" | "yearly" | "custom";
  };
};

// Response Types
export type FinancialReportsResponse = {
  reports: FinancialReport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type ExpensesResponse = {
  expenses: Expense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type AssetsResponse = {
  assets: Asset[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

// Analytics Types
export type ExpenseAnalytics = {
  totalExpenses: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  comparisonToPrevious: {
    amount: number;
    percentage: number;
  };
};

export type FinancialTrends = {
  revenue: Array<{
    period: string;
    amount: number;
    type: "rental" | "fees" | "other";
  }>;
  expenses: Array<{
    period: string;
    amount: number;
    category: string;
  }>;
  netIncome: Array<{
    period: string;
    amount: number;
    margin: number;
  }>;
};

export type BudgetAnalysis = {
  categories: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  }>;
  monthlyComparison: Array<{
    month: string;
    budgeted: number;
    actual: number;
    variance: number;
  }>;
  totalBudget: number;
  totalActual: number;
  overallVariance: number;
};

export type FinancialInsights = {
  kpis: {
    profitMargin: number;
    expenseRatio: number;
    averageMonthlyExpense: number;
    largestExpenseCategory: string;
    cashFlowTrend: "increasing" | "decreasing" | "stable";
  };
  alerts: Array<{
    type: "warning" | "info" | "critical";
    message: string;
    value: number;
    threshold: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    category: string;
  }>;
};

export type ForecastData = {
  expenses: Array<{
    period: string;
    predicted: number;
    confidence: number;
    factors: string[];
  }>;
  income: Array<{
    period: string;
    predicted: number;
    confidence: number;
  }>;
  cashFlow: Array<{
    period: string;
    predicted: number;
    confidence: number;
  }>;
  scenario: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
};

export type CashFlowAnalysis = {
  periods: Array<{
    period: string;
    inflow: number;
    outflow: number;
    netCashFlow: number;
    cumulativeCashFlow: number;
  }>;
  totals: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
  };
  projections: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
};

export type ROIAnalysis = {
  propertyId?: string;
  propertyName?: string;
  totalInvestment: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  roi: number;
  annualizedROI: number;
  paybackPeriod: number;
  breakdownByPeriod: Array<{
    period: string;
    income: number;
    expenses: number;
    netIncome: number;
    cumulativeROI: number;
  }>;
};

export type ExpenseComparison = {
  currentPeriod: {
    period: string;
    totalExpenses: number;
    categoriesBreakdown: Array<{
      category: string;
      amount: number;
      count: number;
    }>;
  };
  comparisonPeriods: Array<{
    period: string;
    totalExpenses: number;
    change: number;
    changePercentage: number;
    categoriesBreakdown: Array<{
      category: string;
      amount: number;
      count: number;
      change: number;
      changePercentage: number;
    }>;
  }>;
  trends: {
    overallTrend: "increasing" | "decreasing" | "stable";
    averageMonthlyChange: number;
    topGrowingCategories: string[];
    topDecliningCategories: string[];
  };
};

export type TaxOptimizationInsights = {
  taxYear: number;
  totalDeductions: number;
  missedOpportunities: Array<{
    category: string;
    potentialSavings: number;
    recommendation: string;
    priority: "high" | "medium" | "low";
  }>;
  quarterlyBreakdown: Array<{
    quarter: number;
    deductions: number;
    estimatedTax: number;
    savingsOpportunity: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    potentialSavings: number;
    implementationDifficulty: "easy" | "medium" | "hard";
    deadline?: string;
  }>;
  projections: {
    currentYearEstimate: number;
    optimizedEstimate: number;
    potentialSavings: number;
  };
};

// Analytics Filter Types
export type AnalyticsFilters = {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  propertyId?: string;
  vendorId?: string;
  taxDeductibleOnly?: boolean;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
};

// Enums
export enum ReportType {
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

export enum AssetCategory {
  PROPERTY = "property",
  EQUIPMENT = "equipment",
  FURNITURE = "furniture",
  VEHICLE = "vehicle",
  OTHER = "other",
}
