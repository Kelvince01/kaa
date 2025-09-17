"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { getRoleRedirect } from "../../auth.queries";
import { useAuth } from "../../use-auth";
import RegisterForm from "./register-form";

/**
 * Registration page component
 */
const RegisterContainer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  // Get redirect URL from query parameters or default to home
  const redirectTo = searchParams.get("redirectTo") || "/";

  // Redirect to home if already logged in
  React.useEffect(() => {
    if (!isLoading && user) {
      getRoleRedirect(user.role as string);
    }
  }, [user, isLoading]);

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

  // Show registration form if not logged in
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col justify-center py-4 sm:px-6 lg:px-8">
        <RegisterForm redirectTo={redirectTo} />
      </div>
    );
  }

  // This should not be rendered due to the redirect effect
  return null;
};

export default RegisterContainer;
