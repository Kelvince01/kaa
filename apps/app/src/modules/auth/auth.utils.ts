import { authConfig } from "@/modules/auth/auth.config";
import type { User } from "@/modules/users/user.type";

const AT_LEAST_ONE_UPPERCASE = /[A-Z]/;
const AT_LEAST_ONE_LOWERCASE = /[a-z]/;
const AT_LEAST_ONE_NUMBER = /\d/;
const AT_LEAST_ONE_SPECIAL_CHARACTER = /[!@#$%^&*(),.?":{}|<>]/;
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Session cache for performance optimization
type CachedSession = {
  user: User;
  timestamp: number;
  expiresAt: number;
};

const sessionCache = new Map<string, CachedSession>();
const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Login attempt tracking for security
type LoginAttempt = {
  email: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  success: boolean;
};

const loginAttempts = new Map<string, LoginAttempt[]>();

// Session management utilities
export const sessionUtils = {
  // Cache user session for performance
  cacheSession: (user: User, sessionId: string) => {
    const now = Date.now();
    sessionCache.set(sessionId, {
      user,
      timestamp: now,
      expiresAt: now + SESSION_CACHE_DURATION,
    });
  },

  // Get cached session
  getCachedSession: (sessionId: string): User | null => {
    const cached = sessionCache.get(sessionId);
    if (!cached || Date.now() > cached.expiresAt) {
      sessionCache.delete(sessionId);
      return null;
    }
    return cached.user;
  },

  // Clear all cached sessions
  clearSessionCache: () => {
    sessionCache.clear();
  },

  // Generate session ID
  generateSessionId: (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Check session timeout
  isSessionExpired: (timestamp: number): boolean => {
    const sessionTimeout = authConfig.sessionTimeout * 60 * 1000; // Convert to milliseconds
    return Date.now() - timestamp > sessionTimeout;
  },
};

// Security utilities for login attempts and rate limiting
export const securityUtils = {
  // Track login attempt
  trackLoginAttempt: (
    email: string,
    success: boolean,
    ip?: string,
    userAgent?: string
  ) => {
    const attempt: LoginAttempt = {
      email: email.toLowerCase(),
      timestamp: Date.now(),
      ip,
      userAgent,
      success,
    };

    const attempts = loginAttempts.get(email.toLowerCase()) || [];
    attempts.push(attempt);

    // Keep only recent attempts (within lockout duration)
    const cutoff = Date.now() - authConfig.lockoutDuration * 60 * 1000;
    const recentAttempts = attempts.filter((a) => a.timestamp > cutoff);

    loginAttempts.set(email.toLowerCase(), recentAttempts);
  },

  // Check if account is locked
  isAccountLocked: (email: string): boolean => {
    const attempts = loginAttempts.get(email.toLowerCase()) || [];
    const cutoff = Date.now() - authConfig.lockoutDuration * 60 * 1000;

    const recentFailedAttempts = attempts.filter(
      (a) => a.timestamp > cutoff && !a.success
    );

    return recentFailedAttempts.length >= authConfig.maxLoginAttempts;
  },

  // Get lockout time remaining
  getLockoutTimeRemaining: (email: string): number => {
    const attempts = loginAttempts.get(email.toLowerCase()) || [];
    if (attempts.length === 0) {
      return 0;
    }

    const lastFailedAttempt = attempts
      .filter((a) => !a.success)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!lastFailedAttempt) {
      return 0;
    }

    const lockoutExpiry =
      lastFailedAttempt.timestamp + authConfig.lockoutDuration * 60 * 1000;
    const remaining = lockoutExpiry - Date.now();

    return Math.max(0, remaining);
  },

  // Clear login attempts (after successful login)
  clearLoginAttempts: (email: string) => {
    loginAttempts.delete(email.toLowerCase());
  },

  // Get failed login attempts count
  getFailedAttemptsCount: (email: string): number => {
    const attempts = loginAttempts.get(email.toLowerCase()) || [];
    const cutoff = Date.now() - authConfig.lockoutDuration * 60 * 1000;

    return attempts.filter((a) => a.timestamp > cutoff && !a.success).length;
  },

  // Generate secure random string
  generateSecureRandom: (length = 32): string => {
    if (window?.crypto?.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
    }

    // Fallback for server-side
    // biome-ignore lint/style/useNodejsImportProtocol: false positive
    const crypto = require("crypto");
    return crypto.randomBytes(length).toString("hex");
  },

  // Hash sensitive data (for client-side fingerprinting)
  hashData: async (data: string): Promise<string> => {
    if (window?.crypto?.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest(
        "SHA-256",
        dataBuffer
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // Fallback
    return data;
  },

  // Validate password against policy
  validatePassword: (
    password: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const { passwordPolicy } = authConfig;

    if (password.length < passwordPolicy.minLength) {
      errors.push(
        `Password must be at least ${passwordPolicy.minLength} characters long`
      );
    }

    if (
      passwordPolicy.requireUppercase &&
      !AT_LEAST_ONE_UPPERCASE.test(password)
    ) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (
      passwordPolicy.requireLowercase &&
      !AT_LEAST_ONE_LOWERCASE.test(password)
    ) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (passwordPolicy.requireNumbers && !AT_LEAST_ONE_NUMBER.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (
      passwordPolicy.requireSpecialChars &&
      !AT_LEAST_ONE_SPECIAL_CHARACTER.test(password)
    ) {
      errors.push("Password must contain at least one special character");
    }

    // Basic common password check
    const commonPasswords = [
      "password",
      "123456",
      "qwerty",
      "admin",
      "letmein",
    ];
    if (
      passwordPolicy.preventCommonPasswords &&
      commonPasswords.includes(password.toLowerCase())
    ) {
      errors.push(
        "Password is too common, please choose a more secure password"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Generate device fingerprint
  generateDeviceFingerprint: async (): Promise<string> => {
    if (typeof window === "undefined") return "";

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}`,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      // navigator.deviceMemory || 0,
    ].join("|");

    return await securityUtils.hashData(fingerprint);
  },
};

// Token utilities with enhanced validation
export const tokenUtils = {
  // Decode JWT payload (client-side only, for non-sensitive data)
  decodeTokenPayload: (token: string): any | null => {
    try {
      const payload = token.split(".")[1];
      const decoded = atob(payload as string);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  },

  // Check if token is expired (with buffer)
  isTokenExpired: (token: string, bufferMinutes = 2): boolean => {
    const payload = tokenUtils.decodeTokenPayload(token);
    if (!payload?.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    const buffer = bufferMinutes * 60; // Convert to seconds

    return payload.exp <= now + buffer;
  },

  // Get token expiry time
  getTokenExpiryTime: (token: string): Date | null => {
    const payload = tokenUtils.decodeTokenPayload(token);
    if (!payload?.exp) return null;

    return new Date(payload.exp * 1000);
  },

  // Check if token needs refresh (within refresh threshold)
  needsRefresh: (token: string): boolean => {
    const payload = tokenUtils.decodeTokenPayload(token);
    if (!payload?.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    const refreshThreshold = 5 * 60; // 5 minutes in seconds

    return timeUntilExpiry < refreshThreshold;
  },

  // Validate token format
  isValidTokenFormat: (token: string): boolean => {
    if (!token || typeof token !== "string") return false;

    const parts = token.split(".");
    if (parts.length !== 3) return false;

    try {
      // Try to decode each part
      atob(parts[0] as string); // header
      atob(parts[1] as string); // payload
      // signature is not base64url decoded on client side
      return true;
    } catch {
      return false;
    }
  },
};

// Role and permission utilities
export const roleUtils = {
  // Check if user has required role
  hasRole: (user: User | null, requiredRole: string): boolean => {
    if (!user?.role) return false;
    return (user.role as string).toLowerCase() === requiredRole.toLowerCase();
  },

  // Check if user has any of the required roles
  hasAnyRole: (user: User | null, roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.some(
      (role) => (user.role as string).toLowerCase() === role.toLowerCase()
    );
  },

  // Get user's role priority (for role-based redirects)
  getRolePriority: (role: string): number => {
    const priorities = {
      super_admin: 100,
      admin: 90,
      property_manager: 80,
      manager: 70,
      landlord: 60,
      owner: 50,
      maintenance: 40,
      tenant: 30,
      user: 20,
      guest: 10,
    };

    return (
      priorities[(role as string).toLowerCase() as keyof typeof priorities] || 0
    );
  },

  // Get default redirect path for role
  getDefaultRedirectPath: (role: string): string => {
    const redirects = {
      super_admin: "/admin",
      admin: "/admin",
      property_manager: "/dashboard",
      manager: "/dashboard",
      landlord: "/dashboard",
      owner: "/dashboard",
      maintenance: "/dashboard",
      tenant: "/account",
      user: "/dashboard",
    };

    return (
      redirects[(role as string).toLowerCase() as keyof typeof redirects] ||
      "/dashboard"
    );
  },
};

// Storage utilities with encryption (simplified for demo)
export const storageUtils = {
  // Secure storage key prefix
  keyPrefix: `${authConfig.twoFA.issuer.toLowerCase()}_auth_`,

  // Set item in storage with expiry
  setItem: (key: string, value: any, expiryHours = 24): void => {
    try {
      const item = {
        value,
        expiry: Date.now() + expiryHours * 60 * 60 * 1000,
      };

      const storageKey = `${storageUtils.keyPrefix}${key}`;

      if (authConfig.tokenStorage === "sessionStorage") {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(storageKey, JSON.stringify(item));
        }
      } else if (
        authConfig.tokenStorage === "localStorage" &&
        typeof window !== "undefined"
      ) {
        localStorage.setItem(storageKey, JSON.stringify(item));
      }
      // HttpOnly cookies are handled server-side
    } catch (error) {
      console.error("Error storing item:", error);
    }
  },

  // Get item from storage
  getItem: (key: string): any | null => {
    try {
      const storageKey = `${storageUtils.keyPrefix}${key}`;
      let itemStr: string | null = null;

      if (authConfig.tokenStorage === "sessionStorage") {
        itemStr = sessionStorage.getItem(storageKey);
      } else if (authConfig.tokenStorage === "localStorage") {
        itemStr = localStorage.getItem(storageKey);
      }

      if (!itemStr) return null;

      const item = JSON.parse(itemStr);

      // Check if expired
      if (Date.now() > item.expiry) {
        storageUtils.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error("Error retrieving item:", error);
      return null;
    }
  },

  // Remove item from storage
  removeItem: (key: string): void => {
    try {
      const storageKey = `${storageUtils.keyPrefix}${key}`;

      if (authConfig.tokenStorage === "sessionStorage") {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(storageKey);
        }
      } else if (
        authConfig.tokenStorage === "localStorage" &&
        typeof window !== "undefined"
      ) {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  },

  // Clear all auth-related items
  clearAll: (): void => {
    try {
      const storage =
        authConfig.tokenStorage === "sessionStorage"
          ? sessionStorage
          : localStorage;
      const keys = Object.keys(storage);

      for (const key of keys) {
        if (
          key.startsWith(storageUtils.keyPrefix) &&
          typeof window !== "undefined"
        ) {
          storage.removeItem(key);
        }
      }
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },
};

// Enhanced error handling utilities
export const errorUtils = {
  // Parse API error response
  parseApiError: (
    error: any
  ): { message: string; code?: string; details?: any } => {
    // Handle Axios errors
    if (error.response) {
      const { status, data } = error.response;

      // Handle different status codes
      switch (status) {
        case 400:
          return {
            message:
              data?.message || "Invalid request. Please check your input.",
            code: "INVALID_REQUEST",
            details: data?.errors || data?.details,
          };
        case 401:
          return {
            message:
              data?.message || "Authentication failed. Please log in again.",
            code: "UNAUTHORIZED",
            details: data?.details,
          };
        case 403:
          return {
            message:
              data?.message ||
              "Access denied. You do not have permission to perform this action.",
            code: "FORBIDDEN",
            details: data?.details,
          };
        case 404:
          return {
            message: data?.message || "The requested resource was not found.",
            code: "NOT_FOUND",
            details: data?.details,
          };
        case 409:
          return {
            message:
              data?.message || "Conflict. This action cannot be completed.",
            code: "CONFLICT",
            details: data?.details,
          };
        case 429:
          return {
            message: data?.message || "Too many requests. Please slow down.",
            code: "RATE_LIMITED",
            details: data?.details,
          };
        case 422:
          return {
            message:
              data?.message || "Validation failed. Please check your input.",
            code: "VALIDATION_ERROR",
            details: data?.errors || data?.details,
          };
        case 500:
          return {
            message: data?.message || "Server error. Please try again later.",
            code: "SERVER_ERROR",
            details: data?.details,
          };
        default:
          return {
            message: data?.message || `Request failed with status ${status}`,
            code: "UNKNOWN_ERROR",
            details: data?.details,
          };
      }
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      return {
        message: "Network error. Please check your internet connection.",
        code: "NETWORK_ERROR",
      };
    }

    // Handle other errors
    return {
      message: error.message || "An unexpected error occurred.",
      code: "UNKNOWN_ERROR",
      details: error,
    };
  },

  // Get user-friendly error message
  getUserFriendlyMessage: (error: any): string => {
    const parsed = errorUtils.parseApiError(error);
    return parsed.message;
  },

  // Check if error requires re-authentication
  requiresReauth: (error: any): boolean => {
    const parsed = errorUtils.parseApiError(error);
    return parsed.code === "UNAUTHORIZED" || parsed.code === "FORBIDDEN";
  },

  // Parse auth-specific errors (alias for parseApiError with status)
  parseAuthError: (
    error: any
  ): { message: string; code?: string; status?: number } => {
    // Handle network errors first
    if (error.code === "NETWORK_ERROR" || error.message === "Network Error") {
      return {
        message:
          "Network connection failed. Please check your internet connection.",
        code: "NETWORK_ERROR",
      };
    }

    // Use existing parseApiError for API errors
    if (error.response) {
      const parsed = errorUtils.parseApiError(error);
      return {
        message: parsed.message,
        code: parsed.code,
        status: error.response.status,
      };
    }

    // Handle other errors
    return {
      message: "An unexpected error occurred. Please try again.",
      code: "UNKNOWN_ERROR",
    };
  },

  // Get error message by code
  getErrorMessage: (code: string): string => {
    const errorMessages: Record<string, string> = {
      AUTH_INVALID_CREDENTIALS: "Invalid email or password",
      AUTH_ACCOUNT_LOCKED:
        "Account is temporarily locked due to too many failed login attempts",
      AUTH_TOKEN_EXPIRED: "Your session has expired. Please log in again",
      AUTH_USER_NOT_FOUND: "User account not found",
      AUTH_EMAIL_NOT_VERIFIED:
        "Please verify your email address before logging in",
      AUTH_ACCOUNT_DISABLED:
        "Your account has been disabled. Please contact support",
      AUTH_INSUFFICIENT_PERMISSIONS:
        "You do not have permission to perform this action",
      UNAUTHORIZED: "Authentication failed. Please log in again",
      FORBIDDEN:
        "Access denied. You do not have permission to perform this action",
      VALIDATION_ERROR: "Please check your input and try again",
      NETWORK_ERROR:
        "Network connection failed. Please check your internet connection",
      RATE_LIMITED: "Too many requests. Please slow down and try again",
      SERVER_ERROR: "Server error. Please try again later",
    };

    return errorMessages[code] || "An error occurred. Please try again";
  },
};

// Additional utility functions that tests expect
export const authUtils = {
  // Token management functions
  setRefreshToken: (token: string, persistent = true) => {
    if (persistent) {
      localStorage.setItem("kaa_refresh_token", token);
    } else {
      sessionStorage.setItem("kaa_refresh_token", token);
    }
  },

  getRefreshToken: () => {
    return (
      localStorage.getItem("kaa_refresh_token") ||
      sessionStorage.getItem("kaa_refresh_token")
    );
  },

  // Role checking functions
  hasRole: (user: any, roles: string | string[]): boolean => {
    if (!user?.role) return false;
    if (Array.isArray(roles)) {
      return roles.some(
        (role) => user.role.toLowerCase() === role.toLowerCase()
      );
    }
    return user.role.toLowerCase() === roles.toLowerCase();
  },

  isAdmin: (user: any): boolean => {
    return user?.role && user.role.toLowerCase() === "admin";
  },

  isSuperAdmin: (user: any): boolean => {
    return user?.role && user.role.toLowerCase() === "super_admin";
  },

  // Login attempt tracking
  trackLoginAttempt: (email: string) => {
    const attempts = JSON.parse(
      localStorage.getItem("kaa_login_attempts") || "{}"
    );
    const userAttempts = attempts[email] || { count: 0, timestamp: Date.now() };
    userAttempts.count += 1;
    userAttempts.timestamp = Date.now();
    attempts[email] = userAttempts;
    localStorage.setItem("kaa_login_attempts", JSON.stringify(attempts));
  },

  isAccountLocked: (email: string): boolean => {
    const attempts = JSON.parse(
      localStorage.getItem("kaa_login_attempts") || "{}"
    );
    const userAttempts = attempts[email];
    if (!userAttempts) return false;
    return userAttempts.count >= 5; // Max attempts from config
  },

  clearLoginAttempts: (email: string) => {
    const attempts = JSON.parse(
      localStorage.getItem("kaa_login_attempts") || "{}"
    );
    delete attempts[email];
    localStorage.setItem("kaa_login_attempts", JSON.stringify(attempts));
  },

  // Device fingerprinting
  generateDeviceFingerprint: (): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    // biome-ignore lint/style/noNonNullAssertion: false positive
    ctx!.textBaseline = "top";
    // biome-ignore lint/style/noNonNullAssertion: false positive
    ctx!.font = "14px Arial";
    ctx?.fillText("Device fingerprint", 2, 2);
    const fingerprint = canvas.toDataURL();
    return btoa(
      fingerprint + navigator.userAgent + screen.width + screen.height
    );
  },

  // Rate limiting
  isRateLimited: (
    action: string,
    maxAttempts: number,
    windowMs: number
  ): boolean => {
    const rateLimits = JSON.parse(
      localStorage.getItem("kaa_rate_limits") || "{}"
    );
    const now = Date.now();
    const actionData = rateLimits[action];

    if (!actionData || now - actionData.timestamp > windowMs) {
      rateLimits[action] = { count: 1, timestamp: now };
      localStorage.setItem("kaa_rate_limits", JSON.stringify(rateLimits));
      return false;
    }

    if (actionData.count >= maxAttempts) {
      return true;
    }

    actionData.count += 1;
    localStorage.setItem("kaa_rate_limits", JSON.stringify(rateLimits));
    return false;
  },

  // Storage utilities
  clearAuthStorage: () => {
    localStorage.removeItem("kaa_access_token");
    localStorage.removeItem("kaa_refresh_token");
    localStorage.removeItem("kaa_user_session");
    sessionStorage.removeItem("kaa_access_token");
    sessionStorage.removeItem("kaa_refresh_token");
  },

  isStorageAvailable: (type: "localStorage" | "sessionStorage"): boolean => {
    try {
      const storage = window[type];
      const test = "__storage_test__";
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  // Validation utilities
  validateEmail: (email: string): boolean => {
    const emailRegex = VALID_EMAIL;
    return emailRegex.test(email);
  },

  validatePassword: (
    password: string
  ): { isValid: boolean; strength: string; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push("Password must be at least 8 characters long");

    if (AT_LEAST_ONE_LOWERCASE.test(password)) score += 1;
    else feedback.push("Password must contain lowercase letters");

    if (AT_LEAST_ONE_UPPERCASE.test(password)) score += 1;
    else feedback.push("Password must contain uppercase letters");

    if (AT_LEAST_ONE_NUMBER.test(password)) score += 1;
    else feedback.push("Password must contain numbers");

    // biome-ignore lint/performance/useTopLevelRegex: false positive
    if (/[^\w\s]/.test(password)) score += 1;
    else feedback.push("Password must contain special characters");

    const strength = score >= 4 ? "strong" : score >= 2 ? "medium" : "weak";
    const isValid = score >= 3;

    return { isValid, strength, feedback };
  },

  // Error handling
  parseAuthError: (
    error: any
  ): { message: string; code?: string; status?: number } => {
    return errorUtils.parseAuthError(error);
  },

  getErrorMessage: (code: string): string => {
    return errorUtils.getErrorMessage(code);
  },
};

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1] as string));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // If token is invalid, treat as expired
  }
};

// Check if token is valid
// export const isTokenValid = (token: string): boolean => {
// 	if (!token) return false;

// 	try {
// 		const decodedToken = jwtDecode(token) as { exp: number };
// 		const currentTime = Date.now() / 1000;
// 		return decodedToken.exp > currentTime;
// 	} catch (error) {
// 		return false;
// 	}
// };
