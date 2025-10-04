"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuthStore } from "../auth.store";
import { useAuth } from "../use-auth";

type AuthGuardProps = {
  children: React.ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
};

export function AuthGuard({
  children,
  requiredRole,
  redirectTo = "/auth/login",
  fallback,
}: AuthGuardProps) {
  const { user, status, isInitialized } = useAuth();
  const {
    setReturnUrl,
    clearReturnUrl,
    canRedirect,
    incrementRedirectAttempts,
    resetRedirectAttempts,
    getSafeRedirectPath,
    getDefaultRedirectPath,
  } = useAuthStore();

  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Don't do anything until auth is initialized
    if (!isInitialized || redirectingRef.current || hasCheckedRef.current) {
      console.log("🔒 AuthGuard: Skipping check", {
        isInitialized,
        redirecting: redirectingRef.current,
        hasChecked: hasCheckedRef.current,
        pathname,
        status,
        requiredRole,
      });
      return;
    }

    const handleAuthCheck = () => {
      console.log("🔒 AuthGuard: Checking auth", {
        pathname,
        status,
        userRole: user?.role,
        requiredRole,
        userId: user?.id,
      });

      // Prevent redirect loops
      if (!canRedirect()) {
        console.error(
          "Maximum redirect attempts exceeded. Possible redirect loop detected."
        );
        resetRedirectAttempts();
        return;
      }

      // User is not authenticated
      if (status === "unauthenticated") {
        console.log(
          "🔒 AuthGuard: User not authenticated, redirecting to login"
        );
        // Only set return URL if it's not an auth page
        if (!pathname.startsWith("/auth")) {
          setReturnUrl(pathname);
        }

        redirectingRef.current = true;
        incrementRedirectAttempts();
        router.push(redirectTo);
        return;
      }

      // User is authenticated
      if (status === "authenticated" && user) {
        // Check role requirements
        if (requiredRole) {
          const roles = Array.isArray(requiredRole)
            ? requiredRole
            : [requiredRole];
          const userRole =
            typeof user.role === "string" ? user.role : user.role._id;

          console.log("🔒 AuthGuard: Checking role requirements", {
            requiredRoles: roles,
            userRole,
            userRoleType: typeof user.role,
          });

          if (!roles.includes(userRole)) {
            // User doesn't have required role - redirect to their default page
            const defaultPath = getDefaultRedirectPath();

            console.log("🔒 AuthGuard: User doesn't have required role", {
              defaultPath,
              currentPath: pathname,
            });

            // Prevent redirect if already on their default page
            if (pathname !== defaultPath) {
              redirectingRef.current = true;
              incrementRedirectAttempts();
              console.log(
                "🔒 AuthGuard: Redirecting to default path:",
                defaultPath
              );
              router.push(defaultPath);
            } else {
              // Clear redirect attempts if we're on the right page
              resetRedirectAttempts();
              console.log(
                "🔒 AuthGuard: Already on correct path, clearing attempts"
              );
            }
            return;
          }
        }

        // User is authenticated and has correct role
        console.log("🔒 AuthGuard: User authenticated and authorized");
        clearReturnUrl();
        resetRedirectAttempts();
        hasCheckedRef.current = true;
      }
    };

    handleAuthCheck();
  }, [
    status,
    user,
    requiredRole,
    pathname,
    router,
    redirectTo,
    isInitialized,
    setReturnUrl,
    clearReturnUrl,
    canRedirect,
    incrementRedirectAttempts,
    resetRedirectAttempts,
    getDefaultRedirectPath,
  ]);

  // Reset refs when pathname changes
  useEffect(() => {
    console.log("🔒 AuthGuard: Pathname changed, resetting refs", {
      pathname,
      requiredRole,
    });
    redirectingRef.current = false;
    hasCheckedRef.current = false;
  }, [pathname, requiredRole]);

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
          <p className="text-gray-600 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated - don't render children
  if (status === "unauthenticated") {
    return null;
  }

  // User is authenticated but doesn't have required role
  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = typeof user.role === "string" ? user.role : user.role._id;

    if (!roles.includes(userRole)) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="font-bold text-2xl text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">
              You don't have permission to access this page.
            </p>
            <button
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => router.push(getDefaultRedirectPath())}
              type="button"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
}
