import { httpClient } from "@/lib/axios";
import type {
  CreateWebhookInput,
  RegenerateSecretResponse,
  SupportedEventsResponse,
  UpdateWebhookInput,
  WebhookAnalytics,
  WebhookDeliveryListResponse,
  WebhookDeliveryType,
  WebhookListQuery,
  WebhookListResponse,
  WebhookTestResult,
  WebhookType,
} from "./webhook.type";

const WEBHOOKS_API = "/webhooks";

/**
 * Get supported webhook events
 */
export const getSupportedEvents =
  async (): Promise<SupportedEventsResponse> => {
    const response = await httpClient.api.get(`${WEBHOOKS_API}/events`);
    return response.data;
  };

/**
 * Get user's webhooks with filters
 */
export const getUserWebhooks = async (
  params: WebhookListQuery = {}
): Promise<WebhookListResponse> => {
  const response = await httpClient.api.get(`${WEBHOOKS_API}/user/webhooks/`, {
    params,
  });
  return response.data;
};

/**
 * Get a specific webhook by ID
 */
export const getWebhook = async (
  webhookId: string
): Promise<{ status: string; data: WebhookType }> => {
  const response = await httpClient.api.get(`${WEBHOOKS_API}/${webhookId}`);
  return response.data;
};

/**
 * Create a new webhook
 */
export const createWebhook = async (
  webhook: CreateWebhookInput
): Promise<{ status: string; data: WebhookType }> => {
  const response = await httpClient.api.post(WEBHOOKS_API, webhook);
  return response.data;
};

/**
 * Update an existing webhook
 */
export const updateWebhook = async (
  webhookId: string,
  updates: UpdateWebhookInput
): Promise<{ status: string; data: WebhookType }> => {
  const response = await httpClient.api.put(
    `${WEBHOOKS_API}/${webhookId}`,
    updates
  );
  return response.data;
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (
  webhookId: string
): Promise<{ status: string; data: string }> => {
  const response = await httpClient.api.delete(`${WEBHOOKS_API}/${webhookId}`);
  return response.data;
};

/**
 * Test a webhook
 */
export const testWebhook = async (
  webhookId: string
): Promise<{ status: string; data: WebhookTestResult }> => {
  const response = await httpClient.api.post(
    `${WEBHOOKS_API}/event/${webhookId}/test`
  );
  return response.data;
};

/**
 * Activate a webhook
 */
export const activateWebhook = async (
  webhookId: string
): Promise<{ status: string; data: string }> => {
  const response = await httpClient.api.post(
    `${WEBHOOKS_API}/event/${webhookId}/activate`
  );
  return response.data;
};

/**
 * Deactivate a webhook
 */
export const deactivateWebhook = async (
  webhookId: string
): Promise<{ status: string; data: string }> => {
  const response = await httpClient.api.post(
    `${WEBHOOKS_API}/event/${webhookId}/deactivate`
  );
  return response.data;
};

/**
 * Regenerate webhook secret
 */
export const regenerateWebhookSecret = async (
  webhookId: string
): Promise<RegenerateSecretResponse> => {
  const response = await httpClient.api.post(
    `${WEBHOOKS_API}/${webhookId}/regenerate-secret`
  );
  return response.data;
};

/**
 * Get webhook delivery history
 */
export const getWebhookDeliveries = async (
  webhookId: string,
  params: { page?: number; limit?: number } = {}
): Promise<WebhookDeliveryListResponse> => {
  const response = await httpClient.api.get(
    `${WEBHOOKS_API}/${webhookId}/deliveries`,
    { params }
  );
  return response.data;
};

/**
 * Get a specific webhook delivery
 */
export const getWebhookDelivery = async (
  deliveryId: string
): Promise<{ status: string; data: WebhookDeliveryType }> => {
  const response = await httpClient.api.get(
    `${WEBHOOKS_API}/deliveries/${deliveryId}`
  );
  return response.data;
};

/**
 * Redeliver a webhook
 */
export const redeliverWebhook = async (
  deliveryId: string
): Promise<{ status: string; data: string }> => {
  const response = await httpClient.api.post(
    `${WEBHOOKS_API}/deliveries/${deliveryId}/redeliver`
  );
  return response.data;
};

/**
 * Get webhook events
 */
export const getWebhookEvents = async (
  webhookId: string
): Promise<{ status: string; data: any[] }> => {
  const response = await httpClient.api.get(
    `${WEBHOOKS_API}/${webhookId}/events`
  );
  return response.data;
};

/**
 * Get webhook analytics
 */
export const getWebhookAnalytics = async (
  webhookId: string
): Promise<{ status: string; data: WebhookAnalytics }> => {
  const response = await httpClient.api.get(
    `${WEBHOOKS_API}/${webhookId}/analytics`
  );
  return response.data;
};
