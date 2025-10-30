import type {
  ApiResponse,
  AuthResponse,
  CollectRequest,
  CollectResponse,
  Config,
  EncryptionService,
  TransferRequest,
  TransferResponse,
  ValidatePayeeRequest,
  ValidatePayeeResponse,
} from "./airtel-money.type";
import { AxiosHttpClient, RsaEncryptionService } from "./airtel-money.util";

export class AirtelMoney {
  constructor(
    private readonly config: Config,
    private readonly httpClient: AxiosHttpClient,
    private readonly encryptionService: EncryptionService
  ) {}

  async getAuthToken(): Promise<ApiResponse<AuthResponse>> {
    const url = `${this.config.baseUrl}/auth/oauth2/token`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
    };
    const data = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "client_credentials",
    };

    return await this.httpClient.request<AuthResponse>(
      url,
      "POST",
      headers,
      data
    );
  }

  async collectMoney(
    accessToken: string,
    reference: string,
    customerPhoneNumber: string,
    amount: number,
    transactionId: string,
    country = "UG",
    currency = "UGX"
  ): Promise<ApiResponse<CollectResponse>> {
    const url = `${this.config.baseUrl}/merchant/v1/payments/`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-Country": country,
      "X-Currency": currency,
      Authorization: `Bearer ${accessToken}`,
    };
    const requestData: CollectRequest = {
      reference,
      subscriber: {
        country,
        currency,
        msisdn: Number.parseInt(customerPhoneNumber, 10),
      },
      transaction: {
        amount: Number.parseInt(amount.toString(), 10),
        country,
        currency,
        id: transactionId,
      },
    };

    return await this.httpClient.request<CollectResponse>(
      url,
      "POST",
      headers,
      requestData
    );
  }

  async checkCollectionStatus(
    accessToken: string,
    transactionId: string,
    country = "UG",
    currency = "UGX"
  ): Promise<ApiResponse<CollectResponse>> {
    const url = `${this.config.baseUrl}/standard/v1/payments/${transactionId}`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-Country": country,
      "X-Currency": currency,
      Authorization: `Bearer ${accessToken}`,
    };

    return await this.httpClient.request<CollectResponse>(url, "GET", headers);
  }

  async canReceiveMoney(
    accessToken: string,
    phoneNumber: string,
    amount: number,
    country = "UGANDA",
    currency = "UGX"
  ): Promise<ApiResponse<ValidatePayeeResponse>> {
    const url = `${this.config.baseUrl}/openapi/moneytransfer/v2/validate`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const requestData: ValidatePayeeRequest = {
      amount: Number.parseInt(amount.toString(), 10),
      country,
      currency,
      msisdn: phoneNumber,
    };

    return await this.httpClient.request<ValidatePayeeResponse>(
      url,
      "POST",
      headers,
      requestData
    );
  }

  async transferMoney(
    accessToken: string,
    phoneNumber: string,
    amount: number,
    transactionId: string,
    payerFirstName: string,
    payerLastName: string,

    rawPin: string,
    country = "UGANDA",
    currency = "UGX"
  ): Promise<ApiResponse<TransferResponse>> {
    const url = `${this.config.baseUrl}/openapi/moneytransfer/v2/credit`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const encryptedPin = this.encryptionService.encryptPin(rawPin);
    const requestData: TransferRequest = {
      amount: Number.parseInt(amount.toString(), 10),
      country,
      currency,
      extTRID: transactionId,
      msisdn: phoneNumber,
      payerCountry: "UG",
      payerFirstName,
      payerLastName,
      pin: encryptedPin,
    };

    return await this.httpClient.request<TransferResponse>(
      url,
      "POST",
      headers,
      requestData
    );
  }
}

const debug = process.env.NODE_ENV !== "production"; // Toggle for UAT/production
const config: Config = {
  baseUrl: debug
    ? "https://openapiuat.airtel.africa"
    : "https://openapi.airtel.africa",
  clientId: process.env.AIRTEL_CLIENT_ID || "",
  clientSecret: process.env.AIRTEL_CLIENT_SECRET || "",
  publicKey:
    process.env.AIRTEL_PUBLIC_KEY ||
    "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCkq3XbDI1s8Lu7SpUBP+bqOs/MC6PKWz6n/0UkqTiOZqKqaoZClI3BUDTrSIJsrN1Qx7ivBzsaAYfsB0CygSSWay4iyUcnMVEDrNVOJwtWvHxpyWJC5RfKBrweW9b8klFa/CfKRtkK730apy0Kxjg+7fF0tB4O3Ic9Gxuv4pFkbQIDAQAB",
};

const httpClient = new AxiosHttpClient();
const encryptionService = new RsaEncryptionService(config.publicKey);
export const airtelMoneyService = new AirtelMoney(
  config,
  httpClient,
  encryptionService
);
