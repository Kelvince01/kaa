import { httpClient } from "@/lib/axios";
import type {
  CreateInsuranceClaimInput,
  CreateInsurancePolicyInput,
  InsuranceClaimListResponse,
  InsuranceClaimQueryParams,
  InsuranceClaimResponse,
  InsurancePolicyListResponse,
  InsurancePolicyQueryParams,
  InsurancePolicyResponse,
  InsuranceRecommendationResponse,
  InsuranceStatsResponse,
  UpdateInsuranceClaimInput,
  UpdateInsurancePolicyInput,
} from "./insurance.type";

/**
 * Property Insurance service for managing insurance policies and claims
 */

// ============ INSURANCE POLICIES ============

// Create a new insurance policy
export const createInsurancePolicy = async (
  data: CreateInsurancePolicyInput
): Promise<InsurancePolicyResponse> => {
  const response = await httpClient.api.post(
    "/properties/insurance/policies",
    data
  );
  return response.data;
};

// Get all insurance policies with optional filtering
export const getInsurancePolicies = async (
  params: InsurancePolicyQueryParams = {}
): Promise<InsurancePolicyListResponse> => {
  const response = await httpClient.api.get("/properties/insurance/policies", {
    params,
  });
  return response.data;
};

// Get insurance policy by ID
export const getInsurancePolicy = async (
  id: string
): Promise<InsurancePolicyResponse> => {
  const response = await httpClient.api.get(
    `/properties/insurance/policies/${id}`
  );
  return response.data;
};

// Update insurance policy
export const updateInsurancePolicy = async (
  id: string,
  data: UpdateInsurancePolicyInput
): Promise<InsurancePolicyResponse> => {
  const response = await httpClient.api.put(
    `/properties/insurance/policies/${id}`,
    data
  );
  return response.data;
};

// Delete insurance policy
export const deleteInsurancePolicy = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/insurance/policies/${id}`
  );
  return response.data;
};

// Renew insurance policy
export const renewInsurancePolicy = async (
  id: string,
  renewalData?: Partial<CreateInsurancePolicyInput>
): Promise<InsurancePolicyResponse> => {
  const response = await httpClient.api.post(
    `/properties/insurance/policies/${id}/renew`,
    renewalData
  );
  return response.data;
};

// Cancel insurance policy
export const cancelInsurancePolicy = async (
  id: string,
  reason: string
): Promise<InsurancePolicyResponse> => {
  const response = await httpClient.api.post(
    `/properties/insurance/policies/${id}/cancel`,
    {
      reason,
    }
  );
  return response.data;
};

// Get policies by landlord
export const getPoliciesByLandlord = async (
  landlordId: string
): Promise<InsurancePolicyListResponse> => {
  const response = await httpClient.api.get(
    `/properties/insurance/policies/landlord/${landlordId}`
  );
  return response.data;
};

// Get policies by property
export const getPoliciesByProperty = async (
  propertyId: string
): Promise<InsurancePolicyListResponse> => {
  const response = await httpClient.api.get(
    `/properties/insurance/policies/property/${propertyId}`
  );
  return response.data;
};

// Get expiring policies
export const getExpiringPolicies = async (
  days = 30
): Promise<InsurancePolicyListResponse> => {
  const response = await httpClient.api.get(
    "/properties/insurance/policies/expiring",
    {
      params: { days },
    }
  );
  return response.data;
};

// Get expired policies
export const getExpiredPolicies =
  async (): Promise<InsurancePolicyListResponse> => {
    const response = await httpClient.api.get(
      "/properties/insurance/policies/expired"
    );
    return response.data;
  };

// ============ INSURANCE CLAIMS ============

// Create a new insurance claim
export const createInsuranceClaim = async (
  data: CreateInsuranceClaimInput
): Promise<InsuranceClaimResponse> => {
  const response = await httpClient.api.post(
    "/properties/insurance/claims",
    data
  );
  return response.data;
};

// Submit a new insurance claim
export const submitInsuranceClaim = async (
  data: CreateInsuranceClaimInput
): Promise<InsuranceClaimResponse> => {
  const formData = new FormData();

  // Add basic claim data
  for (const [key, value] of Object.entries(data)) {
    if (key !== "attachments" && key !== "incident") {
      formData.append(
        key,
        typeof value === "object" ? JSON.stringify(value) : (value as any)
      );
    }
  }

  // Add incident data
  formData.append("incident", JSON.stringify(data.incident));

  // Add attachments if any
  if (data.attachments) {
    for (const file of data.attachments) {
      formData.append("attachments", file);
    }
  }

  const response = await httpClient.api.post(
    "/properties/insurance/claims",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Get all insurance claims with optional filtering
export const getInsuranceClaims = async (
  params: InsuranceClaimQueryParams = {}
): Promise<InsuranceClaimListResponse> => {
  const response = await httpClient.api.get("/properties/insurance/claims", {
    params,
  });
  return response.data;
};

// Get insurance claim by ID
export const getInsuranceClaim = async (
  id: string
): Promise<InsuranceClaimResponse> => {
  const response = await httpClient.api.get(
    `/properties/insurance/claims/${id}`
  );
  return response.data;
};

// Update insurance claim
export const updateInsuranceClaim = async (
  id: string,
  data: UpdateInsuranceClaimInput
): Promise<InsuranceClaimResponse> => {
  const response = await httpClient.api.put(
    `/properties/insurance/claims/${id}`,
    data
  );
  return response.data;
};

// Delete insurance claim
export const deleteInsuranceClaim = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/insurance/claims/${id}`
  );
  return response.data;
};

