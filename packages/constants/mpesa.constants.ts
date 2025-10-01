import config from "@kaa/config/api";

export const MPESA_API_BASE_LIVE_URL = "https://api.safaricom.co.ke";
export const MPESA_API_BASE_SANDBOX_URL = "https://sandbox.safaricom.co.ke";
export const MPESA_API_BASE_BACKUP_URL = "https://api-backup.safaricom.co.ke";

// M-Pesa API URLs
export const MPESA_BASE_URL =
  config.env === "production"
    ? MPESA_API_BASE_LIVE_URL
    : MPESA_API_BASE_SANDBOX_URL;

export const MPESA_BACKUP_BASE_URL =
  config.env === "production" ? MPESA_API_BASE_BACKUP_URL : MPESA_BASE_URL; // Use same URL in sandbox

export const MPESA_AUTH_URL =
  "/oauth/v1/generate?grant_type=client_credentials";
export const MPESA_STK_PUSH_URL = "/mpesa/stkpush/v1/processrequest";
export const MPESA_QUERY_URL = "/mpesa/stkpushquery/v1/query";
export const MPESA_ACCOUNT_BALANCE_URL = "/mpesa/accountbalance/v1/query";
export const MPESA_TRANSACTION_STATUS_URL = "/mpesa/transactionstatus/v1/query";
export const MPESA_REVERSAL_URL = "/mpesa/reversal/v1/request";
export const MPESA_B2C_URL = "/mpesa/b2c/v1/paymentrequest";
export const MPESA_B2B_URL = "/mpesa/b2b/v1/paymentrequest";
export const MPESA_C2B_REGISTER_URL = "/mpesa/c2b/v1/registerurl";
export const MPESA_C2B_SIMULATE_URL = "/mpesa/c2b/v1/simulate";
