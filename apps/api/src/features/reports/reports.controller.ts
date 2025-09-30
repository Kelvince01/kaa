// import { reportsService } from "@kaa/services";
// import type { Context as ReportContext } from "elysia";
// import {
//   ReportRequestSchema,
//   ReportScheduleSchema,
//   ReportTemplateSchema,
// } from "./report.schema";

// type Context = ReportContext & {
//   user: any;
// };

// export class ReportsController {
//   /**
//    * @description Generate a report
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async generateReport(context: Context): Promise<any> {
//     const validation = ReportRequestSchema.safeParse(context.body);

//     if (!validation.success) {
//       context.set.status = 400;
//       return {
//         error: "Invalid report request",
//         details: validation.error.flatten(),
//       };
//     }

//     try {
//       const { userId } = context.user as { userId: string };
//       const report = await reportsService.generateReport(
//         validation.data,
//         userId
//       );
//       return { success: true, data: report };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to generate report", details: error.message };
//     }
//   }

//   /**
//    * @description Get report by ID
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async getReport(context: Context): Promise<any> {
//     try {
//       const { reportId } = context.params as { reportId: string };

//       if (!reportId) {
//         context.set.status = 400;
//         return { error: "Report ID is required" };
//       }

//       const report = await reportsService.getReportById(reportId);
//       if (!report) {
//         context.set.status = 404;
//         return { error: "Report not found" };
//       }

//       return { success: true, data: report };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to get report", details: error.message };
//     }
//   }

//   /**
//    * @description Get user reports
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async getUserReports(context: Context): Promise<any> {
//     try {
//       const { userId } = context.user as { userId: string };
//       const {
//         page = "1",
//         limit = "20",
//         status,
//         type,
//       } = context.query as {
//         page?: string;
//         limit?: string;
//         status?: string;
//         type?: string;
//       };

//       const reports = await reportsService.getUserReports(userId, {
//         page: Number.parseInt(page, 10),
//         limit: Number.parseInt(limit, 10),
//         status,
//         type,
//       });

//       return { success: true, data: reports };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to get user reports", details: error.message };
//     }
//   }

//   /**
//    * @description Download report file
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async downloadReport(context: Context): Promise<any> {
//     try {
//       const { reportId } = context.params as { reportId: string };
//       const { format = "pdf" } = context.query as { format?: string };

//       if (!reportId) {
//         context.set.status = 400;
//         return { error: "Report ID is required" };
//       }

//       const downloadUrl = await reportsService.getReportDownloadUrl(
//         reportId,
//         format
//       );
//       return { success: true, data: { downloadUrl } };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to get download URL", details: error.message };
//     }
//   }

//   /**
//    * @description Schedule a report
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async scheduleReport(context: Context): Promise<any> {
//     const validation = ReportScheduleSchema.safeParse(context.body);

//     if (!validation.success) {
//       context.set.status = 400;
//       return {
//         error: "Invalid schedule data",
//         details: validation.error.flatten(),
//       };
//     }

//     try {
//       const { userId } = context.user as { userId: string };
//       const schedule = await reportsService.scheduleReport(
//         validation.data,
//         userId
//       );
//       return { success: true, data: schedule };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to schedule report", details: error.message };
//     }
//   }

//   /**
//    * @description Get scheduled reports
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async getScheduledReports(context: Context): Promise<any> {
//     try {
//       const { userId } = context.user as { userId: string };
//       const {
//         page = "1",
//         limit = "20",
//         active,
//       } = context.query as {
//         page?: string;
//         limit?: string;
//         active?: string;
//       };

//       const schedules = await reportsService.getScheduledReports(userId, {
//         page: Number.parseInt(page, 10),
//         limit: Number.parseInt(limit, 10),
//         active: active === "true",
//       });

//       return { success: true, data: schedules };
//     } catch (error: any) {
//       context.set.status = 500;
//       return {
//         error: "Failed to get scheduled reports",
//         details: error.message,
//       };
//     }
//   }

//   /**
//    * @description Update report schedule
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async updateReportSchedule(context: Context): Promise<any> {
//     try {
//       const { scheduleId } = context.params as { scheduleId: string };

//       if (!scheduleId) {
//         context.set.status = 400;
//         return { error: "Schedule ID is required" };
//       }

//       const validation = ReportScheduleSchema.partial().safeParse(context.body);
//       if (!validation.success) {
//         context.set.status = 400;
//         return {
//           error: "Invalid schedule data",
//           details: validation.error.flatten(),
//         };
//       }

//       const schedule = await reportsService.updateReportSchedule(
//         scheduleId,
//         validation.data
//       );
//       if (!schedule) {
//         context.set.status = 404;
//         return { error: "Schedule not found" };
//       }

//       return { success: true, data: schedule };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to update schedule", details: error.message };
//     }
//   }

//   /**
//    * @description Cancel report schedule
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async cancelReportSchedule(context: Context): Promise<any> {
//     try {
//       const { scheduleId } = context.params as { scheduleId: string };

//       if (!scheduleId) {
//         context.set.status = 400;
//         return { error: "Schedule ID is required" };
//       }

//       await reportsService.cancelReportSchedule(scheduleId);
//       return { success: true, message: "Schedule cancelled successfully" };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to cancel schedule", details: error.message };
//     }
//   }

//   /**
//    * @description Create report template
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async createReportTemplate(context: Context): Promise<any> {
//     const validation = ReportTemplateSchema.safeParse(context.body);

//     if (!validation.success) {
//       context.set.status = 400;
//       return {
//         error: "Invalid template data",
//         details: validation.error.flatten(),
//       };
//     }

//     try {
//       const { userId } = context.user as { userId: string };
//       const template = await reportsService.createReportTemplate(
//         validation.data,
//         userId
//       );
//       return { success: true, data: template };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to create template", details: error.message };
//     }
//   }

//   /**
//    * @description Get report templates
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async getReportTemplates(context: Context): Promise<any> {
//     try {
//       const { userId } = context.user as { userId: string };
//       const {
//         page = "1",
//         limit = "20",
//         category,
//       } = context.query as {
//         page?: string;
//         limit?: string;
//         category?: string;
//       };

//       const templates = await reportsService.getReportTemplates(userId, {
//         page: Number.parseInt(page, 10),
//         limit: Number.parseInt(limit, 10),
//         category,
//       });

//       return { success: true, data: templates };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to get templates", details: error.message };
//     }
//   }

//   /**
//    * @description Get report analytics
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async getReportAnalytics(context: Context): Promise<any> {
//     try {
//       const { userId } = context.user as { userId: string };
//       const { period = "30d" } = context.query as { period?: string };

//       const analytics = await reportsService.getReportAnalytics(userId, period);
//       return { success: true, data: analytics };
//     } catch (error: any) {
//       context.set.status = 500;
//       return {
//         error: "Failed to get report analytics",
//         details: error.message,
//       };
//     }
//   }

//   /**
//    * @description Get business intelligence dashboard
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async getBusinessIntelligence(context: Context): Promise<any> {
//     try {
//       const {
//         timeframe = "30d",
//         metrics,
//         county,
//         propertyType,
//       } = context.query as {
//         timeframe?: string;
//         metrics?: string;
//         county?: string;
//         propertyType?: string;
//       };

//       const bi = await reportsService.getBusinessIntelligence({
//         timeframe,
//         metrics: metrics?.split(","),
//         county,
//         propertyType,
//       });

//       return { success: true, data: bi };
//     } catch (error: any) {
//       context.set.status = 500;
//       return {
//         error: "Failed to get business intelligence",
//         details: error.message,
//       };
//     }
//   }

//   /**
//    * @description Get market insights
//    * @param {Context} context
//    * @returns {Promise<any>}
//    */
//   async getMarketInsights(context: Context): Promise<any> {
//     try {
//       const {
//         location,
//         propertyType,
//         priceRange,
//         period = "30d",
//       } = context.query as {
//         location?: string;
//         propertyType?: string;
//         priceRange?: string;
//         period?: string;
//       };

//       const insights = await reportsService.getMarketInsights({
//         location,
//         propertyType,
//         priceRange,
//         period,
//       });

//       return { success: true, data: insights };
//     } catch (error: any) {
//       context.set.status = 500;
//       return { error: "Failed to get market insights", details: error.message };
//     }
//   }
// }
