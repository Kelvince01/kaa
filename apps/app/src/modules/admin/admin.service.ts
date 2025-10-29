import { httpClient } from "@/lib/axios";
import type {
  AdminBooking,
  AdminCreateUserInput,
  AdminPayment,
  AdminProperty,
  AdminUpdateUserInput,
  AdminUser,
  AuditLog,
  BookingManagementFilter,
  BulkUserAction,
  FeatureFlag,
  PaymentManagementFilter,
  PropertyManagementFilter,
  SystemConfiguration,
  SystemHealth,
  SystemLog,
  SystemStats,
  SystemStatsFilter,
  UserManagementFilter,
} from "./admin.type";

// System Statistics
export async function getSystemStats(
  filter?: SystemStatsFilter
): Promise<SystemStats> {
  const { data } = await httpClient.api.get<SystemStats>("/admin/stats", {
    params: filter,
  });
  return data;
}

// User Management
export async function getAdminUsers(filter: UserManagementFilter): Promise<{
  items: AdminUser[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { data } = await httpClient.api.get<{
    items: AdminUser[];
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

// User Role & Status Management
export async function updateUserRole(
  userId: string,
  role: string
): Promise<{
  status: string;
  data: any;
  message: string;
}> {
  const { data } = await httpClient.api.patch<{
    status: string;
    data: any;
    message: string;
  }>(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function updateUserStatus(
  userId: string,
  active: boolean
): Promise<{
  status: string;
  data: any;
  message: string;
}> {
  const { data } = await httpClient.api.patch<{
    status: string;
    data: any;
    message: string;
  }>(`/admin/users/${userId}/status`, { active });
  return data;
}

// Property Management
export async function getAdminProperties(
  filter: PropertyManagementFilter
): Promise<{
  properties: AdminProperty[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { data } = await httpClient.api.get<{
    properties: AdminProperty[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>("/admin/properties", { params: filter });
  return data;
}

export async function updatePropertyApproval(
  propertyId: string,
  approved: boolean
): Promise<{
  status: string;
  data: AdminProperty;
  message: string;
}> {
  const { data } = await httpClient.api.patch<{
    status: string;
    data: AdminProperty;
    message: string;
  }>(`/admin/properties/${propertyId}/approval`, { approved });
  return data;
}

// Booking Management
export async function getAdminBookings(
  filter: BookingManagementFilter
): Promise<{
  items: AdminBooking[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { data } = await httpClient.api.get<{
    items: AdminBooking[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>("/admin/bookings", { params: filter });
  return data;
}

// System Logs
export async function getAdminLogs(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  items: SystemLog[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { data } = await httpClient.api.get<{
    items: SystemLog[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>("/admin/logs", { params });
  return data;
}

// Payment Management
export async function getAdminPayments(
  filter: PaymentManagementFilter
): Promise<{
  items: AdminPayment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { data } = await httpClient.api.get<{
    items: AdminPayment[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>("/admin/payments", { params: filter });
  return data;
}
