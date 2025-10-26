import { PropertyValuationService } from "@kaa/services";
import { Elysia, t } from "elysia";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

export const valuationController = new Elysia({ prefix: "/valuations" })
  .use(accessPlugin("valuation", "create"))

  // Create valuation
  .post(
    "/",
    async ({ body }) =>
      await PropertyValuationService.createValuation(body as any),
    {
      body: t.Object({
        propertyId: t.String(),
        type: t.String(),
        requestedBy: t.String(),
        effectiveDate: t.Optional(t.String()),
        includeProfessionalAppraisal: t.Optional(t.Boolean()),
        includeRentalEstimate: t.Optional(t.Boolean()),
        purpose: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Create a new property valuation",
        description: "Create a new property valuation",
      },
    }
  )

  // Generate automated valuation
  .post(
    "/generate/:propertyId",
    async ({ params, body }) =>
      await PropertyValuationService.generateAutomatedValuation(
        params.propertyId,
        body.requestedBy
      ),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      body: t.Object({
        requestedBy: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Generate automated valuation",
        description: "Generate automated valuation",
      },
    }
  )

  .use(accessPlugin("valuation", "read"))

  // Get all valuations with filtering
  .get(
    "/",
    async ({ query }) => await PropertyValuationService.getValuations(query),
    {
      query: t.Object({
        property: t.Optional(t.String()),
        requestedBy: t.Optional(t.String()),
        type: t.Optional(t.String()),
        status: t.Optional(t.String()),
        confidence: t.Optional(t.String()),
        dateFrom: t.Optional(t.String()),
        dateTo: t.Optional(t.String()),
        minValue: t.Optional(t.Number()),
        maxValue: t.Optional(t.Number()),
        includeExpired: t.Optional(t.Boolean()),
        sortBy: t.Optional(t.String()),
        sortOrder: t.Optional(t.String()),
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        search: t.Optional(t.String()),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get valuations",
        description: "Get valuations",
      },
    }
  )

  // Get valuation by ID
  .get(
    "/:id",
    async ({ params }) =>
      await PropertyValuationService.getValuation(params.id),
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get valuation by ID",
        description: "Get valuation by ID",
      },
    }
  )

  // Get valuation statistics
  .get(
    "/stats",
    async ({ query }) =>
      await PropertyValuationService.getValuationStats(query),
    {
      query: t.Object({
        propertyId: t.String(),
        method: t.String(),
        requestedBy: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get valuation statistics",
        description: "Get valuation statistics",
      },
    }
  )

  // Get property valuations
  .get(
    "/property/:propertyId",
    async ({ params }) =>
      await PropertyValuationService.getValuationHistory(params.propertyId),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get valuation by ID",
        description: "Get valuation by ID",
      },
    }
  )

  // Get latest property valuation
  .get(
    "/property/:propertyId/latest",
    async ({ params }) =>
      await PropertyValuationService.getLatestValuation(params.propertyId),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get latest property valuation",
        description: "Get latest property valuation",
      },
    }
  )

  // Get comparable properties
  .get(
    "/property/:propertyId/comparables",
    async ({ params, query }) =>
      await PropertyValuationService.getComparableProperties(
        params.propertyId,
        query.radius,
        query.limit
      ),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      query: t.Object({
        radius: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get comparable properties",
        description: "Get comparable properties",
      },
    }
  )

  // Get market analysis
  .get(
    "/property/:propertyId/market-analysis",
    async ({ params, query }) =>
      await PropertyValuationService.getMarketAnalysis(
        params.propertyId,
        query.radius
      ),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      query: t.Object({
        radius: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get market analysis",
        description: "Get market analysis",
      },
    }
  )

  // Generate market analysis
  .post(
    "/:propertyId/market-analysis/generate",
    async ({ params }) =>
      await PropertyValuationService.generateMarketAnalysis(params.propertyId),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Generate market analysis",
        description: "Generate market analysis",
      },
    }
  )

  // Get rental estimate
  .get(
    "/property/:propertyId/rental-estimate",
    async ({ params }) =>
      await PropertyValuationService.getRentalEstimate(params.propertyId),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get rental estimate",
        description: "Get rental estimate",
      },
    }
  )

  // Generate rental estimate
  .post(
    "/:propertyId/rental-estimate/generate",
    async ({ params }) =>
      await PropertyValuationService.generateRentalEstimate(params.propertyId),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Generate rental estimate",
        description: "Generate rental estimate",
      },
    }
  )

  // Get valuation trends
  .get(
    "/trends",
    async ({ query }) =>
      await PropertyValuationService.getValuationTrends(
        query.propertyId,
        query.period
      ),
    {
      query: t.Object({
        propertyId: t.Optional(t.String()),
        period: t.Optional(t.String()),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get valuation trends",
        description: "Get valuation trends",
      },
    }
  )

  // Get portfolio valuation
  .get(
    "/portfolios/:portfolioId/valuation",
    async ({ params }) =>
      await PropertyValuationService.getPortfolioValuation(params.portfolioId),
    {
      params: t.Object({
        portfolioId: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get portfolio valuation",
        description: "Get portfolio valuation",
      },
    }
  )

  // Get recent valuations
  .get(
    "/recent",
    async ({ query }) =>
      await PropertyValuationService.getRecentValuations(query.days),
    {
      query: t.Object({
        days: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get valuation alerts",
        description: "Get valuation alerts",
      },
    }
  )

  // Get valuation alerts
  .get(
    "/alerts",
    async ({ query }) =>
      await PropertyValuationService.getValuationAlerts(query.propertyId),
    {
      query: t.Object({
        propertyId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Get valuation alerts",
        description: "Get valuation alerts",
      },
    }
  )

  .use(accessPlugin("valuation", "update"))

  // Update valuation
  .put(
    "/:id",
    async ({ params, body }) =>
      await PropertyValuationService.updateValuation(params.id, body),
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        propertyId: t.String(),
        method: t.String(),
        requestedBy: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Bulk request valuations",
        description: "Bulk request valuations",
      },
    }
  )

  // Bulk request valuations
  .post(
    "/bulk-request",
    async ({ body }) =>
      await PropertyValuationService.bulkRequestValuations(
        body.propertyIds,
        body.valuationType,
        body.priority
      ),
    {
      body: t.Object({
        propertyIds: t.Array(t.String()),
        valuationType: t.String(),
        priority: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Bulk request valuations",
        description: "Bulk request valuations",
      },
    }
  )

  // Bulk update valuations
  .put(
    "/bulk-update",
    async ({ body }) =>
      await PropertyValuationService.bulkUpdateValuations(
        body.valuationIds,
        body.updates
      ),
    {
      body: t.Object({
        valuationIds: t.Array(t.String()),
        updates: t.Object({
          propertyId: t.String(),
          method: t.String(),
          requestedBy: t.String(),
        }),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Bulk update valuations",
        description: "Bulk update valuations",
      },
    }
  )

  // Validate valuation
  .post(
    "/property/:id/validate",
    async ({ params, body }) =>
      await PropertyValuationService.validateValuation(
        params.id,
        body.validationNotes
      ),
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        validationNotes: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Create valuation alert",
        description: "Create valuation alert",
      },
    }
  )

  // Create valuation alert
  .post(
    "/alerts",
    async ({ body }) =>
      await PropertyValuationService.createValuationAlert(
        body.propertyId,
        body.alertType,
        body.threshold
      ),
    {
      body: t.Object({
        propertyId: t.String(),
        alertType: t.String(),
        threshold: t.Number(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Update valuation alert",
        description: "Update valuation alert",
      },
    }
  )

  // Update valuation alert
  .put(
    "/alerts/:id",
    async ({ params, body }) =>
      await PropertyValuationService.updateValuationAlert(params.id, body),
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        alertType: t.Optional(t.String()),
        threshold: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Update valuation alert",
        description: "Update valuation alert",
      },
    }
  )

  // Schedule automated valuation
  .post(
    "/:propertyId/schedule",
    async ({ params, body }) =>
      await PropertyValuationService.scheduleAutomatedValuation(
        params.propertyId,
        body.frequency,
        body.nextRunDate
      ),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      body: t.Object({
        frequency: t.String(),
        nextRunDate: t.Date(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Schedule automated valuation",
        description: "Schedule automated valuation",
      },
    }
  )

  .use(accessPlugin("valuation", "delete"))

  // Delete valuation
  .delete(
    "/:id",
    async ({ params }) =>
      await PropertyValuationService.deleteValuation(params.id),
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Schedule automated valuation",
        description: "Schedule automated valuation",
      },
    }
  )

  // Delete valuation alert
  .delete(
    "/alerts/:id",
    async ({ params }) =>
      await PropertyValuationService.deleteValuationAlert(params.id),
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Delete valuation alert",
        description: "Delete valuation alert",
      },
    }
  )

  // Export valuations
  .get(
    "/export",
    async ({ query }) =>
      await PropertyValuationService.exportValuations(
        query.filters,
        query.format
      ),
    {
      query: t.Object({
        filters: t.Array(
          t.Object({
            propertyId: t.String(),
            method: t.String(),
            requestedBy: t.String(),
          })
        ),
        format: t.String(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Export valuations",
        description: "Export valuations",
      },
    }
  )

  // Import valuations
  .post(
    "/import",
    async ({ body }) =>
      await PropertyValuationService.importValuations(body.file, body.options),
    {
      body: t.Object({
        file: t.String(),
        options: t.Object({
          propertyId: t.String(),
          method: t.String(),
          requestedBy: t.String(),
        }),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Import valuations",
        description: "Import valuations",
      },
    }
  )

  // Generate reports
  .post(
    "/reports/generate",
    async ({ body }) =>
      await PropertyValuationService.generateValuationReport(
        body.valuationId,
        body.format,
        body.includeComparables
      ),
    {
      body: t.Object({
        valuationId: t.String(),
        format: t.String(),
        includeComparables: t.Boolean(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Generate valuation report",
        description: "Generate valuation report",
      },
    }
  )

  // Generate portfolio report
  .post(
    "/portfolios/:portfolioId/reports",
    async ({ params, body }) =>
      await PropertyValuationService.generatePortfolioReport(
        params.portfolioId,
        body.format,
        body.includeDetails
      ),
    {
      params: t.Object({
        portfolioId: t.String(),
      }),
      body: t.Object({
        format: t.String(),
        includeDetails: t.Boolean(),
      }),
      detail: {
        tags: ["valuations"],
        summary: "Generate portfolio report",
        description: "Generate portfolio report",
      },
    }
  );
