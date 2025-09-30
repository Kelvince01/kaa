// import { Elysia } from "elysia";
// import { authPlugin } from "~/features/auth/auth.plugin";
// import { ReportsController } from "./reports.controller";

// // import { rateLimitPlugin } from '../../plugins/rate-limit.plugin';

// const reportsController = new ReportsController();

// export const reportsRoutes = new Elysia({ prefix: "/reports" })
//   .use(authPlugin)
//   // .use(rateLimitPlugin)

//   // Generate report
//   .post("/generate", reportsController.generateReport.bind(reportsController), {
//     // beforeHandle: ({ requireAuth }) => requireAuth(),
//     detail: {
//       tags: ["reports"],
//       summary: "Generate report",
//       description: "Generate a new report based on specified parameters",
//     },
//   })

//   // Get report by ID
//   .get("/:reportId", reportsController.getReport.bind(reportsController), {
//     // beforeHandle: ({ requireAuth }) => requireAuth(),
//     detail: {
//       tags: ["Reports"],
//       summary: "Get report",
//       description: "Get report details and data by ID",
//     },
//   })

//   // Get user reports
//   .get(
//     "/user/reports",
//     reportsController.getUserReports.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
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
//     reportsController.downloadReport.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
//       detail: {
//         tags: ["Reports"],
//         summary: "Download report",
//         description: "Get download URL for report file",
//       },
//     }
//   )

//   // Schedule management
//   .post("/schedule", reportsController.scheduleReport.bind(reportsController), {
//     // beforeHandle: ({ requireAuth }) => requireAuth(),
//     detail: {
//       tags: ["Reports", "Schedule"],
//       summary: "Schedule report",
//       description: "Schedule a report to be generated automatically",
//     },
//   })

//   .get(
//     "/schedules",
//     reportsController.getScheduledReports.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
//       detail: {
//         tags: ["Reports", "Schedule"],
//         summary: "Get scheduled reports",
//         description: "Get all scheduled reports for the user",
//       },
//     }
//   )

//   .put(
//     "/schedules/:scheduleId",
//     reportsController.updateReportSchedule.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
//       detail: {
//         tags: ["Reports", "Schedule"],
//         summary: "Update report schedule",
//         description: "Update an existing report schedule",
//       },
//     }
//   )

//   .delete(
//     "/schedules/:scheduleId",
//     reportsController.cancelReportSchedule.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
//       detail: {
//         tags: ["Reports", "Schedule"],
//         summary: "Cancel report schedule",
//         description: "Cancel a scheduled report",
//       },
//     }
//   )

//   // Template management
//   .post(
//     "/templates",
//     reportsController.createReportTemplate.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
//       detail: {
//         tags: ["Reports", "Templates"],
//         summary: "Create report template",
//         description: "Create a new report template",
//       },
//     }
//   )

//   .get(
//     "/templates",
//     reportsController.getReportTemplates.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
//       detail: {
//         tags: ["Reports", "Templates"],
//         summary: "Get report templates",
//         description: "Get available report templates",
//       },
//     }
//   )

//   // Analytics
//   .get(
//     "/analytics/reports",
//     reportsController.getReportAnalytics.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
//       detail: {
//         tags: ["Reports", "Analytics"],
//         summary: "Get report analytics",
//         description: "Get analytics on report usage and performance",
//       },
//     }
//   )

//   // Business Intelligence
//   .get(
//     "/business-intelligence",
//     reportsController.getBusinessIntelligence.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
//       detail: {
//         tags: ["Reports", "BI"],
//         summary: "Get business intelligence",
//         description: "Get business intelligence dashboard and metrics",
//       },
//     }
//   )

//   // Market Insights
//   .get(
//     "/market-insights",
//     reportsController.getMarketInsights.bind(reportsController),
//     {
//       // beforeHandle: ({ requireAuth }) => requireAuth(),
//       detail: {
//         tags: ["Reports", "Market"],
//         summary: "Get market insights",
//         description: "Get market insights and rental market analysis",
//       },
//     }
//   );
