import { RolePermission } from "@kaa/models";
import mongoose from "mongoose";

/**
 * Define the actions that can be performed on an entity.
 */
export type PermittedAction =
  | "*"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "manage"
  | "export"
  | "import"
  | "revoke"
  | "generate";

/**
 * Permission cache to avoid frequent database lookups
 */
const permissionCache = new Map<string, Set<string>>();

/**
 * Clear the permission cache, typically done after role changes
 */
export const clearPermissionCache = (userId?: string) => {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
};

/**
 * Get the cached role permissions or load them from the database
 * @param roleId - The role ID to get permissions for
 * @returns A set of resource:action strings representing permissions
 */
const getRolePermissions = async (roleId: string): Promise<Set<string>> => {
  const cacheKey = `role:${roleId}`;

  if (permissionCache.has(cacheKey)) {
    // biome-ignore lint/style/noNonNullAssertion: false positive
    return permissionCache.get(cacheKey)!;
  }

  // Fetch permissions for the role from the database
  const permissionsData = await RolePermission.find({
    roleId: new mongoose.Types.ObjectId(roleId),
  })
    .populate("permissionId", "resource action")
    .lean();

  // Create a set of "resource:action" strings for easy lookup
  const permissionSet = new Set<string>();
  for (const p of permissionsData) {
    // @ts-expect-error
    permissionSet.add(`${p.permissionId?.resource}:${p.permissionId?.action}`);
  }

  // Cache the permissions
  permissionCache.set(cacheKey, permissionSet);
  return permissionSet;
};

/**
 * PermissionManager class for checking permissions
 */
class CustomPermissionManager {
  /**
   * Check if the user has permission to perform the action on the resource
   * @param resource - The resource to check permissions for
   * @param action - The action to check
   * @param options - Additional options for permission checking
   * @returns Promise that resolves to true if permitted, false otherwise
   */
  async can(
    resource: string,
    action: PermittedAction,
    options?: {
      userId?: string;
      roleId?: string;
      context?: string;
      entityId?: string;
    }
  ): Promise<boolean> {
    // Get the role ID, either from options, or from context
    const roleId = options?.roleId;

    if (!roleId) return false;

    // Get permissions for this role
    const permissions = await getRolePermissions(roleId);

    // Check if the role has the specific permission
    const hasSpecificPermission = permissions.has(`${resource}:${action}`);

    // Check if the role has wildcard permission for all actions on this resource
    const hasResourceWildcard = permissions.has(`${resource}:*`);

    // Check if the role has wildcard permission for this action on all resources
    const hasActionWildcard = permissions.has(`*:${action}`);

    // Check if the role has global wildcard permission
    const hasGlobalWildcard = permissions.has("*:*");

    return (
      hasSpecificPermission ||
      hasResourceWildcard ||
      hasActionWildcard ||
      hasGlobalWildcard
    );
  }

  /**
   * Check if the user has any of the specified permissions
   * @param permissionChecks - Array of resource/action pairs to check
   * @returns Promise that resolves to true if any permission is granted
   */
  async canAny(
    permissionChecks: Array<{ resource: string; action: PermittedAction }>,
    options?: {
      userId?: string;
      roleId?: string;
      context?: string;
      entityId?: string;
    }
  ): Promise<boolean> {
    for (const check of permissionChecks) {
      if (await this.can(check.resource, check.action, options)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the user has all of the specified permissions
   * @param permissionChecks - Array of resource/action pairs to check
   * @returns Promise that resolves to true if all permissions are granted
   */
  async canAll(
    permissionChecks: Array<{ resource: string; action: PermittedAction }>,
    options?: {
      userId?: string;
      roleId?: string;
      context?: string;
      entityId?: string;
    }
  ): Promise<boolean> {
    for (const check of permissionChecks) {
      if (!(await this.can(check.resource, check.action, options))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Filter an array of items based on permission to perform an action
   * @param items - Array of items to filter
   * @param resource - The resource type of the items
   * @param action - The action to check permission for
   * @returns Promise that resolves to filtered array where user has permission
   */
  async filterByPermission<T extends { id: string }>(
    items: T[],
    resource: string,
    action: PermittedAction
  ): Promise<T[]> {
    // Simple case: if user can perform action on all resources of this type
    if (await this.can(resource, action)) {
      return items;
    }

    // Otherwise, need to check individual permissions - to be implemented based on your schema
    // This would typically involve checking resource-specific permissions

    return [];
  }

  clearCacheForUser(userId: string) {
    permissionCache.delete(userId);
  }
}

// Create and export a singleton instance
export const permissionManager = new CustomPermissionManager();
