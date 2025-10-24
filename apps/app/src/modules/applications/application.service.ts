import { httpClient } from "@/lib/axios";
import type {
  Application,
  ApplicationCreateInput,
  ApplicationFilter,
  ApplicationListResponse,
  ApplicationResponse,
  ApplicationUpdateInput,
} from "./application.type";

// Create application
export const createApplication = async (
  data: ApplicationCreateInput
): Promise<ApplicationResponse> => {
  const response = await httpClient.api.post("/applications", data);
  return response.data;
};

// Get all applications (with optional filters)
export const getApplications = async (
  params: ApplicationFilter
): Promise<ApplicationListResponse> => {
  const response = await httpClient.api.get("/applications", { params });
  return response.data;
};

export const getApplicationStatusCounts = async (
  params?: ApplicationFilter
): Promise<{ data: Record<Application["status"], number> }> => {
  const response = await httpClient.api.get("/applications/stats/status", {
    params,
  });
  return response.data;
};

export const getEstimatedOfferAmount = async (
  params?: ApplicationFilter
): Promise<{ data: { min: number; max: number } }> => {
  const response = await httpClient.api.get("/applications/estimated-amount", {
    params,
  });
  return response.data;
};

// Get application by ID
export const getApplication = async (
  id: string
): Promise<ApplicationResponse> => {
  const response = await httpClient.api.get(`/applications/${id}`);
  return response.data;
};

// Update application
export const updateApplication = async (
  id: string,
  data: ApplicationUpdateInput
): Promise<ApplicationResponse> => {
  const response = await httpClient.api.patch(`/applications/${id}`, data);
  return response.data;
};

// Update applications
export const updateApplications = async (
  ids: string[],
  data: ApplicationUpdateInput
): Promise<ApplicationResponse> => {
  const response = await httpClient.api.patch("/applications", { ids, data });
  return response.data;
};

// Submit application
export const submitApplication = async (
  id: string
): Promise<ApplicationResponse> => {
  const response = await httpClient.api.post(`/applications/${id}/submit`);
  return response.data;
};

// Approve application
export const approveApplication = async (
  id: string
): Promise<ApplicationResponse> => {
  const response = await httpClient.api.post(`/applications/${id}/approve`);
  return response.data;
};

// Reject application
export const rejectApplication = async (
  id: string,
  rejectionReason: string
): Promise<ApplicationResponse> => {
  const response = await httpClient.api.post(`/applications/${id}/reject`, {
    rejectionReason,
  });
  return response.data;
};

// Withdraw application
export const withdrawApplication = async (
  id: string
): Promise<ApplicationResponse> => {
  const response = await httpClient.api.post(`/applications/${id}/withdraw`);
  return response.data;
};
