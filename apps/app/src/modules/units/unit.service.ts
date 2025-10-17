import { httpClient } from "@/lib/axios";
import type {
  UnitCreateInput,
  UnitListResponse,
  UnitResponse,
  UnitUpdateInput,
} from "./unit.type";

// Create unit
export const createUnit = async (
  data: UnitCreateInput
): Promise<UnitResponse> => {
  const response = await httpClient.api.post("/units", data);
  return response.data;
};

// Get all units (with optional filters)
export const getUnits = async (params: any = {}): Promise<UnitListResponse> => {
  const response = await httpClient.api.get("/units", { params });
  return response.data;
};

// Get unit by ID
export const getUnit = async (id: string): Promise<UnitResponse> => {
  const response = await httpClient.api.get(`/units/${id}`);
  return response.data;
};

// Update unit
export const updateUnit = async (
  id: string,
  data: UnitUpdateInput
): Promise<UnitResponse> => {
  const response = await httpClient.api.patch(`/units/${id}`, data);
  return response.data;
};

// Delete unit
export const deleteUnit = async (id: string): Promise<void> => {
  const response = await httpClient.api.delete(`/units/${id}`);
  return response.data;
};

// Get units by property ID
export const getUnitsByProperty = async (
  propertyId: string,
  params: any = {}
): Promise<UnitListResponse> => {
  const response = await httpClient.api.get(`/units/property/${propertyId}`, {
    params,
  });
  return response.data;
};

// Assign tenant to unit
export const assignTenantToUnit = async (
  unitId: string,
  data: {
    tenantId: string;
    leaseStartDate: string;
    leaseEndDate?: string;
    depositPaid?: boolean;
    notes?: string;
  }
): Promise<UnitResponse> => {
  const response = await httpClient.api.post(`/units/${unitId}/tenant`, data);
  return response.data;
};

// Update unit status
export const updateUnitStatus = async (
  unitId: string,
  data: {
    status: string;
    reason?: string;
  }
): Promise<UnitResponse> => {
  const response = await httpClient.api.patch(`/units/${unitId}/status`, data);
  return response.data;
};

// Update meter readings
export const updateMeterReadings = async (
  unitId: string,
  data: {
    meterReadings: {
      electricity?: number;
      water?: number;
      gas?: number;
    };
    readingDate: string;
  }
): Promise<UnitResponse> => {
  const response = await httpClient.api.patch(
    `/units/${unitId}/meter-readings`,
    data
  );
  return response.data;
};

// Vacate unit (remove tenant)
export const vacateUnit = async (
  unitId: string,
  data: {
    vacateDate: string;
    reason?: string;
    notes?: string;
  }
): Promise<UnitResponse> => {
  const response = await httpClient.api.post(`/units/${unitId}/vacate`, data);
  return response.data;
};

// Get unit analytics/stats
export const getUnitAnalytics = async (unitId: string): Promise<any> => {
  const response = await httpClient.api.get(`/units/${unitId}/analytics`);
  return response.data;
};

// Bulk operations
export const bulkUpdateUnits = async (
  unitIds: string[],
  data: Partial<UnitUpdateInput>
): Promise<UnitListResponse> => {
  const response = await httpClient.api.patch("/units/bulk", {
    unitIds,
    ...data,
  });
  return response.data;
};

// Get available units (vacant units)
export const getAvailableUnits = async (
  params: any = {}
): Promise<UnitListResponse> => {
  const response = await httpClient.api.get("/units", {
    params: { ...params, available: "true" },
  });
  return response.data;
};
