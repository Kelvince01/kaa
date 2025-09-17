import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import * as rbacService from "./rbac.service";
import type {
  PermissionCreateInput,
  PermissionFilter,
  PermissionUpdateInput,
  RoleCreateInput,
  RoleFilter,
  RoleUpdateInput,
} from "./rbac.type";

// Query keys for RBAC
export const rbacKeys = {
  all: ["rbac"] as const,
  roles: () => [...rbacKeys.all, "roles"] as const,
  rolesList: (filters: RoleFilter) =>
    [...rbacKeys.roles(), "list", { filters }] as const,
  roleDetail: (id: string) => [...rbacKeys.roles(), "detail", id] as const,
  permissions: () => [...rbacKeys.all, "permissions"] as const,
  permissionsList: (filters: PermissionFilter) =>
    [...rbacKeys.permissions(), "list", { filters }] as const,
  permissionDetail: (id: string) =>
    [...rbacKeys.permissions(), "detail", id] as const,
};

// ============ ROLES HOOKS ============

// Hooks for roles data fetching
export const useRoles = (filters: RoleFilter = {}) => {
  return useQuery({
    queryKey: rbacKeys.rolesList(filters),
    queryFn: () => rbacService.getRoles(filters),
  });
};

export const useRole = (id: string) => {
  return useQuery({
    queryKey: rbacKeys.roleDetail(id),
    queryFn: () => rbacService.getRoleById(id),
    enabled: !!id,
  });
};

// Role mutation hooks
export const useCreateRole = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RoleCreateInput) => rbacService.createRole(data),
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      toast.success(`Role "${role.name}" has been created successfully.`);
      router.push("/rbac/roles");
    },
    onError: (error: Error) => {
      toast.error(`Error creating role: ${error.message}`);
    },
  });
};

export const useUpdateRole = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleUpdateInput }) =>
      rbacService.updateRole(id, data),
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      queryClient.invalidateQueries({ queryKey: rbacKeys.roleDetail(role.id) });
      toast.success(`Role "${role.name}" has been updated successfully.`);
    },
    onError: (error: Error) => {
      toast.error(`Error updating role: ${error.message}`);
    },
  });
};

export const useDeleteRole = () => {
  return useMutation({
    mutationFn: (id: string) => rbacService.deleteRole(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      queryClient.removeQueries({ queryKey: rbacKeys.roleDetail(id) });
      toast.success("Role has been deleted successfully.");
    },
    onError: (error: Error) => {
      toast.error(`Error deleting role: ${error.message}`);
    },
  });
};

// ============ PERMISSIONS HOOKS ============

// Hooks for permissions data fetching
export const usePermissions = (filters: PermissionFilter = {}) => {
  return useQuery({
    queryKey: rbacKeys.permissionsList(filters),
    queryFn: () => rbacService.getPermissions(filters),
  });
};

export const usePermission = (id: string) => {
  return useQuery({
    queryKey: rbacKeys.permissionDetail(id),
    queryFn: () => rbacService.getPermissionById(id),
    enabled: !!id,
  });
};

// Permission mutation hooks
export const useCreatePermission = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: PermissionCreateInput) =>
      rbacService.createPermission(data),
    onSuccess: (permission) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
      toast.success(
        `Permission "${permission.name}" has been created successfully.`
      );
      router.push("/rbac/permissions");
    },
    onError: (error: Error) => {
      toast.error(`Error creating permission: ${error.message}`);
    },
  });
};

export const useUpdatePermission = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PermissionUpdateInput }) =>
      rbacService.updatePermission(id, data),
    onSuccess: (permission) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
      queryClient.invalidateQueries({
        queryKey: rbacKeys.permissionDetail(permission.id),
      });
      toast.success(
        `Permission "${permission.name}" has been updated successfully.`
      );
    },
    onError: (error: Error) => {
      toast.error(`Error updating permission: ${error.message}`);
    },
  });
};

export const useDeletePermission = () => {
  return useMutation({
    mutationFn: (id: string) => rbacService.deletePermission(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
      queryClient.removeQueries({ queryKey: rbacKeys.permissionDetail(id) });
      toast.success("Permission has been deleted successfully.");
    },
    onError: (error: Error) => {
      toast.error(`Error deleting permission: ${error.message}`);
    },
  });
};

// Utility hooks for role and permission management
export const useRolePermissions = (roleId: string) => {
  return useQuery({
    queryKey: [...rbacKeys.roleDetail(roleId), "permissions"],
    queryFn: () => rbacService.getPermissions({ roleId }),
    enabled: !!roleId,
  });
};

export const usePermissionsByResource = (resource: string) => {
  return useQuery({
    queryKey: [...rbacKeys.permissions(), "resource", resource],
    queryFn: () => rbacService.getPermissions({ resource }),
    enabled: !!resource,
  });
};

// Hook to get users with a specific role
export const useUsersWithRole = (
  roleId: string,
  options: { limit?: number; offset?: number } = {}
) => {
  return useQuery({
    queryKey: [...rbacKeys.roleDetail(roleId), "users", options],
    queryFn: () => rbacService.getUsersWithRole(roleId, options),
    enabled: !!roleId,
  });
};

// Hook to update role permissions
export const useUpdateRolePermissions = (roleId: string) => {
  return useMutation({
    mutationFn: (permissionIds: string[]) =>
      rbacService.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      queryClient.invalidateQueries({ queryKey: rbacKeys.roleDetail(roleId) });
      queryClient.invalidateQueries({
        queryKey: [...rbacKeys.roleDetail(roleId), "permissions"],
      });
      toast.success("Role permissions updated successfully.");
    },
    onError: (error: Error) => {
      toast.error(`Error updating role permissions: ${error.message}`);
    },
  });
};
