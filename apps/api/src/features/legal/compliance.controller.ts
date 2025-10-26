import {
  ComplianceStatus,
  ComplianceType,
  LegalTemplateType,
} from "@kaa/models/types";
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
      detail: {
        tags: ["compliance"],
        summary: "Create a new compliance record",
        description: "Create a new compliance record",
      },
    }
  )

  .get(
    "/records/landlord/:landlordId",
    async ({ params }) =>
      await ComplianceService.getComplianceRecordsByLandlord(params.landlordId),
    {
      params: t.Object({ landlordId: t.String() }),
      detail: {
        tags: ["compliance"],
        summary: "Get compliance records by landlord ID",
        description: "Get compliance records by landlord ID",
      },
    }
  )

  .get(
    "/records/property/:propertyId",
    async ({ params }) =>
      await ComplianceService.getComplianceRecordsByProperty(params.propertyId),
    {
      params: t.Object({ propertyId: t.String() }),
      detail: {
        tags: ["compliance"],
        summary: "Get compliance records by property ID",
        description: "Get compliance records by property ID",
      },
    }
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
      detail: {
        tags: ["compliance"],
        summary: "Update the status of a compliance record",
        description: "Update the status of a compliance record",
      },
      params: t.Object({ id: t.String() }),
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
      detail: {
        tags: ["compliance"],
        summary: "Add a violation to a compliance record",
        description: "Add a violation to a compliance record",
      },
      params: t.Object({ id: t.String() }),
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
      detail: {
        tags: ["compliance"],
        summary: "Resolve a violation",
        description: "Resolve a violation",
      },
      params: t.Object({ id: t.String(), violationIndex: t.String() }),
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
      detail: {
        tags: ["compliance"],
        summary: "Add an inspection to a compliance record",
        description: "Add an inspection to a compliance record",
      },
      params: t.Object({ id: t.String() }),
    }
  )

  .get(
    "/dashboard/:landlordId",
    async ({ params }) =>
      await ComplianceService.getComplianceDashboard(params.landlordId),
    {
      params: t.Object({ landlordId: t.String() }),
      detail: {
        tags: ["compliance"],
        summary: "Get the compliance dashboard",
        description: "Get the compliance dashboard",
      },
    }
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
      detail: {
        tags: ["compliance"],
        summary: "Generate a regulatory report",
        description: "Generate a regulatory report",
      },
    }
  )

  .get(
    "/reports/landlord/:landlordId",
    async ({ params }) =>
      await ComplianceService.getRegulatoryReportsByLandlord(params.landlordId),
    {
      params: t.Object({ landlordId: t.String() }),
      detail: {
        tags: ["compliance"],
        summary: "Get regulatory reports by landlord ID",
        description: "Get regulatory reports by landlord ID",
      },
    }
  )

  .get(
    "/templates",
    async ({ query }) => await ComplianceService.getLegalTemplates(query),
    {
      query: t.Object({
        type: t.Optional(t.Enum(LegalTemplateType)),
      }),
      detail: {
        tags: ["compliance"],
        summary: "Get legal templates",
        description: "Get legal templates",
      },
    }
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
      detail: {
        tags: ["compliance"],
        summary: "Generate a document from a template",
        description: "Generate a document from a template",
      },
      params: t.Object({ id: t.String() }),
    }
  )

  .post(
    "/check-expiring",
    async () => {
      await SchedulerService.runTask("check_expiring_compliance");
      return { message: "Expiring compliance records checked successfully" };
    },
    {
      detail: {
        tags: ["compliance"],
        summary: "Check expiring compliance records",
        description: "Check expiring compliance records",
      },
    }
  )

  .post(
    "/check-inspections",
    async () => {
      await SchedulerService.runTask("check_upcoming_inspections");
      return { message: "Upcoming inspections checked successfully" };
    },
    {
      detail: {
        tags: ["compliance"],
        summary: "Check upcoming inspections",
        description: "Check upcoming inspections",
      },
    }
  );
