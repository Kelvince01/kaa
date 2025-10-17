import {
  Asset,
  Expense,
  FinancialReport,
  FinancialSettings,
  Payment,
  Property,
  TaxReport,
} from "@kaa/models";
import type {
  IExpenseData,
  IFinancialReport,
  IFinancialSummary,
  IIncomeData,
  ITaxReport,
} from "@kaa/models/types";
import { logger } from "@kaa/utils";
import { DateTime } from "luxon";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";

export class FinancialService {
  /**
   * Generate comprehensive financial report
   */
  async generateFinancialReport(
    landlordId: string,
    reportType: "profit_loss" | "tax_summary" | "cash_flow" | "balance_sheet",
    period: {
      startDate: Date;
      endDate: Date;
      type: "monthly" | "quarterly" | "yearly" | "custom";
    },
    propertyId?: string
  ): Promise<IFinancialReport> {
    try {
      // Get income data
      const incomeData = await this.calculateIncomeData(
        landlordId,
        period,
        propertyId
      );

      // Get expense data
      const expenseData = await this.calculateExpenseData(
        landlordId,
        period,
        propertyId
      );

      // Calculate summary
      const summary = this.calculateFinancialSummary(
        incomeData,
        expenseData,
        landlordId
      );

      // Create or update report
      const reportData = {
        reportType,
        period,
        landlord: landlordId,
        property: propertyId,
        data: {
          income: incomeData,
          expenses: expenseData,
          summary,
        },
        generatedAt: new Date(),
        status: "draft" as const,
      };

      const existingReport = await FinancialReport.findOne({
        landlord: landlordId,
        reportType,
        "period.startDate": period.startDate,
        "period.endDate": period.endDate,
        property: propertyId,
      });

      if (existingReport) {
        Object.assign(existingReport, reportData);
        return await existingReport.save();
      }

      return await FinancialReport.create(reportData);
    } catch (error) {
      logger.error("Error generating financial report:", error);
      throw new Error("Failed to generate financial report");
    }
  }

  /**
   * Calculate income data from payments
   */
  private async calculateIncomeData(
    landlordId: string,
    period: { startDate: Date; endDate: Date },
    propertyId?: string
  ): Promise<IIncomeData> {
    const filter: any = {
      landlord: landlordId,
      status: "completed",
      createdAt: {
        $gte: period.startDate,
        $lte: period.endDate,
      },
    };

    if (propertyId) {
      filter.property = propertyId;
    }

    const payments = await Payment.find(filter).populate("property", "title");

    const incomeData: IIncomeData = {
      rental: { amount: 0, count: 0, properties: [] },
      deposits: { amount: 0, count: 0 },
      fees: {
        amount: 0,
        count: 0,
        breakdown: { application: 0, late: 0, service: 0, other: 0 },
      },
      other: { amount: 0, count: 0, description: [] },
      total: 0,
    };

    const propertyIncomeMap = new Map();

    for (const payment of payments) {
      const amount = payment.amount;

      switch (payment.type) {
        case "rent": {
          incomeData.rental.amount += amount;
          incomeData.rental.count++;

          // Track by property
          const propertyId = payment.property?._id?.toString();
          const propertyName =
            (payment.property as any)?.title || "Unknown Property";

          if (propertyId) {
            if (!propertyIncomeMap.has(propertyId)) {
              propertyIncomeMap.set(propertyId, {
                propertyId,
                propertyName,
                amount: 0,
                payments: 0,
              });
            }
            const propertyData = propertyIncomeMap.get(propertyId);
            propertyData.amount += amount;
            propertyData.payments++;
          }
          break;
        }

        case "deposit":
        case "holding_deposit":
          incomeData.deposits.amount += amount;
          incomeData.deposits.count++;
          break;

        case "fee": {
          incomeData.fees.amount += amount;
          incomeData.fees.count++;

          // Categorize fees based on description or metadata
          const description = payment.description?.toLowerCase() || "";
          if (description.includes("application")) {
            incomeData.fees.breakdown.application += amount;
          } else if (description.includes("late")) {
            incomeData.fees.breakdown.late += amount;
          } else if (description.includes("service")) {
            incomeData.fees.breakdown.service += amount;
          } else {
            incomeData.fees.breakdown.other += amount;
          }
          break;
        }

        default:
          incomeData.other.amount += amount;
          incomeData.other.count++;
          if (payment.description) {
            incomeData.other.description.push(payment.description);
          }
      }
    }

    incomeData.rental.properties = Array.from(propertyIncomeMap.values());
    incomeData.total =
      incomeData.rental.amount +
      incomeData.deposits.amount +
      incomeData.fees.amount +
      incomeData.other.amount;

    return incomeData;
  }

