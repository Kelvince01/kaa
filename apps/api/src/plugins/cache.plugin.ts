import { logger, redisClient as redis } from "@kaa/utils";
import type { Context } from "elysia";
import { Elysia } from "elysia";

export const cachePlugin = (duration = 3600) =>
  new Elysia({ name: "cache" })
    .derive((ctx: Context) => ({
      cacheKey: `api:${ctx.request.url}`,
    }))
    .onBeforeHandle(async ({ request, cacheKey, set }) => {
      if (request.method !== "GET") return;

      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          set.status = 200;
          set.headers["x-cache-hit"] = "true";
          return JSON.parse(cached);
        }
      } catch (err) {
        logger.error(`Redis cache read failed: ${err}`);
      }
    })
    .onAfterHandle(async ({ request, response, cacheKey }) => {
      if (request.method !== "GET" || !response) return;

      try {
        await redis.setEx(cacheKey, duration, JSON.stringify(response));
      } catch (err) {
        logger.error(`Redis cache write failed: ${err}`);
      }
    });
