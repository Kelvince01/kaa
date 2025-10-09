import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth";

export type Permission = {
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage";
};

// Helper function to check if a user has specific permission
export const hasPermission = (
  userRoles: any[],
  resource: string,
  action: string
): boolean => {
  if (!userRoles) return false;

  return userRoles.some((role) =>
    role.permissions.some(
      (permission: any) =>
        (permission.resource === resource &&
          (permission.action === action || permission.action === "manage")) ||
        (permission.resource === "*" && permission.action === "*")
    )
  );
};

// Higher-order component to require specific permissions
export function requirePermission(resource: string, action: string) {
  return function withPermission<P extends object>(
    WrappedComponent: React.ComponentType<P>
  ) {
    return function PermissionWrapper(props: P) {
      const router = useRouter();
      const { user, status, isInitialized } = useAuth();

      useEffect(() => {
        if (!isInitialized || status === "loading") return;

        if (!user) {
          toast.error("Authentication Required", {
            description: "Please sign in to access this page",
          });
          router.push("/auth/login");
          return;
        }

        if (!hasPermission([user.role], resource, action)) {
          toast.error("Access Denied", {
            description: "You do not have permission to access this page",
          });
          router.push("/");
        }
      }, [user, isInitialized, router, resource, action, status]);

      if (status === "loading") {
        return (
          <div className="flex h-screen items-center justify-center">
            <div className="h-32 w-32 animate-spin rounded-full border-primary border-b-2" />
          </div>
        );
      }

      if (!(user && hasPermission([user.role], resource, action))) {
        return null;
      }

      return <WrappedComponent {...props} />;
    };
  };
}

// Hook to check permissions
export function usePermissionCheck(resource: string, action: string): boolean {
  const { user } = useAuth();
  if (!user) return false;

  return hasPermission([user.role], resource, action);
}
