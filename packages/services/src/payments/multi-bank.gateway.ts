import { randomUUID } from "node:crypto";
import type {
  BankConfig,
  BankHealthStatus,
  BankTransaction,
  UnifiedPaymentRequest,
  UnifiedPaymentResponse,
} from "@kaa/models/types";
import axios, { type AxiosInstance } from "axios";

// Base Bank Integration Interface
abstract class BaseBankIntegration {
  protected config: BankConfig;
  protected client: AxiosInstance;
  protected healthStatus: BankHealthStatus;

  constructor(config: BankConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.healthStatus = {
      bank: config.bankCode,
      isHealthy: true,
      responseTime: 0,
      lastChecked: new Date(),
      errorCount: 0,
      successRate: 100,
    };

    this.setupInterceptors();
  }

  protected setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        (config as any).metadata = { startTime };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const startTime =
          (response.config as any).metadata?.startTime || endTime;
        this.updateHealthStatus(true, endTime - startTime);
        return response;
      },
      (error) => {
        const endTime = Date.now();
        const startTime = (error.config as any)?.metadata?.startTime || endTime;
        this.updateHealthStatus(false, endTime - startTime);
        return Promise.reject(error);
      }
    );
  }

  protected updateHealthStatus(success: boolean, responseTime: number): void {
    this.healthStatus.responseTime = responseTime;
    this.healthStatus.lastChecked = new Date();

    if (success) {
      this.healthStatus.errorCount = Math.max(
        0,
        this.healthStatus.errorCount - 1
      );
    } else {
      this.healthStatus.errorCount++;
    }

    // Calculate success rate (simplified)
    this.healthStatus.successRate = Math.max(
      0,
      100 - this.healthStatus.errorCount * 10
    );
    this.healthStatus.isHealthy =
      this.healthStatus.successRate > 70 && this.healthStatus.errorCount < 5;
  }

  abstract authenticate(): Promise<string>;
  abstract initiatePayment(
    request: UnifiedPaymentRequest
  ): Promise<UnifiedPaymentResponse>;
  abstract queryPaymentStatus(
    transactionId: string
  ): Promise<UnifiedPaymentResponse>;
  abstract cancelPayment(transactionId: string): Promise<boolean>;
  abstract refundPayment(
    transactionId: string,
    amount?: number
  ): Promise<UnifiedPaymentResponse>;

  getHealthStatus(): BankHealthStatus {
    return { ...this.healthStatus };
  }

  isHealthy(): boolean {
    return this.config.enabled && this.healthStatus.isHealthy;
  }
}

// Equity Bank Integration
class EquityBankIntegration extends BaseBankIntegration {
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString("base64");