// Process insurance claim
export const processInsuranceClaim = async (
  id: string,
  action: "approve" | "reject" | "settle",
  data: any
): Promise<InsuranceClaimResponse> => {
  const response = await httpClient.api.post(
    `/properties/insurance/claims/${id}/process`,
    {
      action,
      data,
    }
  );
  return response.data;
};

// Get claims by landlord
export const getClaimsByLandlord = async (
  landlordId: string
): Promise<InsuranceClaimListResponse> => {
  const response = await httpClient.api.get(
    `/properties/insurance/claims/landlord/${landlordId}`
  );
  return response.data;
};

// Get claims by property
export const getClaimsByProperty = async (
  propertyId: string
): Promise<InsuranceClaimListResponse> => {
  const response = await httpClient.api.get(
    `/properties/insurance/claims/property/${propertyId}`
  );
  return response.data;
};

// Get claims by policy
export const getClaimsByPolicy = async (
  policyId: string
): Promise<InsuranceClaimListResponse> => {
  const response = await httpClient.api.get(
    `/properties/insurance/claims/policy/${policyId}`
  );
  return response.data;
};

// Upload claim attachment
export const uploadClaimAttachment = async (
  claimId: string,
  file: File,
  description?: string
): Promise<{
  attachment: {
    name: string;
    url: string;
    type: string;
    description?: string;
  };
  status: string;
  message: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);
  if (description) {
    formData.append("description", description);
  }

  const response = await httpClient.api.post(
    `/properties/insurance/claims/${claimId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Delete claim attachment
export const deleteClaimAttachment = async (
  claimId: string,
  attachmentId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/insurance/claims/${claimId}/attachments/${attachmentId}`
  );
  return response.data;
};

// Get claim attachments
export const getClaimAttachments = async (
  claimId: string
): Promise<{
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    description?: string;
    uploadedAt: string;
  }>;
  status: string;
}> => {
  const response = await httpClient.api.get(
    `/properties/insurance/claims/${claimId}/attachments`
  );
  return response.data;
};

// ============ STATISTICS & REPORTS ============

// Get insurance statistics
export const getInsuranceStats = async (
  landlordId?: string
): Promise<InsuranceStatsResponse> => {
  const params = landlordId ? { landlordId } : {};
  const response = await httpClient.api.get("/properties/insurance/stats", {
    params,
  });
  return response.data;
};

