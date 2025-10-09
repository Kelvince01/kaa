/**
 * Airtel Money Service for Virtual Tours
 * Dedicated service for Airtel Money payments with tour-specific optimizations
 */

import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import { SmsPriority } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import { smsService } from "../comms/sms.service";
import { alternativePaymentsService } from "./provider.service";

type AirtelMoneyTransaction = {
  id: string;
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  airtelReceiptNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
};

type AirtelMoneyConfig = {
  enabled: boolean;
  environment: "sandbox" | "production";
  merchantCode: string;
  clientId: string;
  clientSecret: string;
};

class AirtelMoneyService extends EventEmitter {
  private readonly config: AirtelMoneyConfig;
  private readonly transactions: Map<string, AirtelMoneyTransaction> =
    new Map();

  constructor() {
    super();

    this.config = {
      enabled: process.env.AIRTEL_MONEY_ENABLED === "true",
      environment:
        (process.env.AIRTEL_ENVIRONMENT as "sandbox" | "production") ||
        "sandbox",
      merchantCode: process.env.AIRTEL_MERCHANT_CODE || "",
      clientId: process.env.AIRTEL_CLIENT_ID || "",
      clientSecret: process.env.AIRTEL_CLIENT_SECRET || "",
    };
  }

  /**
   * Process Airtel Money payment for virtual tours
   */
  async processPayment(payment: {
    phoneNumber: string;
    amount: number;
    reference: string;
    description: string;
    tourId?: string;
  }): Promise<AirtelMoneyTransaction> {
    if (!this.config.enabled) {
      throw new Error("Airtel Money payments are not enabled");
    }

    try {
      const transactionId = crypto.randomUUID();

      const transaction: AirtelMoneyTransaction = {
        id: transactionId,
        phoneNumber: this.formatPhoneNumber(payment.phoneNumber),
        amount: payment.amount,
        reference: payment.reference,
        description: payment.description,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { tourId: payment.tourId, source: "virtual-tours" },
      };

      // Use existing alternative payments service
      const result = await alternativePaymentsService.processPayment({
        id: transactionId,
        providerId: "airtel_money",
        amount: payment.amount,
        currency: "KES",
        phoneNumber: payment.phoneNumber,
        reference: payment.reference,
        description: payment.description,
        metadata: transaction.metadata,
      });

      // Update transaction with provider response
      transaction.status = this.mapProviderStatus(result.status);
      transaction.updatedAt = new Date();

      this.transactions.set(transactionId, transaction);

      // Send SMS notification
      await this.sendPaymentSMS({
        phoneNumber: payment.phoneNumber,
        amount: payment.amount,
        reference: payment.reference,
        status: "initiated",
      });

      this.emit("airtel-payment-initiated", {
        transactionId,
        phoneNumber: payment.phoneNumber,
        amount: payment.amount,
        reference: payment.reference,
      });

      return transaction;
    } catch (error) {
      logger.error("Airtel Money payment processing error:", error);
      throw new Error(
        `Failed to process Airtel Money payment: ${(error as Error).message}`
      );
    }
  }

  /**
   * Verify Airtel Money payment status
   */
  async verifyPayment(
    transactionId: string
  ): Promise<AirtelMoneyTransaction | null> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return null;