      const response = await this.client.post(
        "/oauth/token",
        {
          grant_type: "client_credentials",
        },
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

      return this.accessToken || "";
    } catch (error) {
      console.error("Equity Bank authentication failed:", error);
      throw new Error("Equity Bank authentication failed");
    }
  }

  async initiatePayment(
    request: UnifiedPaymentRequest
  ): Promise<UnifiedPaymentResponse> {
    const token = await this.authenticate();

    const payload = {
      amount: request.amount,
      currency: request.currency,
      customer: {
        phone: request.customerPhone,
        email: request.customerEmail,
        name: request.customerName,
      },
      description: request.description,
      reference: request.reference,
      callback_url: this.config.callbackUrl,
      payment_method: request.paymentMethod.toLowerCase(),
      merchant_id: this.config.merchantId,
    };

    try {
      const response = await this.client.post("/payments/initiate", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        transactionId: randomUUID(),
        bankTransactionId: response.data.transaction_id,
        status: this.mapEquityStatus(response.data.status),
        amount: request.amount,
        currency: request.currency,
        bank: "EQUITY",
        paymentUrl: response.data.payment_url,
        instructions: response.data.instructions,
        expiresAt: response.data.expires_at
          ? new Date(response.data.expires_at)
          : undefined,
        metadata: response.data,
      };
    } catch (error: any) {
      console.error("Equity Bank payment initiation failed:", error);
      throw new Error(
        `Equity Bank payment failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async queryPaymentStatus(
    transactionId: string
  ): Promise<UnifiedPaymentResponse> {
    const token = await this.authenticate();

    try {
      const response = await this.client.get(
        `/payments/status/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        transactionId,
        bankTransactionId: response.data.transaction_id,
        status: this.mapEquityStatus(response.data.status),
        amount: response.data.amount,
        currency: response.data.currency,
        bank: "EQUITY",
        metadata: response.data,
      };
    } catch (error: any) {
      console.error("Equity Bank status query failed:", error);
      throw new Error(
        `Equity Bank status query failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async cancelPayment(transactionId: string): Promise<boolean> {
    const token = await this.authenticate();

    try {
      await this.client.post(
        `/payments/cancel/${transactionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return true;
    } catch (error) {
      console.error("Equity Bank payment cancellation failed:", error);
      return false;
    }
  }

  async refundPayment(
    transactionId: string,
    amount?: number
  ): Promise<UnifiedPaymentResponse> {
    const token = await this.authenticate();

    const payload = amount ? { amount } : {};

    try {
      const response = await this.client.post(
        `/payments/refund/${transactionId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        transactionId: randomUUID(),
        bankTransactionId: response.data.refund_id,
        status: this.mapEquityStatus(response.data.status),
        amount: response.data.amount,
        currency: response.data.currency,
        bank: "EQUITY",
        metadata: response.data,
      };
    } catch (error: any) {
      console.error("Equity Bank refund failed:", error);
      throw new Error(
        `Equity Bank refund failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private mapEquityStatus(
    status: string
  ): "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return "SUCCESS";
      case "pending":
      case "processing":
        return "PENDING";
      case "cancelled":
        return "CANCELLED";
      default:
        return "FAILED";
    }
  }
}

// KCB Bank Integration
class KCBBankIntegration extends BaseBankIntegration {
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await this.client.post("/api/auth/token", {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: "client_credentials",
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

      return this.accessToken || "";
    } catch (error) {
      console.error("KCB Bank authentication failed:", error);
      throw new Error("KCB Bank authentication failed");
    }
  }

  async initiatePayment(
    request: UnifiedPaymentRequest
  ): Promise<UnifiedPaymentResponse> {
    const token = await this.authenticate();

    const payload = {
      Amount: request.amount,
      Currency: request.currency,
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      MSISDN: request.customerPhone.replace(/^\+/, ""),
      AccountNumber: request.reference,
      TransactionDesc: request.description,
      CallBackURL: this.config.callbackUrl,
      PaymentMethod: request.paymentMethod,
    };

    try {
      const response = await this.client.post(
        "/api/payments/initiate",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-API-Key": this.config.apiKey,
          },
        }
      );

      return {
        transactionId: randomUUID(),
        bankTransactionId: response.data.TransactionID,
        status: this.mapKCBStatus(response.data.Status),
        amount: request.amount,
        currency: request.currency,
        bank: "KCB",
        paymentUrl: response.data.PaymentURL,
        instructions: response.data.Instructions,
        metadata: response.data,
      };
    } catch (error: any) {
      console.error("KCB Bank payment initiation failed:", error);
      throw new Error(
        `KCB Bank payment failed: ${error.response?.data?.Message || error.message}`
      );
    }
  }

  async queryPaymentStatus(
    transactionId: string
  ): Promise<UnifiedPaymentResponse> {
    const token = await this.authenticate();

    try {
      const response = await this.client.get(
        `/api/payments/status/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-API-Key": this.config.apiKey,
          },
        }
      );

      return {
        transactionId,
        bankTransactionId: response.data.TransactionID,
        status: this.mapKCBStatus(response.data.Status),
        amount: response.data.Amount,
        currency: response.data.Currency,
        bank: "KCB",
        metadata: response.data,
      };
    } catch (error: any) {
      console.error("KCB Bank status query failed:", error);
      throw new Error(
        `KCB Bank status query failed: ${error.response?.data?.Message || error.message}`
      );
    }
  }

  async cancelPayment(_transactionId: string): Promise<boolean> {
    // KCB API implementation for cancellation
    return await false; // Placeholder
  }

  async refundPayment(
    _transactionId: string,
    _amount?: number
  ): Promise<UnifiedPaymentResponse> {
    // KCB API implementation for refund
    throw await new Error("KCB Bank refund not implemented");
  }

  private mapKCBStatus(
    status: string
  ): "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" {
    switch (status?.toLowerCase()) {
      case "successful":
      case "completed":
        return "SUCCESS";
      case "pending":
      case "initiated":
        return "PENDING";
      case "cancelled":
        return "CANCELLED";
      default:
        return "FAILED";
    }
  }
}

// NCBA Bank Integration
class NCBABankIntegration extends BaseBankIntegration {
  async authenticate(): Promise<string> {
    try {
      const response = await this.client.post("/auth/oauth2/token", {
        grant_type: "client_credentials",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      return response.data.access_token;
    } catch (error) {
      console.error("NCBA Bank authentication failed:", error);
      throw new Error("NCBA Bank authentication failed");
    }
  }

  async initiatePayment(
    request: UnifiedPaymentRequest
  ): Promise<UnifiedPaymentResponse> {
    const token = await this.authenticate();

    const payload = {
      amount: request.amount.toString(),
      currency: request.currency,
      phone_number: request.customerPhone,
      email: request.customerEmail,
      description: request.description,
      external_reference: request.reference,
      callback_url: this.config.callbackUrl,
    };

    try {
      const response = await this.client.post("/api/v1/payments", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-API-Version": "1.0",
        },
      });

      return {
        transactionId: randomUUID(),
        bankTransactionId: response.data.payment_id,
        status: this.mapNCBAStatus(response.data.status),
        amount: request.amount,
        currency: request.currency,
        bank: "NCBA",
        paymentUrl: response.data.checkout_url,
        metadata: response.data,
      };
    } catch (error: any) {
      console.error("NCBA Bank payment initiation failed:", error);
      throw new Error(
        `NCBA Bank payment failed: ${error.response?.data?.error || error.message}`
      );
    }
  }

  async queryPaymentStatus(
    transactionId: string
  ): Promise<UnifiedPaymentResponse> {
    const token = await this.authenticate();

    try {
      const response = await this.client.get(
        `/api/v1/payments/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-API-Version": "1.0",
          },
        }
      );

      return {
        transactionId,
        bankTransactionId: response.data.payment_id,
        status: this.mapNCBAStatus(response.data.status),
        amount: Number.parseFloat(response.data.amount),
        currency: response.data.currency,
        bank: "NCBA",
        metadata: response.data,
      };
    } catch (error: any) {
      console.error("NCBA Bank status query failed:", error);
      throw new Error(
        `NCBA Bank status query failed: ${error.response?.data?.error || error.message}`
      );
    }
  }

  async cancelPayment(_transactionId: string): Promise<boolean> {
    // NCBA API implementation for cancellation
    return await false; // Placeholder
  }

  async refundPayment(
    _transactionId: string,
    _amount?: number
  ): Promise<UnifiedPaymentResponse> {
    // NCBA API implementation for refund
    throw await new Error("NCBA Bank refund not implemented");
  }

  private mapNCBAStatus(
    status: string
  ): "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return "SUCCESS";
      case "pending":
      case "created":
        return "PENDING";
      case "cancelled":
        return "CANCELLED";
      default:
        return "FAILED";
    }
  }
}

