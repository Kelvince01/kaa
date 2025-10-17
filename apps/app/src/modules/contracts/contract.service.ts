import { httpClient } from "@/lib/axios";
import type {
  Amendment,
  Contract,
  ContractDocument,
  ContractListResponse,
  ContractQueryParams,
  ContractRenewalInput,
  ContractResponse,
  ContractSigningInput,
  ContractStatsResponse,
  ContractTerminationInput,
  CreateContractInput,
  UpdateContractInput,
} from "./contract.type";

/**
 * Contract service for managing rental contracts
 */

// Create a new contract
export const createContract = async (
  data: CreateContractInput
): Promise<ContractResponse> => {
  const response = await httpClient.api.post("/contracts", data);
  return response.data;
};

// Get all contracts with optional filtering
export const getContracts = async (
  params: ContractQueryParams = {}
): Promise<ContractListResponse> => {
  const response = await httpClient.api.get("/contracts", { params });
  return response.data;
};

// Get contract by ID
export const getContract = async (id: string): Promise<ContractResponse> => {
  const response = await httpClient.api.get(`/contracts/${id}`);
  return response.data;
};

// Update contract
export const updateContract = async (
  id: string,
  data: UpdateContractInput
): Promise<ContractResponse> => {
  const response = await httpClient.api.patch(`/contracts/${id}`, data);
  return response.data;
};

// Delete contract
export const deleteContract = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(`/contracts/${id}`);
  return response.data;
};

// Sign contract
export const signContract = async (
  id: string,
  data: ContractSigningInput
): Promise<ContractResponse> => {
  const response = await httpClient.api.post(`/contracts/${id}/sign`, data);
  return response.data;
};

// Terminate contract
export const terminateContract = async (
  id: string,
  data: ContractTerminationInput
): Promise<ContractResponse> => {
  const response = await httpClient.api.post(
    `/contracts/${id}/terminate`,
    data
  );
  return response.data;
};

// Renew contract
export const renewContract = async (
  id: string,
  data: ContractRenewalInput
): Promise<ContractResponse> => {
  const response = await httpClient.api.post(`/contracts/${id}/renew`, data);
  return response.data;
};

// Get contract statistics
export const getContractStats = async (): Promise<ContractStatsResponse> => {
  const response = await httpClient.api.get("/contracts/stats");
  return response.data;
};

// Generate contract PDF
export const generateContractPDF = async (
  id: string
): Promise<{ url: string; status: string }> => {
  const response = await httpClient.api.post(`/contracts/${id}/generate-pdf`);
  return response.data;
};

// Download contract PDF
export const downloadContractPDF = async (id: string): Promise<Blob> => {
  const response = await httpClient.api.get(`/contracts/${id}/pdf`, {
    responseType: "blob",
  });
  return response.data;
};

// Upload contract document
export const uploadContractDocument = async (
  contractId: string,
  file: File,
  documentType: string,
  description?: string
): Promise<{ document: ContractDocument; status: string; message: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", documentType);
  if (description) {
    formData.append("description", description);
  }

  const response = await httpClient.api.post(
    `/contracts/${contractId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Delete contract document
export const deleteContractDocument = async (
  contractId: string,
  documentId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/contracts/${contractId}/documents/${documentId}`
  );
  return response.data;
};

// Get contract templates
export const getContractTemplates = async (): Promise<{
  templates: any[];
  status: string;
}> => {
  const response = await httpClient.api.get("/contracts/templates");
  return response.data;
};

// Create contract template
export const createContractTemplate = async (
  data: any
): Promise<{
  template?: any;
  data?: any;
  status: string;
  message?: string;
}> => {
  const response = await httpClient.api.post("/contracts/templates", data);
  return response.data;
};

// Update contract template
export const updateContractTemplate = async (
  id: string,
  data: any
): Promise<{
  template?: any;
  data?: any;
  status: string;
  message?: string;
}> => {
  const response = await httpClient.api.patch(
    `/contracts/templates/${id}`,
    data
  );
  return response.data;
};

// Delete contract template
export const deleteContractTemplate = async (
  id: string
): Promise<{ status: string; message?: string }> => {
  const response = await httpClient.api.delete(`/contracts/templates/${id}`);
  return response.data;
};

// Duplicate contract template
export const duplicateContractTemplate = async (
  id: string
): Promise<{
  template?: any;
  data?: any;
  status: string;
  message?: string;
}> => {
  const response = await httpClient.api.post(
    `/contracts/templates/${id}/duplicate`
  );
  return response.data;
};

// Create contract amendment
export const createContractAmendment = async (
  contractId: string,
  amendmentData: {
    amendmentReason: string;
    changes: Array<{
      field: string;
      oldValue: string;
      newValue: string;
    }>;
  }
): Promise<ContractResponse> => {
  const response = await httpClient.api.post(
    `/contracts/${contractId}/amendments`,
    amendmentData
  );
  return response.data;
};

