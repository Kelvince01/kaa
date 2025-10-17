// import { reportsService } from "@kaa/services";
import { Elysia } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
// import {
//   ReportRequestSchema,
//   ReportScheduleSchema,
//   ReportTemplateSchema,
// } from "./report.schema";

// import { rateLimitPlugin } from '../../plugins/rate-limit.plugin';

export const reportsController = new Elysia({ prefix: "/reports" }).use(
  authPlugin
);
//   // .use(rateLimitPlugin)

//   // Generate report
//   .post(
//     "/generate",
//     async (context) => {
//       try {
//         const { id } = context.user;
//         const report = await reportsService.generateReport(context.body, id);
//         return { success: true, data: report };
//       } catch (error: any) {
//         context.set.status = 500;
//         return { error: "Failed to generate report", details: error.message };
//       }
//     },
//     {
//       body: ReportRequestSchema,
//       detail: {
//         tags: ["reports"],
//         summary: "Generate report",
//         description: "Generate a new report based on specified parameters",
//       },
//     }
//   )

//   // Get report by ID
//   .get(
//     "/:reportId",
//     async (context) => {
//       try {
//         const { reportId } = context.params;
//         const report = await reportsService.getReportById(reportId);
//         return { success: true, data: report };
//       } catch (error: any) {
//         context.set.status = 500;
//         return { error: "Failed to get report", details: error.message };
//       }
//     },
//     {
//       params: t.Object({
//         reportId: t.String(),
//       }),
//       detail: {
//         tags: ["Reports"],
//         summary: "Get report",
//         description: "Get report details and data by ID",
//       },
//     }
//   )

//   // Get user reports
//   .get(
//     "/user/reports",
//     async (context) => {
//       try {
//         const { id } = context.user;
//         const { page = 1, limit = 20, status, type } = context.query;
//         const reports = await reportsService.getUserReports(id, {
//           page,
//           limit,
//           status,
//           type,
//         });
//         return { success: true, data: reports };
//       } catch (error: any) {
//         context.set.status = 500;
//         return { error: "Failed to get user reports", details: error.message };
//       }
//     },
//     {
//       query: t.Object({
//         page: t.Number(),
//         limit: t.Number(),
//         status: t.String(),
//         type: t.String(),
//       }),
//       detail: {
//         tags: ["Reports"],
//         summary: "Get user reports",
//         description: "Get all reports for the authenticated user",
//       },
//     }
//   )

//   // Download report
//   .get(
//     "/:reportId/download",
//     async (context) => {
//       try {
//         const { reportId } = context.params;
//         const { format = "pdf" } = context.query;
//         const downloadUrl = await reportsService.getReportDownloadUrl(
//           reportId,
//           format
//         );

//         return { success: true, data: { downloadUrl } };
//       } catch (error: any) {
//         context.set.status = 500;
//         return { error: "Failed to download report", details: error.message };
//       }
//     },
//     {
//       params: t.Object({
//         reportId: t.String(),
//       }),
//       query: t.Object({
//         format: t.String(),
//       }),
//       detail: {
//         tags: ["Reports"],
//         summary: "Download report",
//         description: "Get download URL for report file",
//       },
//     }
//   )

//   // Schedule report
//   .post(
//     "/schedule",
//     async (context) => {
//       try {
//         const { id } = context.user;
//         const schedule = await reportsService.scheduleReport(context.body, id);
//         return { success: true, data: schedule };
//       } catch (error: any) {
//         context.set.status = 500;
//         return { error: "Failed to schedule report", details: error.message };
//       }
//     },
//     {
//       body: ReportScheduleSchema,
//       detail: {
//         tags: ["Reports", "Schedule"],
//         summary: "Schedule report",
//         description: "Schedule a report to be generated automatically",
//       },
//     }
//   )

//   // Get scheduled reports
//   .get(
//     "/schedules",
//     async (context) => {
//       try {
//         const { id } = context.user;
//         const { page = 1, limit = 20, active = true } = context.query;

//         const schedules = await reportsService.getScheduledReports(id, {
//           page,
//           limit,
//           active,
//         });
//         return { success: true, data: schedules };
//       } catch (error: any) {
//         context.set.status = 500;
//         return {
//           error: "Failed to get scheduled reports",
//           details: error.message,
//         };
//       }
//     },
//     {
//       query: t.Object({
//         page: t.Number(),
//         limit: t.Number(),
//         active: t.Boolean(),
//       }),
//       detail: {
//         tags: ["Reports", "Schedule"],
//         summary: "Get scheduled reports",
//         description: "Get all scheduled reports for the user",
//       },
//     }
//   )

//   // Update report schedule
//   .put(
//     "/schedules/:scheduleId",
//     async (context) => {
//       try {
//         const { scheduleId } = context.params;
//         const schedule = await reportsService.updateReportSchedule(
//           scheduleId,
//           context.body
//         );
//         return { success: true, data: schedule };
//       } catch (error: any) {
//         context.set.status = 500;
//         return {
//           error: "Failed to update report schedule",
//           details: error.message,
//         };
//       }
//     },
//     {
//       params: t.Object({
//         scheduleId: t.String(),
//       }),
//       body: t.Object({
//         frequency: t.String(),
//         parameters: t.Any(),
//         email: t.String(),
//         active: t.Boolean(),
//       }),
//       detail: {
//         tags: ["Reports", "Schedule"],
//         summary: "Update report schedule",
//         description: "Update an existing report schedule",
//       },
//     }
//   )

