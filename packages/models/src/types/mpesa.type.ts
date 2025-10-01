export type MpesaConfig = {
  environment: "sandbox" | "production";
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  lipaNaMpesaShortCode: string;
  lipaNaMpesaPasskey: string;
  c2bShortCode: string;
  b2cShortCode: string;
  securityCredential: string;
  queueTimeoutUrl: string;
  resultUrl: string;
  callbackUrl: string;
  validationUrl: string;
  confirmationUrl: string;
  initiatorName: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
};

export type MpesaTransaction = {
  id: string;
  type: "STK_PUSH" | "C2B" | "B2C" | "B2B" | "REVERSAL" | "BALANCE";
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
  merchantRequestID?: string;
  checkoutRequestID?: string;
  mpesaReceiptNumber?: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "TIMEOUT";
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
};

export type STKPushRequest = {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callback?: (transaction: MpesaTransaction) => void;
};

export type STKPushResponse = {
  merchantRequestID: string;
  checkoutRequestID: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
};

export type C2BSimulateRequest = {
  phoneNumber: string;
  amount: number;
  billRefNumber: string;
  commandID: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
};

export type B2CRequest = {
  phoneNumber: string;
  amount: number;
  commandID: "SalaryPayment" | "BusinessPayment" | "PromotionPayment";
  remarks: string;
  occasion: string;
};

export type TransactionStatusRequest = {
  transactionID: string;
  identifierType: "1" | "2" | "4"; // 1=MSISDN, 2=TillNumber, 4=OrganizationShortCode
  partyA: string;
  remarks: string;
};

export type BalanceInquiryRequest = {
  commandID: "AccountBalance";
  partyA: string;
  identifierType: "4"; // OrganizationShortCode
  remarks: string;
};

export type ReversalRequest = {
  transactionID: string;
  amount: number;
  receiverParty: string;
  remarks: string;
  occasion: string;
};