  /**
   * Calculate expense data
   */
  private async calculateExpenseData(
    landlordId: string,
    period: { startDate: Date; endDate: Date },
    propertyId?: string
  ): Promise<IExpenseData> {
    const filter: any = {
      landlord: landlordId,
      status: "approved",
      date: {
        $gte: period.startDate,
        $lte: period.endDate,
      },
    };

    if (propertyId) {
      filter.property = propertyId;
    }

    const expenses = await Expense.find(filter);

    const expenseData: IExpenseData = {
      maintenance: { amount: 0, count: 0, breakdown: [] },
      utilities: {
        amount: 0,
        count: 0,
        breakdown: { electricity: 0, water: 0, gas: 0, internet: 0, other: 0 },
      },
      insurance: { amount: 0, count: 0 },
      taxes: {
        amount: 0,
        breakdown: { property: 0, income: 0, vat: 0 },
      },
      management: { amount: 0, platformFees: 0, professionalServices: 0 },
      marketing: { amount: 0, count: 0 },
      depreciation: { amount: 0, assets: [] },
      other: { amount: 0, count: 0, description: [] },
      total: 0,
    };

    const maintenanceCategories = new Map();

    for (const expense of expenses) {
      const amount = expense.amount;
      const category = expense.category.toLowerCase();

      switch (category) {
        case "maintenance":
        case "repairs": {
          expenseData.maintenance.amount += amount;
          expenseData.maintenance.count++;

          const subcat = expense.subcategory || "general";
          if (!maintenanceCategories.has(subcat)) {
            maintenanceCategories.set(subcat, {
              category: subcat,
              amount: 0,
              count: 0,
            });
          }
          const maintData = maintenanceCategories.get(subcat);
          maintData.amount += amount;
          maintData.count++;
          break;
        }

        case "utilities": {
          expenseData.utilities.amount += amount;
          expenseData.utilities.count++;

          const utilityType = expense.subcategory?.toLowerCase() || "other";
          if (utilityType in expenseData.utilities.breakdown) {
            (expenseData.utilities.breakdown as any)[utilityType] += amount;
          } else {
            expenseData.utilities.breakdown.other += amount;
          }
          break;
        }

        case "insurance":
          expenseData.insurance.amount += amount;
          expenseData.insurance.count++;
          break;

        case "tax":
        case "taxes": {
          expenseData.taxes.amount += amount;

          const taxType = expense.subcategory?.toLowerCase() || "other";
          if (taxType.includes("property")) {
            expenseData.taxes.breakdown.property += amount;
          } else if (taxType.includes("income")) {
            expenseData.taxes.breakdown.income += amount;
          } else if (taxType.includes("vat")) {
            expenseData.taxes.breakdown.vat += amount;
          }
          break;
        }

        case "management":
        case "professional":
          expenseData.management.amount += amount;
          if (expense.description?.toLowerCase().includes("platform")) {
            expenseData.management.platformFees += amount;
          } else {
            expenseData.management.professionalServices += amount;
          }
          break;

        case "marketing":
        case "advertising":
          expenseData.marketing.amount += amount;
          expenseData.marketing.count++;
          break;

        default:
          expenseData.other.amount += amount;
          expenseData.other.count++;
          if (expense.description) {
            expenseData.other.description.push(expense.description);
          }
      }
    }

    expenseData.maintenance.breakdown = Array.from(
      maintenanceCategories.values()
    );

    // Calculate depreciation
    const depreciationData = await this.calculateDepreciation(
      landlordId,
      period,
      propertyId
    );
    expenseData.depreciation = depreciationData;

    expenseData.total =
      expenseData.maintenance.amount +
      expenseData.utilities.amount +
      expenseData.insurance.amount +
      expenseData.taxes.amount +
      expenseData.management.amount +
      expenseData.marketing.amount +
      expenseData.depreciation.amount +
      expenseData.other.amount;

    return expenseData;
  }

