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
      body: t.Object({
        requestedBy: t.String(),
      }),
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
    }
  )

  // Get comparable properties
  .get(
    "/:propertyId/comparables",
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
    }
  )

  // Get market analysis
  .get(
    "/:propertyId/market-analysis",
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
    }
  )

  // Get rental estimate
  .get(
    "/:propertyId/rental-estimate",
    async ({ params }) =>
      await PropertyValuationService.getRentalEstimate(params.propertyId),
    {
      params: t.Object({
        propertyId: t.String(),
      }),
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
    }
  )

  // Validate valuation
  .post(
    "/:id/validate",
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
    }
  );
