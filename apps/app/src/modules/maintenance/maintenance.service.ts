import { httpClient } from "@/lib/axios";
import type {
  MaintenanceCreateInput,
  MaintenanceListByUserResponse,
  MaintenanceResponse,
  MaintenanceStatus,
  MaintenanceUpdateInput,
} from "./maintenance.type";

// Create maintenance request
export const createMaintenance = async (
  data: MaintenanceCreateInput
): Promise<MaintenanceResponse> => {
  const response = await httpClient.api.post("/maintenance", data);
  return response.data;
};

// Get all maintenance requests (with optional filters)
export const getMaintenancesByUser = async (
  params: any = {}
): Promise<MaintenanceListByUserResponse> => {
  const response = await httpClient.api.get("/maintenance/user", { params });
  return response.data;
};

// Get maintenance by ID
export const getMaintenance = async (
  id: string
): Promise<MaintenanceResponse> => {
  const response = await httpClient.api.get(`/maintenance/${id}`);
  return response.data;
};

// Update maintenance
export const updateMaintenance = async (
  id: string,
  data: MaintenanceUpdateInput
): Promise<MaintenanceResponse> => {
  const response = await httpClient.api.patch(`/maintenance/${id}`, data);
  return response.data;
};

// Add update/comment to maintenance
export const addMaintenanceUpdate = async (
  id: string,
  update: {
    message: string;
    status?: MaintenanceStatus;
    attachments?: {
      url: string;
      fileName: string;
      fileType: string;
      size: number;
    }[];
  }
): Promise<MaintenanceResponse> => {
  const response = await httpClient.api.post(
    `/maintenance/${id}/updates`,
    update
  );
  return response.data;
};
