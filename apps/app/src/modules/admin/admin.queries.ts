"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as adminService from "./admin.service";
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  BulkUserAction,
  FeatureFlag,
  SystemConfiguration,
  UserManagementFilter,
} from "./admin.type";

// Query keys
export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  usersList: (filters: UserManagementFilter) =>
    [...adminKeys.users(), "list", { filters }] as const,
  config: () => [...adminKeys.all, "config"] as const,
  features: () => [...adminKeys.all, "features"] as const,
  health: () => [...adminKeys.all, "health"] as const,
  audit: () => [...adminKeys.all, "audit"] as const,
  auditLogs: (params?: any) =>
    [...adminKeys.audit(), "logs", { params }] as const,
};

// System Statistics
export const useSystemStats = () => {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => adminService.getSystemStats(),
    refetchInterval: 30_000, // Refresh every 30 seconds
  });
};

// User Management
export const useAdminUsers = (filters: UserManagementFilter) =>
  useQuery({
    queryKey: adminKeys.usersList(filters),
    queryFn: () => adminService.getAdminUsers(filters),
  });

export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminCreateUserInput) =>
      adminService.createAdminUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create user");
    },
  });
};

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUpdateUserInput }) =>
      adminService.updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update user");
    },
  });
};

export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.deleteAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    },
  });
};

export const useBulkUserAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: BulkUserAction) => adminService.bulkUserAction(action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Bulk action failed");
    },
  });
};

export const useImpersonateUser = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (userId: string) => adminService.impersonateUser(userId),
    onSuccess: (data) => {
      // Store impersonation token
      localStorage.setItem("impersonation_token", data.token);
      toast.success(
        `Now impersonating ${data.user.firstName} ${data.user.lastName}`
      );
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to impersonate user"
      );
    },
  });
};

// System Configuration
export const useSystemConfiguration = () =>
  useQuery({
    queryKey: adminKeys.config(),
    queryFn: () => adminService.getSystemConfiguration(),
  });

export const useUpdateSystemConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      adminService.updateSystemConfiguration(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.config() });
      toast.success("Configuration updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update configuration"
      );
    },
  });
};

export const useCreateSystemConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      config: Omit<SystemConfiguration, "id" | "updatedAt" | "updatedBy">
    ) => adminService.createSystemConfiguration(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.config() });
      toast.success("Configuration created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create configuration"
      );
    },
  });
};

// Feature Flags
export const useFeatureFlags = () =>
  useQuery({
    queryKey: adminKeys.features(),
    queryFn: () => adminService.getFeatureFlags(),
  });

export const useUpdateFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<FeatureFlag>;
    }) => adminService.updateFeatureFlag(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.features() });
      toast.success("Feature flag updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update feature flag"
      );
    },
  });
};

export const useCreateFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flag: Omit<FeatureFlag, "id" | "createdAt" | "updatedAt">) =>
      adminService.createFeatureFlag(flag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.features() });
      toast.success("Feature flag created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create feature flag"
      );
    },
  });
};

// System Health
export const useSystemHealth = () => {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: () => adminService.getSystemHealth(),
    refetchInterval: 60_000, // Refresh every minute
  });
};

// Audit Logs
export const useAuditLogs = (params?: any) =>
  useQuery({
    queryKey: adminKeys.auditLogs(params),
    queryFn: () => adminService.getAuditLogs(params),
  });

// System Maintenance
export const useSystemMaintenance = () =>
  useMutation({
    mutationFn: (action: "clear_cache" | "backup_db" | "cleanup_logs") =>
      adminService.performSystemMaintenance(action),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Maintenance action failed"
      );
    },
  });

// Export Data
export const useExportData = () => {
  return useMutation({
    mutationFn: ({
      type,
      format,
    }: {
      type: "users" | "properties" | "bookings";
      format: "csv" | "json";
    }) => adminService.exportData(type, format),
    onSuccess: (data) => {
      // Download the file
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export started. Download will begin shortly.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Export failed");
    },
  });
};
