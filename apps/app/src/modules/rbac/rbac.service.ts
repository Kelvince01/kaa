import { httpClient } from "@/lib/axios";
import type {
  Permission,
  PermissionAssignmentInput,
  PermissionCheck,
  PermissionCreateInput,
  PermissionFilter,
  PermissionUpdateInput,
  Role,
  RoleAssignmentInput,
  RoleCreateInput,
  RoleFilter,
  RoleUpdateInput,
  UserPermission,
  UserRole,
} from "./rbac.type";

// Get all roles with filters
export async function getRoles(filter: RoleFilter = {}): Promise<{
  roles: Role[];
  pagination: { total: number; offset: number; limit: number };
}> {
  const { data } = await httpClient.api.get<{
    roles: Role[];
    pagination: { total: number; offset: number; limit: number };
  }>("/roles", { params: filter });
  return data;
}

// Get a single role by ID
export async function getRoleById(id: string): Promise<Role> {
  const { data } = await httpClient.api.get<Role>(`/roles/${id}`);
  return data;
}

// Create a new role
export async function createRole(input: RoleCreateInput): Promise<Role> {
  const { data } = await httpClient.api.post<Role>("/roles", input);
  return data;
}

// Update an existing role
export async function updateRole(
  id: string,
  input: RoleUpdateInput
): Promise<Role> {
  const { data } = await httpClient.api.patch<Role>(`/roles/${id}`, input);
  return data;
}

// Delete a role
export async function deleteRole(id: string): Promise<void> {
  await httpClient.api.delete(`/roles/${id}`);
}

// Get all permissions with filters
export async function getPermissions(filter: PermissionFilter = {}): Promise<{
  permissions: Permission[];
  pagination: { total: number; offset: number; limit: number };
}> {
  const { data } = await httpClient.api.get<{
    permissions: Permission[];
    pagination: { total: number; offset: number; limit: number };
  }>("/permissions", { params: filter });
  return data;
}

// Get a single permission by ID
export async function getPermissionById(id: string): Promise<Permission> {
  const { data } = await httpClient.api.get<Permission>(`/permissions/${id}`);
  return data;
}

// Create a new permission
export async function createPermission(
  input: PermissionCreateInput
): Promise<Permission> {
  const { data } = await httpClient.api.post<Permission>("/permissions", input);
  return data;
}

// Update an existing permission
export async function updatePermission(
  id: string,
  input: PermissionUpdateInput
): Promise<Permission> {
  const { data } = await httpClient.api.patch<Permission>(
    `/permissions/${id}`,
    input
  );
  return data;
}

// Delete a permission
export async function deletePermission(id: string): Promise<void> {
  await httpClient.api.delete(`/permissions/${id}`);
}

// ============ ROLE ASSIGNMENTS ============

// Assign role to user
export async function assignRoleToUser(
  input: RoleAssignmentInput
): Promise<UserRole> {
  const { data } = await httpClient.api.post<UserRole>(
    "/rbac/assign-role",
    input
  );
  return data;
}

// Remove role from user
export async function removeRoleFromUser(
  userId: string,
  roleId: string,
  memberId?: string
): Promise<void> {
  await httpClient.api.delete("/rbac/remove-role", {
    data: { userId, roleId, memberId },
  });
}

// Get user roles
export async function getUserRoles(
  userId: string,
  memberId?: string
): Promise<UserRole[]> {
  const { data } = await httpClient.api.get<UserRole[]>(
    `/rbac/users/${userId}/roles`,
    {
      params: { memberId },
    }
  );
  return data;
}

// Get users with specific role
export async function getUsersWithRole(
  roleId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{
  users: any[];
  pagination: { total: number; offset: number; limit: number };
}> {
  const { data } = await httpClient.api.get(`/rbac/roles/users/${roleId}`, {
    params: options,
  });
  return data;
}

// ============ PERMISSION ASSIGNMENTS ============

// Add permission to role
export async function addPermissionToRole(
  input: PermissionAssignmentInput
): Promise<void> {
  await httpClient.api.post("/rbac/assign-permission", input);
}

// Remove permission from role
export async function removePermissionFromRole(
  roleId: string,
  permissionId: string
): Promise<void> {
  await httpClient.api.delete("/rbac/remove-permission", {
    data: { roleId, permissionId },
  });
}

// Get role permissions
export async function getRolePermissions(
  roleId: string
): Promise<Permission[]> {
  const { data } = await httpClient.api.get<Permission[]>(
    `/rbac/roles/${roleId}/permissions`
  );
  return data;
}

// ============ PERMISSION CHECKS ============

// Check if user has permission
export async function checkUserPermission(
  check: PermissionCheck
): Promise<{ hasPermission: boolean }> {
  const { data } = await httpClient.api.post<{ hasPermission: boolean }>(
    "/rbac/check-permission",
    check
  );
  return data;
}

// Get user permissions
export async function getUserPermissions(
  userId: string,
  memberId?: string
): Promise<UserPermission[]> {
  const { data } = await httpClient.api.get<UserPermission[]>(
    `/rbac/users/${userId}/permissions`,
    {
      params: { memberId },
    }
  );
  return data;
}

// Check if user has all permissions
export async function checkUserPermissions(
  userId: string,
  permissions: Array<{ resource: string; action: string }>,
  memberId?: string
): Promise<{ hasAllPermissions: boolean }> {
  const { data } = await httpClient.api.post<{ hasAllPermissions: boolean }>(
    "/rbac/check-permissions",
    {
      userId,
      permissions,
      memberId,
    }
  );
  return data;
}

// Check if user has any of the permissions
export async function checkUserAnyPermission(
  userId: string,
  permissions: Array<{ resource: string; action: string }>,
  memberId?: string
): Promise<{ hasAnyPermission: boolean }> {
  const { data } = await httpClient.api.post<{ hasAnyPermission: boolean }>(
    "/rbac/check-any-permission",
    {
      userId,
      permissions,
      memberId,
    }
  );
  return data;
}

// ============ BULK OPERATIONS ============

// Bulk delete roles
export async function bulkDeleteRoles(
  roleIds: string[]
): Promise<{ deletedCount: number }> {
  const { data } = await httpClient.api.post<{ deletedCount: number }>(
    "/rbac/roles/bulk-delete",
    {
      roleIds,
    }
  );
  return data;
}

// Bulk delete permissions
export async function bulkDeletePermissions(
  permissionIds: string[]
): Promise<{ deletedCount: number }> {
  const { data } = await httpClient.api.post<{ deletedCount: number }>(
    "/rbac/permissions/bulk-delete",
    {
      permissionIds,
    }
  );
  return data;
}

// Bulk assign roles to users
export async function bulkAssignRoles(
  userIds: string[],
  roleId: string,
  options: { memberId?: string; isPrimary?: boolean; expiresAt?: string } = {}
): Promise<{ assignedCount: number }> {
  const { data } = await httpClient.api.post<{ assignedCount: number }>(
    "/rbac/bulk-assign-roles",
    {
      userIds,
      roleId,
      ...options,
    }
  );
  return data;
}

// Update role permissions
export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<{ updatedCount: number }> {
  const { data } = await httpClient.api.put<{ updatedCount: number }>(
    `/role/permissions/${roleId}`,
    {
      permissionIds,
    }
  );
  return data;
}
