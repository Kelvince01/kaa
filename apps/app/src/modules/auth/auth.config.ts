import { config as configKaa } from "@kaa/config";

export type AuthConfig = {
  // API Configuration
  apiUrl: string;

  // Token Configuration
  tokenStorage: "httpOnly" | "localStorage" | "sessionStorage";
  accessTokenExpiry: number; // in minutes
  refreshTokenExpiry: number; // in days

  // Security Configuration
  enableTokenRotation: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  sessionTimeout: number; // in minutes

  // Rate Limiting
  rateLimitWindow: number; // in minutes
  maxRequestsPerWindow: number;

  // Security Headers
  enableCSRF: boolean;
  enableSecureHeaders: boolean;

  // Cookie Configuration
  cookieConfig: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    domain?: string;
    path: string;
  };

  // Password Policy
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventCommonPasswords: boolean;
  };

  // Two Factor Authentication
  twoFA: {
    enabled: boolean;
    issuer: string;
    algorithm: string;
    digits: number;
    period: number;
  };
};

export const authConfig: AuthConfig = {
  apiUrl: `${configKaa.backendUrl}/api/v1`,

  // Token Configuration - Use httpOnly cookies for production
  tokenStorage:
    process.env.NODE_ENV === "production" ? "httpOnly" : "localStorage",
  accessTokenExpiry: Number.parseInt(
    process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY || "15",
    10
  ), // 15 minutes
  refreshTokenExpiry: Number.parseInt(
    process.env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY || "7",
    10
  ), // 7 days

  // Security Configuration
  enableTokenRotation: process.env.NODE_ENV === "production",
  maxLoginAttempts: Number.parseInt(
    process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || "5",
    10
  ),
  lockoutDuration: Number.parseInt(
    process.env.NEXT_PUBLIC_LOCKOUT_DURATION || "30",
    10
  ), // 30 minutes
  sessionTimeout: Number.parseInt(
    process.env.NEXT_PUBLIC_SESSION_TIMEOUT || "480",
    10
  ), // 8 hours

  // Rate Limiting
  rateLimitWindow: Number.parseInt(
    process.env.NEXT_PUBLIC_RATE_LIMIT_WINDOW || "15",
    10
  ), // 15 minutes
  maxRequestsPerWindow: Number.parseInt(
    process.env.NEXT_PUBLIC_MAX_REQUESTS_PER_WINDOW || "100",
    10
  ),

  // Security Headers
  enableCSRF:
    process.env.NEXT_PUBLIC_ENABLE_CSRF === "true" ||
    process.env.NODE_ENV === "production",
  enableSecureHeaders: process.env.NODE_ENV === "production",

  // Cookie Configuration
  cookieConfig: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    path: "/",
  },

  // Password Policy
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
  },

  // Two Factor Authentication
  twoFA: {
    enabled: true,
    issuer: process.env.NEXT_PUBLIC_APP_NAME || "KAA-SAAS",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  },
};