    try {
      // Check with provider service (this would query Airtel Money API)
      // For now, we'll simulate status checking

      // Update transaction status based on provider response
      // This would be implemented with actual Airtel Money API calls

      return await Promise.resolve(transaction);
    } catch (error) {
      logger.error("Airtel Money verification error:", error);
      return null;
    }
  }

  /**
   * Handle Airtel Money callback/webhook
   */
  async handleCallback(callbackData: any): Promise<boolean> {
    try {
      const { transactionId, status, receipt, amount, phoneNumber } =
        callbackData;

      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        logger.warn(
          `Airtel Money callback for unknown transaction: ${transactionId}`
        );
        return false;
      }

      // Update transaction status
      transaction.status = this.mapCallbackStatus(status);
      transaction.airtelReceiptNumber = receipt;
      transaction.updatedAt = new Date();

      this.transactions.set(transactionId, transaction);

      // Send SMS notification based on status
      const smsStatus =
        transaction.status === "completed"
          ? "completed"
          : transaction.status === "failed"
            ? "failed"
            : "processing";

      await this.sendPaymentSMS({
        phoneNumber: transaction.phoneNumber,
        amount: transaction.amount,
        reference: transaction.reference,
        status: smsStatus,
      });

      this.emit("airtel-payment-updated", {
        transactionId,
        status: transaction.status,
        receipt: transaction.airtelReceiptNumber,
      });

      return true;
    } catch (error) {
      logger.error("Airtel Money callback processing error:", error);
      return false;
    }
  }

  /**
   * Send Airtel Money payment SMS
   */
  private async sendPaymentSMS(options: {
    phoneNumber: string;
    amount: number;
    reference: string;
    status: "initiated" | "completed" | "failed" | "processing";
  }): Promise<void> {
    try {
      let message: string;
      const formattedAmount = this.formatCurrency(options.amount);

      switch (options.status) {
        case "initiated":
          message = `Airtel Money payment of ${formattedAmount} initiated for ref: ${options.reference}. Check your phone for payment prompt. - Kaa Tours`;
          break;
        case "completed":
          message = `Airtel Money payment of ${formattedAmount} completed successfully! Ref: ${options.reference}. Your virtual tour is now available. - Kaa Tours`;
          break;
        case "failed":
          message = `Airtel Money payment of ${formattedAmount} failed for ref: ${options.reference}. Please try again or contact support. - Kaa Tours`;
          break;
        case "processing":
          message = `Airtel Money payment of ${formattedAmount} is being processed for ref: ${options.reference}. You'll be notified once complete. - Kaa Tours`;
          break;
        default:
          message = `Airtel Money payment of ${formattedAmount} is being processed for ref: ${options.reference}. You'll be notified once complete. - Kaa Tours`;
          break;
      }

      await smsService.sendSms({
        to: [{ phoneNumber: options.phoneNumber }],
        message,
        type: "notification",
        priority: SmsPriority.HIGH,
        context: {
          source: "virtual-tours",
          provider: "airtel-money",
          paymentStatus: options.status,
        },
      });
    } catch (error) {
      logger.error("Airtel Money SMS error:", error);
    }
  }

  /**
   * Get Airtel Money fee structure
   */
  getFeeStructure(): any {
    return {
      provider: "Airtel Money",
      currency: "KES",
      fees: [
        { range: "10 - 100", fee: 5 },
        { range: "101 - 500", fee: 10 },
        { range: "501 - 1,000", fee: 15 },
        { range: "1,001 - 5,000", fee: 25 },
        { range: "5,001 - 50,000", fee: 50 },
        { range: "50,001 - 150,000", fee: 75 },
      ],
      maxDailyLimit: 500_000,
      maxMonthlyLimit: 3_000_000,
    };
  }

  /**
   * Get service health
   */
  getHealth(): {
    isHealthy: boolean;
    enabled: boolean;
    totalTransactions: number;
    successRate: number;
    lastTransaction?: Date;
  } {
    const transactions = Array.from(this.transactions.values());
    const successful = transactions.filter((t) => t.status === "completed");
    const lastTransaction =
      transactions.length > 0
        ? Math.max(...transactions.map((t) => t.createdAt.getTime()))
        : null;

    return {
      isHealthy: this.config.enabled,
      enabled: this.config.enabled,
      totalTransactions: transactions.length,
      successRate:
        transactions.length > 0
          ? (successful.length / transactions.length) * 100
          : 0,
      lastTransaction: lastTransaction ? new Date(lastTransaction) : undefined,
    };
  }

  // Utility methods
  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.startsWith("254")) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith("0")) {
      return `+254${cleaned.substring(1)}`;
    }
    if (cleaned.length === 9) {
      return `+254${cleaned}`;
    }

    return phoneNumber;
  }

  private formatCurrency(amount: number): string {
    return `KSh ${amount.toLocaleString()}`;
  }

  private mapProviderStatus(status: any): AirtelMoneyTransaction["status"] {
    const statusMap: Record<string, AirtelMoneyTransaction["status"]> = {
      pending: "pending",
      success: "completed",
      failed: "failed",
      expired: "cancelled",
      cancelled: "cancelled",
      processing: "pending",
    };

    return statusMap[status] || "failed";
  }

  private mapCallbackStatus(status: string): AirtelMoneyTransaction["status"] {
    // Map Airtel Money callback status to our internal status
    const statusMap: Record<string, AirtelMoneyTransaction["status"]> = {
      TS: "completed", // Transaction successful
      TF: "failed", // Transaction failed
      TP: "pending", // Transaction pending
      TC: "cancelled", // Transaction cancelled
    };

    return statusMap[status] || "failed";
  }

  // Public API methods
  getTransactions(): AirtelMoneyTransaction[] {
    return Array.from(this.transactions.values());
  }

  getTransaction(transactionId: string): AirtelMoneyTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  getTransactionsByStatus(
    status: AirtelMoneyTransaction["status"]
  ): AirtelMoneyTransaction[] {
    return this.getTransactions().filter((t) => t.status === status);
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}

export const airtelMoneyService = new AirtelMoneyService();
