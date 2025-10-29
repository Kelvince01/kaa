import { SubscriptionPlan } from "@kaa/models";
import { memberService } from "@kaa/services";
import { logger, NotFoundError } from "@kaa/utils";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { authPlugin, rolesPlugin } from "~/features/auth/auth.plugin";

export const memberController = new Elysia({
  detail: {
    tags: ["members"],
  },
}).group("members", (app) =>
  app
    .use(authPlugin)
    .use(rolesPlugin(["admin"]))
    .get(
      "/",
      async ({ query }) => {
        const result = await memberService.getAllMembers(query);
        return result;
      },
      {
        query: t.Object({
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
          search: t.Optional(t.String()),
          plan: t.Optional(t.String()),
          organization: t.Optional(t.String()),
        }),
        detail: {
          summary: "Get all members",
          tags: ["members"],
        },
      }
    )
    .get(
      "/:memberId",
      async ({ params }) => {
        const result = (
          await memberService.getMemberById(params.memberId)
        ).toObject();

        return {
          status: "success",
          data: {
            ...result,
            _id: (result._id as mongoose.Types.ObjectId).toString(),
          },
          message: "Member fetched successfully",
        };
      },
      {
        params: t.Object({
          memberId: t.String(),
        }),
        detail: {
          summary: "Get member by ID",
          tags: ["members"],
        },
      }
    )
    .post(
      "/",
      async ({ body }) => {
        const plan = await SubscriptionPlan.findOne({
          name: body.plan,
          isActive: true,
        });
        if (!plan) {
          throw new NotFoundError("Plan not found");
        }

        const result = await memberService.createMember({
          user: body.user,
          organization: body.organization,
          role: body.role,
          name: body.name,
          slug: body.slug,
          plan: (plan._id as mongoose.Types.ObjectId).toString(),
        });
        logger.info(`Member created: ${body.name}`);
        return result;
      },
      {
        body: t.Object({
          user: t.String(),
          organization: t.String(),
          role: t.String(),
          name: t.String(),
          slug: t.String(),
          plan: t.Optional(
            t.String({
              enum: ["free", "starter", "professional", "enterprise"],
            })
          ),
        }),
        detail: {
          summary: "Create member",
          tags: ["members"],
        },
      }
    )
    // Update tenant (admin only)
    .use(rolesPlugin(["admin"]))
    .patch(
      "/:memberId",
      async ({ params, body, user }) => {
        const result = await memberService.updateMember(
          params.memberId,
          body,
          user.id
        );
        logger.info(`Member updated: ${params.memberId}`);
        return result;
      },
      {
        params: t.Object({
          memberId: t.String(),
        }),
        body: t.Object({
          name: t.Optional(t.String()),
          plan: t.Optional(
            t.String({
              enum: ["free", "starter", "professional", "enterprise"],
            })
          ),
          isActive: t.Optional(t.Boolean()),
          settings: t.Optional(t.Object({})),
        }),
        detail: {
          summary: "Update member",
          tags: ["members"],
        },
      }
    )

    // Delete tenant (admin only)
    .use(rolesPlugin(["admin"]))
    .delete(
      "/:memberId",
      async ({ params, user }) => {
        const result = await memberService.deleteMember(
          params.memberId,
          user.id
        );
        logger.info(`Member deleted: ${params.memberId}`);
        return result;
      },
      {
        params: t.Object({
          memberId: t.String(),
        }),
        detail: {
          summary: "Delete member",
          tags: ["members"],
        },
      }
    )
    .get(
      "/me",
      async ({ user }) => {
        const member = await memberService.getMemberById(
          user.memberId as string
        );

        return {
          status: "success",
          data: member,
        };
      },
      {
        detail: {
          tags: ["members"],
          summary: "Get member",
        },
      }
    )
    .put(
      "/me",
      async ({ user, body }) => {
        // requireRole(["admin"])(context);
        const member = await memberService.updateMember(
          user.memberId as string,
          body,
          user.id
        );

        return {
          status: "success",
          data: member,
          message: "Member updated successfully",
        };
      },
      {
        detail: {
          tags: ["members"],
          summary: "Update member",
        },
        body: t.Object({
          name: t.String(),
          domain: t.String(),
          logo: t.String(),
          settings: t.Object({
            theme: t.String(),
            maxUsers: t.Number(),
            features: t.Array(t.String()),
            customBranding: t.Boolean(),
            allowInvites: t.Boolean(),
            requireEmailVerification: t.Boolean(),
            twoFactorRequired: t.Boolean(),
          }),
        }),
      }
    )
    .delete(
      "/me",
      async ({ user }) => {
        // requireRole(["admin"])(context);
        await memberService.deleteMember(user.memberId as string, user.id);

        return {
          status: "success",
          message: "Member deleted successfully",
        };
      },
      {
        detail: {
          tags: ["members"],
          summary: "Delete member",
        },
      }
    )
    .get(
      "/me/stats",
      async ({ user }) => {
        const stats = await memberService.getMemberStats(
          user.memberId as string
        );

        return {
          status: "success",
          data: stats,
        };
      },
      {
        detail: {
          tags: ["members"],
          summary: "Get member stats",
        },
      }
    )
    .get(
      "/:memberId/stats",
      async ({ params }) => {
        const stats = await memberService.getMemberStats(params.memberId);

        return {
          status: "success",
          data: stats,
        };
      },
      {
        detail: {
          tags: ["members"],
          summary: "Get member stats by ID",
        },
        params: t.Object({
          memberId: t.String(),
        }),
      }
    )
);
