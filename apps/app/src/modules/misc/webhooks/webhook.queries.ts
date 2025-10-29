import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateWebhook,
  createWebhook,
  deactivateWebhook,
  deleteWebhook,
  getSupportedEvents,
  getUserWebhooks,
  getWebhook,
  getWebhookAnalytics,
  getWebhookDeliveries,
  getWebhookDelivery,
  getWebhookEvents,
  redeliverWebhook,
  regenerateWebhookSecret,
  testWebhook,
  updateWebhook,
} from "./webhook.service";
import type {
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookListQuery,
} from "./webhook.type";

/**
 * Keys for webhook related queries
 */
export const webhookKeys = {
  all: ["webhooks"] as const,
  lists: () => [...webhookKeys.all, "list"] as const,
  list: (filters: WebhookListQuery) =>
    [...webhookKeys.lists(), filters] as const,
  details: () => [...webhookKeys.all, "detail"] as const,
  detail: (id: string) => [...webhookKeys.details(), id] as const,
  events: () => [...webhookKeys.all, "events"] as const,
  supportedEvents: () => [...webhookKeys.events(), "supported"] as const,
  webhookEvents: (id: string) => [...webhookKeys.events(), id] as const,
  deliveries: () => [...webhookKeys.all, "deliveries"] as const,
  webhookDeliveries: (id: string, params?: any) =>
    [...webhookKeys.deliveries(), id, params] as const,
  delivery: (id: string) => [...webhookKeys.deliveries(), id] as const,
  analytics: (id: string) => [...webhookKeys.all, "analytics", id] as const,
};

/**
 * Get supported webhook events
 */
export const useSupportedEvents = () =>
  useQuery({
    queryKey: webhookKeys.supportedEvents(),
    queryFn: getSupportedEvents,
    staleTime: Number.POSITIVE_INFINITY, // Events don't change often
  });

/**
 * Get user webhooks with filters
 */
export const useUserWebhooks = (params: WebhookListQuery = {}) =>
  useQuery({
    queryKey: webhookKeys.list(params),
    queryFn: () => getUserWebhooks(params),
    staleTime: 30_000,
  });

/**
 * Get a specific webhook
 */
export const useWebhook = (webhookId: string) =>
  useQuery({
    queryKey: webhookKeys.detail(webhookId),
    queryFn: () => getWebhook(webhookId),
    enabled: !!webhookId,
    staleTime: 60_000,
  });

/**
 * Get webhook delivery history
 */
export const useWebhookDeliveries = (
  webhookId: string,
  params: { page?: number; limit?: number } = {}
) =>
  useQuery({
    queryKey: webhookKeys.webhookDeliveries(webhookId, params),
    queryFn: () => getWebhookDeliveries(webhookId, params),
    enabled: !!webhookId,
    staleTime: 30_000,
  });

/**
 * Get specific webhook delivery
 */
export const useWebhookDelivery = (deliveryId: string) =>
  useQuery({
    queryKey: webhookKeys.delivery(deliveryId),
    queryFn: () => getWebhookDelivery(deliveryId),
    enabled: !!deliveryId,
    staleTime: 60_000,
  });

/**
 * Get webhook events
 */
export const useWebhookEvents = (webhookId: string) =>
  useQuery({
    queryKey: webhookKeys.webhookEvents(webhookId),
    queryFn: () => getWebhookEvents(webhookId),
    enabled: !!webhookId,
    staleTime: 60_000,
  });

/**
 * Get webhook analytics
 */
export const useWebhookAnalytics = (webhookId: string) =>
  useQuery({
    queryKey: webhookKeys.analytics(webhookId),
    queryFn: () => getWebhookAnalytics(webhookId),
    enabled: !!webhookId,
    staleTime: 300_000, // 5 minutes
  });

/**
 * Create webhook mutation
 */
export const useCreateWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhook: CreateWebhookInput) => createWebhook(webhook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
};

/**
 * Update webhook mutation
 */
export const useUpdateWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      webhookId,
      updates,
    }: {
      webhookId: string;
      updates: UpdateWebhookInput;
    }) => updateWebhook(webhookId, updates),
    onSuccess: (_, { webhookId }) => {
      queryClient.invalidateQueries({
        queryKey: webhookKeys.detail(webhookId),
      });
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
};

/**
 * Delete webhook mutation
 */
export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
};

/**
 * Test webhook mutation
 */
export const useTestWebhook = () =>
  useMutation({
    mutationFn: (webhookId: string) => testWebhook(webhookId),
  });

/**
 * Activate webhook mutation
 */
export const useActivateWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => activateWebhook(webhookId),
    onSuccess: (_, webhookId) => {
      queryClient.invalidateQueries({
        queryKey: webhookKeys.detail(webhookId),
      });
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
};

/**
 * Deactivate webhook mutation
 */
export const useDeactivateWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => deactivateWebhook(webhookId),
    onSuccess: (_, webhookId) => {
      queryClient.invalidateQueries({
        queryKey: webhookKeys.detail(webhookId),
      });
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
};

/**
 * Regenerate webhook secret mutation
 */
export const useRegenerateWebhookSecret = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => regenerateWebhookSecret(webhookId),
    onSuccess: (_, webhookId) => {
      queryClient.invalidateQueries({
        queryKey: webhookKeys.detail(webhookId),
      });
    },
  });
};

/**
 * Redeliver webhook mutation
 */
export const useRedeliverWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => redeliverWebhook(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.deliveries() });
    },
  });
};
