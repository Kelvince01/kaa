"use client";

import { useEffect, useRef } from "react";
import { useRefreshToken } from "./auth.queries";
import { useAuthStore } from "./auth.store";
import { isTokenExpired, tokenUtils } from "./auth.utils";

export const useAuth = () => {
  const {
    user,
    status,
    isAuthenticated,
    isLoading,
    isRefreshing,
    setStatus,
    logout: storeLogout,
    getAccessToken,
    getRefreshToken,
  } = useAuthStore();

  const refreshTokenMutation = useRefreshToken();
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  // Initialize auth state on mount
  useEffect(() => {
    // Prevent multiple initializations
    if (initializingRef.current || initializedRef.current) {
      return;
    }

    const initializeAuth = async () => {
      initializingRef.current = true;
      console.log("Auth Hook: Starting initialization", {
        hasUser: !!user,
        timestamp: new Date().toISOString(),
      });

      try {
        const token = getAccessToken();
        const refreshToken = getRefreshToken();

        console.log("Auth Hook: Token check", {
          hasAccessToken: !!token,
          hasRefreshToken: !!refreshToken,
          tokenExpired: token ? isTokenExpired(token) : "N/A",
        });

        // No tokens at all - user is not authenticated
        if (!(token || refreshToken)) {
          console.log("Auth Hook: No tokens found, setting unauthenticated");
          setStatus("unauthenticated");
          initializedRef.current = true;
          return;
        }

        // Has valid access token and user data - already authenticated
        if (token && !isTokenExpired(token) && user) {
          console.log(
            "Auth Hook: Valid token and user found, setting authenticated"
          );
          setStatus("authenticated");
          initializedRef.current = true;
          return;
        }

        // Only attempt refresh if we have a refresh token and either:
        // 1. No access token, or
        // 2. Access token is expired
        // 3. And we don't have user data
        if (refreshToken && (!token || isTokenExpired(token))) {
          console.log("Auth Hook: Attempting token refresh");
          try {
            setStatus("refreshing");
            await refreshTokenMutation.mutateAsync();
            console.log("Auth Hook: Token refresh successful");
            setStatus("authenticated");
          } catch (error) {
            console.error(
              "Auth Hook: Failed to initialize auth with refresh:",
              error
            );
            storeLogout();
            setStatus("unauthenticated");
          }
        } else {
          // No tokens at all, ensure we're logged out
          console.log("Auth Hook: No valid refresh conditions, logging out");
          storeLogout();
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("Auth Hook: Failed to initialize auth:", error);
        storeLogout();
        setStatus("unauthenticated");
      } finally {
        initializingRef.current = false;
        initializedRef.current = true;
        console.log("Auth Hook: Initialization complete");
      }
    };

    initializeAuth();
  }, [
    storeLogout,
    setStatus,
    getAccessToken,
    getRefreshToken,
    user,
    refreshTokenMutation.mutateAsync,
  ]); // Run only once on mount

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!isAuthenticated || status !== "authenticated") {
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    // Check if token needs refresh every minute
    const checkInterval = setInterval(() => {
      const needsRefresh = tokenUtils.needsRefresh(token);

      if (needsRefresh && !isRefreshing) {
        refreshTokenMutation.mutateAsync().catch((error) => {
          console.error("Auto token refresh failed:", error);
          storeLogout();
        });
      }
    }, 60_000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [
    isAuthenticated,
    status,
    getAccessToken,
    isRefreshing,
    refreshTokenMutation.mutateAsync,
    storeLogout,
  ]);

  return {
    user,
    status,
    isAuthenticated,
    isLoading: status === "loading" || status === "idle",
    isRefreshing,
    isInitialized: initializedRef.current,
    getAccessToken,
  };
};
