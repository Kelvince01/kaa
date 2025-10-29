import { httpClient } from "@/lib/axios";
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  AdminUser,
  AuditLog,
  BulkUserAction,
  FeatureFlag,
  SystemConfiguration,
  SystemHealth,
  SystemStats,
  UserManagementFilter,
} from "./admin.type";

// System Statistics
export async function getSystemStats(): Promise<SystemStats> {
  const { data } = await httpClient.api.get<SystemStats>("/admin/stats");
  return data;
}

// User Management
export async function getAdminUsers(filter: UserManagementFilter): Promise<{
  users: AdminUser[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { data } = await httpClient.api.get<{
    users: AdminUser[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>("/admin/users", { params: filter });
  return data;
}

export async function createAdminUser(
  input: AdminCreateUserInput
): Promise<AdminUser> {
  const { data } = await httpClient.api.post<AdminUser>("/admin/users", input);
  return data;
}

export async function updateAdminUser(
  id: string,
  input: AdminUpdateUserInput
): Promise<AdminUser> {
  const { data } = await httpClient.api.patch<AdminUser>(
    `/admin/users/${id}`,
    input
  );
  return data;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await httpClient.api.delete(`/admin/users/${id}`);
}

export async function bulkUserAction(
  action: BulkUserAction
): Promise<{ success: boolean; message: string }> {
  const { data } = await httpClient.api.post<{
    success: boolean;
    message: string;
  }>("/admin/users/bulk", action);
  return data;
}

export async function impersonateUser(
  userId: string
): Promise<{ token: string; user: AdminUser }> {
  const { data } = await httpClient.api.post<{
    token: string;
    user: AdminUser;
  }>(`/admin/users/${userId}/impersonate`);
  return data;
}

// System Configuration
export async function getSystemConfiguration(): Promise<SystemConfiguration[]> {
  const { data } =
    await httpClient.api.get<SystemConfiguration[]>("/admin/config");
  return data;
}

export async function updateSystemConfiguration(
  key: string,
  value: any
): Promise<SystemConfiguration> {
  const { data } = await httpClient.api.patch<SystemConfiguration>(
    `/admin/config/${key}`,
    {
      value,
    }
  );
  return data;
}

export async function createSystemConfiguration(
  config: Omit<SystemConfiguration, "id" | "updatedAt" | "updatedBy">
): Promise<SystemConfiguration> {
  const { data } = await httpClient.api.post<SystemConfiguration>(
    "/admin/config",
    config
  );
  return data;
}

export async function deleteSystemConfiguration(key: string): Promise<void> {
  await httpClient.api.delete(`/admin/config/${key}`);
}

// Feature Flags
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const { data } = await httpClient.api.get<FeatureFlag[]>("/admin/features");
  return data;
}

export async function updateFeatureFlag(
  id: string,
  updates: Partial<FeatureFlag>
): Promise<FeatureFlag> {
  const { data } = await httpClient.api.patch<FeatureFlag>(
    `/admin/features/${id}`,
    updates
  );
  return data;
}

export async function createFeatureFlag(
  flag: Omit<FeatureFlag, "id" | "createdAt" | "updatedAt">
): Promise<FeatureFlag> {
  const { data } = await httpClient.api.post<FeatureFlag>(
    "/admin/features",
    flag
  );
  return data;
}

export async function deleteFeatureFlag(id: string): Promise<void> {
  await httpClient.api.delete(`/admin/features/${id}`);
}

// System Health
export async function getSystemHealth(): Promise<SystemHealth> {
  const { data } = await httpClient.api.get<SystemHealth>("/admin/health");
  return data;
}

// Audit Logs
export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  logs: AuditLog[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { data } = await httpClient.api.get<{
    logs: AuditLog[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>("/admin/audit", { params });
  return data;
}

// System Maintenance
export async function performSystemMaintenance(
  action: "clear_cache" | "backup_db" | "cleanup_logs"
): Promise<{
  success: boolean;
  message: string;
}> {
  const { data } = await httpClient.api.post<{
    success: boolean;
    message: string;
  }>(`/admin/maintenance/${action}`);
  return data;
}

// Export Data
export async function exportData(
  type: "users" | "properties" | "bookings",
  format: "csv" | "json"
): Promise<{
  downloadUrl: string;
  filename: string;
}> {
  const { data } = await httpClient.api.post<{
    downloadUrl: string;
    filename: string;
  }>("/admin/export", {
    type,
    format,
  });
  return data;
}
