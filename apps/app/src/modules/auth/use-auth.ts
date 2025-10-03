"use client";

import { useEffect, useRef } from "react";
import { useRefreshToken } from "./auth.queries";
import { useAuthStore } from "./auth.store";
import { isTokenExpired } from "./auth.utils";

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

      try {
        const token = getAccessToken();
        const refreshToken = getRefreshToken();

        // No tokens at all - user is not authenticated
        if (!(token || refreshToken)) {
          setStatus("unauthenticated");
          initializedRef.current = true;
          return;
        }

        // Has valid access token and user data - already authenticated
        if (token && !isTokenExpired(token) && user) {
          setStatus("authenticated");
          initializedRef.current = true;
          return;
        }

        // Has refresh token but no valid access token - attempt refresh
        if (refreshToken && (!token || isTokenExpired(token))) {
          try {
            setStatus("refreshing");
            await refreshTokenMutation.mutateAsync();
            setStatus("authenticated");
          } catch (error) {
            console.error("Token refresh failed during initialization:", error);
            storeLogout();
            setStatus("unauthenticated");
          }
        } else {
          // Has tokens but they're invalid
          storeLogout();
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        storeLogout();
        setStatus("unauthenticated");
      } finally {
        initializingRef.current = false;
        initializedRef.current = true;
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
      const needsRefresh = isTokenExpired(token);

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
