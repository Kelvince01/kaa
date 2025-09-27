import { randomBytes } from "node:crypto";
import { Webhook } from "@kaa/models";
import type { IWebhookConfig as IWebhook } from "@kaa/models/types";

// Get webhooks by user ID
export const getWebhooksByUserId = async (
  userId: string
): Promise<IWebhook[]> => {
  try {
    const webhooks = await Webhook.find({ userId }).exec();
    return webhooks;
  } catch (error) {
    console.error(`Error getting webhooks by user ID: ${error}`);
    return [];
  }
};

// Get webhook by ID
export const getWebhookById = async (
  webhookId: string
): Promise<IWebhook | null> => {
  try {
    const webhook = await Webhook.findById(webhookId).exec();
    return webhook;
  } catch (error) {
    console.error(`Error getting webhook by ID: ${error}`);
    return null;
  }
};

// Get webhooks by event
export const getWebhooksByEvent = async (
  event: string
): Promise<IWebhook[]> => {
  try {
    const webhooks = await Webhook.find({
      events: event,
      isActive: true,
    }).exec();
    return webhooks;
  } catch (error) {
    console.error(`Error getting webhooks by event: ${error}`);
    return [];
  }
};

// Create a new webhook
export const createWebhook = async (
  webhookData: Partial<IWebhook>
): Promise<IWebhook> => {
  try {
    const secret = randomBytes(32).toString("hex");

    const webhook = await Webhook.create({
      ...webhookData,
      "security.hmacSecret": webhookData.security?.hmacSecret
        ? webhookData.security.hmacSecret
        : secret,
      isActive:
        webhookData.isActive !== undefined ? webhookData.isActive : true,
    });

    return webhook;
  } catch (error) {
    console.error(`Error creating webhook: ${error}`);
    throw new Error("Failed to create webhook");
  }
};

// Update webhook
export const updateWebhook = async (
  webhookId: string,
  updateData: Partial<IWebhook>
): Promise<IWebhook> => {
  try {
    const webhook = await Webhook.findByIdAndUpdate(
      webhookId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).exec();

    if (!webhook) {
      throw new Error("Webhook not found after update");
    }

    return webhook;
  } catch (error) {
    console.error(`Error updating webhook: ${error}`);
    throw new Error("Failed to update webhook");
  }
};

// Update webhook response status
export const updateWebhookResponse = async (
  webhookId: string,
  _statusCode: number,
  _message: string
): Promise<boolean> => {
  try {
    const webhook = await Webhook.findByIdAndUpdate(webhookId, {
      lastTriggered: new Date(),
      // lastResponse: {
      //   statusCode,
      //   message,
      // },
      updatedAt: new Date(),
    }).exec();

    return !!webhook;
  } catch (error) {
    console.error(`Error updating webhook response: ${error}`);
    return false;
  }
};

// Delete webhook
export const deleteWebhook = async (webhookId: string): Promise<boolean> => {
  try {
    const webhook = await Webhook.findByIdAndDelete(webhookId).exec();
    return !!webhook;
  } catch (error) {
    console.error(`Error deleting webhook: ${error}`);
    throw new Error("Failed to delete webhook");
  }
};
