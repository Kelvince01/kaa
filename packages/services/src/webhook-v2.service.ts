import crypto from "node:crypto";
import {
  Webhook as WebhookConfig,
  WebhookDelivery,
  WebhookEvent,
} from "@kaa/models";
import {
  type CreateWebhookRequest,
  type IWebhookConfig,
  type IWebhookDelivery,
  type IWebhookEvent,
  type UpdateWebhookRequest,
  WEBHOOK_CONSTANTS,
  WebhookEventType,
  WebhookFailureReason,
  WebhookRetryStrategy,
  WebhookSecurityType,
  WebhookStatus,
} from "@kaa/models/types";
import { DateTime } from "luxon";
import type mongoose from "mongoose";
import { type FilterQuery, Types } from "mongoose";

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

class WebhooksService {
  private readonly deliveryQueue: Map<string, QueuedWebhook> = new Map();
  private readonly rateLimitMap: Map<
    string,
    { count: number; resetTime: Date }
  > = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startQueueProcessor();
  }

  // ===== WEBHOOK CONFIGURATION MANAGEMENT =====

  async createWebhook(
    data: CreateWebhookRequest,
    createdBy: string
  ): Promise<IWebhookConfig> {
    try {
      // Set default security configuration
      const security = {
        type: WebhookSecurityType.NONE,
        userAgent: "Kaa-Rental-Platform/1.0",
        ...data.security,
      };

      // Set default retry configuration based on event types
      let retryConfig = WEBHOOK_CONSTANTS.RETRY_CONFIGS.DEFAULT;
      if (data.events.some((event) => event.includes("mpesa"))) {
        retryConfig = WEBHOOK_CONSTANTS.RETRY_CONFIGS.MPESA;
      } else if (data.events.some((event) => event.includes("sms"))) {
        retryConfig = WEBHOOK_CONSTANTS.RETRY_CONFIGS.SMS;
      }

      const webhook = new WebhookConfig({
        ...data,
        security,
        retryConfig: { ...retryConfig, ...data.retryConfig },
        createdBy: new Types.ObjectId(createdBy),
      });

      await webhook.save();
      return webhook.toObject();
    } catch (error) {
      throw new Error(`Failed to create webhook: ${(error as Error).message}`);
    }
  }

  async updateWebhook(
    webhookId: string,
    data: UpdateWebhookRequest,
    updatedBy: string
  ): Promise<IWebhookConfig> {
    try {
      const webhook = await WebhookConfig.findById(webhookId);
      if (!webhook) {
        throw new Error("Webhook not found");
      }

      Object.assign(webhook, data);
      webhook.updatedBy = new Types.ObjectId(updatedBy);
      webhook.updatedAt = new Date();

      await webhook.save();
      return webhook.toObject();
    } catch (error) {
      throw new Error(`Failed to update webhook: ${(error as Error).message}`);
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      const webhook = await WebhookConfig.findById(webhookId);
      if (!webhook) {
        throw new Error("Webhook not found");
      }

      // Cancel any pending deliveries
      await WebhookDelivery.updateMany(
        { webhookId, status: WebhookStatus.PENDING },
        {
          status: WebhookStatus.CANCELLED,
          completedAt: new Date(),
        }
      );

      await WebhookConfig.findByIdAndDelete(webhookId);
    } catch (error) {
      throw new Error(`Failed to delete webhook: ${(error as Error).message}`);
    }
  }

  async getWebhook(webhookId: string): Promise<IWebhookConfig | null> {
    try {
      return await WebhookConfig.findById(webhookId).lean();
    } catch (error) {
      throw new Error(`Failed to get webhook: ${(error as Error).message}`);
    }
  }

  async getUserWebhooks(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: WebhookStatus;
      events?: WebhookEventType[];
    } = {}
  ): Promise<{ webhooks: IWebhookConfig[]; total: number }> {
    try {
      const query: FilterQuery<IWebhookConfig> = {
        createdBy: new Types.ObjectId(userId),
      };
      if (filters.status) query.status = filters.status;
      if (filters.events?.length) query.events = { $in: filters.events };

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [webhooks, total] = await Promise.all([
        WebhookConfig.find(query).skip(skip).limit(limit).lean(),
        WebhookConfig.countDocuments(query),
      ]);

      return { webhooks, total };
    } catch (error) {
      throw new Error(
        `Failed to get user webhooks: ${(error as Error).message}`
      );
    }
  }

  async listWebhooks(
    filters: {
      createdBy?: string;
      environment?: string;
      isActive?: boolean;
      events?: WebhookEventType[];
      tags?: string[];
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ webhooks: IWebhookConfig[]; total: number }> {
    try {
      const query: FilterQuery<IWebhookConfig> = {};

      if (filters.createdBy)
        query.createdBy = new Types.ObjectId(filters.createdBy);
      if (filters.environment) query.environment = filters.environment;
      if (typeof filters.isActive === "boolean")
        query.isActive = filters.isActive;
      if (filters.events?.length) query.events = { $in: filters.events };
      if (filters.tags?.length) query.tags = { $in: filters.tags };

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [webhooks, total] = await Promise.all([
        WebhookConfig.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        WebhookConfig.countDocuments(query),
      ]);

      return { webhooks, total };
    } catch (error) {
      throw new Error(`Failed to list webhooks: ${(error as Error).message}`);
    }
  }

  async getWebhookEvents(
    webhookId: string,
    filters: {
      page?: number;
      limit?: number;
      eventType?: WebhookEventType;
      status?: WebhookStatus;
    } = {}
  ): Promise<IWebhookEvent[]> {
    try {
      const query: FilterQuery<IWebhookEvent> = {
        webhookId: new Types.ObjectId(webhookId),
      };
      if (filters.eventType) query.type = filters.eventType;
      if (filters.status) query.status = filters.status;

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      return await WebhookEvent.find(query).skip(skip).limit(limit).lean();
    } catch (error) {
      throw new Error(
        `Failed to get webhook events: ${(error as Error).message}`
      );
    }
  }

  async getSupportedEvents(): Promise<WebhookEventType[]> {
    try {
      return await Promise.resolve(Object.values(WebhookEventType));
    } catch (error) {
      throw new Error(
        `Failed to get supported events: ${(error as Error).message}`
      );
    }
  }

  // ===== EVENT PUBLISHING =====

  async publishEvent(eventData: {
    type: WebhookEventType;
    resourceId: string;
    resourceType: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
    source?: string;
    correlationId?: string;
    causedBy?: {
      userId?: string;
      adminId?: string;
      system?: string;
      ip?: string;
      userAgent?: string;
    };
  }): Promise<string> {
    try {
      // Create webhook event
      const event = new WebhookEvent({
        ...eventData,
        id: new Types.ObjectId().toString(),
        timestamp: new Date(),
        source: eventData.source || "kaa-rental-platform",
        version: "1.0",
      });

      await event.save();

      // Find matching webhooks
      const matchingWebhooks = await this.findMatchingWebhooks(event);

      // Queue deliveries for matching webhooks
      for (const webhook of matchingWebhooks) {
        await this.queueDelivery(webhook, event);
      }

      return event.id;
    } catch (error) {
      throw new Error(`Failed to publish event: ${(error as Error).message}`);
    }
  }

  private async findMatchingWebhooks(
    event: IWebhookEvent
  ): Promise<IWebhookConfig[]> {
    try {
      const query: FilterQuery<IWebhookConfig> = {
        isActive: true,
        events: event.type,
      };

      const webhooks = await WebhookConfig.find(query).lean();

      // Apply additional filters
      const filteredWebhooks = await Promise.all(
        webhooks.map(async (webhook) => {
          const matches = await this.doesEventMatchFilters(event, webhook);
          return matches ? webhook : null;
        })
      );

      return filteredWebhooks.filter(Boolean) as IWebhookConfig[];
    } catch (error) {
      throw new Error(
        `Failed to find matching webhooks: ${(error as Error).message}`
      );
    }
  }

  private doesEventMatchFilters(
    event: IWebhookEvent,
    webhook: IWebhookConfig
  ): boolean {
    if (!webhook.filters) return true;

    const filters = webhook.filters;
    const eventData = event.data;

    // Check time window filter (Kenya timezone)
    if (filters.timeWindow) {
      const now = DateTime.now().setZone("Africa/Nairobi");

      const startTime = DateTime.fromFormat(filters.timeWindow.start, "HH:mm", {
        zone: "Africa/Nairobi",
      });

      const endTime = DateTime.fromFormat(filters.timeWindow.end, "HH:mm", {
        zone: "Africa/Nairobi",
      });

      if (!(now >= startTime && now <= endTime)) {
        return false;
      }
    }

    // Check amount filters
    if (filters.minAmount && eventData.amount < filters.minAmount) return false;
    if (filters.maxAmount && eventData.amount > filters.maxAmount) return false;

    // Check county filters
    if (
      filters.counties?.length &&
      eventData.county &&
      !filters.counties.includes(eventData.county)
    )
      return false;

    // Check user type filters
    if (
      filters.userTypes?.length &&
      eventData.userType &&
      !filters.userTypes.includes(eventData.userType)
    )
      return false;

    // Check property type filters
    if (
      filters.propertyTypes?.length &&
      eventData.propertyType &&
      !filters.propertyTypes.includes(eventData.propertyType)
    )
      return false;

    // Check custom conditions
    if (filters.conditions?.length) {
      return this.evaluateConditions(eventData, filters.conditions);
    }

    return true;
  }

  private evaluateConditions(data: any, conditions: any[]): boolean {
    let result = true;
    let currentLogicalOperator = "and";

    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(data, condition.field);
      const conditionResult = this.evaluateCondition(fieldValue, condition);

      if (currentLogicalOperator === "and") {
        // biome-ignore lint/nursery/noUnnecessaryConditions: ignore
        result = result && conditionResult;
      } else {
        // biome-ignore lint/nursery/noUnnecessaryConditions: ignore
        result = result || conditionResult;
      }

      currentLogicalOperator = condition.logicalOperator || "and";
    }

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(fieldValue: any, condition: any): boolean {
    switch (condition.operator) {
      case "eq":
        return fieldValue === condition.value;
      case "ne":
        return fieldValue !== condition.value;
      case "gt":
        return fieldValue > condition.value;
      case "gte":
        return fieldValue >= condition.value;
      case "lt":
        return fieldValue < condition.value;
      case "lte":
        return fieldValue <= condition.value;
      case "in":
        return (
          Array.isArray(condition.value) && condition.value.includes(fieldValue)
        );
      case "nin":
        return (
          Array.isArray(condition.value) &&
          !condition.value.includes(fieldValue)
        );
      case "exists":
        return fieldValue !== undefined && fieldValue !== null;
      case "regex":
        try {
          const regex = new RegExp(condition.value);
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  // ===== DELIVERY MANAGEMENT =====

  private async queueDelivery(
    webhook: IWebhookConfig,
    event: IWebhookEvent
  ): Promise<void> {
    try {
      const delivery = new WebhookDelivery({
        webhookId: webhook.id,
        eventId: event.id,
        attempt: 1,
        status: WebhookStatus.PENDING,
        startedAt: new Date(),
      });

      await delivery.save();

      // Add to in-memory queue for immediate processing
      const priority = this.getPriorityValue(webhook.priority);
      const queuedWebhook: QueuedWebhook = {
        webhookId: webhook.id,
        eventId: event.id,
        scheduledAt: new Date(),
        priority,
      };

      this.deliveryQueue.set(delivery.id, queuedWebhook);
    } catch (error) {
      console.error("Failed to queue delivery:", error);
    }
  }

  private getPriorityValue(priority: string): number {
    const priorityMap = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return priorityMap[priority as keyof typeof priorityMap] || 2;
  }

  private async deliverWebhook(delivery: IWebhookDelivery): Promise<void> {
    try {
      const webhook = await WebhookConfig.findById(delivery.webhookId);
      const event = await WebhookEvent.findById(delivery.eventId);

      if (!(webhook && event)) {
        await this.markDeliveryFailed(
          (delivery._id as mongoose.Types.ObjectId).toString(),
          {
            code: WebhookFailureReason.UNKNOWN,
            message: "Webhook or event not found",
          }
        );
        return;
      }

      // Check rate limiting
      if (!this.checkRateLimit(webhook)) {
        await this.scheduleRetry(delivery, webhook);
        return;
      }

      // Transform payload
      const payload = await this.transformPayload(event, webhook);

      // Make HTTP request
      const result = await this.makeHttpRequest(webhook, payload);

      if (result.success) {
        await this.markDeliverySuccess(
          (delivery._id as mongoose.Types.ObjectId).toString(),
          result
        );
        await webhook.updateLastTriggered();
      } else if (this.shouldRetry(delivery, webhook, result.statusCode)) {
        await this.scheduleRetry(delivery, webhook);
      } else {
        await this.markDeliveryFailed(
          (delivery._id as mongoose.Types.ObjectId).toString(),
          result.error
        );
      }
    } catch (error) {
      console.error("Delivery error:", error);
      await this.markDeliveryFailed(
        (delivery._id as mongoose.Types.ObjectId).toString(),
        {
          code: WebhookFailureReason.UNKNOWN,
          message: (error as Error).message,
        }
      );
    }
  }

  private checkRateLimit(webhook: IWebhookConfig): boolean {
    if (!webhook.rateLimit?.enabled) return true;

    const key = webhook.id;
    const now = new Date();
    const rateLimit = this.rateLimitMap.get(key);

    if (!rateLimit || now > rateLimit.resetTime) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + webhook.rateLimit.windowMs),
      });
      return true;
    }

    if (rateLimit.count >= webhook.rateLimit.maxRequests) {
      return false;
    }

    rateLimit.count++;
    return true;
  }

  private transformPayload(event: IWebhookEvent, webhook: IWebhookConfig): any {
    let payload = {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      data: event.data,
      metadata: event.metadata,
    };

    if (webhook.transformation) {
      const transform = webhook.transformation;

      // Apply field mappings
      if (transform.mapping) {
        const mappedPayload = {};
        for (const [from, to] of Object.entries(transform.mapping)) {
          const value = this.getNestedValue(payload, from);
          if (value !== undefined) {
            this.setNestedValue(mappedPayload, to, value);
          }
        }
        payload = { ...payload, ...mappedPayload };
      }

      // Include/exclude fields
      if (transform.includeFields?.length) {
        const filteredPayload = {};
        for (const field of transform.includeFields) {
          const value = this.getNestedValue(payload, field);
          if (value !== undefined) {
            this.setNestedValue(filteredPayload, field, value);
          }
        }
        payload = filteredPayload as any;
      }

      if (transform.excludeFields?.length) {
        for (const field of transform.excludeFields) {
          this.deleteNestedValue(payload, field);
        }
      }

      // Add custom fields
      if (transform.addFields) {
        Object.assign(payload, transform.addFields);
      }

      // Apply template transformation (simplified)
      if (transform.template) {
        // This is a simplified template engine - in production, use Handlebars
        let templateResult = transform.template;
        for (const [key, value] of Object.entries(payload)) {
          templateResult = templateResult.replace(
            new RegExp(`{{${key}}}`, "g"),
            String(value)
          );
        }
        payload = { transformed: templateResult, original: payload } as any;
      }
    }

    return payload;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop() ?? "";
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private deleteNestedValue(obj: any, path: string): void {
    const keys = path.split(".");
    const lastKey = keys.pop() ?? "";
    const target = keys.reduce((current, key) => current?.[key], obj);
    if (target) {
      delete target[lastKey];
    }
  }

  private async makeHttpRequest(
    webhook: IWebhookConfig,
    payload: any
  ): Promise<DeliveryResult> {
    const startTime = Date.now();
    let requestBody: string;

    try {
      // Prepare request body based on content type
      switch (webhook.contentType) {
        case "application/json":
          requestBody = JSON.stringify(payload);
          break;
        case "application/x-www-form-urlencoded":
          requestBody = new URLSearchParams(payload).toString();
          break;
        case "application/xml":
          requestBody = this.jsonToXml(payload);
          break;
        case "text/plain":
          requestBody = String(payload);
          break;
        default:
          requestBody = JSON.stringify(payload);
      }

      // Prepare headers
      const headers = new Headers({
        "Content-Type": webhook.contentType,
        "User-Agent": webhook.security.userAgent || "Kaa-Rental-Platform/1.0",
        ...webhook.headers,
      });

      // Apply security headers
      this.applySecurityHeaders(headers, webhook.security, requestBody);

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout);

      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers,
        body: webhook.method === "GET" ? undefined : requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      const responseText = await response.text();

      return {
        success: response.ok,
        statusCode: response.status,
        response: {
          statusCode: response.status,
          statusMessage: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText,
          duration,
          size: Buffer.byteLength(responseText, "utf8"),
        },
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      let failureReason = WebhookFailureReason.UNKNOWN;
      if (error.name === "AbortError") {
        failureReason = WebhookFailureReason.TIMEOUT;
      } else if (error.message.includes("fetch")) {
        failureReason = WebhookFailureReason.CONNECTION_ERROR;
      }

      return {
        success: false,
        error: {
          code: failureReason,
          message: error.message,
          details: error,
        },
        duration,
      };
    }
  }

  private applySecurityHeaders(
    headers: Headers,
    security: any,
    requestBody: string
  ): void {
    switch (security.type) {
      case WebhookSecurityType.API_KEY:
        if (security.apiKey) {
          headers.set("X-API-Key", security.apiKey);
        }
        break;

      case WebhookSecurityType.BEARER_TOKEN:
        if (security.bearerToken) {
          headers.set("Authorization", `Bearer ${security.bearerToken}`);
        }
        break;

      case WebhookSecurityType.BASIC_AUTH:
        if (security.basicAuth) {
          const credentials = btoa(
            `${security.basicAuth.username}:${security.basicAuth.password}`
          );
          headers.set("Authorization", `Basic ${credentials}`);
        }
        break;

      case WebhookSecurityType.HMAC_SHA256:
        if (security.hmacSecret) {
          const signature = crypto
            .createHmac("sha256", security.hmacSecret)
            .update(requestBody)
            .digest("hex");
          headers.set("X-Webhook-Signature", `sha256=${signature}`);
        }
        break;

      case WebhookSecurityType.OAUTH2:
        // OAuth2 would require token management - simplified here
        if (security.oauth2?.accessToken) {
          headers.set("Authorization", `Bearer ${security.oauth2.accessToken}`);
        }
        break;
      default:
        break;
    }

    // Apply custom headers
    if (security.customHeaders) {
      for (const [key, value] of Object.entries(security.customHeaders)) {
        headers.set(key, value as string);
      }
    }
  }

  private jsonToXml(obj: any): string {
    // Simplified JSON to XML conversion
    const toXml = (data: any, indent = ""): string => {
      if (typeof data !== "object" || data === null) {
        return String(data);
      }

      let xml = "";
      for (const [key, value] of Object.entries(data)) {
        xml += `${indent}<${key}>`;
        if (typeof value === "object" && value !== null) {
          xml += `\n${toXml(value, `${indent}  `)}\n${indent}`;
        } else {
          xml += String(value);
        }
        xml += `</${key}>\n`;
      }
      return xml;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${toXml(obj, "  ")}</root>`;
  }

  private shouldRetry(
    delivery: IWebhookDelivery,
    webhook: IWebhookConfig,
    statusCode?: number
  ): boolean {
    if (!webhook.retryConfig.enabled) return false;
    if (delivery.attempt >= webhook.retryConfig.maxAttempts) return false;

    if (statusCode) {
      if (webhook.retryConfig.stopOnStatus?.includes(statusCode)) return false;
      if (
        webhook.retryConfig.retryOnStatus?.length &&
        !webhook.retryConfig.retryOnStatus.includes(statusCode)
      )
        return false;
    }

    return true;
  }

  private async scheduleRetry(
    delivery: IWebhookDelivery,
    webhook: IWebhookConfig
  ): Promise<void> {
    const delay = this.calculateRetryDelay(
      delivery.attempt,
      webhook.retryConfig
    );
    const nextRetryAt = new Date(Date.now() + delay);

    await WebhookDelivery.findByIdAndUpdate(delivery._id, {
      status: WebhookStatus.PENDING,
      nextRetryAt,
      attempt: delivery.attempt + 1,
    });
  }

  private calculateRetryDelay(attempt: number, retryConfig: any): number {
    let delay = retryConfig.initialDelay;

    switch (retryConfig.strategy) {
      case WebhookRetryStrategy.EXPONENTIAL_BACKOFF:
        delay *= (retryConfig.backoffMultiplier || 2) ** (attempt - 1);
        break;
      case WebhookRetryStrategy.LINEAR_BACKOFF:
        delay *= attempt;
        break;
      case WebhookRetryStrategy.FIXED_DELAY:
        // delay remains the same
        break;
      case WebhookRetryStrategy.IMMEDIATE:
        delay = 0;
        break;
      default:
        break;
    }

    return Math.min(delay, retryConfig.maxDelay);
  }

  private async markDeliverySuccess(
    deliveryId: string,
    result: DeliveryResult
  ): Promise<void> {
    await WebhookDelivery.findByIdAndUpdate(deliveryId, {
      status: WebhookStatus.DELIVERED,
      completedAt: new Date(),
      httpStatus: result.statusCode,
      response: result.response,
    });
  }

  private async markDeliveryFailed(
    deliveryId: string,
    error: any
  ): Promise<void> {
    await WebhookDelivery.findByIdAndUpdate(deliveryId, {
      status: WebhookStatus.FAILED,
      completedAt: new Date(),
      error,
    });
  }

  // ===== QUEUE PROCESSING =====

  private startQueueProcessor(): void {
    this.processingInterval = setInterval(async () => {
      await this.processDeliveryQueue();
      await this.processRetries();
    }, 5000); // Process every 5 seconds
  }

  private async processDeliveryQueue(): Promise<void> {
    try {
      // Sort by priority and scheduled time
      const sortedDeliveries = Array.from(this.deliveryQueue.entries()).sort(
        ([, a], [, b]) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          return a.scheduledAt.getTime() - b.scheduledAt.getTime();
        }
      );

      // Process up to 10 deliveries at once
      const deliveriesToProcess = sortedDeliveries.slice(0, 10);

      for (const [deliveryId] of deliveriesToProcess) {
        const delivery = await WebhookDelivery.findById(deliveryId);
        if (delivery && delivery.status === WebhookStatus.PENDING) {
          await this.deliverWebhook(delivery);
        }
        this.deliveryQueue.delete(deliveryId);
      }
    } catch (error) {
      console.error("Queue processing error:", error);
    }
  }

  private async processRetries(): Promise<void> {
    try {
      const pendingRetries = await WebhookDelivery.find({
        status: WebhookStatus.PENDING,
        nextRetryAt: { $lte: new Date() },
      });

      for (const delivery of pendingRetries) {
        await this.deliverWebhook(delivery);
      }
    } catch (error) {
      console.error("Retry processing error:", error);
    }
  }

  // ===== ANALYTICS AND MONITORING =====

  async getWebhookStats(webhookId?: string): Promise<WebhookStats> {
    try {
      const webhookFilter = webhookId
        ? { _id: new Types.ObjectId(webhookId) }
        : {};
      const deliveryFilter = webhookId
        ? { webhookId: new Types.ObjectId(webhookId) }
        : {};

      const [
        totalWebhooks,
        activeWebhooks,
        totalEvents,
        deliveryStats,
        responseTimeStats,
      ] = await Promise.all([
        WebhookConfig.countDocuments(webhookFilter),
        WebhookConfig.countDocuments({ ...webhookFilter, isActive: true }),
        WebhookEvent.countDocuments(),
        WebhookDelivery.aggregate([
          { $match: deliveryFilter },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        WebhookDelivery.aggregate([
          { $match: { ...deliveryFilter, duration: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              avgDuration: { $avg: "$duration" },
            },
          },
        ]),
      ]);

      const totalDeliveries = deliveryStats.reduce(
        (sum, stat) => sum + stat.count,
        0
      );
      const successfulDeliveries =
        deliveryStats.find((stat) => stat._id === WebhookStatus.DELIVERED)
          ?.count || 0;
      const failedDeliveries =
        deliveryStats.find((stat) => stat._id === WebhookStatus.FAILED)
          ?.count || 0;
      const successRate =
        totalDeliveries > 0
          ? (successfulDeliveries / totalDeliveries) * 100
          : 0;
      const averageResponseTime = responseTimeStats[0]?.avgDuration || 0;

      return {
        totalWebhooks,
        activeWebhooks,
        totalEvents,
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        averageResponseTime,
        successRate,
      };
    } catch (error) {
      throw new Error(
        `Failed to get webhook stats: ${(error as Error).message}`
      );
    }
  }

  async getWebhookDelivery(
    deliveryId: string
  ): Promise<IWebhookDelivery | null> {
    try {
      return await WebhookDelivery.findById(deliveryId).lean();
    } catch (error) {
      throw new Error(`Failed to get delivery: ${(error as Error).message}`);
    }
  }

  async getDeliveryHistory(
    webhookId: string,
    filters: {
      status?: WebhookStatus[];
      dateRange?: { start: Date; end: Date };
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ deliveries: IWebhookDelivery[]; total: number }> {
    try {
      const query: FilterQuery<IWebhookDelivery> = {
        webhookId: new Types.ObjectId(webhookId),
      };

      if (filters.status?.length) {
        query.status = { $in: filters.status };
      }

      if (filters.dateRange) {
        query.startedAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end,
        };
      }

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const [deliveries, total] = await Promise.all([
        WebhookDelivery.find(query)
          .populate("eventId")
          .sort({ startedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        WebhookDelivery.countDocuments(query),
      ]);

      return { deliveries: deliveries as IWebhookDelivery[], total };
    } catch (error) {
      throw new Error(
        `Failed to get delivery history: ${(error as Error).message}`
      );
    }
  }

  // ===== UTILITY METHODS =====

  async testWebhook(webhookId: string): Promise<DeliveryResult> {
    try {
      const webhook = await WebhookConfig.findById(webhookId);
      if (!webhook) {
        throw new Error("Webhook not found");
      }

      const testPayload = {
        id: "test-event",
        type: WebhookEventType.CUSTOM,
        timestamp: new Date(),
        data: {
          test: true,
          message: "This is a test webhook delivery from Kaa Rental Platform",
        },
      };

      return await this.makeHttpRequest(webhook, testPayload);
    } catch (error) {
      throw new Error(`Failed to test webhook: ${(error as Error).message}`);
    }
  }

  async retryFailedDeliveries(webhookId: string): Promise<number> {
    try {
      const failedDeliveries = await WebhookDelivery.find({
        webhookId: new Types.ObjectId(webhookId),
        status: WebhookStatus.FAILED,
      });

      let retriedCount = 0;
      for (const delivery of failedDeliveries) {
        delivery.status = WebhookStatus.PENDING;
        delivery.attempt = 1;
        delivery.nextRetryAt = new Date();
        await delivery.save();
        retriedCount++;
      }

      return retriedCount;
    } catch (error) {
      throw new Error(
        `Failed to retry failed deliveries: ${(error as Error).message}`
      );
    }
  }

  async redeliverWebhook(deliveryId: string): Promise<void> {
    try {
      const delivery = await WebhookDelivery.findById(deliveryId);
      if (!delivery) {
        throw new Error("Delivery not found");
      }

      delivery.status = WebhookStatus.PENDING;
      delivery.attempt = 1;
      delivery.nextRetryAt = new Date();
      await delivery.save();

      await this.deliverWebhook(delivery);
    } catch (error) {
      throw new Error(
        `Failed to redeliver webhook: ${(error as Error).message}`
      );
    }
  }

  /**
   * @description Handle incoming webhook (for external services)
   */
  async handleIncomingWebhook(service: string): Promise<void> {
    try {
      const webhook = await WebhookConfig.findOne({ service });
      if (!webhook) {
        throw new Error("Webhook not found");
      }

      const event = await WebhookEvent.create({
        webhookId: webhook._id,
        type: WebhookEventType.CUSTOM,
        timestamp: new Date(),
        data: {},
      });

      const delivery = await WebhookDelivery.create({
        webhookId: webhook._id,
        eventId: event._id,
        status: WebhookStatus.PENDING,
        attempt: 1,
        nextRetryAt: new Date(),
      });

      await this.deliverWebhook(delivery);
    } catch (error) {
      throw new Error(
        `Failed to handle incoming webhook: ${(error as Error).message}`
      );
    }
  }

  async cleanupOldDeliveries(daysOld = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const result = await WebhookDelivery.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: {
          $in: [
            WebhookStatus.DELIVERED,
            WebhookStatus.FAILED,
            WebhookStatus.CANCELLED,
          ],
        },
      });

      return result.deletedCount || 0;
    } catch (error) {
      throw new Error(
        `Failed to cleanup old deliveries: ${(error as Error).message}`
      );
    }
  }

  // ===== SHUTDOWN =====

  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Export singleton instance
export const webhooksV2Service = new WebhooksService();
