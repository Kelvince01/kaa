import { httpClient } from "@/lib/axios";
import type {
  LandlordAnalytics,
  LandlordCreateInput,
  LandlordListResponse,
  LandlordQueryParams,
  LandlordResponse,
  LandlordUpdateInput,
} from "./landlord.type";

// Create landlord
export const createLandlord = async (
  data: LandlordCreateInput
): Promise<LandlordResponse> => {
  const response = await httpClient.api.post("/landlords", data);
  return response.data;
};

// Get all landlords (with optional filters)
export const getLandlords = async (
  params: LandlordQueryParams = {}
): Promise<LandlordListResponse> => {
  const response = await httpClient.api.get("/landlords", { params });
  return response.data;
};

// Get landlord by ID
export const getLandlord = async (id: string): Promise<LandlordResponse> => {
  const response = await httpClient.api.get(`/landlords/${id}`);
  return response.data;
};

// Update landlord
export const updateLandlord = async (
  id: string,
  data: LandlordUpdateInput
): Promise<LandlordResponse> => {
  const response = await httpClient.api.patch(`/landlords/${id}`, data);
  return response.data;
};

// Delete landlord
export const deleteLandlord = async (id: string): Promise<LandlordResponse> => {
  const response = await httpClient.api.delete(`/landlords/${id}`);
  return response.data;
};

// Search landlords
export const searchLandlords = async (
  params: any = {}
): Promise<LandlordListResponse> => {
  const response = await httpClient.api.get("/landlords/search", { params });
  return response.data;
};

// Get landlord statistics
export const getLandlordStats = async (): Promise<{
  data: LandlordAnalytics;
  status: string;
  message?: string;
}> => {
  const response = await httpClient.api.get("/landlords/stats");
  return response.data;
};

// Verify landlord
export const verifyLandlord = async (id: string): Promise<LandlordResponse> => {
  const response = await httpClient.api.patch(`/landlords/${id}/verify`);
  return response.data;
};

// Update landlord verification
export const updateLandlordVerification = async (
  id: string,
  verificationType: "identity" | "address" | "financial" | "business",
  verificationData: any
): Promise<LandlordResponse> => {
  const response = await httpClient.api.patch(`/landlords/${id}/verification`, {
    verificationType,
    verificationData,
  });
  return response.data;
};

// Get landlord analytics
export const getLandlordAnalytics = async (
  filters: Partial<LandlordQueryParams> = {}
): Promise<{ data: LandlordAnalytics; status: string; message?: string }> => {
  const response = await httpClient.api.get("/landlords/analytics", {
    params: filters,
  });
  return response.data;
};

// Bulk update landlords
export const bulkUpdateLandlords = async (
  landlordIds: string[],
  updateData: Partial<LandlordUpdateInput>
): Promise<any> => {
  const response = await httpClient.api.patch("/landlords/bulk-update", {
    landlordIds,
    updateData,
  });
  return response.data;
};

// Bulk delete landlords
export const bulkDeleteLandlords = async (
  landlordIds: string[]
): Promise<any> => {
  const response = await httpClient.api.delete("/landlords/bulk-delete", {
    data: { landlordIds },
  });
  return response.data;
};

// Update landlord risk assessment
export const updateLandlordRiskAssessment = async (
  id: string,
  riskData: any
): Promise<LandlordResponse> => {
  const response = await httpClient.api.patch(
    `/landlords/${id}/risk-assessment`,
    riskData
  );
  return response.data;
};

// Get landlords requiring follow-up
export const getLandlordsRequiringFollowUp =
  async (): Promise<LandlordListResponse> => {
    const response = await httpClient.api.get("/landlords/follow-up");
    return response.data;
  };

// Get expiring landlord documents
export const getExpiringLandlordDocuments = async (
  daysAhead = 30
): Promise<LandlordListResponse> => {
  const response = await httpClient.api.get(
    `/landlords/expiring-documents?daysAhead=${daysAhead}`
  );
  return response.data;
};

// Update landlord property stats
export const updateLandlordPropertyStats = async (
  id: string
): Promise<LandlordResponse> => {
  const response = await httpClient.api.patch(
    `/landlords/${id}/property-stats`
  );
  return response.data;
};
