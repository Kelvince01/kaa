import { tenantService } from "@kaa/services";
import { UnauthorizedError } from "@kaa/utils";
import type Elysia from "elysia";
import type mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

export const tenantPlugin = (app: Elysia) =>
  app
    .use(authPlugin)
    .derive(async ({ user }) => {
      if (!user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const tenant = await tenantService.getTenantBy({
        memberId: user.memberId,
      });

      if (!tenant) {
        throw new UnauthorizedError("Tenant not found");
      }

      return {
        tenant: {
          id: (tenant._id as mongoose.Types.ObjectId).toString(),
          name: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
          slug: `${tenant.personalInfo.firstName}-${tenant.personalInfo.lastName}`,
          email: tenant.personalInfo.email,
          phone: tenant.personalInfo.phone,
          nationalId: tenant.personalInfo.nationalId,
          dateOfBirth: tenant.personalInfo.dateOfBirth,
          occupation: tenant.personalInfo.occupation,
          employer: tenant.personalInfo.employer,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        },
      };
    })
    .as("scoped");

export const optionalTenantPlugin = (app: Elysia) =>
  app
    .use(authPlugin)
    .derive(async ({ user }) => {
      if (!user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const tenant = await tenantService.getTenantBy({
        memberId: user.memberId,
      });

      if (!tenant) {
        return {
          tenant: null,
        };
      }

      return {
        tenant: {
          id: (tenant._id as mongoose.Types.ObjectId).toString(),
          name: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
          slug: `${tenant.personalInfo.firstName}-${tenant.personalInfo.lastName}`,
          email: tenant.personalInfo.email,
          phone: tenant.personalInfo.phone,
          nationalId: tenant.personalInfo.nationalId,
          dateOfBirth: tenant.personalInfo.dateOfBirth,
          occupation: tenant.personalInfo.occupation,
          employer: tenant.personalInfo.employer,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        },
      };
    })
    .as("scoped");
