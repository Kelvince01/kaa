import { httpClient } from "@/lib/axios";
import type {
  CreateReferenceInput,
  ReferenceListResponse,
  ReferenceResponseDto,
  SubmitReferenceInput,
} from "./reference.type";

// Create a reference request for a tenant
export const createReference = async (
  tenantId: string,
  data: CreateReferenceInput
): Promise<ReferenceResponseDto> => {
  const response = await httpClient.api.post(
    `/reference/request/${tenantId}`,
    data
  );
  return response.data;
};

// Get all references for a specific tenant
export const getReferences = async (
  tenantId: string
): Promise<ReferenceListResponse> => {
  const response = await httpClient.api.get(`/reference/tenant/${tenantId}`);
  return response.data;
};

// Submit a response to a reference request using a token
export const submitReference = async (
  token: string,
  data: SubmitReferenceInput
): Promise<ReferenceResponseDto> => {
  const response = await httpClient.api.post(
    `/reference/respond/${token}`,
    data
  );
  return response.data;
};

// Verify references for a tenant and get the verification score
export const verifyTenantReferences = async (
  tenantId: string
): Promise<any> => {
  const response = await httpClient.api.post(`/reference/verify/${tenantId}`);
  return response.data;
};

// Resend a reference request
export const resendReference = async (referenceId: string): Promise<any> => {
  const response = await httpClient.api.post(
    `/reference/resend/${referenceId}`
  );
  return response.data;
};

// Decline a reference request
export const declineReference = async (
  token: string,
  declineData: { reason: string; comment?: string }
): Promise<any> => {
  const response = await httpClient.api.post(
    `/reference/decline/${token}`,
    declineData
  );
  return response.data;
};

// Get validation schema for a reference type
export const getValidationSchema = async (
  referenceType: string
): Promise<any> => {
  const response = await httpClient.api.get(
    `/reference/validation-schema/${referenceType}`
  );
  return response.data;
};

// Create consent
export const createConsent = async (consentData: any): Promise<any> => {
  const response = await httpClient.api.post("/reference/consent", consentData);
  return response.data;
};

// Get consents for a tenant
export const getConsents = async (tenantId: string): Promise<any> => {
  const response = await httpClient.api.get(
    `/reference/consent/tenant/${tenantId}`
  );
  return response.data;
};

// Revoke consent
export const revokeConsent = async (consentId: string): Promise<any> => {
  const response = await httpClient.api.put(
    `/reference/consent/${consentId}/revoke`
  );
  return response.data;
};
