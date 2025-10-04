import { config } from "@kaa/config";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authConfig } from "@/modules/auth/auth.config";
import {
  roleUtils,
  securityUtils,
  sessionUtils,
  storageUtils,
  tokenUtils,
} from "@/modules/auth/auth.utils";
import type { User } from "@/modules/users/user.type";

type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "refreshing";

type AuthState = {
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  isRefreshing: boolean;
  isAuthenticated: boolean;
  sessionId: string | null;
  lastActivity: number;
  tokens: {
    access_token: string | null;
    refresh_token: string | null;
  };

  // Redirect management
  returnUrl: string | null;
  redirectAttempts: number;
  maxRedirectAttempts: number;

  // Enhanced methods
  setUser: (user: User | null) => void;
  setTokens: (tokens: { access_token: string; refresh_token: string }) => void;
  setStatus: (status: AuthStatus) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  logout: () => void;
  updateAvatar: (avatarUrl: string) => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  clearTokens: () => void;

  // Redirect management methods
  setReturnUrl: (url: string | null) => void;
  getReturnUrl: () => string | null;
  clearReturnUrl: () => void;
  incrementRedirectAttempts: () => void;
  resetRedirectAttempts: () => void;
  canRedirect: () => boolean;

  // New enhanced methods
  updateActivity: () => void;
  isSessionExpired: () => boolean;
  needsTokenRefresh: () => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getUserRole: () => string | null;
  getDefaultRedirectPath: () => string;
  initializeSession: (
    user: User,
    tokens: { access_token: string; refresh_token: string }
  ) => void;
  trackLoginAttempt: (email: string, success: boolean) => void;
  isAccountLocked: (email: string) => boolean;
  getSecurityInfo: () => { failedAttempts: number; lockoutRemaining: number };

  // Safe redirect helper
  getSafeRedirectPath: (requestedPath?: string | null) => string;
};

// Allowed redirect paths to prevent open redirect vulnerabilities
const ALLOWED_REDIRECT_PATTERNS = [
  /^\/dashboard/,
  /^\/account/,
  /^\/admin/,
  /^\/properties/,
  /^\/applications/,
  /^\/messages/,
  /^\/bookings/,
  /^\/settings/,
  /^\/wallet/,
];

