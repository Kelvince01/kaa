/**
 * Performance monitoring utilities using Bun's built-in performance APIs
 */

import { logger } from "@kaa/utils";
import Elysia from "elysia";

type PerformanceMetrics = {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  uptime: number;
  requestsProcessed: number;
  averageResponseTime: number;
};

/**
 * Request counter for metrics
 */
let requestCount = 0;
let totalResponseTime = 0;

/**
 * Increment request counter
 */
export const incrementRequestCount = (): void => {
  requestCount += 1;
};

/**
 * Add response time to total
 * @param time - Response time in milliseconds
 */
export const addResponseTime = (time: number): void => {
  totalResponseTime += time;
};

/**
 * Get the current performance metrics
 * @returns The current performance metrics
 */
export const getPerformanceMetrics = (): PerformanceMetrics => {
  const memoryInfo = process.memoryUsage();
  const cpuInfo = process.cpuUsage();

  return {
    memoryUsage: {
      heapUsed: Math.round(memoryInfo.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryInfo.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryInfo.external / 1024 / 1024), // MB
      arrayBuffers: Math.round((memoryInfo.arrayBuffers || 0) / 1024 / 1024), // MB
    },
    cpuUsage: {
      user: Math.round(cpuInfo.user / 1000), // ms
      system: Math.round(cpuInfo.system / 1000), // ms
    },
    uptime: Math.round(process.uptime()),
    requestsProcessed: requestCount,
    averageResponseTime:
      requestCount > 0 ? totalResponseTime / requestCount : 0,
  };
};

/**
 * Reset performance metrics
 */
export const resetMetrics = (): void => {
  requestCount = 0;
  totalResponseTime = 0;
};

/**
 * Performance monitoring middleware for Express
 */
export const performancePlugin = new Elysia()
  .state("startTime", 0)
  .onBeforeHandle((ctx) => {
    ctx.store.startTime = performance.now();
  })
  .onAfterHandle((ctx) => {
    // Process the request
    const duration = performance.now() - ctx.store.startTime;
    incrementRequestCount();
    addResponseTime(duration);

    // Log performance metrics for slow requests (over 1000ms)
    if (duration > 1000) {
      logger.warn(
        `Slow request: ${ctx.request.method} ${ctx.request.url} took ${duration.toFixed(2)}ms`
      );
    }
  });

/**
 * Log performance metrics at regular intervals
 * @param intervalMs - Interval in milliseconds
 */
export const startPerformanceMonitoring = (
  intervalMs = 300_000
): NodeJS.Timeout =>
  setInterval(() => {
    const metrics = getPerformanceMetrics();
    logger.info("Performance metrics:", { extra: metrics });
  }, intervalMs);

/**
 * Measure the execution time of a function
 * @param fn - Function to measure
 * @param args - Arguments to pass to the function
 * @returns The result of the function
 */
export const measureExecutionTime = async <T, A extends unknown[]>(
  fn: (...args: A) => Promise<T> | T,
  ...args: A
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn(...args);
  const duration = performance.now() - start;

  return { result, duration };
};
