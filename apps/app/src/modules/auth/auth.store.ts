import { config } from "@kaa/config";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authConfig } from "@/modules/auth/auth.config";
import {
  //   errorUtils,
  //   isTokenExpired,
  roleUtils,
  securityUtils,
  sessionUtils,
  storageUtils,
  tokenUtils,
} from "@/modules/auth/auth.utils";
import type { User } from "@/modules/users/user.type";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  sessionId: string | null;
  lastActivity: number;
  tokens: {
    access_token: string | null;
    refresh_token: string | null;
  };

  // Enhanced methods
  setUser: (user: User | null) => void;
  setTokens: (tokens: { access_token: string; refresh_token: string }) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  logout: () => void;
  updateAvatar: (avatarUrl: string) => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  clearTokens: () => void;

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
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isRefreshing: false,
      sessionId: null,
      lastActivity: Date.now(),
      tokens: {
        access_token: null,
        refresh_token: null,
      },

      // Enhanced user management
      setUser: (user) => {
        const state = get();
        if (user && state.sessionId) {
          // Cache the session for performance
          sessionUtils.cacheSession(user, state.sessionId);
        }
        set({
          user,
          isAuthenticated: !!user,
          lastActivity: Date.now(),
        });
      },

      // Enhanced token management
      setTokens: (tokens) => {
        // Validate token format
        if (!tokenUtils.isValidTokenFormat(tokens.access_token)) {
          console.error("Invalid access token format");
          return;
        }

        set({
          tokens,
          isAuthenticated: !!tokens.access_token,
          lastActivity: Date.now(),
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),

      // Enhanced logout with cleanup
      logout: () => {
        const state = get();

        // Clear session cache
        if (state.sessionId) {
          sessionUtils.clearSessionCache();
        }

        // Clear storage
        storageUtils.clearAll();

        set({
          user: null,
          isAuthenticated: false,
          sessionId: null,
          lastActivity: Date.now(),
          tokens: {
            access_token: null,
            refresh_token: null,
          },
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

          // Update cached session
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

      // NEW ENHANCED METHODS

      // Update last activity timestamp
      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      // Check if session is expired
      isSessionExpired: () => {
        const state = get();
        return sessionUtils.isSessionExpired(state.lastActivity);
      },

      // Check if token needs refresh
      needsTokenRefresh: () => {
        const token = get().tokens.access_token;
        if (!token) {
          return true;
        }
        return tokenUtils.needsRefresh(token);
      },

      // Role checking methods
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

      // Initialize session with security features
      initializeSession: (
        user: User,
        tokens: { access_token: string; refresh_token: string }
      ) => {
        const sessionId = sessionUtils.generateSessionId();

        // Cache session for performance
        sessionUtils.cacheSession(user, sessionId);

        // Store in secure storage if configured
        if (authConfig.tokenStorage !== "httpOnly") {
          storageUtils.setItem("session_id", sessionId, 24);
          storageUtils.setItem("user_data", user, 24);
        }

        set({
          user,
          tokens,
          sessionId,
          isAuthenticated: true,
          lastActivity: Date.now(),
        });
      },

      // Security: Track login attempts
      trackLoginAttempt: (email: string, success: boolean) => {
        const userAgent =
          typeof window !== "undefined" ? navigator.userAgent : "";
        securityUtils.trackLoginAttempt(email, success, undefined, userAgent);

        if (success) {
          // Clear failed attempts on successful login
          securityUtils.clearLoginAttempts(email);
        }
      },

      // Security: Check if account is locked
      isAccountLocked: (email: string) => securityUtils.isAccountLocked(email),

      // Security: Get security information
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
    }),
    {
      name: `${config.slug}-auth-store`,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tokens: state.tokens,
      }),
      storage: createJSONStorage(() => localStorage),
      // Add onRehydrateStorage to validate token on page load
      // onRehydrateStorage: () => async (state) => {
      // 	// Check if token is valid when hydrating from storage
      // 	if (state?.tokens?.access_token && !isTokenExpired(state.tokens.access_token)) {
      // 		// If token invalid, reset the auth state
      // 		await state.logout();
      // 	} else if (state?.tokens?.access_token) {
      // 		// If token valid, set up API client
      // 		state.setTokens(state.tokens as { access_token: string; refresh_token: string });
      // 	}
      // },
    }
  )
);
