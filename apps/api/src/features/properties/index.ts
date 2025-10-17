/**
 * Property Feature - Centralized Exports
 *
 * This file provides a clean interface for importing property-related features.
 */

// Main controller
export { propertyController } from "./property.controller";
// Advanced Features
export {
  // Helpers
  getRateLimitForEndpoint,
  // Main integration object
  propertyAdvancedFeatures,
  propertyAIController,
  // Individual controllers
  propertyMonitoringController,
  // webhookTriggers,
} from "./property.integration";
// Schemas
export * from "./property.schema";
// AI Services
export * as propertyAI from "./property-ai.service";
// Monitoring
export {
  propertyAlerts,
  propertyDashboardConfig,
  propertyHealthChecks,
  propertyMetrics,
  propertyReports,
} from "./property-monitoring.config";
// Rate Limiting
export {
  propertyEndpointLimits,
  propertyRoleLimits,
} from "./property-rate-limit.config";
// Webhooks
// export { propertyWebhooks } from "./property-webhooks.service";
