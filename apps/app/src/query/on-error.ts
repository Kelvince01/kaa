"use client";

import { CancelledError } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toaster } from "@/components/common/toaster";
import { flushStoresAndCache } from "@/modules/auth/components/sign-out";
import { useAlertStore } from "@/shared/stores/alert.store";
import { ApiError } from "@/shared/utils/api.util";

/**
 * Fallback messages for common 400 errors
 */
const fallbackMessages = {
  400: "Bad request",
  401: "Unauthorized access",
  403: "Access forbidden",
  404: "Resource not found",
  429: "Too many requests",
};

const getErrorMessage = (
  error: ApiError,
  t?: (key: string, params?: any) => string
) => {
  const statusCode = Number(error.status);

  // Try resource-specific error translation if entityType and type are present and translations available

  if (t && error.entityType && error.type) {
    try {
      const resourceKey = `errors.resource_${error.type}`;
      const resourceTranslation = t(resourceKey, {
        resource: t(error.entityType),
      });
      // If translation exists and is not the key itself, return it
      if (resourceTranslation !== resourceKey) {
        return resourceTranslation;
      }
    } catch {
      // Translation failed, continue to fallbacks
    }
  }

  // Try generic error type translation

  if (t && error.type) {
    try {
      const typeKey = `errors.${error.type}`;
      const typeTranslation = t(typeKey);
      if (typeTranslation !== typeKey) {
        return typeTranslation;
      }
    } catch {
      // Translation failed, continue to fallbacks
    }
  }

  // Fallback to error message if present
  if (error.message) return error.message;

  // Fallback to status code message or default
  return (
    fallbackMessages[statusCode as keyof typeof fallbackMessages] ||
    "Unknown error occurred"
  );
};

/**
 * Global error handler for API requests.
 * Handles network errors, API errors, and redirects to the sign-in page if the user is not authenticated.
 * @param error - The error object.
 */
export const onError = (error: Error | ApiError) => {
  const router = useRouter();

  // Safely try to get translations, fallback if context not available
  let t: ((key: string, params?: any) => string) | undefined;
  try {
    // biome-ignore lint/correctness/useHookAtTopLevel: false positive
    t = useTranslations();
  } catch {
    // Translation context not available, will use fallbacks
    t = undefined;
  }

  // Ignore cancellation error
  if (error instanceof CancelledError) {
    return console.debug("Ignoring CancelledError");
  }

  // Handle network error (e.g., connection refused)
  if (error instanceof Error && error.message === "Failed to fetch") {
    const networkErrorMsg = t
      ? t("errors.network_error")
      : "Network connection failed";
    toaster(networkErrorMsg, "error");
  }

  if (error instanceof ApiError) {
    const statusCode = Number(error.status);
    const isSilentSessionAttempt =
      error.path && ["/me", "/me/menu"].includes(error.path);

    // Maintenance mode
    if ([503, 502].includes(statusCode))
      useAlertStore.getState().setDownAlert("maintenance");
    // Authentication service is unavailable
    else if (statusCode === 500 && isSilentSessionAttempt)
      return useAlertStore.getState().setDownAlert("auth_unavailable");
    // Offline mode
    else if (statusCode === 504)
      return useAlertStore.getState().setDownAlert("offline");

    // Hide error if casually trying /me or /me/menu. It should fail silently if no valid session.
    if (isSilentSessionAttempt && statusCode === 401) return;

    // Get error message with optional translations
    const errorMessage = getErrorMessage(error, t);

    // Show toast
    const toastType =
      error.severity === "error"
        ? "error"
        : error.severity === "warn"
          ? "warning"
          : "info";
    toaster(errorMessage || error.message, toastType);

    // Redirect to sign-in page if the user is not authenticated (unless already on /auth/*)
    if (statusCode === 401 && !location.pathname.startsWith("/auth/")) {
      const redirectOptions: { to: string; search?: { redirect: string } } = {
        to: "/auth/login",
      };

      // Save the current path as a redirect
      if (location.pathname?.length > 2) {
        redirectOptions.search = { redirect: location.pathname };
      }

      flushStoresAndCache();
      router.push(redirectOptions.to);
    }
  }
};
