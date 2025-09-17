import type {
  AuthenticationResponseJSON,
  // RegistrationResponseJSON,
  // PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";

export type IPasskey = {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  transports?: string[];
  name: string;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PasskeyEnrollOptions = {
  rpId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  challenge: string;
};

export type PasskeyEnrollRequest = {
  authCodeStore: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
};

export type PasskeyEnrollResponse = {
  status: "success" | "error";
  enrollOptions?: PasskeyEnrollOptions;
  message?: string;
};

export type PasskeyVerifyOptionsRequest = {
  email: string;
};

export type PasskeyVerifyOptionsResponse = {
  status: "success" | "error";
  options?: PublicKeyCredentialRequestOptionsJSON;
  message?: string;
};

export type PasskeyProcessEnrollRequest = {
  authCodeStore: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  enrollInfo: {
    id: string;
    rawId: string;
    type: string;
    clientDataJSON: string;
    attestationObject: string;
    transports?: string[];
  };
};

export type PasskeyProcessEnrollResponse = {
  status: "success" | "error";
  passkeyId?: string;
  passkeyPublickey?: string;
  passkeyCounter?: number;
  message?: string;
};

export type PasskeyProcessVerifyRequest = {
  email: string;
  passkeyInfo: AuthenticationResponseJSON;
};

export type PasskeyProcessVerifyResponse = {
  status: "success" | "error";
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  passkeyId?: string;
  newCounter?: number;
  message?: string;
};

export type PasskeyCreateRequest = {
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
};

export type PasskeyCreateResponse = {
  status: "success" | "error";
  message?: string;
  error?: string;
};

export type PasskeyGetResponse = {
  status: "success" | "error";
  passkey?: IPasskey;
  message?: string;
};

export type PasskeyListResponse = {
  status: "success" | "error";
  passkeys?: IPasskey[];
  message?: string;
};

export type PasskeyDeleteResponse = {
  status: "success" | "error";
  message?: string;
};

export type PasskeyUpdateCounterRequest = {
  counter: number;
};

export type PasskeyLoginRequest = {
  email: string;
};

export type PasskeyLoginResponse = {
  status: "success" | "error";
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
    memberId: string;
    role: string;
    status: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
  message?: string;
};
