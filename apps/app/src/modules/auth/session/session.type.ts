export type OAuthStrategy = "password" | "otp" | "oauth";
export type OauthType = "regular" | "impersonation";

export type SessionLocation = {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export type Session = {
  id: string;
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    os: string;
    location?: string;
    device?: string;
    deviceType: "desktop" | "mobile" | "tablet" | "unknown";
    deviceHash: string;
    browser: string;
  };
  valid: boolean;
  isRevoked: boolean;
  authStrategy: OAuthStrategy;
  authType: OauthType;
  location: SessionLocation;
  lastActive: Date;
  createdAt: Date;
};
