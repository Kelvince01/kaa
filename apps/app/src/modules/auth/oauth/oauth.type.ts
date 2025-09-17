export type OAuthConnection = {
  id: string;
  provider: string;
  providerUserId: string;
  profile: {
    name?: string;
    email?: string;
    picture?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type GetConnectionsResponse = {
  status: "success" | "error";
  connections?: OAuthConnection[];
  message?: string;
  error?: string;
};

export type LinkOAuthRequest = {
  provider: string;
  providerUserId: string;
  accessToken: string;
  refreshToken: string;
  profile: {
    name?: string;
    email?: string;
    picture?: string;
  };
  expiresAt?: number;
};

export type LinkOAuthResponse = {
  status: "success" | "error";
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export type UnlinkOAuthRequest = {
  provider: string;
};

export type UnlinkOAuthResponse = {
  status: "success" | "error";
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export type OAuthProvider = {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  isConnected: boolean;
  connectedAt?: string;
};

export type SupportedOAuthProvider = "google" | "microsoft";