// Approve contract amendment
export const approveContractAmendment = async (
  contractId: string,
  amendmentId: string
): Promise<ContractResponse> => {
  const response = await httpClient.api.post(
    `/contracts/${contractId}/amendments/${amendmentId}/approve`
  );
  return response.data;
};

// Reject contract amendment
export const rejectContractAmendment = async (
  contractId: string,
  amendmentId: string,
  reason?: string
): Promise<ContractResponse> => {
  const response = await httpClient.api.post(
    `/contracts/${contractId}/amendments/${amendmentId}/reject`,
    {
      reason,
    }
  );
  return response.data;
};

// Send contract for signing
export const sendContractForSigning = async (
  contractId: string,
  recipients?: string[]
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/contracts/${contractId}/send-for-signing`,
    {
      recipients,
    }
  );
  return response.data;
};

// Archive contract
export const archiveContract = async (
  id: string
): Promise<ContractResponse> => {
  const response = await httpClient.api.post(`/contracts/${id}/archive`);
  return response.data;
};

// Unarchive contract
export const unarchiveContract = async (
  id: string
): Promise<ContractResponse> => {
  const response = await httpClient.api.post(`/contracts/${id}/unarchive`);
  return response.data;
};

// Duplicate contract
export const duplicateContract = async (
  id: string
): Promise<ContractResponse> => {
  const response = await httpClient.api.post(`/contracts/${id}/duplicate`);
  return response.data;
};

// Export contracts
export const exportContracts = async (
  filters: ContractQueryParams = {},
  format = "pdf" as "pdf" | "csv" | "xlsx"
): Promise<Blob> => {
  const response = await httpClient.api.get("/contracts/export", {
    params: { ...filters, format },
    responseType: "blob",
  });
  return response.data;
};

// Get contracts expiring soon
export const getExpiringContracts = async (
  days = 30
): Promise<ContractListResponse> => {
  const response = await httpClient.api.get("/contracts/expiring", {
    params: { days },
  });
  return response.data;
};

// Get contracts due for renewal
export const getContractsDueForRenewal = async (
  days = 60
): Promise<ContractListResponse> => {
  const response = await httpClient.api.get("/contracts/due-for-renewal", {
    params: { days },
  });
  return response.data;
};

// Send payment reminder
export const sendPaymentReminder = async (
  contractId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/contracts/${contractId}/payment-reminder`
  );
  return response.data;
};

// Get contract audit logs
export const getContractAuditLogs = async (
  contractId: string
): Promise<{ logs: any[]; status: string }> => {
  const response = await httpClient.api.get(
    `/contracts/${contractId}/audit-logs`
  );
  return response.data;
};

// Validate contract data
export const validateContractData = async (
  data: CreateContractInput | UpdateContractInput
): Promise<{ isValid: boolean; errors?: string[]; status: string }> => {
  const response = await httpClient.api.post("/contracts/validate", data);
  return response.data;
};

// Get contract by tenant
export const getContractsByTenant = async (
  tenantId: string
): Promise<ContractListResponse> => {
  const response = await httpClient.api.get(`/contracts/by-tenant/${tenantId}`);
  return response.data;
};

// Get contract by property
export const getContractsByProperty = async (
  propertyId: string
): Promise<ContractListResponse> => {
  const response = await httpClient.api.get(
    `/contracts/by-property/${propertyId}`
  );
  return response.data;
};

// Get contract by unit
export const getContractsByUnit = async (
  unitId: string
): Promise<ContractListResponse> => {
  const response = await httpClient.api.get(`/contracts/by-unit/${unitId}`);
  return response.data;
};

// Check for contract overlaps
export const checkContractOverlaps = async (
  propertyId: string,
  unitId: string | undefined,
  startDate: string,
  endDate: string,
  excludeContractId?: string
): Promise<{
  hasOverlap: boolean;
  overlappingContracts?: Contract[];
  status: string;
}> => {
  const response = await httpClient.api.post("/contracts/check-overlaps", {
    propertyId,
    unitId,
    startDate,
    endDate,
    excludeContractId,
  });
  return response.data;
};

// Get contract amendment history
export const getContractAmendmentHistory = async (
  contractId: string
): Promise<{ amendments: Amendment[]; status: string }> => {
  const response = await httpClient.api.get(
    `/contracts/${contractId}/amendments`
  );
  return response.data;
};

// Get pending amendments for user
export const getPendingAmendments = async (): Promise<{
  pendingAmendments: Amendment[];
  status: string;
}> => {
  const response = await httpClient.api.get("/contracts/amendments/pending");
  return response.data;
};