//   // Cancel report schedule
//   .delete(
//     "/schedules/:scheduleId",
//     async (context) => {
//       try {
//         const { scheduleId } = context.params;
//         await reportsService.cancelReportSchedule(scheduleId);
//         return { success: true, message: "Schedule cancelled successfully" };
//       } catch (error: any) {
//         context.set.status = 500;
//         return {
//           error: "Failed to cancel report schedule",
//           details: error.message,
//         };
//       }
//     },
//     {
//       params: t.Object({
//         scheduleId: t.String(),
//       }),
//       detail: {
//         tags: ["Reports", "Schedule"],
//         summary: "Cancel report schedule",
//         description: "Cancel a scheduled report",
//       },
//     }
//   )

//   // Create report template
//   .post(
//     "/templates",
//     async (context) => {
//       try {
//         const { id } = context.user;
//         const template = await reportsService.createReportTemplate(
//           context.body,
//           id
//         );
//         return { success: true, data: template };
//       } catch (error: any) {
//         context.set.status = 500;
//         return {
//           error: "Failed to create report template",
//           details: error.message,
//         };
//       }
//     },
//     {
//       body: ReportTemplateSchema,
//       detail: {
//         tags: ["Reports", "Templates"],
//         summary: "Create report template",
//         description: "Create a new report template",
//       },
//     }
//   )

//   // Get report templates
//   .get(
//     "/templates",
//     async (context) => {
//       try {
//         const { id } = context.user;
//         const { page = "1", limit = "20", category } = context.query;
//         const templates = await reportsService.getReportTemplates(id, {
//           page,
//           limit,
//           category,
//         });
//         return { success: true, data: templates };
//       } catch (error: any) {
//         context.set.status = 500;
//         return {
//           error: "Failed to get report templates",
//           details: error.message,
//         };
//       }
//     },
//     {
//       query: t.Object({
//         page: t.Number(),
//         limit: t.Number(),
//         category: t.String(),
//       }),
//       detail: {
//         tags: ["Reports", "Templates"],
//         summary: "Get report templates",
//         description: "Get available report templates",
//       },
//     }
//   )

//   // Get report analytics
//   .get(
//     "/analytics/reports",
//     async (context) => {
//       try {
//         const { id } = context.user;
//         const { period = "30d" } = context.query;
//         const analytics = await reportsService.getReportAnalytics(id, period);
//         return { success: true, data: analytics };
//       } catch (error: any) {
//         context.set.status = 500;
//         return {
//           error: "Failed to get report analytics",
//           details: error.message,
//         };
//       }
//     },
//     {
//       query: t.Object({
//         period: t.String(),
//       }),
//       detail: {
//         tags: ["Reports", "Analytics"],
//         summary: "Get report analytics",
//         description: "Get analytics on report usage and performance",
//       },
//     }
//   )

//   // Get business intelligence
//   .get(
//     "/business-intelligence",
//     async (context) => {
//       try {
//         const {
//           timeframe = "30d",
//           metrics,
//           county,
//           propertyType,
//         } = context.query;

//         const bi = await reportsService.getBusinessIntelligence({
//           timeframe,
//           metrics: metrics?.split(","),
//           county,
//           propertyType,
//         });

//         return { success: true, data: bi };
//       } catch (error: any) {
//         context.set.status = 500;
//         return {
//           error: "Failed to get business intelligence",
//           details: error.message,
//         };
//       }
//     },
//     {
//       query: t.Object({
//         timeframe: t.String(),
//         metrics: t.String(),
//         county: t.String(),
//         propertyType: t.String(),
//       }),
//       detail: {
//         tags: ["Reports", "BI"],
//         summary: "Get business intelligence",
//         description: "Get business intelligence dashboard and metrics",
//       },
//     }
//   )

//   // Get market insights
//   .get(
//     "/market-insights",
//     async (context) => {
//       try {
//         const {
//           location,
//           propertyType,
//           priceRange,
//           period = "30d",
//         } = context.query;

//         const insights = await reportsService.getMarketInsights({
//           location,
//           propertyType,
//           priceRange,
//           period,
//         });
//         return { success: true, data: insights };
//       } catch (error: any) {
//         context.set.status = 500;
//         return {
//           error: "Failed to get market insights",
//           details: error.message,
//         };
//       }
//     },
//     {
//       query: t.Object({
//         location: t.String(),
//         propertyType: t.String(),
//         priceRange: t.String(),
//         period: t.String(),
//       }),
//       detail: {
//         tags: ["Reports", "Market"],
//         summary: "Get market insights",
//         description: "Get market insights and rental market analysis",
//       },
//     }
//   );