  /**
   * Calculate depreciation for assets
   */
  private async calculateDepreciation(
    landlordId: string,
    period: { startDate: Date; endDate: Date },
    propertyId?: string
  ) {
    const filter: any = {
      landlord: landlordId,
      status: "active",
      purchaseDate: { $lte: period.endDate },
    };

    if (propertyId) {
      filter.property = propertyId;
    }

    const assets = await Asset.find(filter);
    const depreciationData = {
      amount: 0,
      assets: [] as Array<{
        assetId: string;
        assetName: string;
        depreciationAmount: number;
      }>,
    };

    for (const asset of assets) {
      const depreciationAmount = this.calculateAssetDepreciation(asset, period);
      if (depreciationAmount > 0) {
        depreciationData.amount += depreciationAmount;
        depreciationData.assets.push({
          assetId: (asset._id as mongoose.Types.ObjectId).toString(),
          assetName: asset.name,
          depreciationAmount,
        });
      }
    }

    return depreciationData;
  }

  /**
   * Calculate depreciation for a single asset
   */
  private calculateAssetDepreciation(
    asset: any,
    period: { startDate: Date; endDate: Date }
  ): number {
    const yearsInPeriod =
      (period.endDate.getTime() - period.startDate.getTime()) /
      (365.25 * 24 * 60 * 60 * 1000);

    switch (asset.depreciationMethod) {
      case "straight_line": {
        const annualDepreciation =
          (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;
        return annualDepreciation * yearsInPeriod;
      }

      case "declining_balance": {
        // Simplified declining balance calculation
        const rate = 2 / asset.usefulLife;
        return asset.currentValue * rate * yearsInPeriod;
      }

      default:
        return 0;
    }
  }

  /**
   * Calculate financial summary
   */
  private async calculateFinancialSummary(
    incomeData: IIncomeData,
    expenseData: IExpenseData,
    landlordId: string
  ): Promise<IFinancialSummary> {
    const settings = await FinancialSettings.findOne({ landlord: landlordId });
    const taxRates = settings?.taxRates || {
      income: 30,
      property: 1.5,
      vat: 16,
    };

    const grossIncome = incomeData.total;
    const totalExpenses = expenseData.total;
    const netIncome = grossIncome - totalExpenses;
    const profitMargin = grossIncome > 0 ? (netIncome / grossIncome) * 100 : 0;

    // Calculate taxable income (net income minus non-taxable deductions)
    const taxableIncome = Math.max(0, netIncome);
    const estimatedTax = taxableIncome * (taxRates.income / 100);

    const cashFlow = netIncome; // Simplified cash flow calculation

    // Calculate ROI (would need property values for accurate calculation)
    const roi = 0; // Placeholder - would need investment amounts

    return {
      grossIncome,
      totalExpenses,
      netIncome,
      profitMargin,
      taxableIncome,
      estimatedTax,
      cashFlow,
      roi,
    };
  }

  /**
   * Generate tax report
   */
  async generateTaxReport(
    landlordId: string,
    taxYear: number
  ): Promise<ITaxReport> {
    try {
      const settings = await FinancialSettings.findOne({
        landlord: landlordId,
      });
      const startMonth = settings?.taxYear.startMonth || 1;

      const startDate = new Date(taxYear, startMonth - 1, 1);
      const endDate = new Date(taxYear + 1, startMonth - 1, 0);

      // Get all properties for the landlord
      const properties = await Property.find({ landlord: landlordId }).select(
        "_id"
      );
      const propertyIds = properties.map((p) =>
        (p._id as mongoose.Types.ObjectId).toString()
      );

      // Calculate income
      const incomeData = await this.calculateIncomeData(landlordId, {
        startDate,
        endDate,
      });

      // Calculate deductions from expenses
      const expenseData = await this.calculateExpenseData(landlordId, {
        startDate,
        endDate,
      });

      const income = {
        rental: incomeData.rental.amount,
        deposits: incomeData.deposits.amount,
        fees: incomeData.fees.amount,
        other: incomeData.other.amount,
        total: incomeData.total,
      };

      const deductions = {
        mortgage: 0, // Would need mortgage payment tracking
        maintenance: expenseData.maintenance.amount,
        utilities: expenseData.utilities.amount,
        insurance: expenseData.insurance.amount,
        depreciation: expenseData.depreciation.amount,
        professionalFees: expenseData.management.professionalServices,
        advertising: expenseData.marketing.amount,
        travel: 0, // Would need travel expense tracking
        other: expenseData.other.amount,
        total: expenseData.total,
      };

      const taxableIncome = Math.max(0, income.total - deductions.total);
      const taxRate = settings?.taxRates.income || 30;
      const estimatedTax = taxableIncome * (taxRate / 100);

      // Generate quarterly payment schedule
      const quarterlyPayments = this.generateQuarterlyPayments(
        taxYear,
        estimatedTax
      );

      const taxReportData = {
        taxYear,
        landlord: landlordId,
        properties: propertyIds,
        income,
        deductions,
        taxableIncome,
        estimatedTax,
        quarterlyPayments,
        status: "draft" as const,
      };

      // Check if report already exists
      const existingReport = await TaxReport.findOne({
        landlord: landlordId,
        taxYear,
      });

      if (existingReport) {
        Object.assign(existingReport, taxReportData);
        return await existingReport.save();
      }

      return await TaxReport.create(taxReportData);
    } catch (error) {
      logger.error("Error generating tax report:", error);
      throw new Error("Failed to generate tax report");
    }
  }

  /**
   * Generate quarterly payment schedule
   */
  private generateQuarterlyPayments(taxYear: number, estimatedTax: number) {
    const quarterlyAmount = estimatedTax / 4;

    return [
      {
        quarter: 1 as const,
        dueDate: new Date(taxYear, 3, 15), // April 15
        amount: quarterlyAmount,
        paid: false,
      },
      {
        quarter: 2 as const,
        dueDate: new Date(taxYear, 5, 15), // June 15
        amount: quarterlyAmount,
        paid: false,
      },
      {
        quarter: 3 as const,
        dueDate: new Date(taxYear, 8, 15), // September 15
        amount: quarterlyAmount,
        paid: false,
      },
      {
        quarter: 4 as const,
        dueDate: new Date(taxYear + 1, 0, 15), // January 15 of next year
        amount: quarterlyAmount,
        paid: false,
      },
    ];
  }

  /**
   * Get financial reports for a landlord
   */
  async getFinancialReports(
    landlordId: string,
    filters: {
      reportType?: string;
      startDate?: Date;
      endDate?: Date;
      propertyId?: string;
      status?: string;
    } = {}
  ) {
    const query: any = { landlord: landlordId };

    if (filters.reportType) {
      query.reportType = filters.reportType;
    }

    if (filters.propertyId) {
      query.property = filters.propertyId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query["period.startDate"] = {};
      if (filters.startDate) {
        query["period.startDate"].$gte = filters.startDate;
      }
      if (filters.endDate) {
        query["period.startDate"].$lte = filters.endDate;
      }
    }

    return await FinancialReport.find(query)
      .populate("property", "title address")
      .sort({ "period.startDate": -1 });
  }

  /**
   * Get period dates based on type
   */
  getPeriodDates(
    type: "monthly" | "quarterly" | "yearly",
    _date: Date = new Date()
  ) {
    const now = DateTime.now();

    switch (type) {
      case "monthly":
        return {
          startDate: now.startOf("month"),
          endDate: now.endOf("month"),
          type,
        };
      case "quarterly":
        return {
          startDate: now.startOf("quarter"),
          endDate: now.endOf("quarter"),
          type,
        };
      case "yearly":
        return {
          startDate: now.startOf("year"),
          endDate: now.endOf("year"),
          type,
        };
      default:
        throw new Error("Invalid period type");
    }
  }

  /**
   * Get expense trends over time
   */
  async getExpenseTrends(
    landlordId: string,
    period: { startDate: Date; endDate: Date },
    propertyId?: string
  ) {
    try {
      const filter: FilterQuery<IExpense> = {
        landlord: landlordId,
        status: "approved",
        date: { $gte: period.startDate, $lte: period.endDate },
      };

      if (propertyId) {
        filter.property = propertyId;
      }

      // Group expenses by month
      const monthlyData = await Expense.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Calculate trends
      const trends = monthlyData.map((item: any, index: number) => {
        const period = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
        const change =
          index > 0 ? item.totalAmount - monthlyData[index - 1].totalAmount : 0;
        const changePercentage =
          index > 0 && monthlyData[index - 1].totalAmount > 0
            ? (change / monthlyData[index - 1].totalAmount) * 100
            : 0;

        return {
          period,
          amount: item.totalAmount,
          count: item.count,
          change,
          changePercentage,
        };
      });

      return trends;
    } catch (error) {
      logger.error("Error getting expense trends:", error);
      throw new Error("Failed to get expense trends");
    }
  }

  /**
   * Get category analytics
   */
  async getCategoryAnalytics(
    landlordId: string,
    currentPeriod: { startDate: Date; endDate: Date },
    propertyId?: string
  ) {
    try {
      const filter: any = {
        landlord: landlordId,
        status: "approved",
      };

      if (propertyId) {
        filter.property = propertyId;
      }

      // Get current period data
      const currentData = await Expense.aggregate([
        {
          $match: {
            ...filter,
            date: {
              $gte: currentPeriod.startDate,
              $lte: currentPeriod.endDate,
            },
          },
        },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]);

      // Calculate previous period for comparison
      const periodDiff =
        currentPeriod.endDate.getTime() - currentPeriod.startDate.getTime();
      const previousPeriod = {
        startDate: new Date(currentPeriod.startDate.getTime() - periodDiff),
        endDate: new Date(currentPeriod.endDate.getTime() - periodDiff),
      };

      const previousData = await Expense.aggregate([
        {
          $match: {
            ...filter,
            date: {
              $gte: previousPeriod.startDate,
              $lte: previousPeriod.endDate,
            },
          },
        },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      // Create a map for previous data
      const previousMap = new Map(
        previousData.map((item) => [item._id, item.totalAmount])
      );

      const totalAmount = currentData.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      );

      const analytics = currentData.map((item) => {
        const previousAmount = previousMap.get(item._id) || 0;
        const change = item.totalAmount - previousAmount;
        const changePercentage =
          previousAmount > 0 ? (change / previousAmount) * 100 : 0;

        return {
          category: item._id,
          amount: item.totalAmount,
          count: item.count,
          percentage:
            totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0,
          trend: {
            change,
            changePercentage,
          },
        };
      });

      return analytics;
    } catch (error) {
      logger.error("Error getting category analytics:", error);
      throw new Error("Failed to get category analytics");
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    landlordId: string,
    period: { startDate: Date; endDate: Date },
    propertyId?: string
  ) {
    try {
      // Get income and expense data
      const incomeData = await this.calculateIncomeData(
        landlordId,
        period,
        propertyId
      );
      const expenseData = await this.calculateExpenseData(
        landlordId,
        period,
        propertyId
      );

      // Calculate metrics
      const totalIncome = incomeData.total;
      const totalExpenses = expenseData.total;
      const netIncome = totalIncome - totalExpenses;
      const profitMargin =
        totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
      const expenseRatio =
        totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

      // Calculate average monthly expenses
      const monthsDiff = Math.max(
        1,
        (period.endDate.getTime() - period.startDate.getTime()) /
          (1000 * 60 * 60 * 24 * 30.44)
      );
      const averageMonthlyExpenses = totalExpenses / monthsDiff;

      // Get top expense categories
      const categoryAnalytics = await this.getCategoryAnalytics(
        landlordId,
        period,
        propertyId
      );
      const topExpenseCategories = categoryAnalytics.slice(0, 5);

      // Get monthly trends
      const monthlyTrends = await this.getExpenseTrends(
        landlordId,
        period,
        propertyId
      );

      return {
        totalIncome,
        totalExpenses,
        netIncome,
        profitMargin,
        expenseRatio,
        averageMonthlyExpenses,
        topExpenseCategories,
        monthlyTrends,
      };
    } catch (error) {
      logger.error("Error getting performance metrics:", error);
      throw new Error("Failed to get performance metrics");
    }
  }

  /**
   * Get comparative analysis between two periods
   */
  async getComparativeAnalysis(
    landlordId: string,
    currentPeriod: { startDate: Date; endDate: Date },
    previousPeriod: { startDate: Date; endDate: Date },
    propertyId?: string
  ) {
    try {
      // Get data for both periods
      const [currentIncome, currentExpenses, previousIncome, previousExpenses] =
        await Promise.all([
          this.calculateIncomeData(landlordId, currentPeriod, propertyId),
          this.calculateExpenseData(landlordId, currentPeriod, propertyId),
          this.calculateIncomeData(landlordId, previousPeriod, propertyId),
          this.calculateExpenseData(landlordId, previousPeriod, propertyId),
        ]);

      const currentData = {
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
        totalIncome: currentIncome.total,
        totalExpenses: currentExpenses.total,
        netIncome: currentIncome.total - currentExpenses.total,
      };

      const previousData = {
        startDate: previousPeriod.startDate,
        endDate: previousPeriod.endDate,
        totalIncome: previousIncome.total,
        totalExpenses: previousExpenses.total,
        netIncome: previousIncome.total - previousExpenses.total,
      };

      // Calculate changes
      const incomeChange = currentData.totalIncome - previousData.totalIncome;
      const incomeChangePercentage =
        previousData.totalIncome > 0
          ? (incomeChange / previousData.totalIncome) * 100
          : 0;

      const expenseChange =
        currentData.totalExpenses - previousData.totalExpenses;
      const expenseChangePercentage =
        previousData.totalExpenses > 0
          ? (expenseChange / previousData.totalExpenses) * 100
          : 0;

      const netIncomeChange = currentData.netIncome - previousData.netIncome;
      const netIncomeChangePercentage =
        previousData.netIncome > 0
          ? (netIncomeChange / previousData.netIncome) * 100
          : 0;

      return {
        currentPeriod: currentData,
        previousPeriod: previousData,
        comparison: {
          incomeChange,
          incomeChangePercentage,
          expenseChange,
          expenseChangePercentage,
          netIncomeChange,
          netIncomeChangePercentage,
        },
      };
    } catch (error) {
      logger.error("Error getting comparative analysis:", error);
      throw new Error("Failed to get comparative analysis");
    }
  }

  /**
   * Batch import expenses or assets
   */
  async batchImport(
    landlordId: string,
    dataType: "expenses" | "assets",
    data: Record<string, any>[],
    options: {
      skipValidation?: boolean;
      updateExisting?: boolean;
      columnMappings?: Record<string, string>;
    }
  ) {
    try {
      const results = {
        totalRows: data.length,
        successCount: 0,
        errorCount: 0,
        warningCount: 0,
        skippedCount: 0,
        errors: [] as Array<{
          row: number;
          field: string;
          message: string;
          value: any;
        }>,
        warnings: [] as Array<{
          row: number;
          field: string;
          message: string;
          value: any;
        }>,
        created: [] as string[],
        updated: [] as string[],
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowIndex = i + 1;

        try {
          // Apply column mappings
          let mappedRow = { ...row };
          if (options.columnMappings) {
            const newRow: Record<string, any> = {};
            for (const [sourceCol, targetCol] of Object.entries(
              options.columnMappings
            )) {
              if (sourceCol in mappedRow) {
                newRow[targetCol] = mappedRow[sourceCol];
              }
            }
            mappedRow = newRow;
          }

          // Add landlord ID
          mappedRow.landlord = landlordId;

          if (dataType === "expenses") {
            // Validate required fields for expenses
            if (
              !(mappedRow.amount && mappedRow.category && mappedRow.description)
            ) {
              results.errors.push({
                row: rowIndex,
                field: "required",
                message:
                  "Missing required fields: amount, category, or description",
                value: mappedRow,
              });
              results.errorCount++;
              continue;
            }

            // Set defaults
            mappedRow.currency = mappedRow.currency || "KES";
            mappedRow.date = mappedRow.date
              ? new Date(mappedRow.date)
              : new Date();
            mappedRow.status = "approved";
            mappedRow.taxDeductible = mappedRow.taxDeductible ?? true;

            const expense = await Expense.create(mappedRow);
            results.created.push(
              (expense._id as mongoose.Types.ObjectId).toString()
            );
            results.successCount++;
          } else if (dataType === "assets") {
            // Validate required fields for assets
            if (
              !(
                mappedRow.name &&
                mappedRow.category &&
                mappedRow.purchasePrice &&
                mappedRow.usefulLife
              )
            ) {
              results.errors.push({
                row: rowIndex,
                field: "required",
                message:
                  "Missing required fields: name, category, purchasePrice, or usefulLife",
                value: mappedRow,
              });
              results.errorCount++;
              continue;
            }

            // Set defaults
            mappedRow.purchaseDate = mappedRow.purchaseDate
              ? new Date(mappedRow.purchaseDate)
              : new Date();
            mappedRow.currentValue =
              mappedRow.currentValue || mappedRow.purchasePrice;
            mappedRow.salvageValue = mappedRow.salvageValue || 0;
            mappedRow.status = "active";
            mappedRow.depreciationMethod =
              mappedRow.depreciationMethod || "straight_line";

            const asset = await Asset.create(mappedRow);
            results.created.push(
              (asset._id as mongoose.Types.ObjectId).toString()
            );
            results.successCount++;
          }
        } catch (error) {
          logger.error(`Error importing row ${rowIndex}:`, error);
          results.errors.push({
            row: rowIndex,
            field: "general",
            message: error instanceof Error ? error.message : "Unknown error",
            value: row,
          });
          results.errorCount++;
        }
      }

      return results;
    } catch (error) {
      logger.error("Error in batch import:", error);
      throw new Error("Failed to perform batch import");
    }
  }
}
