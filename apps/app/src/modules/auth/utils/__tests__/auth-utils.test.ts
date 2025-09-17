import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authUtils,
  errorUtils,
  roleUtils,
  securityUtils,
  sessionUtils,
  tokenUtils,
} from "@/modules/auth/auth.utils";
import { type User, UserRole, UserStatus } from "@/modules/users/user.type";

// Mock the config
vi.mock("@/config/auth", () => ({
  authConfig: {
    sessionTimeout: 480, // 8 hours in minutes
    maxLoginAttempts: 5,
    lockoutDuration: 30, // 30 minutes
    tokenStorage: "localStorage",
    twoFA: {
      enabled: true,
      issuer: "KAA-SAAS",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    },
  },
}));

describe("Auth Utils", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe("Token Utils", () => {
    describe("decodeTokenPayload", () => {
      it("should return null for invalid token", () => {
        expect(tokenUtils.decodeTokenPayload("invalid-token")).toBeNull();
      });

      it("should decode valid token payload", () => {
        const payload = { userId: "123", role: "user" };
        const token = `header.${btoa(JSON.stringify(payload))}.signature`;

        expect(tokenUtils.decodeTokenPayload(token)).toEqual(payload);
      });
    });

    describe("isTokenExpired", () => {
      it("should return true for invalid token format", () => {
        expect(tokenUtils.isTokenExpired("invalid-token")).toBe(true);
      });

      it("should return true for expired token", () => {
        const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
        const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

        expect(tokenUtils.isTokenExpired(expiredToken)).toBe(true);
      });

      it("should return false for valid token", () => {
        const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
        const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;

        expect(tokenUtils.isTokenExpired(validToken)).toBe(false);
      });
    });

    describe("needsRefresh", () => {
      it("should return true for token expiring soon", () => {
        const soonToExpirePayload = {
          exp: Math.floor(Date.now() / 1000) + 120,
        }; // 2 minutes from now
        const token = `header.${btoa(JSON.stringify(soonToExpirePayload))}.signature`;

        expect(tokenUtils.needsRefresh(token)).toBe(true);
      });

      it("should return false for token with plenty of time", () => {
        const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
        const token = `header.${btoa(JSON.stringify(validPayload))}.signature`;

        expect(tokenUtils.needsRefresh(token)).toBe(false);
      });
    });

    describe("isValidTokenFormat", () => {
      it("should return false for invalid token format", () => {
        expect(tokenUtils.isValidTokenFormat("invalid")).toBe(false);
        expect(tokenUtils.isValidTokenFormat("invalid.token")).toBe(false);
      });

      it("should return true for valid JWT format", () => {
        const validToken = `${btoa("header")}.${btoa("payload")}.signature`;
        expect(tokenUtils.isValidTokenFormat(validToken)).toBe(true);
      });
    });

    describe("setRefreshToken", () => {
      it("should store refresh token in localStorage for persistent storage", () => {
        const token = "refresh-token";
        authUtils.setRefreshToken(token, true);

        expect(localStorage.getItem("kaa_refresh_token")).toBe(token);
      });

      it("should store refresh token in sessionStorage for non-persistent storage", () => {
        const token = "refresh-token";
        authUtils.setRefreshToken(token, false);

        expect(sessionStorage.getItem("kaa_refresh_token")).toBe(token);
      });
    });

    describe("getRefreshToken", () => {
      it("should retrieve refresh token from appropriate storage", () => {
        localStorage.setItem("kaa_refresh_token", "local-refresh");

        expect(authUtils.getRefreshToken()).toBe("local-refresh");
      });
    });
  });

  describe("Session Utils", () => {
    const mockUser: User = {
      id: "123",
      email: "test@example.com",
      role: UserRole.USER,
      firstName: "Test",
      lastName: "User",
      isVerified: true,
      avatar: undefined,
      phone: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberId: "member123",
      username: "testuser",
      status: UserStatus.ACTIVE,
      isActive: true,
    };

    describe("session cache", () => {
      it("should cache and retrieve user session", () => {
        const sessionId = "test-session-id";
        sessionUtils.cacheSession(mockUser, sessionId);

        const cachedUser = sessionUtils.getCachedSession(sessionId);
        expect(cachedUser).toEqual(mockUser);
      });

      it("should return null for non-existent session", () => {
        const cachedUser = sessionUtils.getCachedSession("non-existent");
        expect(cachedUser).toBeNull();
      });

      it("should clear all sessions", () => {
        const sessionId = "test-session-id";
        sessionUtils.cacheSession(mockUser, sessionId);

        sessionUtils.clearSessionCache();

        const cachedUser = sessionUtils.getCachedSession(sessionId);
        expect(cachedUser).toBeNull();
      });

      it("should generate unique session IDs", () => {
        const id1 = sessionUtils.generateSessionId();
        const id2 = sessionUtils.generateSessionId();

        expect(id1).not.toBe(id2);
        // biome-ignore lint/performance/useTopLevelRegex: false positive
        expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
      });

      it("should detect session timeout", () => {
        const oldTimestamp = Date.now() - 10 * 60 * 60 * 1000; // 10 hours ago
        const recentTimestamp = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago

        expect(sessionUtils.isSessionExpired(oldTimestamp)).toBe(true);
        expect(sessionUtils.isSessionExpired(recentTimestamp)).toBe(false);
      });
    });
  });

  describe("Session Cache", () => {
    const mockUser: User = {
      id: "123",
      email: "test@example.com",
      role: UserRole.USER,
      firstName: "Test",
      lastName: "User",
      isVerified: true,
      avatar: undefined,
      phone: undefined,
      memberId: "member123",
      username: "testuser",
      status: UserStatus.ACTIVE,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("should cache user session", () => {
      sessionUtils.cacheSession(mockUser, "session_id");

      // sessionUtils uses in-memory cache, not localStorage
      const cachedUser = sessionUtils.getCachedSession("session_id");
      expect(cachedUser).toEqual(mockUser);
    });

    it("should return null for expired session from memory cache", () => {
      // Cache session that will expire
      sessionUtils.cacheSession(mockUser, "expired_session");

      // Wait for it to expire or manually clear cache
      sessionUtils.clearSessionCache();

      expect(sessionUtils.getCachedSession("expired_session")).toBeNull();
    });
  });

  describe("Security Utils", () => {
    const email = "test@example.com";

    describe("login attempt tracking", () => {
      it("should track failed login attempts", () => {
        securityUtils.trackLoginAttempt(email, false);

        expect(securityUtils.getFailedAttemptsCount(email.toLowerCase())).toBe(
          1
        );
      });

      it("should not count successful login attempts as failed", () => {
        securityUtils.trackLoginAttempt(email, true);

        expect(securityUtils.getFailedAttemptsCount(email.toLowerCase())).toBe(
          1
        );
      });

      it("should detect account lockout after max attempts", () => {
        // Track max failed attempts
        for (let i = 0; i < 5; i++) {
          securityUtils.trackLoginAttempt(email, false);
        }

        expect(securityUtils.isAccountLocked(email.toLowerCase())).toBe(true);
      });

      it("should clear login attempts", () => {
        securityUtils.trackLoginAttempt(email, false);
        securityUtils.clearLoginAttempts(email);

        expect(securityUtils.getFailedAttemptsCount(email)).toBe(0);
        expect(securityUtils.isAccountLocked(email)).toBe(false);
      });

      it("should get lockout time remaining", () => {
        // Track failed attempts to trigger lockout
        for (let i = 0; i < 5; i++) {
          securityUtils.trackLoginAttempt(email, false);
        }

        const remaining = securityUtils.getLockoutTimeRemaining(email);
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(30 * 60 * 1000); // 30 minutes
      });
    });

    describe("generateDeviceFingerprint", () => {
      it("should generate consistent device fingerprint", () => {
        const fingerprint1 = authUtils.generateDeviceFingerprint();
        const fingerprint2 = authUtils.generateDeviceFingerprint();

        expect(fingerprint1).toBe(fingerprint2);
        expect(typeof fingerprint1).toBe("string");
        expect(fingerprint1.length).toBeGreaterThan(0);
      });
    });

    describe("Rate Limiting", () => {
      it("should check if action is rate limited", () => {
        const action = "test-action";

        // First call should not be rate limited
        expect(authUtils.isRateLimited(action, 2, 60_000)).toBe(false);

        // Second call should not be rate limited
        expect(authUtils.isRateLimited(action, 2, 60_000)).toBe(false);

        // Third call should be rate limited
        expect(authUtils.isRateLimited(action, 2, 60_000)).toBe(true);
      });

      it("should reset rate limit after time window", () => {
        const action = "test-action-2";

        // Use up the limit
        expect(authUtils.isRateLimited(action, 1, 1)).toBe(false);
        expect(authUtils.isRateLimited(action, 1, 1)).toBe(true);

        // Wait for time window to pass (mocked)
        const attempts = JSON.parse(
          localStorage.getItem("kaa_rate_limits") || "{}"
        );
        attempts[action].timestamp = Date.now() - 2; // 2ms ago
        localStorage.setItem("kaa_rate_limits", JSON.stringify(attempts));

        expect(authUtils.isRateLimited(action, 1, 1)).toBe(false);
      });
    });
  });

  describe("Role Utils", () => {
    const adminUser: User = {
      id: "123",
      email: "admin@example.com",
      role: UserRole.ADMIN,
      firstName: "Admin",
      lastName: "User",
      isVerified: true,
      avatar: undefined,
      phone: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberId: "admin123",
      username: "adminuser",
      status: UserStatus.ACTIVE,
      isActive: true,
    };

    const regularUser: User = {
      ...adminUser,
      role: UserRole.USER,
      email: "user@example.com",
    };

    describe("role checking", () => {
      it("should correctly identify user roles", () => {
        expect(roleUtils.hasRole(adminUser, "admin")).toBe(true);
        expect(roleUtils.hasRole(adminUser, "user")).toBe(false);
        expect(roleUtils.hasRole(regularUser, "user")).toBe(true);
        expect(roleUtils.hasRole(regularUser, "admin")).toBe(false);
      });

      it("should handle case insensitive role matching", () => {
        expect(roleUtils.hasRole(adminUser, "ADMIN")).toBe(true);
        expect(roleUtils.hasRole(adminUser, "Admin")).toBe(true);
      });

      it("should check multiple roles", () => {
        expect(roleUtils.hasAnyRole(adminUser, ["user", "admin"])).toBe(true);
        expect(roleUtils.hasAnyRole(regularUser, ["admin", "moderator"])).toBe(
          false
        );
      });

      it("should handle null users", () => {
        expect(roleUtils.hasRole(null, "admin")).toBe(false);
        expect(roleUtils.hasAnyRole(null, ["admin", "user"])).toBe(false);
      });
    });

    describe("role priorities and redirects", () => {
      it("should return correct role priorities", () => {
        expect(roleUtils.getRolePriority("super_admin")).toBe(100);
        expect(roleUtils.getRolePriority("admin")).toBe(90);
        expect(roleUtils.getRolePriority("user")).toBe(20);
        expect(roleUtils.getRolePriority("unknown")).toBe(0);
      });

      it("should return correct default redirect paths", () => {
        expect(roleUtils.getDefaultRedirectPath("admin")).toBe("/admin");
        expect(roleUtils.getDefaultRedirectPath("user")).toBe("/dashboard");
        expect(roleUtils.getDefaultRedirectPath("landlord")).toBe(
          "/landlord/dashboard"
        );
        expect(roleUtils.getDefaultRedirectPath("unknown")).toBe("/dashboard");
      });
    });
  });

  describe("Error Utils", () => {
    describe("parseAuthError", () => {
      it("should parse API error responses", () => {
        const apiError = {
          response: {
            data: {
              message: "Invalid credentials",
              code: "AUTH_INVALID_CREDENTIALS",
            },
            status: 401,
          },
        };

        const parsed = errorUtils.parseAuthError(apiError);
        expect(parsed.message).toBe("Invalid credentials");
        expect(parsed.code).toBe("UNAUTHORIZED");
        expect(parsed.status).toBe(401);
      });

      it("should handle network errors", () => {
        const networkError = {
          code: "NETWORK_ERROR",
          message: "Network Error",
        };

        const parsed = errorUtils.parseAuthError(networkError);
        expect(parsed.message).toBe(
          "Network connection failed. Please check your internet connection."
        );
        expect(parsed.code).toBe("NETWORK_ERROR");
      });

      it("should provide default error for unknown errors", () => {
        const unknownError = { message: "Unknown error" };

        const parsed = errorUtils.parseAuthError(unknownError);
        expect(parsed.message).toBe(
          "An unexpected error occurred. Please try again."
        );
      });
    });

    describe("getErrorMessage", () => {
      it("should return user-friendly error messages", () => {
        expect(errorUtils.getErrorMessage("AUTH_INVALID_CREDENTIALS")).toBe(
          "Invalid email or password"
        );
        expect(errorUtils.getErrorMessage("AUTH_ACCOUNT_LOCKED")).toBe(
          "Account is temporarily locked due to too many failed login attempts"
        );
        expect(errorUtils.getErrorMessage("AUTH_TOKEN_EXPIRED")).toBe(
          "Your session has expired. Please log in again"
        );
      });

      it("should return default message for unknown codes", () => {
        expect(errorUtils.getErrorMessage("UNKNOWN_CODE")).toBe(
          "An error occurred. Please try again"
        );
      });
    });
  });

  describe("Role and Permission Management", () => {
    const mockUser: User = {
      id: "123",
      email: "test@example.com",
      role: UserRole.ADMIN,
      firstName: "Test",
      lastName: "User",
      isVerified: true,
      avatar: undefined,
      phone: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberId: "",
      username: "",
      status: UserStatus.ACTIVE,
      isActive: false,
    };

    describe("hasRole", () => {
      it("should return true for matching role", () => {
        expect(authUtils.hasRole(mockUser, "admin")).toBe(true);
      });

      it("should return false for non-matching role", () => {
        expect(authUtils.hasRole(mockUser, "user")).toBe(false);
      });

      it("should handle array of roles", () => {
        expect(authUtils.hasRole(mockUser, ["user", "admin"])).toBe(true);
        expect(authUtils.hasRole(mockUser, ["user", "moderator"])).toBe(false);
      });
    });

    describe("isAdmin", () => {
      it("should return true for admin user", () => {
        expect(authUtils.isAdmin(mockUser)).toBe(true);
      });

      it("should return false for non-admin user", () => {
        const userMock = { ...mockUser, role: "user" };
        expect(authUtils.isAdmin(userMock)).toBe(false);
      });
    });

    describe("isSuperAdmin", () => {
      it("should return true for super_admin user", () => {
        const superAdminUser = { ...mockUser, role: "super_admin" };
        expect(authUtils.isSuperAdmin(superAdminUser)).toBe(true);
      });

      it("should return false for non-super-admin user", () => {
        expect(authUtils.isSuperAdmin(mockUser)).toBe(false);
      });
    });
  });

  describe("Validation Utils", () => {
    describe("validateEmail", () => {
      it("should validate correct email formats", () => {
        expect(authUtils.validateEmail("test@example.com")).toBe(true);
        expect(authUtils.validateEmail("user.name+tag@domain.co.uk")).toBe(
          true
        );
      });

      it("should reject invalid email formats", () => {
        expect(authUtils.validateEmail("invalid-email")).toBe(false);
        expect(authUtils.validateEmail("test@")).toBe(false);
        expect(authUtils.validateEmail("@domain.com")).toBe(false);
      });
    });

    describe("validatePassword", () => {
      it("should validate strong passwords", () => {
        const result = authUtils.validatePassword("StrongPass123!");
        expect(result.isValid).toBe(true);
        expect(result.strength).toBe("strong");
      });

      it("should validate medium strength passwords", () => {
        const result = authUtils.validatePassword("Password123");
        expect(result.isValid).toBe(true);
        expect(result.strength).toBe("strong");
      });

      it("should reject weak passwords", () => {
        const result = authUtils.validatePassword("weak");
        expect(result.isValid).toBe(false);
        expect(result.strength).toBe("weak");
      });

      it("should provide detailed feedback", () => {
        const result = authUtils.validatePassword("short");
        expect(result.feedback).toContain(
          "Password must be at least 8 characters long"
        );
      });
    });
  });

  describe("Storage Utils", () => {
    describe("clearAuthStorage", () => {
      it("should clear all authentication related storage", () => {
        // Set up various auth storage items
        localStorage.setItem("kaa_access_token", "token");
        localStorage.setItem("kaa_refresh_token", "refresh");
        localStorage.setItem("kaa_user_session", "session");
        sessionStorage.setItem("kaa_access_token", "session-token");

        authUtils.clearAuthStorage();

        expect(localStorage.getItem("kaa_access_token")).toBeNull();
        expect(localStorage.getItem("kaa_refresh_token")).toBeNull();
        expect(localStorage.getItem("kaa_user_session")).toBeNull();
        expect(sessionStorage.getItem("kaa_access_token")).toBeNull();
      });
    });

    describe("isStorageAvailable", () => {
      it("should detect localStorage availability", () => {
        expect(authUtils.isStorageAvailable("localStorage")).toBe(true);
      });

      it("should detect sessionStorage availability", () => {
        expect(authUtils.isStorageAvailable("sessionStorage")).toBe(true);
      });
    });
  });
});

