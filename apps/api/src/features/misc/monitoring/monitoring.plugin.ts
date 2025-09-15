import { monitoringService } from "@kaa/services";
import type Elysia from "elysia";

export const performancePlugin = (metricName: string) => (app: Elysia) =>
  app.onAfterHandle(async (ctx) => {
    const startTime = Date.now();

    try {
      const responseTime = Date.now() - startTime;

      // Record success metric
      await monitoringService.recordMetric({
        name: `${metricName}.response_time`,
        value: responseTime,
        unit: "ms",
        tags: {
          status: "success",
          endpoint: ctx.request.url,
        },
      });

      await monitoringService.recordMetric({
        name: `${metricName}.requests`,
        value: 1,
        unit: "count",
        tags: {
          status: "success",
          endpoint: ctx.request.url,
        },
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error metric
      await monitoringService.recordMetric({
        name: `${metricName}.response_time`,
        value: responseTime,
        unit: "ms",
        tags: {
          status: "error",
          endpoint: ctx.request.url,
        },
      });

      await monitoringService.recordMetric({
        name: `${metricName}.requests`,
        value: 1,
        unit: "count",
        tags: {
          status: "error",
          endpoint: ctx.request.url,
        },
      });

      await monitoringService.recordMetric({
        name: `${metricName}.errors`,
        value: 1,
        unit: "count",
        tags: {
          endpoint: ctx.request.url,
          error: (error as Error).message,
        },
      });

      throw error;
    }
  });
