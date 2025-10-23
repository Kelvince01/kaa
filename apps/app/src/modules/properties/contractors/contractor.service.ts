import { httpClient } from "@/lib/axios";
import type {
  AvailableContractorQuery,
  AvailableContractorsResponse,
  Contractor,
  ContractorListResponse,
  ContractorQueryParams,
  ContractorResponse,
  ContractorSpecialty,
  CreateContractorInput,
  EmergencyContractorQuery,
  RateContractorInput,
  UpdateContractorInput,
} from "./contractor.type";

/**
 * Property Contractor service for managing contractors
 */

// Create a new contractor
export const createContractor = async (
  data: CreateContractorInput
): Promise<ContractorResponse> => {
  const response = await httpClient.api.post("/properties/contractors", data);
  return response.data;
};

// Get all contractors with optional filtering
export const getContractors = async (
  params: ContractorQueryParams = {}
): Promise<ContractorListResponse> => {
  const response = await httpClient.api.get("/properties/contractors", {
    params,
  });
  return response.data;
};

// Get contractor by ID
export const getContractor = async (
  id: string
): Promise<ContractorResponse> => {
  const response = await httpClient.api.get(`/properties/contractors/${id}`);
  return response.data;
};

// Check contractor availability
export const contractorAvailability = async ({
  specialty,
  serviceArea,
  date,
  startTime,
  endTime,
}: {
  specialty?: ContractorSpecialty;
  serviceArea?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
} = {}): Promise<{ available: boolean; message: string }> => {
  const response = await httpClient.api.get(
    "/properties/contractors/availability",
    {
      params: {
        specialty,
        serviceArea,
        date,
        startTime,
        endTime,
      },
    }
  );
  return response.data;
};

// Update contractor
export const updateContractor = async (
  id: string,
  data: UpdateContractorInput
): Promise<ContractorResponse> => {
  const response = await httpClient.api.put(
    `/properties/contractors/${id}`,
    data
  );
  return response.data;
};

// Delete contractor
export const deleteContractor = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(`/properties/contractors/${id}`);
  return response.data;
};

// Rate a contractor
export const rateContractor = async (
  id: string,
  data: RateContractorInput
): Promise<ContractorResponse> => {
  const response = await httpClient.api.post(
    `/properties/contractors/${id}/rate`,
    data
  );
  return response.data;
};

// Find available contractors
export const findAvailableContractors = async (
  params: AvailableContractorQuery
): Promise<AvailableContractorsResponse> => {
  const response = await httpClient.api.get(
    "/properties/contractors/available",
    { params }
  );
  return response.data;
};

// Find emergency contractors
export const findEmergencyContractors = async (
  params: EmergencyContractorQuery
): Promise<AvailableContractorsResponse> => {
  const response = await httpClient.api.get(
    "/properties/contractors/emergency",
    { params }
  );
  return response.data;
};

// Get contractor statistics
export const getContractorStats = async (
  contractorId?: string
): Promise<{
  stats: {
    totalJobs: number;
    completedJobs: number;
    averageRating: number;
    onTimePercentage: number;
    totalEarnings: number;
  };
  status: string;
}> => {
  const params = contractorId ? { contractorId } : {};
  const response = await httpClient.api.get("/properties/contractors/stats", {
    params,
  });
  return response.data;
};

// Get contractors by specialty
export const getContractorsBySpecialty = async (
  specialty: string
): Promise<ContractorListResponse> => {
  const response = await httpClient.api.get(
    `/properties/contractors/specialty/${specialty}`
  );
  return response.data;
};

// Get contractors by service area
export const getContractorsByServiceArea = async (
  serviceArea: string
): Promise<ContractorListResponse> => {
  const response = await httpClient.api.get(
    `/properties/contractors/service-area/${serviceArea}`
  );
  return response.data;
};

// Search contractors
export const searchContractors = async (
  query: string
): Promise<ContractorListResponse> => {
  const response = await httpClient.api.get("/properties/contractors/search", {
    params: { q: query },
  });
  return response.data;
};

// Get contractor work history
export const getContractorWorkHistory = async (
  contractorId: string,
  limit = 10
): Promise<{
  workOrders: any[];
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/contractors/${contractorId}/work-history`,
    {
      params: { limit },
    }
  );
  return response.data;
};

// Update contractor availability
export const updateContractorAvailability = async (
  contractorId: string,
  availability: Contractor["availability"]
): Promise<ContractorResponse> => {
  const response = await httpClient.api.patch(
    `/properties/contractors/${contractorId}/availability`,
    {
      availability,
    }
  );
  return response.data;
};

// Verify contractor license
export const verifyContractorLicense = async (
  contractorId: string
): Promise<{
  verified: boolean;
  details?: any;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.post(
    `/properties/contractors/${contractorId}/verify-license`
  );
  return response.data;
};

// Send contractor invitation
export const sendContractorInvitation = async (
  contractorId: string,
  workOrderId: string,
  message?: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/contractors/${contractorId}/invite`,
    {
      workOrderId,
      message,
    }
  );
  return response.data;
};

// Get contractor calendar
export const getContractorCalendar = async (
  contractorId: string,
  startDate: string,
  endDate: string
): Promise<{
  events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    type: string;
    status: string;
  }>;
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/contractors/${contractorId}/calendar`,
    {
      params: { startDate, endDate },
    }
  );
  return response.data;
};

// Export contractors
export const exportContractors = async (
  filters: ContractorQueryParams = {},
  format: "csv" | "xlsx" | "pdf" = "csv"
): Promise<Blob> => {
  const response = await httpClient.api.get("/properties/contractors/export", {
    params: { ...filters, format },
    responseType: "blob",
  });
  return response.data;
};

// Bulk update contractors
export const bulkUpdateContractors = async (
  contractorIds: string[],
  updates: Partial<UpdateContractorInput>
): Promise<{
  updated: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    "/properties/contractors/bulk-update",
    {
      contractorIds,
      updates,
    }
  );
  return response.data;
};

// Get contractor recommendations for work order
export const getContractorRecommendations = async (
  workOrderId: string
): Promise<{
  recommendations: Contractor[];
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/contractors/recommendations/${workOrderId}`
  );
  return response.data;
};
