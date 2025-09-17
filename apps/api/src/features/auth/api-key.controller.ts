import { apiKeyService } from "@kaa/services";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "~/features/rbac/rbac.plugin";
import {
  ApiKeyBaseResponseSchema,
  ApiKeyRequestSchema,
  ApiKeyResponseSchema,
  ApiKeyUpdateRequestSchema,
} from "./auth.schema";

export const apiKeyController = new Elysia().group("api-keys", (app) =>
  app
    .use(authPlugin)
    .get(
      "/",
      async ({ set, user }) => {
        try {
          const result = await apiKeyService.getApiKeys(
            user.memberId || "",
            user.id
          );
          set.status = 200;
          return {
            status: "success",
            data: result.map((key) => ({
              name: key.name,
              permissions: key.permissions,
              expiresAt: key.expiresAt,
              rateLimit: key.rateLimit,
            })),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to retrieve API keys",
          };
        }
      },
      {
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Array(ApiKeyBaseResponseSchema),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get API keys",
          tags: ["api-keys"],
        },
      }
    )
    .use(accessPlugin("apiKeys", "create"))
    .post(
      "/",
      async ({ set, body, user }) => {
        try {
          const result = await apiKeyService.createApiKey({
            memberId: user.memberId || "",
            userId: user.id,
            name: body.name,
            permissions: body.permissions,
            expiresAt: body.expiresAt,
            rateLimit: body.rateLimit,
          });

          set.status = 201;
          return {
            status: "success",
            data: {
              apiKey: result.id,
              key: result.key,
            },
            message: "API key created successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create API key",
          };
        }
      },
      {
        body: ApiKeyRequestSchema,
        response: {
          201: t.Object({
            status: t.Literal("success"),
            data: ApiKeyResponseSchema,
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Create API key",
          tags: ["api-keys"],
        },
      }
    )
    .use(accessPlugin("apiKeys", "update"))
    .put(
      "/:id",
      async ({ set, params, user, body }) => {
        try {
          const apiKey = await apiKeyService.updateApiKey(
            params.id,
            user.memberId || "",
            body
          );

          return {
            status: "success",
            data: apiKey,
            message: "API key updated successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update API key",
          };
        }
      },
      {
        body: ApiKeyUpdateRequestSchema,
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Any(),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Update API key",
          tags: ["api-keys"],
        },
      }
    )
    .use(accessPlugin("apiKeys", "delete"))
    .delete(
      "/:id",
      async ({ set, params, user }) => {
        try {
          await apiKeyService.revokeApiKey(params.id, user.memberId || "");
          set.status = 200;
          return {
            status: "success",
            data: null,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete API key",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Null(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Delete API key",
          tags: ["api-keys"],
        },
      }
    )
    .use(accessPlugin("apiKeys", "read"))
    .get(
      "/:id/usage",
      async ({ set, params, user }) => {
        try {
          const usage = await apiKeyService.getApiKeyUsage(
            params.id,
            user.memberId || ""
          );

          set.status = 200;
          return {
            status: "success",
            data: usage,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get API key usage",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Object({
              totalRequests: t.Number(),
              lastRequest: t.Optional(t.Date()),
              lastUsedAt: t.Optional(t.Date()),
              rateLimit: t.Optional(
                t.Object({
                  requests: t.Number(),
                  window: t.Number(),
                })
              ),
            }),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          summary: "Get API key usage",
          tags: ["api-keys"],
        },
      }
    )
);
