import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import {
  AltPaymentStatus,
  AltPaymentType,
  AltProviderStatus,
  KENYA_NETWORKS,
  type PaymentProvider,
  type PaymentRequest,
  type PaymentResponse,
  USSD_CODES,
  type USSDResponse,
  type USSDSession,
} from "@kaa/models/types";
import { redisClient } from "@kaa/utils";
import axios, { type AxiosInstance } from "axios";
import type { RedisClientType } from "redis";

class AlternativePaymentsService extends EventEmitter {
  private readonly redis: RedisClientType;
  private readonly providers: Map<string, PaymentProvider>;
  private readonly httpClients: Map<string, AxiosInstance>;

  constructor() {
    super();
    this.redis = redisClient;

    this.providers = new Map();
    this.httpClients = new Map();

    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Airtel Money Configuration
    const airtelProvider: PaymentProvider = {
      id: "airtel_money",
      name: "Airtel Money",
      type: AltPaymentType.MOBILE_MONEY,
      status: AltProviderStatus.ACTIVE,
      config: {
        baseUrl:
          process.env.AIRTEL_API_URL || "https://openapiuat.airtel.africa",
        apiKey: process.env.AIRTEL_API_KEY || "",
        secretKey: process.env.AIRTEL_SECRET_KEY || "",
        merchantId: process.env.AIRTEL_MERCHANT_ID || "",
        sandbox: process.env.NODE_ENV !== "production",
        timeout: 30_000,
        retries: 3,
        webhookUrl: `${process.env.API_BASE_URL}/webhooks/airtel-money`,
      },
      limits: {
        minAmount: 10,
        maxAmount: 150_000,
        dailyLimit: 500_000,
        monthlyLimit: 3_000_000,
        transactionLimit: 50,
      },
      fees: {
        type: "tiered",
        value: 0,
        tiers: [
          { min: 10, max: 100, fee: 5 },
          { min: 101, max: 500, fee: 10 },
          { min: 501, max: 1000, fee: 15 },
          { min: 1001, max: 5000, fee: 25 },
          { min: 5001, max: 50_000, fee: 50 },
          { min: 50_001, max: 150_000, fee: 75 },
        ],
      },
    };

    // T-Kash (Telkom) Configuration
    const tkashProvider: PaymentProvider = {
      id: "tkash",
      name: "T-Kash",
      type: AltPaymentType.MOBILE_MONEY,
      status: AltProviderStatus.ACTIVE,
      config: {
        baseUrl: process.env.TKASH_API_URL || "https://api.tkash.telkom.co.ke",
        apiKey: process.env.TKASH_API_KEY || "",
        secretKey: process.env.TKASH_SECRET_KEY || "",
        merchantId: process.env.TKASH_MERCHANT_ID || "",
        sandbox: process.env.NODE_ENV !== "production",
        timeout: 30_000,
        retries: 3,
        webhookUrl: `${process.env.API_BASE_URL}/webhooks/tkash`,
      },
      limits: {
        minAmount: 10,
        maxAmount: 70_000,
        dailyLimit: 300_000,
        monthlyLimit: 1_500_000,
        transactionLimit: 30,
      },
      fees: {
        type: "tiered",
        value: 0,
        tiers: [
          { min: 10, max: 100, fee: 5 },
          { min: 101, max: 500, fee: 11 },
          { min: 501, max: 1000, fee: 15 },
          { min: 1001, max: 5000, fee: 25 },
          { min: 5001, max: 70_000, fee: 55 },
        ],
      },
    };

    // Equitel Configuration
    const equitelProvider: PaymentProvider = {
      id: "equitel",
      name: "Equitel",
      type: AltPaymentType.MOBILE_MONEY,
      status: AltProviderStatus.ACTIVE,
      config: {
        baseUrl:
          process.env.EQUITEL_API_URL || "https://api.equitel.equity.co.ke",
        apiKey: process.env.EQUITEL_API_KEY || "",
        secretKey: process.env.EQUITEL_SECRET_KEY || "",
        merchantId: process.env.EQUITEL_MERCHANT_ID || "",
        sandbox: process.env.NODE_ENV !== "production",
        timeout: 30_000,
        retries: 3,
        webhookUrl: `${process.env.API_BASE_URL}/webhooks/equitel`,
      },
      limits: {
        minAmount: 10,
        maxAmount: 999_999,
        dailyLimit: 999_999,
        monthlyLimit: 3_000_000,
        transactionLimit: 100,
      },
      fees: {
        type: "tiered",
        value: 0,
        tiers: [
          { min: 10, max: 100, fee: 0 },
          { min: 101, max: 500, fee: 5 },
          { min: 501, max: 1000, fee: 10 },
          { min: 1001, max: 5000, fee: 15 },
          { min: 5001, max: 50_000, fee: 25 },
          { min: 50_001, max: 999_999, fee: 30 },
        ],
      },
    };

    // Add providers to map
    this.providers.set(airtelProvider.id, airtelProvider);
    this.providers.set(tkashProvider.id, tkashProvider);
    this.providers.set(equitelProvider.id, equitelProvider);

    // Initialize HTTP clients for each provider
    this.initializeHttpClients();
  }

