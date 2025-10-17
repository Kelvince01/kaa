import {
  Asset,
  Expense,
  ExpenseCategory,
  FinancialSettings,
} from "@kaa/models";
import type { IAsset, IExpense } from "@kaa/models/types";
import { FinancialService } from "@kaa/services";
import { logger } from "@kaa/utils";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "~/features/rbac/rbac.plugin";
import {
  assetSchema,
  batchImportRequestSchema,
  categoryAnalyticsSchema,
  comparativeAnalysisSchema,
  createAssetRequestSchema,
  createExpenseRequestSchema,
  expenseFiltersSchema,
  expenseSchema,
  expenseTrendSchema,
  exportConfigSchema,
  financialReportSchema,
  financialSettingsSchema,
  generateReportRequestSchema,
  importResultSchema,
  performanceMetricsSchema,
  reportFiltersSchema,
  taxReportSchema,
  updateFinancialSettingsRequestSchema,
} from "./financial.schema";

const financialService = new FinancialService();

export const financialController = new Elysia({
  detail: {
    tags: ["financial"],
    security: [{ bearerAuth: [] }],
  },
}).group("/financial", (app) =>
  app
    .use(authPlugin)
    .use(accessPlugin("financial", "read"))

    // Financial Reports
    .get(
      "/reports",
      async ({ set, user, query }) => {
        try {
          const {
            reportType,
            startDate,
            endDate,
            propertyId,
            status,
            page = 1,
            limit = 10,
          } = query;

          const reports = await financialService.getFinancialReports(user.id, {
            reportType,
            startDate,
            endDate,
            propertyId,
            status,
          });

          // Pagination
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedReports = reports.slice(startIndex, endIndex);

          set.status = 200;
          return {
            status: "success",
            data: {
              reports: paginatedReports.map((report) => ({
                ...report.toObject(),
                _id: (report._id as mongoose.Types.ObjectId).toString(),
                property: report.property?.toString(),
                landlord: report.landlord.toString(),
              })),
              pagination: {
                total: reports.length,
                page,
                limit,
                pages: Math.ceil(reports.length / limit),
              },
            },
          };
        } catch (error) {
          logger.error("Error fetching financial reports:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch financial reports",
          };
        }
      },
      {
        query: reportFiltersSchema,
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Object({
              reports: t.Array(financialReportSchema),
              pagination: t.Object({
                total: t.Number(),
                page: t.Number(),
                limit: t.Number(),
                pages: t.Number(),
              }),
            }),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get financial reports",
          description:
            "Retrieve financial reports for the authenticated landlord",
        },
      }
    )

    .use(accessPlugin("financial", "create"))
    .post(
      "/reports/generate",
      async ({ set, user, body }) => {
        try {
          const { reportType, period, propertyId } = body;

          const report = await financialService.generateFinancialReport(
            user.id,
            reportType,
            period,
            propertyId
          );

          set.status = 201;
          return {
            status: "success",
            data: report,
          };
        } catch (error) {
          logger.error("Error generating financial report:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to generate financial report",
          };
        }
      },
      {
        body: generateReportRequestSchema,
        response: {
          201: t.Object({
            status: t.Literal("success"),
            data: financialReportSchema,
          }),
        },
        detail: {
          summary: "Generate financial report",
          description:
            "Generate a new financial report (profit/loss, tax summary, etc.)",
        },
      }
    )

    // Tax Reports
    .use(accessPlugin("financial", "read"))
    .get(
      "/tax-reports",
      async ({ set, user, query }) => {
        try {
          const { taxYear } = query;

          if (taxYear) {
            const report = await financialService.generateTaxReport(
              user.id,
              taxYear
            );
            set.status = 200;
            return {
              status: "success",
              data: {
                ...report.toObject(),
                _id: (report._id as mongoose.Types.ObjectId).toString(),
                // property: report.property?.toString(),
                landlord: report.landlord.toString(),
              },
            };
          }

          // Get all tax reports if no specific year requested
          const reports = await financialService.getFinancialReports(user.id, {
            reportType: "tax_summary",
          });

          set.status = 200;
          return {
            status: "success",
            data: reports.map((report) => ({
              ...report.toObject(),
              _id: (report._id as mongoose.Types.ObjectId).toString(),
              property: report.property?.toString(),
              landlord: report.landlord.toString(),
            })),
          };
        } catch (error) {
          logger.error("Error fetching tax reports:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch tax reports",
          };
        }
      },
      {
        query: t.Object({
          taxYear: t.Optional(t.Number()),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Union([taxReportSchema, t.Array(financialReportSchema)]),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get tax reports",
          description: "Retrieve tax reports for the authenticated landlord",
        },
      }
    )

    .use(accessPlugin("financial", "create"))
    .post(
      "/tax-reports/generate/:taxYear",
      async ({ set, user, params }) => {
        try {
          const { taxYear } = params;
          const report = await financialService.generateTaxReport(
            user.id,
            Number(taxYear)
          );

          set.status = 201;
          return {
            status: "success",
            data: {
              ...report,
              _id: (report._id as mongoose.Types.ObjectId).toString(),
            },
          };
        } catch (error) {
          logger.error("Error generating tax report:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to generate tax report",
          };
        }
      },
      {
        params: t.Object({
          taxYear: t.String(),
        }),
        response: {
          201: t.Object({
            status: t.Literal("success"),
            data: taxReportSchema,
          }),
        },
        detail: {
          summary: "Generate tax report",
          description: "Generate tax report for a specific year",
        },
      }
    )

    // Expenses
    .use(accessPlugin("financial", "read"))
    .get(
      "/expenses",
      async ({ set, user, query }) => {
        try {
          const {
            category,
            startDate,
            endDate,
            propertyId,
            status,
            taxDeductible,
            page = 1,
            limit = 10,
          } = query;

          const filter: FilterQuery<IExpense> = { landlord: user.id };

          if (category) filter.category = category;
          if (propertyId) filter.property = propertyId;
          if (status) filter.status = status;
          if (taxDeductible !== undefined) filter.taxDeductible = taxDeductible;

          if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = startDate;
            if (endDate) filter.date.$lte = endDate;
          }

          const total = await Expense.countDocuments(filter);
          const expenses = await Expense.find(filter)
            .populate("property", "title location")
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

          set.status = 200;
          return {
            status: "success",
            data: {
              expenses: expenses.map((expense) => ({
                ...expense.toObject(),
                _id: (expense._id as mongoose.Types.ObjectId).toString(),
                property: expense.property?.toString(),
                landlord: expense.landlord.toString(),
              })),
              pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
              },
            },
          };
        } catch (error) {
          logger.error("Error fetching expenses:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch expenses",
          };
        }
      },
      {
        query: expenseFiltersSchema,
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Object({
              expenses: t.Array(expenseSchema),
              pagination: t.Object({
                total: t.Number(),
                page: t.Number(),
                limit: t.Number(),
                pages: t.Number(),
              }),
            }),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get expenses",
          description: "Retrieve expenses for the authenticated landlord",
        },
      }
    )

    .use(accessPlugin("financial", "create"))
    .post(
      "/expenses",
      async ({ set, user, body }) => {
        try {
          const expenseData = {
            ...body,
            landlord: user.id,
            currency: body.currency || "KES",
          };

          const expense = await Expense.create(expenseData);
          await expense.populate("property", "title location");

          set.status = 201;
          return {
            status: "success",
            data: expense,
          };
        } catch (error) {
          logger.error("Error creating expense:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create expense",
          };
        }
      },
      {
        body: createExpenseRequestSchema,
        response: {
          201: t.Object({
            status: t.Literal("success"),
            data: expenseSchema,
          }),
        },
        detail: {
          summary: "Create expense",
          description: "Create a new expense record",
        },
      }
    )

    .use(accessPlugin("financial", "update"))
    .patch(
      "/expenses/:id",
      async ({ set, user, params, body }) => {
        try {
          const { id } = params;
          const expense = await Expense.findOne({ _id: id, landlord: user.id });

          if (!expense) {
            set.status = 404;
            return {
              status: "error",
              message: "Expense not found",
            };
          }

          Object.assign(expense, body);
          await expense.save();
          await expense.populate("property", "title location");

          set.status = 200;
          return {
            status: "success",
            data: {
              ...expense.toObject(),
              _id: (expense._id as mongoose.Types.ObjectId).toString(),
              property: expense.property?.toString(),
              landlord: expense.landlord.toString(),
            },
          };
        } catch (error) {
          logger.error("Error updating expense:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update expense",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Partial(createExpenseRequestSchema),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: expenseSchema,
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Update expense",
          description: "Update an existing expense record",
        },
      }
    )

    .use(accessPlugin("financial", "delete"))
    .delete(
      "/expenses/:id",
      async ({ set, user, params }) => {
        try {
          const { id } = params;
          const expense = await Expense.findOne({ _id: id, landlord: user.id });

          if (!expense) {
            set.status = 404;
            return {
              status: "error",
              message: "Expense not found",
            };
          }

          await Expense.findByIdAndDelete(id);

          set.status = 200;
          return {
            status: "success",
            message: "Expense deleted successfully",
          };
        } catch (error) {
          logger.error("Error deleting expense:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete expense",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Delete expense",
          description: "Delete an expense record",
        },
      }
    )

    // Expense Categories
    .use(accessPlugin("financial", "read"))
    .get(
      "/expenses/categories",
      async ({ set, user }) => {
        try {
          const categories = await ExpenseCategory.find({
            $or: [{ landlord: user.id }, { isDefault: true }],
          }).select("name");

          const categoryNames = categories.map((cat) => cat.name);

          // Add common default categories if none exist
          if (categoryNames.length === 0) {
            const defaultCategories = [
              "Maintenance",
              "Utilities",
              "Insurance",
              "Taxes",
              "Management",
              "Marketing",
              "Legal",
              "Other",
            ];
            categoryNames.push(...defaultCategories);
          }

          set.status = 200;
          return {
            status: "success",
            data: categoryNames,
          };
        } catch (error) {
          logger.error("Error fetching expense categories:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch expense categories",
          };
        }
      },
      {
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Array(t.String()),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get expense categories",
          description: "Retrieve available expense categories",
        },
      }
    )

    // Assets
    .use(accessPlugin("financial", "read"))
    .get(
      "/assets",
      async ({ set, user, query }) => {
        try {
          const { category, propertyId, status, page = 1, limit = 10 } = query;

          const filter: FilterQuery<IAsset> = { landlord: user.id };
          if (category) filter.category = category;
          if (propertyId) filter.property = propertyId;
          if (status) filter.status = status;

          const total = await Asset.countDocuments(filter);
          const assets = await Asset.find(filter)
            .populate("property", "title location")
            .sort({ purchaseDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

          set.status = 200;
          return {
            status: "success",
            data: {
              assets: assets.map((asset) => ({
                ...asset.toObject(),
                _id: (asset._id as mongoose.Types.ObjectId).toString(),
                property: asset.property?.toString(),
                landlord: asset.landlord.toString(),
              })),
              pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
              },
            },
          };
        } catch (error) {
          logger.error("Error fetching assets:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch assets",
          };
        }
      },
      {
        query: t.Object({
          category: t.Optional(t.String()),
          propertyId: t.Optional(t.String()),
          status: t.Optional(t.String()),
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Object({
              assets: t.Array(assetSchema),
              pagination: t.Object({
                total: t.Number(),
                page: t.Number(),
                limit: t.Number(),
                pages: t.Number(),
              }),
            }),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get assets",
          description: "Retrieve assets for the authenticated landlord",
        },
      }
    )

    .use(accessPlugin("financial", "create"))
    .post(
      "/assets",
      async ({ set, user, body }) => {
        try {
          const assetData = {
            ...body,
            landlord: user.id,
            currentValue: body.purchasePrice, // Initially same as purchase price
            salvageValue: body.salvageValue || 0,
          };

          const asset = await Asset.create(assetData);
          await asset.populate("property", "title location");

          set.status = 201;
          return {
            status: "success",
            data: asset,
          };
        } catch (error) {
          logger.error("Error creating asset:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create asset",
          };
        }
      },
      {
        body: createAssetRequestSchema,
        response: {
          201: t.Object({
            status: t.Literal("success"),
            data: assetSchema,
          }),
        },
        detail: {
          summary: "Create asset",
          description: "Create a new asset record",
        },
      }
    )

    .use(accessPlugin("financial", "update"))
    .patch(
      "/assets/:id",
      async ({ set, user, params, body }) => {
        try {
          const { id } = params;
          const asset = await Asset.findOne({ _id: id, landlord: user.id });

          if (!asset) {
            set.status = 404;
            return {
              status: "error",
              message: "Asset not found",
            };
          }

          Object.assign(asset, body);
          await asset.save();
          await asset.populate("property", "title location");

          set.status = 200;
          return {
            status: "success",
            data: {
              ...asset.toObject(),
              _id: (asset._id as mongoose.Types.ObjectId).toString(),
              property: asset.property?.toString(),
              landlord: asset.landlord.toString(),
            },
          };
        } catch (error) {
          logger.error("Error updating asset:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update asset",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Partial(createAssetRequestSchema),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: assetSchema,
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Update asset",
          description: "Update an existing asset record",
        },
      }
    )

    .use(accessPlugin("financial", "delete"))
    .delete(
      "/assets/:id",
      async ({ set, user, params }) => {
        try {
          const { id } = params;
          const asset = await Asset.findOne({ _id: id, landlord: user.id });

          if (!asset) {
            set.status = 404;
            return {
              status: "error",
              message: "Asset not found",
            };
          }

          await Asset.findByIdAndDelete(id);

          set.status = 200;
          return {
            status: "success",
            message: "Asset deleted successfully",
          };
        } catch (error) {
          logger.error("Error deleting asset:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete asset",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Delete asset",
          description: "Delete an asset record",
        },
      }
    )

    // Financial Settings
    .use(accessPlugin("financial", "read"))
    .get(
      "/settings",
      async ({ set, user }) => {
        try {
          let settings = await FinancialSettings.findOne({ landlord: user.id });

          if (!settings) {
            // Create default settings
            settings = await FinancialSettings.create({
              landlord: user.id,
              currency: "KES",
              taxYear: { startMonth: 1, endMonth: 12 },
              taxRates: { income: 30, property: 1.5, vat: 16 },
              depreciationRates: {
                property: 2.5,
                equipment: 20,
                furniture: 10,
                vehicle: 25,
                other: 10,
              },
              reportingPreferences: {
                frequency: "monthly",
                autoGenerate: false,
                emailReports: true,
              },
            });
          }

          set.status = 200;
          return {
            status: "success",
            data: {
              ...settings.toObject(),
              _id: (settings._id as mongoose.Types.ObjectId).toString(),
              landlord: settings.landlord.toString(),
            },
          };
        } catch (error) {
          logger.error("Error fetching financial settings:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch financial settings",
          };
        }
      },
      {
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: financialSettingsSchema,
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get financial settings",
          description:
            "Retrieve financial settings for the authenticated landlord",
        },
      }
    )

    .use(accessPlugin("financial", "update"))
    .patch(
      "/settings",
      async ({ set, user, body }) => {
        try {
          let settings = await FinancialSettings.findOne({ landlord: user.id });

          if (settings) {
            Object.assign(settings, body);
            await settings.save();
          } else {
            settings = await FinancialSettings.create({
              landlord: user.id,
              ...body,
            });
          }

          set.status = 200;
          return {
            status: "success",
            data: {
              ...settings.toObject(),
              _id: (settings._id as mongoose.Types.ObjectId).toString(),
              landlord: settings.landlord.toString(),
            },
          };
        } catch (error) {
          logger.error("Error updating financial settings:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update financial settings",
          };
        }
      },
      {
        body: updateFinancialSettingsRequestSchema,
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: financialSettingsSchema,
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Update financial settings",
          description:
            "Update financial settings for the authenticated landlord",
        },
      }
    )

    // Quick Stats
    .use(accessPlugin("financial", "read"))
    .get(
      "/dashboard",
      async ({ set, user, query }) => {
        try {
          const { period = "monthly" } = query;
          const periodData = financialService.getPeriodDates(
            period as "monthly" | "quarterly" | "yearly"
          );

          const report = await financialService.generateFinancialReport(
            user.id,
            "profit_loss",
            {
              startDate: periodData.startDate.toJSDate(),
              endDate: periodData.endDate.toJSDate(),
              type: periodData.type as
                | "monthly"
                | "quarterly"
                | "yearly"
                | "custom",
            }
          );

          // Get recent expenses
          const recentExpenses = await Expense.find({ landlord: user.id })
            .populate("property", "title location")
            .sort({ date: -1 })
            .limit(5);

          // Get pending expenses
          const pendingExpenses = await Expense.countDocuments({
            landlord: user.id,
            status: "pending",
          });

          set.status = 200;
          return {
            status: "success",
            data: {
              summary: report.data.summary,
              income: report.data.income,
              expenses: report.data.expenses,
              recentExpenses,
              pendingExpenses,
              period: periodData,
            },
          };
        } catch (error) {
          logger.error("Error fetching financial dashboard:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch financial dashboard",
          };
        }
      },
      {
        query: t.Object({
          period: t.Optional(
            t.Union([
              t.Literal("monthly"),
              t.Literal("quarterly"),
              t.Literal("yearly"),
            ])
          ),
        }),
        detail: {
          summary: "Get financial dashboard",
          description:
            "Get financial dashboard data with summary and recent activity",
        },
      }
    )

    // Analytics Endpoints
    .use(accessPlugin("financial", "read"))
    .get(
      "/analytics/expense-trends",
      async ({ set, user, query }) => {
        try {
          const { startDate, endDate, propertyId } = query;

          if (!(startDate && endDate)) {
            set.status = 400;
            return {
              status: "error",
              message: "Start date and end date are required",
            };
          }

          const trends = await financialService.getExpenseTrends(
            user.id,
            { startDate: new Date(startDate), endDate: new Date(endDate) },
            propertyId
          );

          set.status = 200;
          return {
            status: "success",
            data: trends as any,
          };
        } catch (error) {
          logger.error("Error fetching expense trends:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch expense trends",
          };
        }
      },
      {
        query: t.Object({
          startDate: t.String(),
          endDate: t.String(),
          propertyId: t.Optional(t.String()),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Array(expenseTrendSchema),
          }),
          400: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get expense trends",
          description: "Get expense trends over time for analytics",
        },
      }
    )

    .get(
      "/analytics/category-analytics",
      async ({ set, user, query }) => {
        try {
          const { startDate, endDate, propertyId } = query;

          if (!(startDate && endDate)) {
            set.status = 400;
            return {
              status: "error",
              message: "Start date and end date are required",
            };
          }

          const analytics = await financialService.getCategoryAnalytics(
            user.id,
            { startDate: new Date(startDate), endDate: new Date(endDate) },
            propertyId
          );

          set.status = 200;
          return {
            status: "success",
            data: analytics,
          };
        } catch (error) {
          logger.error("Error fetching category analytics:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch category analytics",
          };
        }
      },
      {
        query: t.Object({
          startDate: t.String(),
          endDate: t.String(),
          propertyId: t.Optional(t.String()),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Array(categoryAnalyticsSchema),
          }),
          400: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get category analytics",
          description: "Get expense analytics by category",
        },
      }
    )

    .get(
      "/analytics/performance-metrics",
      async ({ set, user, query }) => {
        try {
          const { startDate, endDate, propertyId } = query;

          if (!(startDate && endDate)) {
            set.status = 400;
            return {
              status: "error",
              message: "Start date and end date are required",
            };
          }

          const metrics = await financialService.getPerformanceMetrics(
            user.id,
            { startDate: new Date(startDate), endDate: new Date(endDate) },
            propertyId
          );

          set.status = 200;
          return {
            status: "success",
            data: metrics,
          };
        } catch (error) {
          logger.error("Error fetching performance metrics:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch performance metrics",
          };
        }
      },
      {
        query: t.Object({
          startDate: t.String(),
          endDate: t.String(),
          propertyId: t.Optional(t.String()),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: performanceMetricsSchema,
          }),
          400: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get performance metrics",
          description: "Get comprehensive performance metrics",
        },
      }
    )

    .get(
      "/analytics/comparative-analysis",
      async ({ set, user, query }) => {
        try {
          const {
            currentStart,
            currentEnd,
            previousStart,
            previousEnd,
            propertyId,
          } = query;

          if (!(currentStart && currentEnd && previousStart && previousEnd)) {
            set.status = 400;
            return {
              status: "error",
              message: "All period dates are required",
            };
          }

          const analysis = await financialService.getComparativeAnalysis(
            user.id,
            {
              startDate: new Date(currentStart),
              endDate: new Date(currentEnd),
            },
            {
              startDate: new Date(previousStart),
              endDate: new Date(previousEnd),
            },
            propertyId
          );

          set.status = 200;
          return {
            status: "success",
            data: analysis,
          };
        } catch (error) {
          logger.error("Error fetching comparative analysis:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch comparative analysis",
          };
        }
      },
      {
        query: t.Object({
          currentStart: t.String(),
          currentEnd: t.String(),
          previousStart: t.String(),
          previousEnd: t.String(),
          propertyId: t.Optional(t.String()),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: comparativeAnalysisSchema,
          }),
          400: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get comparative analysis",
          description: "Compare financial performance between two periods",
        },
      }
    )

    // Import/Export Endpoints
    .use(accessPlugin("financial", "create"))
    .post(
      "/import",
      async ({ set, user, body }) => {
        try {
          const { dataType, data, options } = body;

          const results = await financialService.batchImport(
            user.id,
            dataType,
            data,
            options
          );

          set.status = 201;
          return {
            status: "success",
            data: results,
          };
        } catch (error) {
          logger.error("Error importing data:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to import data",
          };
        }
      },
      {
        body: batchImportRequestSchema,
        response: {
          201: t.Object({
            status: t.Literal("success"),
            data: importResultSchema,
          }),
        },
        detail: {
          summary: "Batch import financial data",
          description: "Import expenses or assets in batch from uploaded data",
        },
      }
    )

    .use(accessPlugin("financial", "read"))
    .post(
      "/export",
      ({ set, body }) => {
        try {
          const { dataType, format, filters, options } = body;

          // For now, return a placeholder response
          // In a real implementation, you would generate the export file
          // and return either the file directly or a URL to download it
          set.status = 200;
          return {
            status: "success",
            message:
              "Export functionality will be implemented with file generation",
            data: {
              dataType,
              format,
              filters,
              options,
              exportId: `export_${Date.now()}`,
            },
          };
        } catch (error) {
          logger.error("Error exporting data:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to export data",
          };
        }
      },
      {
        body: exportConfigSchema,
        detail: {
          summary: "Export financial data",
          description: "Export expenses, assets, or reports in various formats",
        },
      }
    )
);
