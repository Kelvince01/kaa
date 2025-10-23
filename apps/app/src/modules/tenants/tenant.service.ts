import { httpClient } from "@/lib/axios";
import type {
  TenantCreateInput,
  TenantListResponse,
  TenantResponse,
  TenantUpdateInput,
} from "./tenant.type";

// Create tenant
export const createTenant = async (
  data: TenantCreateInput
): Promise<TenantResponse> => {
  const response = await httpClient.api.post("/tenants", data);
  return response.data;
};

// Get all tenants (with optional filters)
export const getTenants = async (
  params: any = {}
): Promise<TenantListResponse> => {
  const response = await httpClient.api.get("/tenants", { params });
  return response.data;
};

// Get tenant by ID
export const getTenant = async (id: string): Promise<TenantResponse> => {
  const response = await httpClient.api.get(`/tenants/${id}`);
  return response.data;
};

// Update tenant
export const updateTenant = async (
  id: string,
  data: TenantUpdateInput
): Promise<TenantResponse> => {
  const response = await httpClient.api.patch(`/tenants/${id}`, data);
  return response.data;
};

// Delete tenant
export const deleteTenant = async (id: string): Promise<TenantResponse> => {
  const response = await httpClient.api.delete(`/tenants/${id}`);
  return response.data;
};

// Search tenants
export const searchTenants = async (
  params: any = {}
): Promise<TenantListResponse> => {
  const response = await httpClient.api.get("/tenants/search", { params });
  return response.data;
};

// Get tenant statistics
export const getTenantStats = async (): Promise<any> => {
  const response = await httpClient.api.get("/tenants/stats");
  return response.data;
};

// Verify tenant
export const verifyTenant = async (id: string): Promise<TenantResponse> => {
  const response = await httpClient.api.patch(`/tenants/${id}/verify`);
  return response.data;
};

// Update tenant verification
export const updateTenantVerification = async (
  id: string,
  verificationData: any
): Promise<TenantResponse> => {
  const response = await httpClient.api.patch(`/tenants/${id}/verification`, {
    verificationProgress: verificationData,
  });
  return response.data;
};
