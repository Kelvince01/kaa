import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import {
  createConsent,
  createReference,
  declineReference,
  getConsents,
  getReferences,
  getValidationSchema,
  resendReference,
  revokeConsent,
  submitReference,
  verifyTenantReferences,
} from "./reference.service";
import type {
  CreateReferenceInput,
  SubmitReferenceInput,
} from "./reference.type";

// Query keys
export const referenceKeys = {
  all: ["references"] as const,
  tenant: (tenantId: string) =>
    [...referenceKeys.all, "tenant", tenantId] as const,
};

// Get references for a tenant
export const useReferences = (tenantId: string) => {
  return useQuery({
    queryKey: referenceKeys.tenant(tenantId),
    queryFn: () => getReferences(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000, // 30 seconds
  });
};

// Create reference request
export const useCreateReference = () => {
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateReferenceInput;
    }) => createReference(tenantId, data),
    onSuccess: (_, { tenantId }) => {
      // Invalidate and refetch references for this tenant
      queryClient.invalidateQueries({
        queryKey: referenceKeys.tenant(tenantId),
      });
    },
  });
};

// Submit reference response (from referee)
export const useSubmitReference = () =>
  useMutation({
    mutationFn: ({
      token,
      data,
    }: {
      token: string;
      data: SubmitReferenceInput;
    }) => submitReference(token, data),
  });

// Verify tenant references
export const useVerifyTenantReferences = () => {
  return useMutation({
    mutationFn: (tenantId: string) => verifyTenantReferences(tenantId),
    onSuccess: (_, tenantId) => {
      // Invalidate and refetch references for this tenant
      queryClient.invalidateQueries({
        queryKey: referenceKeys.tenant(tenantId),
      });
    },
  });
};

// Resend reference request
export const useResendReference = () => {
  return useMutation({
    mutationFn: (referenceId: string) => resendReference(referenceId),
    onSuccess: () => {
      // Invalidate all reference queries to update the UI
      queryClient.invalidateQueries({ queryKey: referenceKeys.all });
    },
  });
};

// Decline reference request
export const useDeclineReference = () =>
  useMutation({
    mutationFn: ({
      token,
      declineData,
    }: {
      token: string;
      declineData: { reason: string; comment?: string };
    }) => declineReference(token, declineData),
  });

// Get validation schema
export const useValidationSchema = (referenceType: string) => {
  return useQuery({
    queryKey: ["validationSchema", referenceType],
    queryFn: () => getValidationSchema(referenceType),
    enabled: !!referenceType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create consent
export const useCreateConsent = () =>
  useMutation({
    mutationFn: (consentData: any) => createConsent(consentData),
  });

// Get consents
export const useConsents = (tenantId: string) => {
  return useQuery({
    queryKey: ["consents", tenantId],
    queryFn: () => getConsents(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000, // 30 seconds
  });
};

// Revoke consent
export const useRevokeConsent = () => {
  return useMutation({
    mutationFn: (consentId: string) => revokeConsent(consentId),
    onSuccess: () => {
      // Invalidate consent queries
      queryClient.invalidateQueries({ queryKey: ["consents"] });
    },
  });
};
