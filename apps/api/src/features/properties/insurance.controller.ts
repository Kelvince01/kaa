import { ClaimStatus, type InsuranceType } from "@kaa/models/types";
import { InsuranceService, SchedulerService } from "@kaa/services";
import { Elysia, t } from "elysia";
import mongoose from "mongoose";

export const insuranceController = new Elysia({ prefix: "/insurance" })
  .post(
    "/policies",
    async ({ body }) =>
      await InsuranceService.createPolicy({
        property: new mongoose.Types.ObjectId(body.property),
        landlord: new mongoose.Types.ObjectId(body.landlord),
        tenant: body.tenant
          ? new mongoose.Types.ObjectId(body.tenant)
          : undefined,
        insuranceType: body.insuranceType as InsuranceType,
        provider: body.provider,
        coverage: {
          buildingValue: body.coverage.buildingValue,
          contentsValue: body.coverage.contentsValue || 0,
          liabilityLimit: body.coverage.liabilityLimit,
          additionalCoverage: [],
        },
        terms: {
          startDate: new Date(body.terms.startDate),
          endDate: new Date(body.terms.endDate),
          policyTerm: body.terms.policyTerm,
          deductible: body.terms.deductible,
          renewalDate: new Date(body.terms.renewalDate),
          autoRenewal: body.terms.autoRenewal,
          currency: body.terms.currency,
        },
      }),
    {
      body: t.Object({
        property: t.String(),
        landlord: t.String(),
        tenant: t.Optional(t.String()),
        insuranceType: t.String(),
        provider: t.String(),
        coverage: t.Object({
          buildingValue: t.Number(),
          contentsValue: t.Optional(t.Number()),
          liabilityLimit: t.Number(),
        }),
        terms: t.Object({
          startDate: t.String(),
          endDate: t.String(),
          policyTerm: t.Number(),
          deductible: t.Number(),
          renewalDate: t.String(),
          autoRenewal: t.Boolean(),
          currency: t.String(),
        }),
        premium: t.Object({
          annualPremium: t.Number(),
          paymentFrequency: t.String(),
        }),
      }),
    }
  )

  .get(
    "/policies/landlord/:landlordId",
    async ({ params }) =>
      await InsuranceService.getPoliciesByLandlord(params.landlordId)
  )

  .get(
    "/policies/:id",
    async ({ params }) => await InsuranceService.getPolicyById(params.id)
  )

  .post(
    "/policies/:id/renew",
    async ({ params, body }) =>
      await InsuranceService.renewPolicy(params.id, body)
  )

  .post(
    "/policies/:id/cancel",
    async ({ params, body }) =>
      await InsuranceService.cancelPolicy(params.id, body.reason),
    {
      body: t.Object({
        reason: t.String(),
      }),
    }
  )

  .post(
    "/claims",
    async ({ body }) =>
      await InsuranceService.submitClaim({
        policy: new mongoose.Types.ObjectId(body.policy),
        property: new mongoose.Types.ObjectId(body.property),
        landlord: new mongoose.Types.ObjectId(body.landlord),
        claimType: body.claimType,
        incidentDate: new Date(body.incidentDate),
        description: body.description,
        claimedAmount: body.claimedAmount,
        incident: {
          type: body.incident.type,
          location: body.incident.location,
          cause: body.incident.cause,
          witnesses: body.incident.witnesses,
          policeReport: {
            reportNumber: body.incident.policeReport.reportNumber,
            station: body.incident.policeReport.station,
            officerName: body.incident.policeReport.officerName,
            reportDate: body.incident.policeReport.reportDate,
          },
        },
        submittedBy: new mongoose.Types.ObjectId(body.submittedBy),
      }),
    {
      body: t.Object({
        policy: t.String(),
        property: t.String(),
        landlord: t.String(),
        claimType: t.String(),
        incidentDate: t.String(),
        description: t.String(),
        claimedAmount: t.Number(),
        incident: t.Object({
          type: t.Enum({
            fire: "fire",
            flood: "flood",
            theft: "theft",
            vandalism: "vandalism",
            accident: "accident",
            natural_disaster: "natural_disaster",
            other: "other",
          }),
          location: t.String(),
          cause: t.Optional(t.String()),
          witnesses: t.Array(
            t.Object({
              name: t.String(),
              contact: t.String(),
              statement: t.Optional(t.String()),
            })
          ),
          policeReport: t.Object({
            reportNumber: t.String(),
            station: t.String(),
            officerName: t.String(),
            reportDate: t.Date(),
          }),
        }),
        submittedBy: t.String(),
      }),
    }
  )

  .get(
    "/claims/landlord/:landlordId",
    async ({ params }) =>
      await InsuranceService.getClaimsByLandlord(params.landlordId)
  )

  .get(
    "/claims/:id",
    async ({ params }) => await InsuranceService.getClaimById(params.id)
  )

  .post(
    "/claims/:id/process",
    async ({ params, body }) =>
      await InsuranceService.processClaim(params.id, body.action, body.data),
    {
      body: t.Object({
        action: t.String(),
        data: t.Any(),
      }),
    }
  )

  .get(
    "/recommendations/:propertyId",
    async ({ params }) =>
      await InsuranceService.getInsuranceRecommendations(params.propertyId)
  )

  .post("/check-expiring", async () => {
    await SchedulerService.runTask("check_expiring_policies");
    return { message: "Expiring policies checked successfully" };
  })

  .post("/check-overdue", async () => {
    await SchedulerService.runTask("check_overdue_payments");
    return { message: "Overdue payments checked successfully" };
  })

  .get(
    "/policies/expired",
    async () => await InsuranceService.getExpiredPolicies()
  )

  .get(
    "/policies/reminders",
    async () => await InsuranceService.getInsuranceReminders()
  )

  .get(
    "/claims/:id/attachments",
    async ({ params }) => await InsuranceService.getClaimAttachments(params.id)
  )

  .delete(
    "/claims/:id",
    async ({ params }) => await InsuranceService.deleteInsuranceClaim(params.id)
  )

  .post(
    "/policies/:id/reminders/send",
    async ({ params, body }) =>
      await InsuranceService.sendInsuranceReminder(params.id, body.message),
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        message: t.String(),
      }),
    }
  )

  .put(
    "/claims/bulk-update",
    async ({ body }) =>
      await InsuranceService.bulkUpdateClaims(body.claimIds, body.updates),
    {
      body: t.Object({
        claimIds: t.Array(t.String()),
        updates: t.Object({
          status: t.Enum(ClaimStatus),
        }),
      }),
    }
  );
