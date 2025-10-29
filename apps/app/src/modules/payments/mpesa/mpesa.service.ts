import { httpClient } from "@/lib/axios";
import type { Payment } from "../payment.type";

// Base API endpoints
const MPESA_API = "/payments/mpesa";

// Mpesa service types
export type MpesaPaymentRequest = {
  bookingId: string;
  phoneNumber: string;
  amount: number;
  paymentMethod: string;
  paymentType: string;
};

export type MpesaPaymentResponse = {
  payment: Payment;
  mpesaResponse: {
    CheckoutRequestID: string;
    MerchantRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
  };
};

export type MpesaVerificationRequest = {
  checkoutRequestID: string;
};

export type MpesaB2CRequest = {
  phoneNumber: string;
  amount: number;
  remarks: string;
  occassion?: string;
  commandId?: string;
};

export type MpesaB2BRequest = {
  receivingShortCode: string;
  amount: number;
  remarks: string;
  accountReference?: string;
  commandId?: string;
};

export type MpesaTransactionQuery = {
  originatorConversationId: string;
  conversationId: string;
};

export type MpesaReversalRequest = {
  transactionId: string;
  amount: number;
  remarks: string;
  occassion?: string;
};

// Mpesa payment services
export const initiateMpesaPayment = async (
  data: MpesaPaymentRequest
): Promise<MpesaPaymentResponse> => {
  const { data: response } = await httpClient.api.post(
    `${MPESA_API}/initiate`,
    data
  );
  return response;
};

export const verifyMpesaPayment = async (data: MpesaVerificationRequest) => {
  const { data: response } = await httpClient.api.post(
    `${MPESA_API}/verify`,
    data
  );
  return response;
};

export const initiateB2CPayment = async (data: MpesaB2CRequest) => {
  const { data: response } = await httpClient.api.post(
    `${MPESA_API}/b2c`,
    data
  );
  return response;
};

export const initiateB2BPayment = async (data: MpesaB2BRequest) => {
  const { data: response } = await httpClient.api.post(
    `${MPESA_API}/b2b`,
    data
  );
  return response;
};

export const reverseTransaction = async (data: MpesaReversalRequest) => {
  const { data: response } = await httpClient.api.post(
    `${MPESA_API}/reverse`,
    data
  );
  return response;
};

export const checkAccountBalance = async () => {
  const { data: response } = await httpClient.api.get(`${MPESA_API}/balance`);
  return response;
};

export const queryTransactionStatus = async (data: MpesaTransactionQuery) => {
  const { data: response } = await httpClient.api.post(
    `${MPESA_API}/query-status`,
    data
  );
  return response;
};

export const registerMpesaUrls = async () => {
  const { data: response } = await httpClient.api.post(
    `${MPESA_API}/register-urls`
  );
  return response;
};

// Utility functions
export const formatMpesaPhoneNumber = (phoneNumber: string): string => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, "");

  // Check if it starts with 254 (Kenya code)
  if (!cleaned.startsWith("254")) {
    // If it starts with 0, replace with 254
    if (cleaned.startsWith("0")) {
      cleaned = `254${cleaned.substring(1)}`;
    } else {
      // Add 254 prefix
      cleaned = `254${cleaned}`;
    }
  }

  return cleaned;
};

export const validateMpesaPhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatMpesaPhoneNumber(phoneNumber);
  // Ensure it's 12 digits (254 + 9 digits)
  return formatted.length === 12 && formatted.startsWith("254");
};

export const getMpesaErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    "0": "Success",
    "1": "Insufficient funds",
    "2": "Less than minimum transaction value",
    "3": "More than maximum transaction value",
    "4": "Would exceed daily transfer limit",
    "5": "Would exceed minimum balance",
    "6": "Unresolved primary party",
    "7": "Unresolved receiver party",
    "8": "Would exceed maximum balance",
    "11": "Debit account invalid",
    "12": "Credit account invalid",
    "13": "Unresolved debit account",
    "14": "Unresolved credit account",
    "15": "Duplicate detected",
    "17": "Internal failure",
    "20": "Unresolved initiator",
    "26": "Traffic blocking condition in place",
    "1001": "Request could not be processed",
    // Add more error codes as needed
  };

  return errorMessages[errorCode] || `Unknown error (${errorCode})`;
};
