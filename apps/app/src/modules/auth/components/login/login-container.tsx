"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../use-auth";
import LoginForm from "./login-form";

/**
 * Login page component with proper redirect handling
 */
const LoginContainer = () => {
  const searchParams = useSearchParams();
  const { user, status, isInitialized } = useAuth();
  const resetSuccess = searchParams.get("resetSuccess");
  const verified = searchParams.get("verified");

  // Show loading state while checking authentication
  if (!isInitialized || status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="mt-4 font-medium text-gray-900 text-lg">
            Checking authentication...
          </h3>
        </div>
      </div>
    );
  }

  // If authenticated, GuestGuard will handle the redirect
  // Just show a loading state here
  if (status === "authenticated" && user) {
    return (
      <div className="flex min-h-screen items-center justify-center py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="mt-4 font-medium text-gray-900 text-lg">
            Redirecting...
          </h3>
        </div>
      </div>
    );
  }

  // User is not authenticated - show login form
  return (
    <div className="flex min-h-screen flex-col justify-center py-4 sm:px-6 lg:px-8">
      <div className="space-y-4 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Success messages */}
        {resetSuccess && (
          <Alert className="border border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Your password has been reset successfully. You can now log in with
              your new password.
            </AlertDescription>
          </Alert>
        )}

        {verified && (
          <Alert className="border border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Your email has been verified successfully. You can now log in.
            </AlertDescription>
          </Alert>
        )}

        <LoginForm />
      </div>
    </div>
  );
};

export default LoginContainer;
