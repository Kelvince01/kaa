"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../use-auth";

type AuthGuardProps = {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
};

export function AuthGuard({
  children,
  requiredRole,
  redirectTo = "/auth/login",
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Store the current URL before redirecting
        sessionStorage.setItem("returnUrl", pathname);
        router.push(redirectTo);
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Redirect based on user role if they don't have required role
        const roleRedirects: Record<string, string> = {
          admin: "/admin",
          landlord: "/dashboard",
          tenant: "/account",
          property_manager: "/dashboard",
          maintenance: "/dashboard",
        };

        const userRedirect =
          roleRedirects[(user?.role as string)?.toLowerCase() as string] ||
          "/dashboard";
        router.push(userRedirect);
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredRole,
    router,
    redirectTo,
    pathname,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="font-bold text-2xl text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
