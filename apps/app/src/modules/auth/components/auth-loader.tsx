"use client";

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand";
import { useRefreshToken } from "../auth.queries";
import { useAuthStore } from "../auth.store";
import { useAuth } from "../use-auth";

type AuthLoaderProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  minLoadingTime?: number;
  maxRetries?: number;
  onError?: (error: Error) => void;
};

/**
 * Enhanced AuthLoader with error handling and retry logic
 */
function AuthLoaderWithError({
  children,
  fallback,
  errorFallback,
  minLoadingTime = 500,
  maxRetries = 3,
  onError,
}: AuthLoaderProps) {
  const { status, isInitialized } = useAuth();
  const { logout } = useAuthStore();
  const refreshTokenMutation = useRefreshToken();

  const [isMinTimeMet, setIsMinTimeMet] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Ensure minimum loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinTimeMet(true);
    }, minLoadingTime);

    return () => clearTimeout(timer);
  }, [minLoadingTime]);

  // Handle retry logic
  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      setError(new Error("Maximum retry attempts reached"));
      return;
    }

    try {
      setError(null);
      setRetryCount((prev) => prev + 1);
      await refreshTokenMutation.mutateAsync();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      onError?.(error);
    }
  };

  // Show error state
  if (error && isMinTimeMet) {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }

    return (
      <ErrorFallback
        error={error}
        maxRetries={maxRetries}
        onLogout={logout}
        onRetry={handleRetry}
        retryCount={retryCount}
      />
    );
  }

  // Show loading state
  const isLoading =
    !isInitialized ||
    status === "idle" ||
    status === "loading" ||
    status === "refreshing" ||
    !isMinTimeMet;

  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <LoadingFallback status={status} />;
  }

  // Render children when ready
  return <>{children}</>;
}

/**
 * Loading fallback with status information
 */
function LoadingFallback({ status }: { status: string }) {
  const getMessage = () => {
    switch (status) {
      case "idle":
        return "Initializing...";
      case "loading":
        return "Checking authentication...";
      case "refreshing":
        return "Refreshing session...";
      default:
        return "Loading...";
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="font-semibold text-gray-900 text-xl">
            {getMessage()}
          </h2>
          <p className="mt-2 text-gray-600 text-sm">Please wait a moment</p>
        </div>

        <div className="w-64">
          <div className="h-1 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full animate-progress rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error fallback with retry options
 */
function ErrorFallback({
  error,
  onRetry,
  onLogout,
  retryCount,
  maxRetries,
}: {
  error: Error;
  onRetry: () => void;
  onLogout: () => void;
  retryCount: number;
  maxRetries: number;
}) {
  const canRetry = retryCount < maxRetries;

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          {/* Error Icon */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>

          {/* Error Message */}
          <h2 className="mb-2 font-bold text-gray-900 text-xl">
            Authentication Error
          </h2>
          <p className="mb-6 text-gray-600 text-sm">
            {error.message || "Failed to initialize authentication"}
          </p>

          {/* Retry Info */}
          {retryCount > 0 && (
            <p className="mb-4 text-gray-500 text-xs">
              Attempt {retryCount} of {maxRetries}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-3">
            {canRetry && (
              <button
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary/90"
                onClick={onRetry}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            )}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              onClick={onLogout}
              type="button"
            >
              Sign Out
            </button>

            <button
              className="text-gray-600 text-sm hover:text-gray-900"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload Page
            </button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-gray-500 text-xs">
            If the problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLoaderWithError;

/**
 * Simple AuthLoader wrapper for basic use cases
 */
export function SimpleAuthLoader({ children }: { children: React.ReactNode }) {
  return (
    <AuthLoaderWithError minLoadingTime={300}>{children}</AuthLoaderWithError>
  );
}

const CustomFallback = ({
  brandName,
  logo,
}: {
  brandName: string;
  logo: React.ReactNode;
}) => (
  <div className="flex h-screen w-screen items-center justify-center bg-white">
    <div className="flex flex-col items-center space-y-6">
      {logo || (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <span className="font-bold text-2xl text-white">KR</span>
        </div>
      )}
      <h1 className="font-bold text-2xl text-gray-900">{brandName}</h1>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  </div>
);

/**
 * AuthLoader with custom branding
 */
export function BrandedAuthLoader({
  children,
  brandName = "Kenyan Rental Platform",
  logo,
}: {
  children: React.ReactNode;
  brandName?: string;
  logo?: React.ReactNode;
}) {
  return (
    <AuthLoaderWithError
      fallback={<CustomFallback brandName={brandName} logo={logo} />}
      minLoadingTime={500}
      onError={(_error) => {
        // Log to error tracking service
        // errorTracker.capture(error, {
        //   context: "auth_initialization",
        //   timestamp: new Date(),
        // });

        // Show toast notification
        toast.error("Failed to initialize authentication");

        // Analytics event
        // analytics.track("auth_init_error", {
        //   error: error.message,
        // });
      }}
    >
      {children}
    </AuthLoaderWithError>
  );
}

export function AppLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="text-center text-white">
        <Loader2 className="mx-auto h-12 w-12 animate-spin" />
        <h2 className="mt-4 font-bold text-2xl">Loading Your Workspace</h2>
        <p className="mt-2 text-sm opacity-90">
          This will only take a moment...
        </p>
      </div>
    </div>
  );
}

export function AnimatedLogoLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="relative">
        {/* Pulsing circles */}
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
        <div className="animation-delay-150 absolute inset-2 animate-ping rounded-full bg-primary/20" />

        {/* Logo */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary shadow-2xl">
          <Logo className="h-12 w-12 text-white" />
        </div>
      </div>
    </div>
  );
}

export function ProgressBarLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h2 className="mb-4 font-semibold text-xl">Loading Application</h2>

      <div className="w-80">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-gray-600 text-sm">{progress}%</p>
      </div>
    </div>
  );
}
