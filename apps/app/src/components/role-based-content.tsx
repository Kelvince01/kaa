"use client";

import { Loader2 } from "lucide-react";
import { useUserRole } from "@/modules/me";

type RoleBasedContentProps = {
  landlord?: React.ReactNode;
  tenant?: React.ReactNode;
  admin?: React.ReactNode;
  manager?: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
};

/**
 * Renders content based on user's role
 * Used for creating role-aware pages that show different content for different roles
 */
export function RoleBasedContent({
  landlord,
  tenant,
  admin,
  manager,
  fallback,
  loading,
}: RoleBasedContentProps) {
  const { roleName, role } = useUserRole();

  // Show loading state
  if (!(role || roleName)) {
    return (
      <>
        {loading ?? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </>
    );
  }

  // Render based on role
  switch (roleName) {
    case "landlord":
      return <>{landlord ?? fallback}</>;
    case "tenant":
      return <>{tenant ?? fallback}</>;
    case "admin":
    case "super_admin":
      return <>{admin ?? fallback}</>;
    case "manager":
    case "property_manager":
      return <>{manager ?? landlord ?? fallback}</>;
    default:
      return <>{fallback}</>;
  }
}

type RoleGuardProps = {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Shows content only if user has one of the allowed roles
 */
export function RoleGuard({
  allowedRoles,
  children,
  fallback,
}: RoleGuardProps) {
  const { hasAnyRole } = useUserRole();

  if (!hasAnyRole(allowedRoles)) {
    return (
      <>
        {fallback ?? (
          <div className="flex h-full flex-col items-center justify-center space-y-4">
            <p className="text-muted-foreground">
              You don't have permission to view this content.
            </p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

/**
 * Shows content only for specific role
 */
export function ShowForRole({
  role,
  children,
}: {
  role: string | string[];
  children: React.ReactNode;
}) {
  const { hasRole, hasAnyRole } = useUserRole();

  const roles = Array.isArray(role) ? role : [role];
  const shouldShow = hasAnyRole(roles);

  if (!shouldShow) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hides content for specific role
 */
export function HideForRole({
  role,
  children,
}: {
  role: string | string[];
  children: React.ReactNode;
}) {
  const { hasAnyRole } = useUserRole();

  const roles = Array.isArray(role) ? role : [role];
  const shouldHide = hasAnyRole(roles);

  if (shouldHide) {
    return null;
  }

  return <>{children}</>;
}