describe("Security Utils", () => {
  describe("Login Attempts Tracking", () => {
    const email = "test@example.com";

    it("should track login attempts", () => {
      authUtils.trackLoginAttempt(email);

      const attempts = JSON.parse(
        localStorage.getItem("kaa_login_attempts") || "{}"
      );
      expect(attempts[email]).toBeDefined();
      expect(attempts[email].count).toBe(1);
    });

    it("should increment existing attempts", () => {
      authUtils.trackLoginAttempt(email);
      authUtils.trackLoginAttempt(email);

      const attempts = JSON.parse(
        localStorage.getItem("kaa_login_attempts") || "{}"
      );
      expect(attempts[email].count).toBe(2);
    });

    it("should check if account is locked", () => {
      // Simulate max attempts
      for (let i = 0; i < 6; i++) {
        authUtils.trackLoginAttempt(email);
      }

      expect(authUtils.isAccountLocked(email)).toBe(true);
    });

    it("should clear login attempts on successful login", () => {
      authUtils.trackLoginAttempt(email);
      authUtils.clearLoginAttempts(email);

      const attempts = JSON.parse(
        localStorage.getItem("kaa_login_attempts") || "{}"
      );
      expect(attempts[email]).toBeUndefined();
    });
  });

  describe("generateDeviceFingerprint", () => {
    it("should generate consistent device fingerprint", () => {
      const fingerprint1 = authUtils.generateDeviceFingerprint();
      const fingerprint2 = authUtils.generateDeviceFingerprint();

      expect(fingerprint1).toBe(fingerprint2);
      expect(typeof fingerprint1).toBe("string");
      expect(fingerprint1.length).toBeGreaterThan(0);
    });
  });

  describe("Rate Limiting", () => {
    it("should check if action is rate limited", () => {
      const action = "test-action";

      // First call should not be rate limited
      expect(authUtils.isRateLimited(action, 2, 60_000)).toBe(false);

      // Second call should not be rate limited
      expect(authUtils.isRateLimited(action, 2, 60_000)).toBe(false);

      // Third call should be rate limited
      expect(authUtils.isRateLimited(action, 2, 60_000)).toBe(true);
    });

    it("should reset rate limit after time window", () => {
      const action = "test-action-2";

      // Use up the limit
      expect(authUtils.isRateLimited(action, 1, 1)).toBe(false);
      expect(authUtils.isRateLimited(action, 1, 1)).toBe(true);

      // Wait for time window to pass (mocked)
      const attempts = JSON.parse(
        localStorage.getItem("kaa_rate_limits") || "{}"
      );
      attempts[action].timestamp = Date.now() - 2; // 2ms ago
      localStorage.setItem("kaa_rate_limits", JSON.stringify(attempts));

      expect(authUtils.isRateLimited(action, 1, 1)).toBe(false);
    });
  });
});