// Absa Bank Integration
class AbsaBankIntegration extends BaseBankIntegration {
  async authenticate(): Promise<string> {
    try {
      const credentials = Buffer.from(
        `${this.config.apiKey}:${this.config.apiSecret}`
      ).toString("base64");

      const response = await this.client.post(
        "/oauth2/token",
        {
          grant_type: "client_credentials",
        },
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error("Absa Bank authentication failed:", error);
      throw new Error("Absa Bank authentication failed");
    }
  }

  async initiatePayment(
    request: UnifiedPaymentRequest
  ): Promise<UnifiedPaymentResponse> {
    const token = await this.authenticate();

    const payload = {
      PaymentAmount: request.amount,
      PaymentCurrency: request.currency,
      CustomerMobile: request.customerPhone,
      PaymentDescription: request.description,
      MerchantReference: request.reference,
      CallbackURL: this.config.callbackUrl,
      PaymentChannel: request.paymentMethod,
    };

    try {
      const response = await this.client.post(
        "/payments/v1/initiate",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Merchant-ID": this.config.merchantId,
          },
        }
      );

      return {
        transactionId: randomUUID(),
        bankTransactionId: response.data.PaymentReference,
        status: this.mapAbsaStatus(response.data.PaymentStatus),
        amount: request.amount,
        currency: request.currency,
        bank: "ABSA",
        paymentUrl: response.data.PaymentURL,
        qrCode: response.data.QRCode,
        metadata: response.data,
      };
    } catch (error: any) {
      console.error("Absa Bank payment initiation failed:", error);
      throw new Error(
        `Absa Bank payment failed: ${error.response?.data?.ErrorMessage || error.message}`
      );
    }
  }

  async queryPaymentStatus(
    transactionId: string
  ): Promise<UnifiedPaymentResponse> {
    const token = await this.authenticate();

    try {
      const response = await this.client.get(
        `/payments/v1/status/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Merchant-ID": this.config.merchantId,
          },
        }
      );

      return {
        transactionId,
        bankTransactionId: response.data.PaymentReference,
        status: this.mapAbsaStatus(response.data.PaymentStatus),
        amount: response.data.PaymentAmount,
        currency: response.data.PaymentCurrency,
        bank: "ABSA",
        metadata: response.data,
      };
    } catch (error: any) {
      console.error("Absa Bank status query failed:", error);
      throw new Error(
        `Absa Bank status query failed: ${error.response?.data?.ErrorMessage || error.message}`
      );
    }
  }

  async cancelPayment(_transactionId: string): Promise<boolean> {
    // Absa API implementation for cancellation
    return await false; // Placeholder
  }

  async refundPayment(
    _transactionId: string,
    _amount?: number
  ): Promise<UnifiedPaymentResponse> {
    // Absa API implementation for refund
    throw await new Error("Absa Bank refund not implemented");
  }

  private mapAbsaStatus(
    status: string
  ): "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" {
    switch (status?.toLowerCase()) {
      case "successful":
      case "paid":
        return "SUCCESS";
      case "pending":
      case "initiated":
        return "PENDING";
      case "cancelled":
        return "CANCELLED";
      default:
        return "FAILED";
    }
  }
}

// Multi-Bank Payment Gateway
class MultiBankPaymentGateway {
  private readonly banks: Map<string, BaseBankIntegration> = new Map();
  private readonly transactions: Map<string, BankTransaction> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(configs: BankConfig[]) {
    for (const config of configs) {
      if (!config.enabled) continue;

      let bankIntegration: BaseBankIntegration;

      switch (config.bankCode) {
        case "EQUITY":
          bankIntegration = new EquityBankIntegration(config);
          break;
        case "KCB":
          bankIntegration = new KCBBankIntegration(config);
          break;
        case "NCBA":
          bankIntegration = new NCBABankIntegration(config);
          break;
        case "ABSA":
          bankIntegration = new AbsaBankIntegration(config);
          break;
        default:
          console.warn(`Unsupported bank: ${config.bankCode}`);
          continue;
      }

      this.banks.set(config.bankCode, bankIntegration);
    }

    this.startHealthMonitoring();
  }

  // Unified Payment Processing with Fallback
  async processPayment(
    request: UnifiedPaymentRequest
  ): Promise<UnifiedPaymentResponse> {
    const availableBanks = this.getAvailableBanks(request.preferredBank);

    if (availableBanks.length === 0) {
      throw new Error("No available payment providers");
    }

    let lastError: Error | null = null;

    for (const bankCode of availableBanks) {
      const bank = this.banks.get(bankCode);
      if (!bank?.isHealthy()) continue;

      try {
        const response = await bank.initiatePayment(request);

        // Store transaction record
        const transaction: BankTransaction = {
          id: response.transactionId,
          bankTransactionId: response.bankTransactionId || "",
          bank: bankCode,
          amount: request.amount,
          currency: request.currency,
          status: response.status,
          customerPhone: request.customerPhone,
          customerEmail: request.customerEmail,
          description: request.description,
          reference: request.reference,
          paymentMethod: request.paymentMethod,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            ...request.metadata,
            ...response.metadata,
          },
        };

        this.transactions.set(response.transactionId, transaction);

        console.log(
          `Payment initiated successfully via ${bankCode}: ${response.transactionId}`
        );
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`Payment failed via ${bankCode}:`, error.message);

        // Mark bank as potentially unhealthy if multiple failures
        const bankIntegration = this.banks.get(bankCode);
        if (bankIntegration) {
          (bankIntegration as any).updateHealthStatus(false, 0);
        }
      }
    }

    // All banks failed
    throw lastError || new Error("All payment providers failed");
  }

  // Query Payment Status
  async queryPaymentStatus(
    transactionId: string
  ): Promise<UnifiedPaymentResponse | null> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return null;
    }

    const bank = this.banks.get(transaction.bank);
    if (!bank) {
      return null;
    }

    try {
      const response = await bank.queryPaymentStatus(
        transaction.bankTransactionId
      );

      // Update transaction record
      transaction.status = response.status;
      transaction.updatedAt = new Date();
      if (response.status === "SUCCESS") {
        transaction.completedAt = new Date();
      }

      this.transactions.set(transactionId, transaction);

      return response;
    } catch (error) {
      console.error(`Status query failed for ${transactionId}:`, error);
      return null;
    }
  }

  // Cancel Payment
  async cancelPayment(transactionId: string): Promise<boolean> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return false;
    }

    const bank = this.banks.get(transaction.bank);
    if (!bank) {
      return false;
    }

    try {
      const cancelled = await bank.cancelPayment(transaction.bankTransactionId);
      if (cancelled) {
        transaction.status = "CANCELLED";
        transaction.updatedAt = new Date();
        this.transactions.set(transactionId, transaction);
      }
      return cancelled;
    } catch (error) {
      console.error(`Payment cancellation failed for ${transactionId}:`, error);
      return false;
    }
  }

  // Refund Payment
  async refundPayment(
    transactionId: string,
    amount?: number
  ): Promise<UnifiedPaymentResponse | null> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return null;
    }

    const bank = this.banks.get(transaction.bank);
    if (!bank) {
      return null;
    }

    try {
      const response = await bank.refundPayment(
        transaction.bankTransactionId,
        amount
      );

      // Create refund transaction record
      const refundTransaction: BankTransaction = {
        id: response.transactionId,
        bankTransactionId: response.bankTransactionId || "",
        bank: transaction.bank,
        amount: -(amount || transaction.amount),
        currency: transaction.currency,
        status: response.status,
        customerPhone: transaction.customerPhone,
        customerEmail: transaction.customerEmail,
        description: `Refund for ${transaction.reference}`,
        reference: `REFUND-${transaction.reference}`,
        paymentMethod: transaction.paymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          originalTransactionId: transactionId,
          ...response.metadata,
        },
      };

      this.transactions.set(response.transactionId, refundTransaction);

      return response;
    } catch (error) {
      console.error(`Refund failed for ${transactionId}:`, error);
      return null;
    }
  }

  // Get Available Banks (sorted by priority and health)
  private getAvailableBanks(preferredBank?: string): string[] {
    const banks = Array.from(this.banks.entries())
      .filter(([_, bank]) => bank.isHealthy())
      .map(([bankCode, bank]) => ({
        bankCode,
        priority: (bank as any).config.priority || 99,
        successRate: bank.getHealthStatus().successRate,
      }))
      .sort((a, b) => {
        // Prefer specified bank if healthy
        if (preferredBank === a.bankCode) return -1;
        if (preferredBank === b.bankCode) return 1;

        // Sort by priority, then by success rate
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.successRate - a.successRate;
      });

    return banks.map((bank) => bank.bankCode);
  }

  // Health Monitoring
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [bankCode, bank] of this.banks.entries()) {
        try {
          // Simple health check by attempting authentication
          await bank.authenticate();
        } catch (error) {
          console.warn(`Health check failed for ${bankCode}:`, error);
        }
      }
    }, 300_000); // Check every 5 minutes
  }

  // Get Overall Health Status
  getHealthStatus(): { [bankCode: string]: BankHealthStatus } {
    const status: { [bankCode: string]: BankHealthStatus } = {};

    for (const [bankCode, bank] of this.banks.entries()) {
      status[bankCode] = bank.getHealthStatus();
    }

    return status;
  }

  // Get Transaction Statistics
  getTransactionStats(): {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    byBank: { [bankCode: string]: { total: number; successful: number } };
  } {
    const transactions = Array.from(this.transactions.values());
    const byBank: {
      [bankCode: string]: { total: number; successful: number };
    } = {};

    let successful = 0;
    let failed = 0;
    let pending = 0;

    for (const transaction of transactions) {
      if (!byBank[transaction.bank]) {
        byBank[transaction.bank] = { total: 0, successful: 0 };
      }

      // biome-ignore lint/style/noNonNullAssertion: ignore
      byBank[transaction.bank]!.total++;

      switch (transaction.status) {
        case "SUCCESS":
          successful++;
          // biome-ignore lint/style/noNonNullAssertion: ignore
          byBank[transaction.bank]!.successful++;
          break;
        case "FAILED":
          failed++;
          break;
        case "PENDING":
          pending++;
          break;
        default:
          break;
      }
    }

    return {
      total: transactions.length,
      successful,
      failed,
      pending,
      byBank,
    };
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export {
  MultiBankPaymentGateway,
  BaseBankIntegration,
  EquityBankIntegration,
  KCBBankIntegration,
  NCBABankIntegration,
  AbsaBankIntegration,
};
