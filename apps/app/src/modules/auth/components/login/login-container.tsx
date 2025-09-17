"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useAuth } from "../../use-auth";
import LoginForm from "./login-form";

/**
 * Login page component
 */
const LoginContainer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const resetSuccess = searchParams.get("resetSuccess");

  // Get redirect URL from storage or query parameters, fallback to home
  const redirectTo =
    sessionStorage.getItem("returnUrl") ||
    searchParams.get("redirectTo") ||
    "/";

  // Redirect to home if already logged in
  React.useEffect(() => {
    if (!isLoading && user) {
      // Clear stored return URL after successful login
      const returnUrl = sessionStorage.getItem("returnUrl");
      sessionStorage.removeItem("returnUrl");
      router.push(returnUrl || redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center py-4 sm:px-6 lg:px-8">
        <div className="animate-pulse text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary-300" />
          <h3 className="mt-4 font-medium text-gray-900 text-lg">Loading...</h3>
        </div>
      </div>
    );
  }

  // Show login form if not logged in
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col justify-center py-4 sm:px-6 lg:px-8">
        <LoginForm redirectTo={redirectTo} />
      </div>
    );
  }

  // This should not be rendered due to the redirect effect
  if (resetSuccess) {
    return (
      <div className="flex min-h-screen flex-col justify-center py-4 sm:px-6 lg:px-8">
        {/* Clear any stored return URL when showing reset success */}
        {sessionStorage.removeItem("returnUrl") as any}
        <Alert className="border border-green-200 bg-green-50">
          <AlertDescription>
            Your password has been reset successfully. You can now log in with
            your new password.
          </AlertDescription>
        </Alert>
        <LoginForm redirectTo={redirectTo} />
      </div>
    );
  }

  return null;
};

export default LoginContainer;
