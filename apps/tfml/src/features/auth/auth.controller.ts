import { apiKeyService } from "@kaa/services/api-keys";
import { getMemberBy } from "@kaa/services/members";
import { getUserById } from "@kaa/services/users";
import { logger } from "@kaa/utils/logger";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { apiKeyPlugin } from "./api-key.plugin";

/**
 * Auth Controller - API Key Management
 *
 * All endpoints use API key authentication via X-API-Key or Authorization header
 * No JWT tokens or session management
 */
export const authController = new Elysia({ prefix: "/auth" })
  // Protected routes - require API key
  .group("", (app) =>
    app
      .use(apiKeyPlugin)

      // Get current user info from API key
      .get(
        "/me",
        async ({ user, set }) => {
          try {
            // Get full user document
            const currentUser = await getUserById(user.id);
            if (!currentUser) {
              set.status = 404;
              return {
                status: "error",
                message: "User not found",
              };
            }

            const userProfile = currentUser.getPublicProfile();
            const member = await getMemberBy({
              user: userProfile._id?.toString() ?? "",
            });

            set.status = 200;
            return {
              status: "success",
              user: {
                id: (userProfile._id as mongoose.Types.ObjectId).toString(),
                memberId: member?._id?.toString() ?? undefined,
                avatar: userProfile.profile?.avatar,
                username: userProfile.profile?.displayName as string,
                firstName: userProfile.profile?.firstName as string,
                lastName: userProfile.profile?.lastName as string,
                email: userProfile.contact?.email as string,
                phone: userProfile.contact?.phone?.formatted,
                permissions: user.permissions,
                apiKeyId: user.apiKeyId,
              },
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            set.status = 500;
            return {
              status: "error",
              message: "Failed to fetch user",
              error: errorMessage,
            };
          }
        },
        {
          response: {
            200: t.Object({
              status: t.Literal("success"),
              user: t.Object({
                id: t.String(),
                memberId: t.Optional(t.String()),
                avatar: t.Optional(t.String()),
                username: t.String(),
                firstName: t.String(),
                lastName: t.String(),
                email: t.String(),
                phone: t.Optional(t.String()),
                permissions: t.Array(t.String()),
                apiKeyId: t.String(),
              }),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
              error: t.String(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Get current user info",
            description: "Get user information from API key",
          },
        }
      )

      // Create new API key
      .post(
        "/api-keys",
        async ({ user, body, set }) => {
          try {
            const apiKey = await apiKeyService.createApiKey({
              memberId: user.memberId ?? "",
              userId: user.id,
              name: body.name,
              permissions: body.permissions,
              expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
              rateLimit: body.rateLimit,
            });

            logger.info("API key created", {
              apiKeyId: apiKey.id,
              memberId: user.memberId,
              userId: user.id,
            });

            set.status = 201;
            return {
              status: "success",
              data: apiKey,
              message:
                "API key created successfully. Save this key - it won't be shown again!",
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            set.status = 500;
            return {
              status: "error",
              message: "Failed to create API key",
              error: errorMessage,
            };
          }
        },
        {
          body: t.Object({
            name: t.String({ minLength: 1, maxLength: 100 }),
            permissions: t.Optional(t.Array(t.String())),
            expiresAt: t.Optional(t.String({ format: "date-time" })),
            rateLimit: t.Optional(
              t.Object({
                requests: t.Number({ minimum: 1 }),
                window: t.Number({ minimum: 1 }),
              })
            ),
          }),
          response: {
            201: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                id: t.String(),
                name: t.String(),
                key: t.String(),
                permissions: t.Array(t.String()),
                rateLimit: t.Optional(
                  t.Object({
                    requests: t.Number(),
                    window: t.Number(),
                  })
                ),
                expiresAt: t.Optional(t.Any()),
                createdAt: t.Any(),
              }),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
              error: t.String(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Create API key",
            description: "Create a new API key for authentication",
          },
        }
      )

      // List all API keys for current user/member
      .get(
        "/api-keys",
        async ({ user, set }) => {
          try {
            const apiKeys = await apiKeyService.getApiKeys(
              user.memberId ?? "",
              user.id
            );

            set.status = 200;
            return {
              status: "success",
              data: apiKeys.map((key) => ({
                id: (key._id as mongoose.Types.ObjectId).toString(),
                name: key.name,
                permissions: key.permissions,
                isActive: key.isActive,
                lastUsedAt: key.lastUsedAt,
                expiresAt: key.expiresAt,
                rateLimit: key.rateLimit,
                usage: key.usage,
                createdAt: key.createdAt,
              })),
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            set.status = 500;
            return {
              status: "error",
              message: "Failed to fetch API keys",
              error: errorMessage,
            };
          }
        },
        {
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Array(
                t.Object({
                  id: t.String(),
                  name: t.String(),
                  permissions: t.Array(t.String()),
                  isActive: t.Boolean(),
                  lastUsedAt: t.Optional(t.Any()),
                  expiresAt: t.Optional(t.Any()),
                  rateLimit: t.Optional(
                    t.Object({
                      requests: t.Number(),
                      window: t.Number(),
                    })
                  ),
                  usage: t.Object({
                    totalRequests: t.Number(),
                    lastRequest: t.Optional(t.Any()),
                  }),
                  createdAt: t.Any(),
                })
              ),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
              error: t.String(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "List API keys",
            description: "Get all API keys for current user",
          },
        }
      )

      // Get API key usage statistics
      .get(
        "/api-keys/:id/usage",
        async ({ user, params, set }) => {
          try {
            const usage = await apiKeyService.getApiKeyUsage(
              params.id,
              user.memberId ?? ""
            );

            set.status = 200;
            return {
              status: "success",
              data: usage,
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            set.status =
              error instanceof Error && errorMessage.includes("not found")
                ? 404
                : 500;
            return {
              status: "error",
              message: errorMessage,
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
                lastRequest: t.Optional(t.Any()),
                lastUsedAt: t.Optional(t.Any()),
                rateLimit: t.Optional(
                  t.Object({
                    requests: t.Number(),
                    window: t.Number(),
                  })
                ),
              }),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Get API key usage",
            description: "Get usage statistics for an API key",
          },
        }
      )

      // Update API key
      .patch(
        "/api-keys/:id",
        async ({ user, params, body, set }) => {
          try {
            const apiKey = await apiKeyService.updateApiKey(
              params.id,
              user.memberId ?? "",
              body
            );

            logger.info("API key updated", {
              apiKeyId: params.id,
              memberId: user.memberId,
            });

            set.status = 200;
            return {
              status: "success",
              data: {
                id: (apiKey._id as mongoose.Types.ObjectId).toString(),
                name: apiKey.name,
                permissions: apiKey.permissions,
                expiresAt: apiKey.expiresAt,
                rateLimit: apiKey.rateLimit,
              },
              message: "API key updated successfully",
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            set.status = errorMessage.includes("not found") ? 404 : 500;
            return {
              status: "error",
              message: errorMessage,
            };
          }
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
            permissions: t.Optional(t.Array(t.String())),
            expiresAt: t.Optional(t.Any()),
            rateLimit: t.Optional(
              t.Object({
                requests: t.Number({ minimum: 1 }),
                window: t.Number({ minimum: 1 }),
              })
            ),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                id: t.String(),
                name: t.String(),
                permissions: t.Array(t.String()),
                expiresAt: t.Optional(t.Any()),
                rateLimit: t.Optional(
                  t.Object({
                    requests: t.Number(),
                    window: t.Number(),
                  })
                ),
              }),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Update API key",
            description: "Update API key settings (name, permissions, expiry)",
          },
        }
      )

      // Revoke API key
      .delete(
        "/api-keys/:id",
        async ({ user, params, set }) => {
          try {
            await apiKeyService.revokeApiKey(params.id, user.memberId ?? "");

            logger.info("API key revoked", {
              apiKeyId: params.id,
              memberId: user.memberId,
            });

            set.status = 200;
            return {
              status: "success",
              message: "API key revoked successfully",
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            set.status = errorMessage.includes("not found") ? 404 : 500;
            return {
              status: "error",
              message: errorMessage,
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
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Revoke API key",
            description: "Permanently revoke an API key",
          },
        }
      )
  );
