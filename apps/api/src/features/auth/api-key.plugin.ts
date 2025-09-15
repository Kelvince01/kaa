import { apiKeyService } from "@kaa/services";
import { type Elysia, t } from "elysia";

// API Key middleware
export const apiKeyPlugin = (app: Elysia) =>
  app
    .derive(async ({ headers }) => {
      const apiKey =
        headers["x-api-key"] || headers.authorization?.replace("Bearer ", "");

      if (!apiKey) {
        return { apiKey: null, apiKeyData: null };
      }

      const apiKeyData = await apiKeyService.validateApiKey(apiKey);
      return { apiKey, apiKeyData };
    })
    .guard({
      headers: t.Object({
        "x-api-key": t.String(),
      }),
    })
    .onBeforeHandle(({ apiKeyData, set }) => {
      if (!apiKeyData) {
        (set as any).status = 401;
        throw new Error("Invalid API Key");
      }
    });
