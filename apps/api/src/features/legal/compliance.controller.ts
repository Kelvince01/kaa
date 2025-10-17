import { ComplianceStatus, ComplianceType } from "@kaa/models/types";
import { ComplianceService, SchedulerService } from "@kaa/services";
import { Elysia, t } from "elysia";

export const complianceController = new Elysia({ prefix: "/compliance" })
  .post(
    "/records",
    async ({ body }) =>
      await ComplianceService.createComplianceRecord(body as any),
    {
      body: t.Object({
        property: t.String(),
        landlord: t.String(),
        complianceType: t.Enum(ComplianceType),
        title: t.String(),
        description: t.String(),
        regulatoryBody: t.String(),
        regulation: t.String(),
        requirementLevel: t.Optional(t.String()),
        expiryDate: t.Optional(t.String()),
        requirements: t.Optional(
          t.Array(
            t.Object({
              requirement: t.String(),
              status: t.Optional(t.String()),
            })
          )
        ),
      }),
    }
  )

  .get(
    "/records/landlord/:landlordId",
    async ({ params }) =>
      await ComplianceService.getComplianceRecordsByLandlord(params.landlordId)
  )

  .get(
    "/records/property/:propertyId",
    async ({ params }) =>
      await ComplianceService.getComplianceRecordsByProperty(params.propertyId)
  )

  .patch(
    "/records/:id/status",
    async ({ params, body }) =>
      await ComplianceService.updateComplianceStatus(
        params.id,
        body.status,
        body.notes
      ),
    {
      body: t.Object({
        status: t.Enum(ComplianceStatus),
        notes: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/records/:id/violations",
    async ({ params, body }) =>
      await ComplianceService.addViolation(params.id, body),
    {
      body: t.Object({
        violationType: t.String(),
        description: t.String(),
        severity: t.String(),
        remedialAction: t.String(),
        penalty: t.Optional(
          t.Object({
            type: t.String(),
            amount: t.Optional(t.Number()),
            description: t.String(),
            dueDate: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  .post(
    "/records/:id/violations/:violationIndex/resolve",
    async ({ params, body }) =>
      await ComplianceService.resolveViolation(
        params.id,
        Number.parseInt(params.violationIndex, 10),
        body.resolution
      ),
    {
      body: t.Object({
        resolution: t.String(),
      }),
    }
  )

  .post(
    "/records/:id/inspections",
    async ({ params, body }) =>
      await ComplianceService.addInspection(params.id, body),
    {
      body: t.Object({
        inspector: t.String(),
        inspectorContact: t.String(),
        findings: t.String(),
        recommendations: t.Optional(t.Array(t.String())),
        passed: t.Boolean(),
        reportUrl: t.Optional(t.String()),
        nextInspectionDate: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/dashboard/:landlordId",
    async ({ params }) =>
      await ComplianceService.getComplianceDashboard(params.landlordId)
  )

  .post(
    "/reports/generate",
    async ({ body }) =>
      await ComplianceService.generateRegulatoryReport(
        body.landlordId,
        body.reportType,
        {
          startDate: new Date(body.period.startDate),
          endDate: new Date(body.period.endDate),
        },
        body.propertyIds
      ),
    {
      body: t.Object({
        landlordId: t.String(),
        reportType: t.Enum({
          monthly: "monthly",
          quartely: "quarterly",
          annual: "annual",
          custom: "custom",
        }),
        period: t.Object({
          startDate: t.String(),
          endDate: t.String(),
        }),
        propertyIds: t.Optional(t.Array(t.String())),
      }),
    }
  )

  .get(
    "/reports/landlord/:landlordId",
    async ({ params }) =>
      await ComplianceService.getRegulatoryReportsByLandlord(params.landlordId)
  )

  .get(
    "/templates",
    async ({ query }) => await ComplianceService.getLegalTemplates(query)
  )

  .post(
    "/templates/:id/generate",
    async ({ params, body }) =>
      await ComplianceService.createDocumentFromTemplate(
        params.id,
        body.variables,
        body.createdBy
      ),
    {
      body: t.Object({
        variables: t.Record(t.String(), t.Any()),
        createdBy: t.String(),
      }),
    }
  )

  .post("/check-expiring", async () => {
    await SchedulerService.runTask("check_expiring_compliance");
    return { message: "Expiring compliance records checked successfully" };
  })

  .post("/check-inspections", async () => {
    await SchedulerService.runTask("check_upcoming_inspections");
    return { message: "Upcoming inspections checked successfully" };
  });