  private initializeHttpClients(): void {
    for (const [id, provider] of this.providers.entries()) {
      const client = axios.create({
        baseURL: provider.config.baseUrl,
        timeout: provider.config.timeout,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      // Add request interceptor for authentication
      client.interceptors.request.use(
        async (config) => await this.addAuthHeaders(config, provider),
        (error) => Promise.reject(error)
      );

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        async (error) => await this.handleApiError(error, provider.id)
      );

      this.httpClients.set(id, client);
    }
  }

  private addAuthHeaders(config: any, provider: PaymentProvider): any {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString("hex");

    switch (provider.id) {
      case "airtel_money":
        // Airtel Money uses OAuth2 bearer token
        config.headers.Authorization = `Bearer ${provider.config.apiKey}`;
        config.headers["X-Country"] = "KE";
        config.headers["X-Currency"] = "KES";
        break;

      case "tkash":
        // T-Kash uses API key authentication
        config.headers["X-API-Key"] = provider.config.apiKey;
        config.headers["X-Merchant-ID"] = provider.config.merchantId;
        break;

      case "equitel": {
        // Equitel uses signature-based authentication
        const signature = this.generateSignature(
          config.method?.toUpperCase() +
            config.url +
            JSON.stringify(config.data || {}),
          provider.config.secretKey
        );
        config.headers.Authorization = `Bearer ${provider.config.apiKey}`;
        config.headers["X-Signature"] = signature;
        config.headers["X-Timestamp"] = timestamp;
        config.headers["X-Nonce"] = nonce;
        break;
      }
      default:
        break;
    }

    return config;
  }

  // Process payment through alternative providers
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const provider = this.providers.get(request.providerId);
    if (!provider) {
      throw new Error(`Provider ${request.providerId} not found`);
    }

    // Validate request
    await this.validatePaymentRequest(request, provider);

    // Check rate limits
    await this.checkRateLimits(request.phoneNumber, provider);

    // Process payment based on provider
    let response: PaymentResponse;

    try {
      switch (request.providerId) {
        case "airtel_money":
          response = await this.processAirtelMoneyPayment(request, provider);
          break;
        case "tkash":
          response = await this.processTKashPayment(request, provider);
          break;
        case "equitel":
          response = await this.processEquitelPayment(request, provider);
          break;
        default:
          throw new Error(
            `Payment processing not implemented for ${request.providerId}`
          );
      }

      // Cache payment request
      await this.cachePaymentRequest(request, response);

      // Emit payment initiated event
      this.emit("payment.initiated", {
        request,
        response,
        provider: provider.id,
        timestamp: new Date(),
      });

      return response;
    } catch (error) {
      console.error(
        `Payment processing error for ${request.providerId}:`,
        error
      );

      // Emit payment failed event
      this.emit("payment.failed", {
        request,
        error: error instanceof Error ? error.message : String(error),
        provider: provider.id,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  private async processAirtelMoneyPayment(
    request: PaymentRequest,
    provider: PaymentProvider
  ): Promise<PaymentResponse> {
    const client = this.httpClients.get(provider.id);
    if (!client) {
      throw new Error(`HTTP client for ${provider.id} not found`);
    }

    const payload = {
      reference: request.reference,
      subscriber: {
        country: "KE",
        currency: "KES",
        msisdn: this.formatPhoneNumber(request.phoneNumber),
      },
      transaction: {
        amount: request.amount,
        country: "KE",
        currency: "KES",
        id: request.id,
      },
    };

    const response = await client.post("/merchant/v1/payments/", payload);

    if (response.data.status?.success) {
      return {
        transactionId: response.data.data?.transaction?.id || request.id,
        status: AltPaymentStatus.PENDING,
        message: "Payment request sent successfully",
        reference: request.reference,
        instructions: `Dial ${USSD_CODES.AIRTEL_MONEY} and follow the prompts to complete payment`,
      };
    }
    throw new Error(response.data.status?.message || "Payment failed");
  }

  private async processTKashPayment(
    request: PaymentRequest,
    provider: PaymentProvider
  ): Promise<PaymentResponse> {
    const client = this.httpClients.get(provider.id);
    if (!client) {
      throw new Error(`HTTP client for ${provider.id} not found`);
    }

    const payload = {
      merchantRequestID: request.id,
      checkoutRequestID: crypto.randomUUID(),
      businessShortCode: provider.config.merchantId,
      password: this.generateTKashPassword(provider),
      timestamp: this.getTimestamp(),
      transactionType: "CustomerPayBillOnline",
      amount: request.amount,
      partyA: this.formatPhoneNumber(request.phoneNumber),
      partyB: provider.config.merchantId,
      phoneNumber: this.formatPhoneNumber(request.phoneNumber),
      callBackURL: provider.config.webhookUrl,
      accountReference: request.reference,
      transactionDesc: request.description,
    };

    const response = await client.post("/v1/stkpush", payload);

    if (response.data.ResponseCode === "0") {
      return {
        transactionId: response.data.CheckoutRequestID,
        status: AltPaymentStatus.PENDING,
        message: response.data.ResponseDescription,
        reference: request.reference,
        instructions: "Check your phone for T-Kash payment prompt",
      };
    }
    throw new Error(response.data.ResponseDescription || "Payment failed");
  }

  private async processEquitelPayment(
    request: PaymentRequest,
    provider: PaymentProvider
  ): Promise<PaymentResponse> {
    const client = this.httpClients.get(provider.id);
    if (!client) {
      throw new Error(`HTTP client for ${provider.id} not found`);
    }

    const payload = {
      Amount: request.amount,
      PhoneNumber: this.formatPhoneNumber(request.phoneNumber),
      BillRefNumber: request.reference,
      TransactionDescription: request.description,
      MerchantRequestID: request.id,
      CallbackURL: provider.config.webhookUrl,
    };

    const response = await client.post("/api/v1/c2b/simulate", payload);

    if (response.data.ResponseCode === "0") {
      return {
        transactionId: response.data.CheckoutRequestID || request.id,
        status: AltPaymentStatus.PENDING,
        message: "Payment request sent successfully",
        reference: request.reference,
        instructions: `Dial ${USSD_CODES.EQUITEL} and follow the prompts to complete payment`,
      };
    }
    throw new Error(response.data.ResponseDescription || "Payment failed");
  }

  // USSD Integration
  async handleUSSDRequest(
    sessionId: string,
    phoneNumber: string,
    text: string
  ): Promise<USSDResponse> {
    // Get or create USSD session
    let session = await this.getUSSDSession(sessionId);

    if (!session) {
      session = {
        sessionId,
        phoneNumber,
        currentStep: 0,
        data: {},
        lastActivity: new Date(),
        status: "active",
      };
    }

    // Update last activity
    session.lastActivity = new Date();

    // Process USSD flow based on current step
    const response = await this.processUSSDFlow(session, text);

    // Save session
    await this.saveUSSDSession(session);

    return response;
  }

  private async processUSSDFlow(
    session: USSDSession,
    input: string
  ): Promise<USSDResponse> {
    switch (session.currentStep) {
      case 0:
        // Welcome menu
        session.currentStep = 1;
        return {
          sessionId: session.sessionId,
          message:
            "Welcome to Kaa Rentals\n1. Pay Rent\n2. View Properties\n3. Check Balance\n4. Support",
          options: ["1", "2", "3", "4"],
          isEndSession: false,
        };

      case 1:
        // Main menu selection
        session.data.mainChoice = input;

        switch (input) {
          case "1":
            session.currentStep = 2;
            return {
              sessionId: session.sessionId,
              message:
                "Select Payment Method:\n1. M-Pesa\n2. Airtel Money\n3. T-Kash\n4. Equitel",
              options: ["1", "2", "3", "4"],
              isEndSession: false,
            };

          case "2":
            return await this.getPropertyList(session);

          case "3":
            return await this.checkBalance(session);

          case "4":
            return {
              sessionId: session.sessionId,
              message:
                "Support: Call 0800 123 456 or email support@kaarentals.co.ke",
              isEndSession: true,
            };

          default:
            return {
              sessionId: session.sessionId,
              message: "Invalid selection. Please try again.",
              isEndSession: true,
            };
        }

      case 2: {
        // Payment method selection
        session.data.paymentMethod = input;
        session.currentStep = 3;

        const methodName = this.getPaymentMethodName(input);
        return {
          sessionId: session.sessionId,
          message: `Enter amount to pay via ${methodName}:`,
          isEndSession: false,
        };
      }

      case 3: {
        // Amount entry
        const amount = Number.parseFloat(input);
        if (Number.isNaN(amount) || amount <= 0) {
          return {
            sessionId: session.sessionId,
            message: "Invalid amount. Please enter a valid number.",
            isEndSession: true,
          };
        }

        session.data.amount = amount;
        session.currentStep = 4;

        return {
          sessionId: session.sessionId,
          message: "Enter your property reference:",
          isEndSession: false,
        };
      }

      case 4:
        // Property reference entry
        session.data.propertyRef = input;
        return await this.processUSSDPayment(session);

      default:
        return {
          sessionId: session.sessionId,
          message: "Session expired. Please try again.",
          isEndSession: true,
        };
    }
  }

  private async processUSSDPayment(
    session: USSDSession
  ): Promise<USSDResponse> {
    try {
      const providerId = this.getProviderIdFromChoice(
        session.data.paymentMethod
      );

      if (!providerId) {
        return {
          sessionId: session.sessionId,
          message: "Invalid payment method selected.",
          isEndSession: true,
        };
      }

      const paymentRequest: PaymentRequest = {
        id: crypto.randomUUID(),
        providerId,
        amount: session.data.amount,
        currency: "KES",
        phoneNumber: session.phoneNumber,
        reference: session.data.propertyRef,
        description: `Rent payment for ${session.data.propertyRef}`,
        metadata: {
          source: "ussd",
          sessionId: session.sessionId,
        },
      };

      const response = await this.processPayment(paymentRequest);

      session.status = "completed";

      return {
        sessionId: session.sessionId,
        message: `Payment initiated successfully!\nRef: ${response.reference}\nYou will receive a payment prompt shortly.`,
        isEndSession: true,
      };
    } catch (error) {
      console.error("USSD payment error:", error);

      return {
        sessionId: session.sessionId,
        message: "Payment failed. Please try again later or contact support.",
        isEndSession: true,
      };
    }
  }

  // Utility Methods
  private async validatePaymentRequest(
    request: PaymentRequest,
    provider: PaymentProvider
  ): Promise<void> {
    // Validate amount limits
    if (
      request.amount < provider.limits.minAmount ||
      request.amount > provider.limits.maxAmount
    ) {
      throw new Error(
        `Amount must be between ${provider.limits.minAmount} and ${provider.limits.maxAmount}`
      );
    }

    // Validate phone number for the provider
    if (!this.isValidPhoneForProvider(request.phoneNumber, provider.id)) {
      throw new Error(`Phone number not supported by ${provider.name}`);
    }

    await Promise.resolve();
  }

  private isValidPhoneForProvider(
    phoneNumber: string,
    providerId: string
  ): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);

    switch (providerId) {
      case "airtel_money":
        return KENYA_NETWORKS.AIRTEL.prefix.some((prefix) =>
          formatted.startsWith(prefix)
        );
      case "tkash":
        return KENYA_NETWORKS.TELKOM.prefix.some((prefix) =>
          formatted.startsWith(prefix)
        );
      case "equitel":
        return KENYA_NETWORKS.EQUITEL.prefix.some((prefix) =>
          formatted.startsWith(prefix)
        );
      default:
        return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digits
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Handle different formats
    if (cleaned.startsWith("254")) {
      return cleaned;
    }
    if (cleaned.startsWith("0")) {
      return `254${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
      return `254${cleaned}`;
    }

    return cleaned;
  }

  private generateSignature(data: string, secretKey: string): string {
    return crypto.createHmac("sha256", secretKey).update(data).digest("hex");
  }

  private generateTKashPassword(provider: PaymentProvider): string {
    const timestamp = this.getTimestamp();
    const passkey = provider.config.secretKey;
    const password = Buffer.from(
      provider.config.merchantId + passkey + timestamp
    ).toString("base64");
    return password;
  }

  private getTimestamp(): string {
    const date = new Date();
    return (
      date.getFullYear() +
      `0${date.getMonth() + 1}`.slice(-2) +
      `0${date.getDate()}`.slice(-2) +
      `0${date.getHours()}`.slice(-2) +
      `0${date.getMinutes()}`.slice(-2) +
      `0${date.getSeconds()}`.slice(-2)
    );
  }

  private async checkRateLimits(
    phoneNumber: string,
    provider: PaymentProvider
  ): Promise<void> {
    const key = `rate_limit:${provider.id}:${phoneNumber}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, 3600); // 1 hour window
    }

    if (current > provider.limits.transactionLimit) {
      throw new Error("Transaction limit exceeded. Please try again later.");
    }
  }

  private async cachePaymentRequest(
    request: PaymentRequest,
    response: PaymentResponse
  ): Promise<void> {
    const key = `payment:${request.id}`;
    const data = {
      request,
      response,
      timestamp: new Date().toISOString(),
    };

    await this.redis.setEx(key, 3600, JSON.stringify(data)); // Cache for 1 hour
  }

  private async getUSSDSession(sessionId: string): Promise<USSDSession | null> {
    const key = `ussd_session:${sessionId}`;
    const data = await this.redis.get(key);

    if (data) {
      return JSON.parse(data);
    }

    return null;
  }

  private async saveUSSDSession(session: USSDSession): Promise<void> {
    const key = `ussd_session:${session.sessionId}`;
    await this.redis.setEx(key, 300, JSON.stringify(session)); // 5 minutes TTL
  }

  private getPaymentMethodName(choice: string): string {
    switch (choice) {
      case "1":
        return "M-Pesa";
      case "2":
        return "Airtel Money";
      case "3":
        return "T-Kash";
      case "4":
        return "Equitel";
      default:
        return "Unknown";
    }
  }

  private getProviderIdFromChoice(choice: string): string | null {
    switch (choice) {
      case "1":
        return "mpesa"; // Assuming M-Pesa is handled elsewhere
      case "2":
        return "airtel_money";
      case "3":
        return "tkash";
      case "4":
        return "equitel";
      default:
        return null;
    }
  }

  private async getPropertyList(session: USSDSession): Promise<USSDResponse> {
    // This would integrate with your property service
    return await Promise.resolve({
      sessionId: session.sessionId,
      message:
        "Featured Properties:\n1. 2BR Apartment - Westlands\n2. 3BR House - Karen\n3. Studio - CBD\nCall 0800 123 456 for more info.",
      isEndSession: true,
    });
  }

  private async checkBalance(session: USSDSession): Promise<USSDResponse> {
    // This would integrate with your user account service
    return await Promise.resolve({
      sessionId: session.sessionId,
      message:
        "Account Balance: KES 15,000\nNext Payment Due: 15th Jan 2024\nProperty: Westlands Apartment",
      isEndSession: true,
    });
  }

  private async handleApiError(error: any, providerId: string): Promise<never> {
    console.error(
      `API Error for ${providerId}:`,
      error.response?.data || error.message
    );

    // Emit error event
    this.emit("api.error", {
      provider: providerId,
      error: error.response?.data || error.message,
      timestamp: new Date(),
    });
    await Promise.resolve();

    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Payment processing failed"
    );
  }

  // Provider Management
  async getProviders(): Promise<PaymentProvider[]> {
    return await Promise.resolve(
      Array.from(this.providers.values()).filter(
        (p) => p.status === AltProviderStatus.ACTIVE
      )
    );
  }

  async getProvider(id: string): Promise<PaymentProvider | undefined> {
    return await Promise.resolve(this.providers.get(id));
  }

  async updateProviderStatus(
    id: string,
    status: AltProviderStatus
  ): Promise<void> {
    const provider = this.providers.get(id);
    if (provider) {
      provider.status = status;

      // Emit status change event
      this.emit("provider.status.changed", {
        provider: id,
        status,
        timestamp: new Date(),
      });
    }
    await Promise.resolve();
  }

  // Analytics and Monitoring
  async getPaymentStats(providerId?: string): Promise<any> {
    const key = providerId ? `stats:${providerId}` : "stats:all";
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate stats (this would integrate with your analytics service)
    const stats = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalAmount: 0,
      averageAmount: 0,
      topProviders: [],
      lastUpdated: new Date(),
    };

    await this.redis.setEx(key, 300, JSON.stringify(stats)); // Cache for 5 minutes
    return stats;
  }

  // Cleanup and maintenance
  async cleanup(): Promise<void> {
    // Clean up expired sessions
    const sessions = await this.redis.keys("ussd_session:*");
    for (const session of sessions) {
      const data = await this.redis.get(session);
      if (data) {
        const sessionData: USSDSession = JSON.parse(data);
        const now = new Date();
        const lastActivity = new Date(sessionData.lastActivity);

        // Remove sessions older than 10 minutes
        if (now.getTime() - lastActivity.getTime() > 10 * 60 * 1000) {
          await this.redis.del(session);
        }
      }
    }

    // Clean up old payment requests
    const payments = await this.redis.keys("payment:*");
    for (const payment of payments) {
      const ttl = await this.redis.ttl(payment);
      if (ttl < 0) {
        // No expiry set
        await this.redis.del(payment);
      }
    }
  }
}

export const alternativePaymentsService = new AlternativePaymentsService();
