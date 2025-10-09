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

      try {
        const token = getAccessToken();
        const refreshToken = getRefreshToken();

        console.log("🔐 Auth initialization:", {
          hasToken: !!token,
          hasRefreshToken: !!refreshToken,
          hasUser: !!user,
          tokenExpired: token ? isTokenExpired(token) : "N/A",
          userId: user?.id,
        });

        // No tokens at all - user is not authenticated
        if (!(token || refreshToken)) {
          console.log("🔐 No tokens found - setting unauthenticated");
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

        // Special case: If we have a valid token but no user data yet,
        // this might be during login redirect - wait a bit for user data to sync
        if (token && !isTokenExpired(token) && !user) {
          console.log(
            "Auth Hook: Valid token found but no user data - waiting for sync"
          );

          // Wait up to 500ms for user data to be available (from Zustand persistence)
          let attempts = 0;
          const checkUserData = () => {
            attempts++;
            const currentUser = useAuthStore.getState().user;

            if (currentUser) {
              console.log("Auth Hook: User data synced, setting authenticated");
              setStatus("authenticated");
              initializedRef.current = true;
              return;
            }

            if (attempts < 5) {
              setTimeout(checkUserData, 100);
            } else {
              console.log(
                "Auth Hook: User data not synced after waiting, attempting refresh"
              );
              // If user data still not available, try refresh
              if (refreshToken) {
                refreshTokenMutation
                  .mutateAsync()
                  .then(() => {
                    setStatus("authenticated");
                    initializedRef.current = true;
                  })
                  .catch(() => {
                    storeLogout();
                    setStatus("unauthenticated");
                    initializedRef.current = true;
                  });
              } else {
                storeLogout();
                setStatus("unauthenticated");
                initializedRef.current = true;
              }
            }
          };

          setTimeout(checkUserData, 100);
          return;
        }

        // Only attempt refresh if we have a refresh token and either:
        // 1. No access token, or
        // 2. Access token is expired
        // 3. And we don't have user data
        if (refreshToken && (!token || isTokenExpired(token))) {
          console.log("🔐 Attempting token refresh");
          try {
            setStatus("refreshing");
            await refreshTokenMutation.mutateAsync();
            setStatus("authenticated");
            console.log("🔐 Token refresh successful");
          } catch (error) {
            console.error("🔐 Failed to refresh token:", error);
            storeLogout();
            setStatus("unauthenticated");
          }
        } else {
          // No valid tokens, ensure we're logged out
          console.log("🔐 No valid tokens - logging out");
          storeLogout();
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("🔐 Failed to initialize auth:", error);
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
      // Skip auto-refresh if we're still initializing or if auth state is inconsistent
      if (!initializedRef.current || initializingRef.current) {
        return;
      }

      const needsRefresh = tokenUtils.needsRefresh(token);

      if (needsRefresh && !isRefreshing) {
        console.log("Auth Hook: Auto-refreshing token");
        refreshTokenMutation.mutateAsync().catch((error) => {
          console.error("Auth Hook: Auto token refresh failed:", error);
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
    logout: storeLogout,
  };
};
