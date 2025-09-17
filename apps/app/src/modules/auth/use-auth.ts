"use client";

import { useEffect } from "react";
import { useRefreshToken } from "./auth.queries";
import { useAuthStore } from "./auth.store";
import { isTokenExpired } from "./auth.utils";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    isRefreshing,
    setUser,
    setTokens,
    setLoading,
    logout: storeLogout,
    getAccessToken,
    getRefreshToken,
  } = useAuthStore();

  const refreshTokenMutation = useRefreshToken();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();

      // Only attempt refresh if we have a refresh token and either:
      // 1. No access token, or
      // 2. Access token is expired
      // 3. And we don't have user data
      if (refreshToken && (!token || isTokenExpired(token)) && !user) {
        try {
          setLoading(true);
          await refreshTokenMutation.mutateAsync();
        } catch (error) {
          console.error("Failed to initialize auth:", error);
          storeLogout();
        } finally {
          setLoading(false);
        }
      } else if (token || refreshToken) {
        // Token exists and is valid, or we already have user data
        setLoading(false);
      } else {
        // No tokens at all, ensure we're logged out
        setLoading(false);
        storeLogout();
      }
    };

    initializeAuth();
  }, [
    getAccessToken,
    getRefreshToken,
    setLoading,
    storeLogout,
    user,
    refreshTokenMutation.mutateAsync,
  ]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isRefreshing,
    getAccessToken,
  };
};