// Get insurance recommendations for property
export const getInsuranceRecommendations = async (
  propertyId: string
): Promise<InsuranceRecommendationResponse> => {
  const response = await httpClient.api.get(
    `/properties/insurance/recommendations/${propertyId}`
  );
  return response.data;
};

// Generate insurance report
export const generateInsuranceReport = async (
  type: "policies" | "claims" | "summary",
  filters: any = {},
  format: "csv" | "xlsx" | "pdf" = "csv"
): Promise<{
  report: {
    type: string;
    generatedAt: string;
    data: any;
  };
  status: string;
}> => {
  const response = await httpClient.api.post(
    "/properties/insurance/reports/generate",
    {
      type,
      filters,
      format,
    }
  );
  return response.data;
};

// Export insurance data
export const exportInsuranceData = async (
  type: "policies" | "claims",
  filters: any = {},
  format: "csv" | "xlsx" | "pdf" = "csv"
): Promise<Blob> => {
  const response = await httpClient.api.get(
    `/properties/insurance/export/${type}`,
    {
      params: { ...filters, format },
      responseType: "blob",
    }
  );
  return response.data;
};

// ============ NOTIFICATIONS & REMINDERS ============

// Get insurance reminders
export const getInsuranceReminders = async (): Promise<{
  reminders: Array<{
    id: string;
    type: "renewal" | "payment" | "document" | "claim";
    policyId?: string;
    claimId?: string;
    message: string;
    dueDate: string;
    status: "pending" | "sent" | "completed";
  }>;
  status: string;
}> => {
  const response = await httpClient.api.get("/properties/insurance/reminders");
  return response.data;
};

// Send insurance reminder
export const sendInsuranceReminder = async (
  policyId: string,
  reminderType: "renewal" | "payment" | "document" | "custom",
  customMessage?: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/insurance/policies/${policyId}/remind`,
    {
      reminderType,
      customMessage,
    }
  );
  return response.data;
};

// Send policy renewal reminder
export const sendPolicyRenewalReminder = async (
  policyId: string,
  reminderType: "30_days" | "15_days" | "7_days" | "custom",
  customMessage?: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/insurance/policies/${policyId}/remind`,
    {
      reminderType,
      customMessage,
    }
  );
  return response.data;
};

// Send claim update notification
export const sendClaimUpdateNotification = async (
  claimId: string,
  recipients?: string[]
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/insurance/claims/${claimId}/notify`,
    {
      recipients,
    }
  );
  return response.data;
};

// ============ BULK OPERATIONS ============

// Bulk update policies
export const bulkUpdatePolicies = async (
  policyIds: string[],
  updates: Partial<UpdateInsurancePolicyInput>
): Promise<{
  updated: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    "/properties/insurance/policies/bulk-update",
    {
      policyIds,
      updates,
    }
  );
  return response.data;
};

// Bulk process claims
export const bulkProcessClaims = async (
  claimIds: string[],
  action: "approve" | "reject" | "close",
  data?: any
): Promise<{
  processed: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    "/properties/insurance/claims/bulk-process",
    {
      claimIds,
      action,
      data,
    }
  );
  return response.data;
};

// Bulk update claims
export const bulkUpdateClaims = async (
  claimIds: string[],
  updates: Partial<UpdateInsuranceClaimInput>
): Promise<{
  updated: number;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.patch(
    "/properties/insurance/claims/bulk-update",
    {
      claimIds,
      updates,
    }
  );
  return response.data;
};

// Check expiring policies (automated task)
export const checkExpiringPolicies = async (): Promise<{
  message: string;
  notified: number;
}> => {
  const response = await httpClient.api.post(
    "/properties/insurance/check-expiring"
  );
  return response.data;
};

// Check overdue payments (automated task)
export const checkOverduePayments = async (): Promise<{
  message: string;
  processed: number;
}> => {
  const response = await httpClient.api.post(
    "/properties/insurance/check-overdue"
  );
  return response.data;
};