// Paths that don't require authentication
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/verify-phone",
  "/",
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "idle",
      isLoading: false,
      isRefreshing: false,
      isAuthenticated: false,
      sessionId: null,
      lastActivity: Date.now(),
      tokens: {
        access_token: null,
        refresh_token: null,
      },
      returnUrl: null,
      redirectAttempts: 0,
      maxRedirectAttempts: 3,

      // Status management
      setStatus: (status) => {
        const currentState = get();
        console.log("Auth Store: Status change", {
          from: currentState.status,
          to: status,
          hasUser: !!currentState.user,
          hasTokens: !!(
            currentState.tokens.access_token ||
            currentState.tokens.refresh_token
          ),
          timestamp: new Date().toISOString(),
        });

        set({
          status,
          isLoading: status === "loading",
          isRefreshing: status === "refreshing",
          isAuthenticated: status === "authenticated",
        });
      },

      // Enhanced user management
      setUser: (user) => {
        console.log("🔐 AuthStore: setUser called", {
          userId: user?.id,
          userRole: user?.role,
          hasUser: !!user,
        });

        const state = get();
        if (user && state.sessionId) {
          sessionUtils.cacheSession(user, state.sessionId);
        }
        set({
          user,
          status: user ? "authenticated" : "unauthenticated",
          isAuthenticated: !!user,
          lastActivity: Date.now(),
        });
      },

      // Enhanced token management
      setTokens: (tokens) => {
        console.log("🔐 AuthStore: setTokens called", {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
        });

        if (!tokenUtils.isValidTokenFormat(tokens.access_token)) {
          console.error("Invalid access token format");
          return;
        }

        set({
          tokens,
          status: "authenticated",
          isAuthenticated: !!tokens.access_token,
          lastActivity: Date.now(),
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),

      // Enhanced logout with cleanup
      logout: () => {
        const state = get();
        console.log("Auth Store: Logout called", {
          currentStatus: state.status,
          hasUser: !!state.user,
          hasTokens: !!(
            state.tokens.access_token || state.tokens.refresh_token
          ),
          sessionId: state.sessionId,
          timestamp: new Date().toISOString(),
        });

        // Clear session cache
        if (state.sessionId) {
          sessionUtils.clearSessionCache();
        }

        // Clear storage
        storageUtils.clearAll();

        // Clear return URL
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("returnUrl");
        }

        set({
          user: null,
          status: "unauthenticated",
          isAuthenticated: false,
          sessionId: null,
          lastActivity: Date.now(),
          tokens: {
            access_token: null,
            refresh_token: null,
          },
          returnUrl: null,
          redirectAttempts: 0,
        });
      },

      updateAvatar: (avatarUrl) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, avatar: avatarUrl };
          set({
            user: updatedUser,
            lastActivity: Date.now(),
          });

          const sessionId = get().sessionId;
          if (sessionId) {
            sessionUtils.cacheSession(updatedUser, sessionId);
          }
        }
      },

      getAccessToken: () => get().tokens.access_token,
      getRefreshToken: () => get().tokens.refresh_token,
      clearTokens: () =>
        set({
          tokens: {
            access_token: null,
            refresh_token: null,
          },
        }),

      // Redirect management
      setReturnUrl: (url) => {
        // Validate URL before setting
        if (url && !isValidRedirectUrl(url)) {
          console.warn("Invalid redirect URL attempted:", url);
          return;
        }
        set({ returnUrl: url });
        if (typeof window !== "undefined" && url) {
          sessionStorage.setItem("returnUrl", url);
        }
      },

      getReturnUrl: () => {
        const stateUrl = get().returnUrl;
        if (stateUrl) return stateUrl;

        if (typeof window !== "undefined") {
          const sessionUrl = sessionStorage.getItem("returnUrl");
          if (sessionUrl && isValidRedirectUrl(sessionUrl)) {
            return sessionUrl;
          }
        }
        return null;
      },

      clearReturnUrl: () => {
        set({ returnUrl: null, redirectAttempts: 0 });
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("returnUrl");
        }
      },

      incrementRedirectAttempts: () => {
        set({ redirectAttempts: get().redirectAttempts + 1 });
      },

      resetRedirectAttempts: () => {
        set({ redirectAttempts: 0 });
      },

      canRedirect: () => get().redirectAttempts < get().maxRedirectAttempts,

      // NEW ENHANCED METHODS

      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      isSessionExpired: () => {
        const state = get();
        return sessionUtils.isSessionExpired(state.lastActivity);
      },

      needsTokenRefresh: () => {
        const token = get().tokens.access_token;
        if (!token) return true;
        return tokenUtils.needsRefresh(token);
      },

      hasRole: (role: string) => {
        const user = get().user;
        return roleUtils.hasRole(user, role);
      },

      hasAnyRole: (roles: string[]) => {
        const user = get().user;
        return roleUtils.hasAnyRole(user, roles);
      },

      getUserRole: () => {
        const user = get().user;
        return typeof user?.role === "string"
          ? user.role
          : user?.role._id || null;
      },

      getDefaultRedirectPath: () => {
        const user = get().user;
        if (!user?.role) {
          return "/dashboard";
        }
        return roleUtils.getDefaultRedirectPath(
          typeof user.role === "string" ? user.role : user.role._id
        );
      },

      initializeSession: (
        user: User,
        tokens: { access_token: string; refresh_token: string }
      ) => {
        const sessionId = sessionUtils.generateSessionId();

        sessionUtils.cacheSession(user, sessionId);

        if (authConfig.tokenStorage !== "httpOnly") {
          storageUtils.setItem("session_id", sessionId, 24);
          storageUtils.setItem("user_data", user, 24);
        }

        set({
          user,
          tokens,
          sessionId,
          status: "authenticated",
          isAuthenticated: true,
          lastActivity: Date.now(),
        });
      },

      trackLoginAttempt: (email: string, success: boolean) => {
        const userAgent =
          typeof window !== "undefined" ? navigator.userAgent : "";
        securityUtils.trackLoginAttempt(email, success, undefined, userAgent);

        if (success) {
          securityUtils.clearLoginAttempts(email);
        }
      },

      isAccountLocked: (email: string) => securityUtils.isAccountLocked(email),

      getSecurityInfo: () => {
        const user = get().user;
        if (!user?.email) {
          return { failedAttempts: 0, lockoutRemaining: 0 };
        }

        return {
          failedAttempts: securityUtils.getFailedAttemptsCount(user.email),
          lockoutRemaining: securityUtils.getLockoutTimeRemaining(user.email),
        };
      },

      // Safe redirect helper
      getSafeRedirectPath: (requestedPath?: string | null) => {
        const user = get().user;

        // If no requested path, use default for user role
        if (!requestedPath) {
          return get().getDefaultRedirectPath();
        }

        // Validate the requested path
        if (!isValidRedirectUrl(requestedPath)) {
          console.warn("Invalid redirect path, using default:", requestedPath);
          return get().getDefaultRedirectPath();
        }

        // If user is authenticated, allow valid internal paths
        if (user) {
          return requestedPath;
        }

        // For unauthenticated users, only allow public paths
        if (PUBLIC_PATHS.includes(requestedPath)) {
          return requestedPath;
        }

        return "/";
      },
    }),
    {
      name: `${config.slug}-auth-store`,
      partialize: (state) => ({
        user: state.user,
        status: state.status,
        isAuthenticated: state.isAuthenticated,
        tokens: state.tokens,
        sessionId: state.sessionId,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper function to validate redirect URLs
function isValidRedirectUrl(url: string): boolean {
  if (!url) return false;

  try {
    // Must be a relative URL (starts with /)
    if (!url.startsWith("/")) {
      return false;
    }

    // Prevent protocol-relative URLs
    if (url.startsWith("//")) {
      return false;
    }

    // Must match allowed patterns
    const isAllowed =
      ALLOWED_REDIRECT_PATTERNS.some((pattern) => pattern.test(url)) ||
      PUBLIC_PATHS.includes(url);

    return isAllowed;
  } catch {
    return false;
  }
}

// Export helper for external use
export const isPublicPath = (path: string): boolean =>
  PUBLIC_PATHS.includes(path);

export const isProtectedPath = (path: string): boolean =>
  ALLOWED_REDIRECT_PATTERNS.some((pattern) => pattern.test(path));
