// Interfaces for type safety (unchanged from previous version)
export type AuthResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
};

export type CollectRequest = {
  reference: string;
  subscriber: {
    country: string;
    currency: string;
    msisdn: number;
  };
  transaction: {
    amount: number;
    country: string;
    currency: string;
    id: string;
  };
};

export type CollectResponse = {
  data: {
    transaction: {
      id: string;
      status: string; // e.g., 'TS' (success), 'TIP' (in progress)
      message: string;
    };
  };
};

export type ValidatePayeeRequest = {
  amount: number;
  country: string;
  currency: string;
  msisdn: string;
};

export type ValidatePayeeResponse = {
  message: string;
  data: {
    accountStatus: string; // 'Y' for active
    amlstatus: string; // 'Y' for compliant
  };
};

export type TransferRequest = {
  amount: number;
  country: string;
  currency: string;
  extTRID: string;
  msisdn: string;
  payerCountry: string;
  payerFirstName: string;
  payerLastName: string;
  pin: string; // Encrypted PIN
};

export type TransferResponse = {
  status: number;
  message: string;
  data?: {
    transactionId: string;
  };
};

// New: Config interface for injected settings
export type Config = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  publicKey: string;
};

// New: HttpClient interface for dependency injection
export type HttpClient = {
  request<T>(
    url: string,
    method: "GET" | "POST",
    headers: Record<string, string>,
    data?: any
  ): Promise<ApiResponse<T>>;
};

// New: EncryptionService interface for dependency injection
export type EncryptionService = {
  encryptPin(rawPin: string): string;
};
