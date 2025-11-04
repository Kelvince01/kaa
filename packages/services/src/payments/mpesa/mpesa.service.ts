import { randomUUID } from "node:crypto";
import config from "@kaa/config/api";
import {
  MPESA_ACCOUNT_BALANCE_URL,
  MPESA_B2B_URL,
  MPESA_B2C_URL,
  MPESA_BACKUP_BASE_URL,
  MPESA_BASE_URL,
  MPESA_C2B_REGISTER_URL,
  MPESA_C2B_SIMULATE_URL,
  MPESA_QUERY_URL,
  MPESA_REVERSAL_URL,
  MPESA_STK_PUSH_URL,
  MPESA_TRANSACTION_STATUS_URL,
} from "@kaa/constants";
import type {
  B2CRequest,
  C2BSimulateRequest,
  MpesaConfig,
  MpesaTransaction,
} from "@kaa/models/types";
import { AppError, logger } from "@kaa/utils";
import axios, { type AxiosInstance } from "axios";
import { MPESA_ERROR_CODES } from "./mpesa.error-code";
import { getPassword, getTimestamp, validatePhoneNumber } from "./mpesa.utils";

export class MpesaService {
  private readonly config: MpesaConfig;
  private primaryClient: AxiosInstance;
  private backupClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry = 0;
  private readonly transactions: Map<string, MpesaTransaction> = new Map();
  private readonly failoverEnabled = true;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  constructor() {
    this.config = {
      environment: config.mpesa.environment,
      consumerKey: config.mpesa.consumerKey,
      consumerSecret: config.mpesa.consumerSecret,
      businessShortCode: config.mpesa.shortCode.toString(),
      lipaNaMpesaShortCode: config.mpesa.shortCode.toString(),
      lipaNaMpesaPasskey: config.mpesa.passKey,
      c2bShortCode: config.mpesa.shortCode.toString(),
      b2cShortCode: config.mpesa.shortCode.toString(),
      securityCredential: config.mpesa.securityCredential,
      queueTimeoutUrl: config.mpesa.queueTimeoutUrl,
      resultUrl: config.mpesa.resultUrl,
      callbackUrl: config.mpesa.callbackUrl,
      validationUrl: config.mpesa.validationUrl,
      confirmationUrl: config.mpesa.confirmationUrl,
      initiatorName: config.mpesa.initiatorName,
      timeout: config.timeout || 30_000,
      retryAttempts: config.mpesa.retryAttempts,
      retryDelay: config.mpesa.retryDelay,
    };

    this.primaryClient = axios.create({
      baseURL: MPESA_BASE_URL,
      timeout: config.timeout || 30_000,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });

    this.backupClient = axios.create({
      baseURL: MPESA_BACKUP_BASE_URL,
      timeout: config.timeout || 30_000,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });

    this.setupInterceptors();
    this.startHealthCheck();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    const requestInterceptor = async (config: any) => {
      if (!config.url?.includes("/oauth/v1/generate")) {
        const token = await this.getAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    };

    // Response interceptor for error handling
    const responseInterceptor = (error: any) => {
      if (error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiry = 0;
      }
      return Promise.reject(
        error.response?.data?.errorMessage || error.message
      );
    };

    this.primaryClient.interceptors.request.use(requestInterceptor);
    this.primaryClient.interceptors.response.use(null, responseInterceptor);

    this.backupClient.interceptors.request.use(requestInterceptor);
    this.backupClient.interceptors.response.use(null, responseInterceptor);
  }

  private startHealthCheck(): void {
    setInterval(async () => {
      try {
        await this.checkHealth();
        this.reconnectAttempts = 0;
      } catch (error) {
        console.warn("M-Pesa health check failed:", error);
        this.handleFailover();
      }
    }, 60_000); // Check every minute
  }

  private async checkHealth(): Promise<boolean> {
    try {
      const response = await this.primaryClient.get("/health");
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  private async handleFailover(): Promise<void> {
    if (
      !this.failoverEnabled ||
      this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      return;
    }

    this.reconnectAttempts++;
    console.log(`M-Pesa failover attempt ${this.reconnectAttempts}`);

    // Switch to backup client temporarily
    const temp = this.primaryClient;
    this.primaryClient = this.backupClient;
    this.backupClient = temp;

    // Wait before retry
    await new Promise((resolve) =>
      setTimeout(resolve, this.config.retryDelay || 5000)
    );
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      ).toString("base64");

      const response = await this.primaryClient.get(
        "/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry =
        Date.now() +
        (Number.parseInt(response.data.expires_in, 10) - 60) * 1000;

      return this.accessToken ?? "";
    } catch (error: any) {
      console.error("Failed to get M-Pesa access token:", error);

      if (error.response) {
        throw new AppError(
          `M-Pesa API error: ${error.response.data.errorMessage || "Unknown error"}`,
          error.response.status
        );
      }

      throw error;
    }
  }

  // Initiate M-Pesa payment
  initiateMpesaPayment = async ({
    phoneNumber,
    amount,
    accountReference,
    transactionDesc,
    callbackUrl,
  }: {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
    callbackUrl: string;
  }) => {
    try {
      // Validate inputs
      if (!phoneNumber) throw new AppError("Phone number is required", 400);
      if (!amount || amount <= 0)
        throw new AppError("Valid amount is required", 400);
      if (!accountReference)
        throw new AppError("Account reference is required", 400);
      if (!transactionDesc)
        throw new AppError("Transaction description is required", 400);
      if (!callbackUrl) throw new AppError("Callback URL is required", 400);

      const transactionId = randomUUID();

      // Format phone number (remove leading 0 or +254 and add 254)
      const formattedPhone = validatePhoneNumber(phoneNumber);

      // Generate timestamp
      const timestamp = getTimestamp();

      // Generate password
      const password = getPassword(
        config.mpesa.shortCode,
        config.mpesa.passKey,
        timestamp
      );

      // Prepare request body
      const requestBody = {
        BusinessShortCode: config.mpesa.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount), // Ensure amount is an integer
        PartyA: formattedPhone,
        PartyB: config.mpesa.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      };

      // Create transaction record
      const transaction: MpesaTransaction = {
        id: transactionId,
        type: "STK_PUSH",
        amount,
        phoneNumber,
        accountReference,
        transactionDesc,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { callback: callbackUrl },
      };

      this.transactions.set(transactionId, transaction);

      let lastError: any;
      for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
        try {
          // Make request
          const response = await this.primaryClient.post(
            MPESA_STK_PUSH_URL,
            requestBody,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          // Check for errors in response
          if (response.data.ResponseCode !== "0") {
            const errorMessage =
              MPESA_ERROR_CODES[
                response.data.ResponseCode as keyof typeof MPESA_ERROR_CODES
              ] || `Unknown error (${response.data.ResponseCode})`;

            throw new AppError(`M-Pesa error: ${errorMessage}`, 400);
          }

          if (response.data.ResponseCode === "0") {
            transaction.merchantRequestID = response.data.MerchantRequestID;
            transaction.checkoutRequestID = response.data.CheckoutRequestID;
            transaction.updatedAt = new Date();

            this.transactions.set(transactionId, transaction);

            // Start status polling
            this.pollTransactionStatus(transactionId);

            return {
              merchantRequestID: response.data.MerchantRequestID,
              checkoutRequestID: response.data.CheckoutRequestID,
              responseCode: response.data.ResponseCode,
              responseDescription: response.data.ResponseDescription,
              customerMessage: response.data.CustomerMessage,
            };
          }

          throw new Error(
            `STK Push failed: ${response.data.ResponseDescription}`
          );
        } catch (error: any) {
          lastError = error;
          console.warn(
            `STK Push attempt ${attempt + 1} failed:`,
            error.message
          );

          if (attempt < this.config.retryAttempts - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.config.retryDelay || 2000)
            );
          }
        }
      }

      transaction.status = "FAILED";
      transaction.errorMessage =
        lastError?.message || "STK Push failed after retries";
      transaction.updatedAt = new Date();
      this.transactions.set(transactionId, transaction);

      throw lastError;
    } catch (error: any) {
      console.error("Error initiating M-Pesa payment:", error);

      if (error instanceof AppError) {
        throw error;
      }

      if (error.response) {
        const errorCode = error.response.data.ResponseCode;
        const errorMessage =
          MPESA_ERROR_CODES[errorCode as keyof typeof MPESA_ERROR_CODES] ||
          error.response.data.ResponseDescription ||
          "Unknown M-Pesa error";

        throw new AppError(`M-Pesa error: ${errorMessage}`, 400);
      }

      throw new AppError("Failed to initiate M-Pesa payment", 500);
    }
  };

  // Verify M-Pesa payment
  verifyMpesaPayment = async (checkoutRequestID: string) => {
    try {
      if (!checkoutRequestID) {
        throw new AppError("Checkout request ID is required", 400);
      }

      // Generate timestamp
      const timestamp = getTimestamp();

      // Generate password
      const password = getPassword(
        config.mpesa.shortCode,
        config.mpesa.passKey,
        timestamp
      );

      // Prepare request body
      const requestBody = {
        BusinessShortCode: config.mpesa.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      };

      // Make request
      const response = await this.primaryClient.post(
        MPESA_QUERY_URL,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Check for errors in response
      if (response.data.ResponseCode !== "0") {
        const errorMessage =
          MPESA_ERROR_CODES[
            response.data.ResponseCode as keyof typeof MPESA_ERROR_CODES
          ] || `Unknown error (${response.data.ResponseCode})`;

        throw new AppError(`M-Pesa error: ${errorMessage}`, 400);
      }

      return response.data;
    } catch (error: any) {
      console.error("Error verifying M-Pesa payment:", error);

      if (error instanceof AppError) {
        throw error;
      }

      if (error.response) {
        const errorCode = error.response.data.ResponseCode;
        const errorMessage =
          MPESA_ERROR_CODES[errorCode as keyof typeof MPESA_ERROR_CODES] ||
          error.response.data.ResponseDescription ||
          "Unknown M-Pesa error";

        throw new AppError(`M-Pesa error: ${errorMessage}`, 400);
      }

      throw new AppError("Failed to verify M-Pesa payment", 500);
    }
  };

  // Process M-Pesa callback data
  processMpesaCallback = (callbackData: any) => {
    try {
      if (!callbackData?.Body?.stkCallback) {
        throw new AppError("Invalid M-Pesa callback data", 400);
      }

      const { ResultCode, ResultDesc, CallbackMetadata } =
        callbackData.Body.stkCallback;

      // If payment was successful
      if (ResultCode === 0) {
        if (!CallbackMetadata?.Item) {
          throw new AppError("Invalid M-Pesa callback metadata", 400);
        }

        // Extract payment details
        const amount = CallbackMetadata.Item.find(
          (item: any) => item.Name === "Amount"
        )?.Value;
        const mpesaReceiptNumber = CallbackMetadata.Item.find(
          (item: any) => item.Name === "MpesaReceiptNumber"
        )?.Value;
        const transactionDate = CallbackMetadata.Item.find(
          (item: any) => item.Name === "TransactionDate"
        )?.Value;
        const phoneNumber = CallbackMetadata.Item.find(
          (item: any) => item.Name === "PhoneNumber"
        )?.Value;

        return {
          success: true,
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          amount,
          mpesaReceiptNumber,
          transactionDate,
          phoneNumber,
        };
      }

      // If payment failed
      return {
        success: false,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        errorMessage:
          MPESA_ERROR_CODES[ResultCode as keyof typeof MPESA_ERROR_CODES] ||
          ResultDesc,
      };
    } catch (error) {
      console.error("Error processing M-Pesa callback:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Failed to process M-Pesa callback", 500);
    }
  };

  processMpesaRefund = async (options: {
    phone: string;
    amount: number;
    leaseId: string;
  }) => {
    // Format phone to 254...
    // biome-ignore lint/performance/useTopLevelRegex: false positive
    const formattedPhone = options.phone.replace(/^0/, "254");

    // const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
    // Generate timestamp
    const timestamp = getTimestamp();

    // Generate password
    const password = getPassword(
      config.mpesa.shortCode,
      config.mpesa.passKey,
      timestamp
    );

    const response = await this.primaryClient.post(
      MPESA_STK_PUSH_URL,
      {
        BusinessShortCode: config.mpesa.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: options.amount,
        PartyA: formattedPhone,
        PartyB: config.mpesa.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${config.app.url}/api/v1/payments/mpesa/callback`,
        AccountReference: `REFUND-${options.leaseId}`,
        TransactionDesc: "Deposit refund",
      },
      {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
      }
    );

    if (response.data.ResponseCode !== "0") {
      throw new Error(`M-Pesa failed: ${response.data.ResponseDescription}`);
    }

    return {
      code: response.data.CheckoutRequestID,
      status: "pending",
    };
  };

  // Check account balance
  checkAccountBalance = async (): Promise<any> => {
    try {
      // Prepare request body
      const requestBody = {
        Initiator: config.mpesa.initiatorName,
        SecurityCredential: config.mpesa.securityCredential,
        CommandID: "AccountBalance",
        PartyA: config.mpesa.shortCode,
        IdentifierType: "4", // Organization shortcode
        Remarks: "Account balance check",
        QueueTimeOutURL: `${config.app.url}/api/v1/payments/balance-timeout`,
        ResultURL: `${config.app.url}/api/v1/payments/balance-result`,
      };

      // Make request to M-Pesa API
      const response = await this.primaryClient.post(
        MPESA_ACCOUNT_BALANCE_URL,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error checking account balance:", error);
      throw error;
    }
  };

  // Transaction status query
  queryTransactionStatus = async (
    originatorConversationId: string,
    conversationId: string
  ): Promise<any> => {
    try {
      // Prepare request body
      const requestBody = {
        Initiator: config.mpesa.initiatorName,
        SecurityCredential: config.mpesa.securityCredential,
        CommandID: "TransactionStatusQuery",
        TransactionID: conversationId,
        PartyA: config.mpesa.shortCode,
        IdentifierType: "4", // Organization shortcode
        ResultURL: `${config.app.url}/api/v1/payments/status-result`,
        QueueTimeOutURL: `${config.app.url}/api/v1/payments/status-timeout`,
        Remarks: "Transaction status query",
        Occassion: "Status check",
        OriginatorConversationID: originatorConversationId,
      };

      // Make request to M-Pesa API
      const response = await this.primaryClient.post(
        MPESA_TRANSACTION_STATUS_URL,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error querying transaction status:", error);
      throw error;
    }
  };

  // Transaction reversal
  reverseTransaction = async (
    transactionId: string,
    amount: number,
    remarks: string,
    occassion?: string
  ): Promise<any> => {
    try {
      // Prepare request body
      const requestBody = {
        Initiator: config.mpesa.initiatorName,
        SecurityCredential: config.mpesa.securityCredential,
        CommandID: "TransactionReversal",
        TransactionID: transactionId,
        Amount: Math.round(amount),
        ReceiverParty: config.mpesa.shortCode,
        RecieverIdentifierType: "11", // Till number
        ResultURL: `${config.app.url}/api/v1/payments/reversal-result`,
        QueueTimeOutURL: `${config.app.url}/api/v1/payments/reversal-timeout`,
        Remarks: remarks,
        Occassion: occassion || "Transaction reversal",
      };

      // Make request to M-Pesa API
      const response = await this.primaryClient.post(
        MPESA_REVERSAL_URL,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error reversing transaction:", error);
      throw error;
    }
  };

  // Simulate C2B transaction (for testing)
  simulateC2BTransaction = async ({
    phoneNumber,
    amount,
    billRefNumber,
    commandID = "CustomerPayBillOnline",
  }: C2BSimulateRequest): Promise<any> => {
    try {
      // Format phone number
      const formattedPhone = validatePhoneNumber(phoneNumber);

      // Prepare request body
      const requestBody = {
        ShortCode: config.mpesa.shortCode,
        CommandID: commandID,
        Amount: Math.round(amount),
        Msisdn: formattedPhone,
        BillRefNumber: billRefNumber,
      };

      // Make request to M-Pesa API
      const response = await this.primaryClient.post(
        MPESA_C2B_SIMULATE_URL,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error simulating C2B transaction:", error);
      throw error;
    }
  };

  // B2C transaction (business to customer)
  initiateB2CTransaction = async ({
    phoneNumber,
    amount,
    remarks,
    occasion,
    commandID = "BusinessPayment",
  }: B2CRequest): Promise<any> => {
    try {
      // Format phone number
      const formattedPhone = validatePhoneNumber(phoneNumber);

      // Validate command ID
      const validCommands = [
        "BusinessPayment",
        "SalaryPayment",
        "PromotionPayment",
      ];
      if (!validCommands.includes(commandID)) {
        throw new AppError("Invalid command ID", 400);
      }

      // Prepare request body
      const requestBody = {
        InitiatorName: config.mpesa.initiatorName,
        SecurityCredential: config.mpesa.securityCredential,
        CommandID: commandID,
        Amount: Math.round(amount),
        PartyA: config.mpesa.shortCode,
        PartyB: formattedPhone,
        Remarks: remarks,
        QueueTimeOutURL: `${config.app.url}/api/v1/payments/b2c-timeout`,
        ResultURL: `${config.app.url}/api/v1/payments/b2c-result`,
        Occassion: occasion || "Payment",
      };

      // Make request to M-Pesa API
      const response = await this.primaryClient.post(
        MPESA_B2C_URL,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error initiating B2C transaction:", error);
      throw error;
    }
  };

  // B2B transaction (business to business)
  initiateB2BTransaction = async (
    receivingShortCode: string,
    amount: number,
    remarks: string,
    accountReference?: string,
    commandId = "BusinessToBusinessTransfer"
  ): Promise<any> => {
    try {
      // Validate command ID
      const validCommands = [
        "BusinessToBusinessTransfer",
        "BusinessPayBill",
        "BusinessBuyGoods",
      ];
      if (!validCommands.includes(commandId)) {
        throw new AppError("Invalid command ID", 400);
      }

      // Prepare request body
      const requestBody = {
        Initiator: config.mpesa.initiatorName,
        SecurityCredential: config.mpesa.securityCredential,
        CommandID: commandId,
        SenderIdentifierType: "4", // Organization shortcode
        RecieverIdentifierType: commandId === "BusinessBuyGoods" ? "2" : "4", // Till or shortcode
        Amount: Math.round(amount),
        PartyA: config.mpesa.shortCode,
        PartyB: receivingShortCode,
        Remarks: remarks,
        QueueTimeOutURL: `${config.app.url}/api/v1/payments/b2b-timeout`,
        ResultURL: `${config.app.url}/api/v1/payments/b2b-result`,
        ...(accountReference && { AccountReference: accountReference }),
      };

      // Make request to M-Pesa API
      const response = await this.primaryClient.post(
        MPESA_B2B_URL,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error initiating B2B transaction:", error);
      throw error;
    }
  };

  // Register C2B URLs - Register validation and confirmation URLs
  registerC2BUrls = async (): Promise<any> => {
    try {
      // Prepare request body
      const requestBody = {
        ShortCode: config.mpesa.shortCode,
        ResponseType: "Completed",
        ConfirmationURL: `${config.app.url}/api/v1/payments/c2b-confirmation`,
        ValidationURL: `${config.app.url}/api/v1/payments/c2b-validation`,
      };

      // Make request to M-Pesa API
      const response = await this.primaryClient.post(
        MPESA_C2B_REGISTER_URL,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error registering C2B URLs:", error);
      throw error;
    }
  };

  // Real-time Status Polling
  private pollTransactionStatus(transactionId: string): void {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || transaction.status !== "PENDING") return;

    let pollAttempts = 0;
    const maxPollAttempts = 12; // 2 minutes with 10s intervals

    const pollInterval = setInterval(async () => {
      pollAttempts++;

      try {
        if (transaction.checkoutRequestID) {
          const status = await this.verifyMpesaPayment(
            transaction.checkoutRequestID
          );

          if (status.ResultCode === "0") {
            transaction.status = "SUCCESS";
            transaction.mpesaReceiptNumber = status.MpesaReceiptNumber;
            transaction.updatedAt = new Date();
            this.transactions.set(transactionId, transaction);

            const callback = transaction.metadata?.callback;
            if (callback && typeof callback === "function") {
              callback(transaction);
            }

            clearInterval(pollInterval);
          } else if (status.ResultCode && status.ResultCode !== "1032") {
            // 1032 is "Request cancelled by user"
            transaction.status = "FAILED";
            transaction.errorCode = status.ResultCode;
            transaction.errorMessage = status.ResultDesc;
            transaction.updatedAt = new Date();
            this.transactions.set(transactionId, transaction);

            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.warn(
          `Polling attempt ${pollAttempts} failed for transaction ${transactionId}:`,
          error
        );
      }

      if (pollAttempts >= maxPollAttempts) {
        transaction.status = "TIMEOUT";
        transaction.errorMessage = "Transaction polling timeout";
        transaction.updatedAt = new Date();
        this.transactions.set(transactionId, transaction);

        clearInterval(pollInterval);
      }
    }, 10_000); // Poll every 10 seconds
  }

  // Transaction Management
  getTransaction(transactionId: string): MpesaTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  getAllTransactions(): MpesaTransaction[] {
    return Array.from(this.transactions.values());
  }

  getTransactionsByStatus(
    status: MpesaTransaction["status"]
  ): MpesaTransaction[] {
    return this.getAllTransactions().filter((t) => t.status === status);
  }

  getTransactionsByPhoneNumber(phoneNumber: string): MpesaTransaction[] {
    return this.getAllTransactions().filter(
      (t) => t.phoneNumber === phoneNumber
    );
  }

  // Reconciliation
  reconcileTransactions(date?: Date): {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    discrepancies: MpesaTransaction[];
  } {
    const targetDate = date || new Date();
    const transactions = this.getAllTransactions().filter(
      (t) => t.createdAt.toDateString() === targetDate.toDateString()
    );

    const successful = transactions.filter((t) => t.status === "SUCCESS");
    const failed = transactions.filter((t) => t.status === "FAILED");
    const pending = transactions.filter((t) => t.status === "PENDING");
    const discrepancies: MpesaTransaction[] = [];

    // Check for discrepancies (transactions that should have completed but are still pending)
    for (const transaction of pending) {
      const hoursSinceCreation =
        (Date.now() - transaction.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > 1) {
        // Consider as discrepancy if pending for more than 1 hour
        discrepancies.push(transaction);
      }
    }

    return {
      total: transactions.length,
      successful: successful.length,
      failed: failed.length,
      pending: pending.length,
      discrepancies,
    };
  }

  // Health and Statistics
  getHealthStatus(): {
    isHealthy: boolean;
    primaryConnectionStatus: "active" | "failed";
    backupConnectionStatus: "active" | "standby" | "failed";
    reconnectAttempts: number;
    totalTransactions: number;
    successRate: number;
  } {
    const total = this.transactions.size;
    const successful = this.getTransactionsByStatus("SUCCESS").length;

    return {
      isHealthy: this.reconnectAttempts < this.maxReconnectAttempts,
      primaryConnectionStatus:
        this.reconnectAttempts === 0 ? "active" : "failed",
      backupConnectionStatus: this.failoverEnabled ? "standby" : "failed",
      reconnectAttempts: this.reconnectAttempts,
      totalTransactions: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  }
}

export const mpesaService = new MpesaService();
