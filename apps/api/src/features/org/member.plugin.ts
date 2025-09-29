import { ForbiddenError, UnauthorizedError } from "@kaa/utils";
import type Elysia from "elysia";
import { t } from "elysia";
import { rolePlugin } from "~/features/rbac/rbac.plugin";

export const memberPlugin = (app: Elysia) =>
  app
    .use(rolePlugin)
    .guard({
      params: t.Object({
        memberId: t.String(),
      }),
    })
    .derive(({ user, params, role }) => {
      const requestedMemberId = params.memberId;

      if (!user) {
        throw new UnauthorizedError();
      }

      // Allow access if user is admin or accessing their own tenant
      if (role.name !== "admin" && user.memberId !== requestedMemberId) {
        throw new ForbiddenError(
          "You can only access resources in your own tenant"
        );
      }

      return {};
    });
