import crypto from "node:crypto";
import { WebhookDelivery } from "@kaa/models";
import {
  type IWebhookConfig as IWebhook,
  type WebhookFailureReason,
  WebhookSecurityType,
  WebhookStatus,
} from "@kaa/models/types";
import { logger } from "@kaa/utils";
import axios from "axios";
import * as webhookRepository from "./repositories/webhooks.repository";

type QueuedWebhook = {
  webhookId: string;
  eventId: string;
  scheduledAt: Date;
  priority: number;
};

type DeliveryResult = {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: {
    code: WebhookFailureReason;
    message: string;
    details?: any;
  };
  duration: number;
};

type WebhookStats = {
  totalWebhooks: number;
  activeWebhooks: number;
  totalEvents: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  successRate: number;
};

type WebhookPayload = {
  event: string;
  data: any;
  timestamp: number;
};

// Sign payload with webhook secret
const signPayload = (payload: WebhookPayload, secret: string): string => {
  const hmac = crypto.createHmac("sha256", secret);
  const signature = hmac.update(JSON.stringify(payload)).digest("hex");
  return signature;
};

/**
 * Verify webhook signature
 */
const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return signature === `sha256=${expectedSignature}`;
};

// Trigger webhooks for an event
export const triggerWebhooks = async (
  memberId: string,
  event: string,
  data: any
): Promise<void> => {
  try {
    // Find all active webhooks for this event
    const webhooks = await webhookRepository.getWebhooksByEvent(event);

    if (webhooks.length === 0) {
      console.log(`No webhooks registered for event: ${event}`);
      return;
    }

    console.log(`Triggering ${webhooks.length} webhooks for event: ${event}`);

    // Prepare payload
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: Date.now(),
    };

    for (const webhook of webhooks) {
      await WebhookDelivery.create({
        webhookId: webhook._id,
        memberId: memberId ? memberId : webhook.memberId,
        event,
        payload,
        status: "pending",
      });
    }

    // Process deliveries asynchronously
    processWebhookDeliveries();

    // Send webhooks asynchronously
    const promises = webhooks.map((webhook) => sendWebhook(webhook, payload));

    // We don't await these promises to avoid blocking the main process
    // Results are handled in the sendWebhook function
    Promise.allSettled(promises).catch((error) => {
      console.error("Error processing webhooks:", error);
    });
  } catch (error) {
    console.error(`Error triggering webhooks for event ${event}:`, error);
  }
};

// Send webhook to a specific endpoint
const sendWebhook = async (
  webhook: IWebhook,
  payload: WebhookPayload
): Promise<void> => {
  try {
    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...webhook.headers,
    };

    // Add signature if webhook has secret
    if (webhook.security.type === WebhookSecurityType.HMAC_SHA256) {
      const signature = signPayload(payload, webhook.security.hmacSecret || "");
      headers["X-Webhook-Signature"] = signature;
    }

    // Add webhook ID for debugging
    headers["X-Webhook-ID"] = webhook.id || "";

    // Send webhook with 5 second timeout
    const response = await axios.post(webhook.url, payload, {
      headers,
      timeout: 5000,
    });

    // Update webhook with response
    await webhookRepository.updateWebhookResponse(
      webhook.id || "",
      response.status,
      "Success"
    );

    console.log(
      `Webhook ${webhook.id} triggered successfully for ${payload.event}`
    );
  } catch (error) {
    console.error(`Error sending webhook ${webhook.id}:`, error);

    // Update webhook with error
    if (webhook.id) {
      let statusCode = 500;
      let message = "Internal error";

      if (axios.isAxiosError(error)) {
        statusCode = error.response?.status || 500;
        message = error.message;
      }

      await webhookRepository.updateWebhookResponse(
        webhook.id,
        statusCode,
        message
      );
    }
  }
};

// Validate webhook URL (optional helper function)
export const validateWebhookUrl = async (url: string): Promise<boolean> => {
  try {
    // Basic URL validation
    new URL(url);

    // Optional: Ping the URL to see if it responds
    // This is not always reliable and may be skipped
    await axios.options(url, { timeout: 3000 });

    return true;
  } catch (error) {
    console.error(`Invalid webhook URL: ${url}`, error);
    return false;
  }
};

/**
 * Get webhook deliveries
 */
export const getWebhookDeliveries = async (
  webhookId: string,
  query: any = {}
) => {
  const { page = 1, limit = 50, status } = query;

  const filter: any = { webhookId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const deliveries = await WebhookDelivery.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await WebhookDelivery.countDocuments(filter);

  return {
    deliveries,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Process webhook deliveries asynchronously
 */
export async function processWebhookDeliveries() {
  try {
    const pendingDeliveries = await WebhookDelivery.find({
      status: { $in: ["pending", "retrying"] },
      $or: [
        { nextRetryAt: { $exists: false } },
        { nextRetryAt: { $lte: new Date() } },
      ],
    }).populate("webhookId");

    for (const delivery of pendingDeliveries) {
      try {
        const webhook = delivery.webhookId as any;

        if (!webhook?.isActive) {
          delivery.status = WebhookStatus.FAILED;
          await delivery.save();
          continue;
        }

        // Create signature
        const payload = JSON.stringify(delivery.request?.body);
        const signature = crypto
          .createHmac("sha256", webhook.security.hmacSecret || "")
          .update(payload)
          .digest("hex");

        // Send webhook
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": `sha256=${signature}`,
            "X-Webhook-Event": delivery.eventId.toString(),
            ...webhook.headers,
          },
          body: payload,
        });

        delivery.attempt += 1;
        delivery.httpStatus = response.status;
        delivery.response = (await response.json()) as any;

        if (response.ok) {
          delivery.status = WebhookStatus.DELIVERED;
          delivery.completedAt = new Date();
          webhook.lastTriggered = new Date();
          await webhook.save();
        } else {
          throw new Error(`HTTP ${response.status}: ${delivery.response}`);
        }

        await delivery.save();
        logger.info(`Webhook delivered successfully: ${delivery._id}`);
      } catch (error) {
        delivery.attempt += 1;

        const webhook = delivery.webhookId as any;
        const maxRetries = webhook?.retryPolicy?.maxRetries || 3;

        if (delivery.attempt >= maxRetries) {
          delivery.status = WebhookStatus.FAILED;
        } else {
          delivery.status = WebhookStatus.RETRYING;
          const backoffMultiplier =
            webhook?.retryPolicy?.backoffMultiplier || 2;
          const maxBackoffSeconds =
            webhook?.retryPolicy?.maxBackoffSeconds || 300;

          const backoffSeconds = Math.min(
            backoffMultiplier ** (delivery.attempt - 1) * 60,
            maxBackoffSeconds
          );

          delivery.nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
        }

        await delivery.save();
        logger.error(`Webhook delivery failed: ${delivery._id}`, error);
      }
    }
  } catch (error) {
    logger.error("Error processing webhook deliveries", error);
  }
}
