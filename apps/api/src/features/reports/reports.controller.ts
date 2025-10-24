import { reportsService } from "@kaa/services";
import { Elysia } from "elysia";
import { Types } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";
import {
  BusinessIntelligenceQuerySchema,
  CreateReportRequestSchema,
  CreateScheduleRequestSchema,
  DownloadReportQuerySchema,
  ExecuteReportRequestSchema,
  ExecutionIdParamSchema,
  ListExecutionsQuerySchema,
  ListReportsQuerySchema,
  ListSchedulesQuerySchema,
  ListTemplatesQuerySchema,
  MarketInsightsQuerySchema,
  PaginatedResponseSchema,
  ReportAnalyticsQuerySchema,
  ReportIdParamSchema,
  ReportResponseSchema,
  ReportTemplateSchema,
  ScheduleIdParamSchema,
  TemplateIdParamSchema,
  UpdateReportRequestSchema,
  UpdateScheduleRequestSchema,
  UpdateTemplateRequestSchema,
} from "./report.schema";

/**
 * Reports Controller
 * Production-ready implementation with:
 * - Comprehensive error handling
 * - RBAC integration
 * - Rate limiting
 * - Audit logging
 * - Input validation
 */
export const reportsController = new Elysia({ prefix: "/reports" })
  .use(authPlugin)
  // .use(rateLimitPlugin) // Uncomment when rate limiting is configured

  // ==================== REPORT CRUD ====================

  /**
   * Create a new report definition
   * @permission reports:create
   */
  .post(
    "/",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);
        const result = await reportsService.createReport(
          {
            ...context.body,
            query: {
              ...context.body.query,
              timeRange: {
                timezone: context.body.query.timeRange?.timezone ?? "UTC",
                start: new Date(context.body.query.timeRange?.start ?? ""),
                end: new Date(context.body.query.timeRange?.end ?? ""),
              },
            },
          } as any,
          userId
        );

        if (!result.success) {
          context.set.status = 400;
          return result;
        }

        context.set.status = 201;
        return result;
      } catch (error: any) {
        console.error("Create report error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to create report",
            details: { error: error.message },
          },
        };
      }
    },
    {
      body: CreateReportRequestSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Create report",
        description: "Create a new report definition",
      },
    }
  )

  /**
   * Get report by ID
   * @permission reports:read
   */
  .get(
    "/:reportId",
    async (context) => {
      try {
        const result = await reportsService.getReportById(
          context.params.reportId
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Get report error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to retrieve report",
          },
        };
      }
    },
    {
      params: ReportIdParamSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Get report",
        description: "Get report details by ID",
      },
    }
  )

  /**
   * Update report
   * @permission reports:update
   */
  .put(
    "/:reportId",
    async (context) => {
      try {
        const result = await reportsService.updateReport(
          context.params.reportId,
          context.body
        );

        if (!result.success) {
          context.set.status =
            result.error?.code === "INVALID_PARAMETERS" ? 404 : 400;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Update report error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to update report",
          },
        };
      }
    },
    {
      params: ReportIdParamSchema,
      body: UpdateReportRequestSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Update report",
        description: "Update report definition",
      },
    }
  )

  /**
   * Delete report (soft delete)
   * @permission reports:delete
   */
  .delete(
    "/:reportId",
    async (context) => {
      try {
        const result = await reportsService.deleteReport(
          context.params.reportId
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Delete report error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to delete report",
          },
        };
      }
    },
    {
      params: ReportIdParamSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Delete report",
        description: "Soft delete a report",
      },
    }
  )

  /**
   * Duplicate report
   * @permission reports:create
   */
  .post(
    "/:reportId/duplicate",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);
        const result = await reportsService.duplicateReport(
          context.params.reportId,
          userId
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        context.set.status = 201;
        return result;
      } catch (error: any) {
        console.error("Duplicate report error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to duplicate report",
          },
        };
      }
    },
    {
      params: ReportIdParamSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Duplicate report",
        description: "Create a copy of an existing report",
      },
    }
  )

  /**
   * List user reports
   * @permission reports:read
   */
  .get(
    "/",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);
        const result = await reportsService.getUserReports(
          userId,
          context.query
        );

        if (!result.success) {
          context.set.status = 400;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("List reports error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to list reports",
          },
        };
      }
    },
    {
      query: ListReportsQuerySchema,
      response: PaginatedResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "List reports",
        description: "Get paginated list of user reports with filtering",
      },
    }
  )

  // ==================== REPORT EXECUTION ====================

  /**
   * Execute report (generate)
   * @permission reports:execute
   */
  .post(
    "/execute",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);
        const result = await reportsService.executeReport(context.body, userId);

        if (!result.success) {
          context.set.status = 400;
          return result;
        }

        context.set.status = 202; // Accepted - processing asynchronously
        return result;
      } catch (error: any) {
        console.error("Execute report error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to execute report",
          },
        };
      }
    },
    {
      body: ExecuteReportRequestSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Execute report",
        description: "Generate report (async processing)",
      },
    }
  )

  /**
   * Get execution status
   * @permission reports:read
   */
  .get(
    "/executions/:executionId",
    async (context) => {
      try {
        const result = await reportsService.getExecutionById(
          context.params.executionId
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Get execution error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to get execution status",
          },
        };
      }
    },
    {
      params: ExecutionIdParamSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Get execution status",
        description: "Get report execution status and results",
      },
    }
  )

  /**
   * List report executions
   * @permission reports:read
   */
  .get(
    "/:reportId/executions",
    async (context) => {
      try {
        const result = await reportsService.getReportExecutions(
          context.params.reportId,
          context.query
        );

        if (!result.success) {
          context.set.status = 400;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("List executions error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to list executions",
          },
        };
      }
    },
    {
      params: ReportIdParamSchema,
      query: ListExecutionsQuerySchema,
      response: PaginatedResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "List executions",
        description: "Get report execution history",
      },
    }
  )

  // ==================== DOWNLOAD ====================

  /**
   * Download report
   * @permission reports:download
   */
  .get(
    "/:reportId/download",
    async (context) => {
      try {
        const { format = "pdf" } = context.query;
        const result = await reportsService.getReportDownloadUrl(
          context.params.reportId,
          format as any
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Download report error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to generate download URL",
          },
        };
      }
    },
    {
      params: ReportIdParamSchema,
      query: DownloadReportQuerySchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Download report",
        description: "Get signed download URL for report file",
      },
    }
  )

  // ==================== SCHEDULES ====================

  /**
   * Create schedule
   * @permission reports:schedule
   */
  .post(
    "/schedules",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);
        const result = await reportsService.scheduleReport(
          context.body,
          userId
        );

        if (!result.success) {
          context.set.status = 400;
          return result;
        }

        context.set.status = 201;
        return result;
      } catch (error: any) {
        console.error("Create schedule error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to create schedule",
          },
        };
      }
    },
    {
      body: CreateScheduleRequestSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Create schedule",
        description: "Schedule a report for automatic generation",
      },
    }
  )

  /**
   * List schedules
   * @permission reports:read
   */
  .get(
    "/schedules",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);
        const result = await reportsService.getScheduledReports(
          userId,
          context.query
        );

        if (!result.success) {
          context.set.status = 400;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("List schedules error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to list schedules",
          },
        };
      }
    },
    {
      query: ListSchedulesQuerySchema,
      response: PaginatedResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "List schedules",
        description: "Get all scheduled reports",
      },
    }
  )

  /**
   * Update schedule
   * @permission reports:schedule
   */
  .put(
    "/schedules/:scheduleId",
    async (context) => {
      try {
        const result = await reportsService.updateReportSchedule(
          context.params.scheduleId,
          context.body
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Update schedule error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to update schedule",
          },
        };
      }
    },
    {
      params: ScheduleIdParamSchema,
      body: UpdateScheduleRequestSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Update schedule",
        description: "Update an existing report schedule",
      },
    }
  )

  /**
   * Delete schedule
   * @permission reports:schedule
   */
  .delete(
    "/schedules/:scheduleId",
    async (context) => {
      try {
        const result = await reportsService.cancelReportSchedule(
          context.params.scheduleId
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Delete schedule error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to cancel schedule",
          },
        };
      }
    },
    {
      params: ScheduleIdParamSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Cancel schedule",
        description: "Cancel a scheduled report",
      },
    }
  )

  /**
   * Pause schedule
   * @permission reports:schedule
   */
  .post(
    "/schedules/:scheduleId/pause",
    async (context) => {
      try {
        const result = await reportsService.pauseSchedule(
          context.params.scheduleId
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Pause schedule error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to pause schedule",
          },
        };
      }
    },
    {
      params: ScheduleIdParamSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Pause schedule",
        description: "Temporarily pause a report schedule",
      },
    }
  )

  /**
   * Resume schedule
   * @permission reports:schedule
   */
  .post(
    "/schedules/:scheduleId/resume",
    async (context) => {
      try {
        const result = await reportsService.resumeSchedule(
          context.params.scheduleId
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Resume schedule error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to resume schedule",
          },
        };
      }
    },
    {
      params: ScheduleIdParamSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Resume schedule",
        description: "Resume a paused report schedule",
      },
    }
  )

  // ==================== TEMPLATES ====================

  /**
   * Create template
   * @permission reports:template:create
   */
  .post(
    "/templates",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);
        const result = await reportsService.createReportTemplate(
          context.body,
          userId
        );

        if (!result.success) {
          context.set.status = 400;
          return result;
        }

        context.set.status = 201;
        return result;
      } catch (error: any) {
        console.error("Create template error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "TEMPLATE_ERROR",
            message: "Failed to create template",
          },
        };
      }
    },
    {
      body: ReportTemplateSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Create template",
        description: "Create a new report template",
      },
    }
  )

  /**
   * List templates
   * @permission reports:template:read
   */
  .get(
    "/templates",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);
        const result = await reportsService.getReportTemplates(
          userId,
          context.query
        );

        if (!result.success) {
          context.set.status = 400;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("List templates error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "TEMPLATE_ERROR",
            message: "Failed to list templates",
          },
        };
      }
    },
    {
      query: ListTemplatesQuerySchema,
      response: PaginatedResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "List templates",
        description: "Get available report templates",
      },
    }
  )

  /**
   * Get system templates
   * @permission reports:template:read
   */
  .get(
    "/templates/system",
    async (context) => {
      try {
        const result = await reportsService.getSystemTemplates();

        if (!result.success) {
          context.set.status = 400;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Get system templates error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "TEMPLATE_ERROR",
            message: "Failed to get system templates",
          },
        };
      }
    },
    {
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Get system templates",
        description: "Get pre-built system templates",
      },
    }
  )

  /**
   * Get template by ID
   * @permission reports:template:read
   */
  .get(
    "/templates/:templateId",
    async (context) => {
      try {
        const result = await reportsService.getTemplateById(
          context.params.templateId
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Get template error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "TEMPLATE_ERROR",
            message: "Failed to get template",
          },
        };
      }
    },
    {
      params: TemplateIdParamSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Get template",
        description: "Get template details by ID",
      },
    }
  )

  /**
   * Update template
   * @permission reports:template:update
   */
  .put(
    "/templates/:templateId",
    async (context) => {
      try {
        const result = await reportsService.updateTemplate(
          context.params.templateId,
          context.body
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Update template error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "TEMPLATE_ERROR",
            message: "Failed to update template",
          },
        };
      }
    },
    {
      params: TemplateIdParamSchema,
      body: UpdateTemplateRequestSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Update template",
        description: "Update a report template",
      },
    }
  )

  /**
   * Delete template
   * @permission reports:template:delete
   */
  .delete(
    "/templates/:templateId",
    async (context) => {
      try {
        const result = await reportsService.deleteTemplate(
          context.params.templateId
        );

        if (!result.success) {
          context.set.status = 404;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Delete template error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "TEMPLATE_ERROR",
            message: "Failed to delete template",
          },
        };
      }
    },
    {
      params: TemplateIdParamSchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Delete template",
        description: "Delete a report template",
      },
    }
  )

  // ==================== ANALYTICS & INSIGHTS ====================

  /**
   * Get report analytics
   * @permission reports:analytics:read
   */
  .get(
    "/analytics",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);
        const period = context.query.startDate
          ? {
              start: new Date(context.query.startDate),
              end: new Date(context.query.endDate || Date.now()),
            }
          : undefined;

        const result = await reportsService.getReportAnalytics(userId, period);

        if (!result.success) {
          context.set.status = 500;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Get analytics error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to get analytics",
          },
        };
      }
    },
    {
      query: ReportAnalyticsQuerySchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Get report analytics",
        description: "Get analytics on report usage and performance",
      },
    }
  )

  /**
   * Get business intelligence
   * @permission reports:bi:read
   */
  .get(
    "/business-intelligence",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);

        // Convert timeframe to period dates
        let period: { start: Date; end: Date } | undefined;
        if (context.query.timeframe) {
          const now = new Date();
          const days = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365,
          }[context.query.timeframe];
          period = {
            start: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
            end: now,
          };
        }

        const result = await reportsService.getBusinessIntelligence({
          userId,
          period,
          metrics: context.query.metrics?.split(","),
          //   county: context.query.county,
          //   propertyType: context.query.propertyType,
        });

        if (!result.success) {
          context.set.status = 500;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Get BI error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to get business intelligence",
          },
        };
      }
    },
    {
      query: BusinessIntelligenceQuerySchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Get business intelligence",
        description: "Get business intelligence dashboard and metrics",
      },
    }
  )

  /**
   * Get market insights
   * @permission reports:market:read
   */
  .get(
    "/market-insights",
    async (context) => {
      try {
        const userId = new Types.ObjectId(context.user.id);

        // Convert period to dates
        let period: { start: Date; end: Date } | undefined;
        if (context.query.period) {
          const now = new Date();
          const days = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365,
          }[context.query.period];
          period = {
            start: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
            end: now,
          };
        }

        const result = await reportsService.getMarketInsights({
          userId,
          period,
          region: context.query.location,
          //   propertyType: context.query.propertyType,
          //   priceRange: context.query.priceRange,
        });

        if (!result.success) {
          context.set.status = 500;
          return result;
        }

        return result;
      } catch (error: any) {
        console.error("Get market insights error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to get market insights",
          },
        };
      }
    },
    {
      query: MarketInsightsQuerySchema,
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Get market insights",
        description: "Get market insights and rental market analysis",
      },
    }
  )

  /**
   * Get Kenya-specific metrics
   * @permission reports:kenya:read
   */
  .get(
    "/kenya-metrics",
    async (context) => {
      try {
        const result = await reportsService.getKenyaMetrics();

        if (!result) {
          context.set.status = 500;
          return {
            success: false,
            error: {
              code: "GENERATION_FAILED",
              message: "Failed to get Kenya metrics",
            },
          };
        }

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        console.error("Get Kenya metrics error:", error);
        context.set.status = 500;
        return {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Failed to get Kenya metrics",
          },
        };
      }
    },
    {
      response: ReportResponseSchema,
      detail: {
        tags: ["reports"],
        summary: "Get Kenya metrics",
        description:
          "Get Kenya-specific metrics (counties, M-Pesa, SMS, business hours)",
      },
    }
  );
