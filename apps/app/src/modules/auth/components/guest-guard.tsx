"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuthStore } from "../auth.store";
import { useAuth } from "../use-auth";

type GuestGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function GuestGuard({ children, fallback }: GuestGuardProps) {
  const { user, status, isInitialized } = useAuth();
  const {
    getReturnUrl,
    clearReturnUrl,
    getSafeRedirectPath,
    canRedirect,
    incrementRedirectAttempts,
    resetRedirectAttempts,
  } = useAuthStore();

  const router = useRouter();
  const redirectingRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    // Don't do anything until auth is initialized
    if (!isInitialized || redirectingRef.current) {
      return;
    }

    // Prevent redirect loops
    if (!canRedirect()) {
      console.error("Maximum redirect attempts exceeded in GuestGuard");
      resetRedirectAttempts();
      return;
    }

    // If user is authenticated, redirect them away from guest pages
    if (status === "authenticated" && user) {
      redirectingRef.current = true;
      incrementRedirectAttempts();

      // Check if there's a return URL
      const returnUrl = getReturnUrl();

      if (returnUrl) {
        // Validate and use the return URL
        const safePath = getSafeRedirectPath(returnUrl);
        clearReturnUrl();
        router.push(safePath);
      } else {
        // No return URL, use default path for user's role
        const userRole =
          typeof user.role === "string" ? user.role : user.role._id;
        const defaultPath = getDefaultRedirectPath(userRole);
        router.push(defaultPath);
      }
    } else if (status === "unauthenticated") {
      // User is unauthenticated, reset redirect attempts
      resetRedirectAttempts();
    }
  }, [
    status,
    user,
    isInitialized,
    router,
    getReturnUrl,
    clearReturnUrl,
    getSafeRedirectPath,
    canRedirect,
    incrementRedirectAttempts,
    resetRedirectAttempts,
  ]);

  // Show loading state while checking auth
  if (
    !isInitialized ||
    status === "idle" ||
    status === "loading" ||
    status === "refreshing"
  ) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't show guest content (redirect will happen)
  if (status === "authenticated") {
    return null;
  }

  // User is not authenticated - show guest content
  return <>{children}</>;

  function getDefaultRedirectPath(role: string): string {
    const redirects: Record<string, string> = {
      admin: "/admin",
      super_admin: "/admin",
      property_manager: "/dashboard",
      manager: "/dashboard",
      landlord: "/dashboard",
      owner: "/dashboard",
      maintenance: "/dashboard",
      tenant: "/account",
    };

    return redirects[role.toLowerCase()] || "/dashboard";
  }
}
