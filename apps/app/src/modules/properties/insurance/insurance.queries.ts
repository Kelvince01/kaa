import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as insuranceService from "./insurance.service";
import type {
  CreateInsurancePolicyInput,
  InsuranceClaimQueryParams,
  InsurancePolicyQueryParams,
  UpdateInsuranceClaimInput,
  UpdateInsurancePolicyInput,
} from "./insurance.type";

/**
 * Insurance query keys for consistent cache management
 */
export const insuranceKeys = {
  all: ["insurance"] as const,
  policies: () => [...insuranceKeys.all, "policies"] as const,
  policyLists: () => [...insuranceKeys.policies(), "list"] as const,
  policyList: (params: InsurancePolicyQueryParams) =>
    [...insuranceKeys.policyLists(), params] as const,
  policyDetails: () => [...insuranceKeys.policies(), "detail"] as const,
  policyDetail: (id: string) => [...insuranceKeys.policyDetails(), id] as const,
  claims: () => [...insuranceKeys.all, "claims"] as const,
  claimLists: () => [...insuranceKeys.claims(), "list"] as const,
  claimList: (params: InsuranceClaimQueryParams) =>
    [...insuranceKeys.claimLists(), params] as const,
  claimDetails: () => [...insuranceKeys.claims(), "detail"] as const,
  claimDetail: (id: string) => [...insuranceKeys.claimDetails(), id] as const,
  stats: () => [...insuranceKeys.all, "stats"] as const,
  statsByProperty: (propertyId: string) =>
    [...insuranceKeys.stats(), propertyId] as const,
  expiring: (days: number) =>
    [...insuranceKeys.policies(), "expiring", days] as const,
  expired: () => [...insuranceKeys.policies(), "expired"] as const,
  byProperty: (propertyId: string) =>
    [...insuranceKeys.policies(), "by-property", propertyId] as const,
  claimsByProperty: (propertyId: string) =>
    [...insuranceKeys.claims(), "by-property", propertyId] as const,
  claimsByPolicy: (policyId: string) =>
    [...insuranceKeys.claims(), "by-policy", policyId] as const,
  reminders: () => [...insuranceKeys.all, "reminders"] as const,
  recommendations: (propertyId: string) =>
    [...insuranceKeys.all, "recommendations", propertyId] as const,
  attachments: (claimId: string) =>
    [...insuranceKeys.claims(), "attachments", claimId] as const,
};

/**
 * Query Hooks - for fetching data
 */

// Get all insurance policies with filtering
export const useInsurancePolicies = (
  params: InsurancePolicyQueryParams = {}
) => {
  return useQuery({
    queryKey: insuranceKeys.policyList(params),
    queryFn: () => insuranceService.getInsurancePolicies(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get insurance policy by ID
export const useInsurancePolicy = (id: string) =>
  useQuery({
    queryKey: insuranceKeys.policyDetail(id),
    queryFn: () => insuranceService.getInsurancePolicy(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Get all insurance claims with filtering
export const useInsuranceClaims = (params: InsuranceClaimQueryParams = {}) =>
  useQuery({
    queryKey: insuranceKeys.claimList(params),
    queryFn: () => insuranceService.getInsuranceClaims(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

// Get insurance claim by ID
export const useInsuranceClaim = (id: string) =>
  useQuery({
    queryKey: insuranceKeys.claimDetail(id),
    queryFn: () => insuranceService.getInsuranceClaim(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Get insurance statistics
export const useInsuranceStats = (propertyId?: string) => {
  return useQuery({
    queryKey: propertyId
      ? insuranceKeys.statsByProperty(propertyId)
      : insuranceKeys.stats(),
    queryFn: () => insuranceService.getInsuranceStats(propertyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get expiring policies
export const useExpiringPolicies = (days = 30) =>
  useQuery({
    queryKey: insuranceKeys.expiring(days),
    queryFn: () => insuranceService.getExpiringPolicies(days),
    staleTime: 5 * 60 * 1000,
  });

// Get expired policies
export const useExpiredPolicies = () =>
  useQuery({
    queryKey: insuranceKeys.expired(),
    queryFn: insuranceService.getExpiredPolicies,
    staleTime: 5 * 60 * 1000,
  });

// Get policies by property
export const usePoliciesByProperty = (propertyId: string) =>
  useQuery({
    queryKey: insuranceKeys.byProperty(propertyId),
    queryFn: () => insuranceService.getPoliciesByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get claims by property
export const useClaimsByProperty = (propertyId: string) =>
  useQuery({
    queryKey: insuranceKeys.claimsByProperty(propertyId),
    queryFn: () => insuranceService.getClaimsByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get claims by policy
export const useClaimsByPolicy = (policyId: string) =>
  useQuery({
    queryKey: insuranceKeys.claimsByPolicy(policyId),
    queryFn: () => insuranceService.getClaimsByPolicy(policyId),
    enabled: !!policyId,
    staleTime: 5 * 60 * 1000,
  });

// Get insurance reminders
export const useInsuranceReminders = () =>
  useQuery({
    queryKey: insuranceKeys.reminders(),
    queryFn: insuranceService.getInsuranceReminders,
    staleTime: 2 * 60 * 1000,
  });

// Get insurance recommendations
export const useInsuranceRecommendations = (propertyId: string) =>
  useQuery({
    queryKey: insuranceKeys.recommendations(propertyId),
    queryFn: () => insuranceService.getInsuranceRecommendations(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get claim attachments
export const useClaimAttachments = (claimId: string) =>
  useQuery({
    queryKey: insuranceKeys.attachments(claimId),
    queryFn: () => insuranceService.getClaimAttachments(claimId),
    enabled: !!claimId,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Mutation Hooks - for modifying data
 */

// Create insurance policy
export const useCreateInsurancePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: insuranceService.createInsurancePolicy,
    onSuccess: (data) => {
      // Add policy to cache
      const policy = data.policy || data.data;
      if (policy) {
        queryClient.setQueryData(insuranceKeys.policyDetail(policy._id), data);
      }

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: insuranceKeys.policyLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Update insurance policy
export const useUpdateInsurancePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInsurancePolicyInput;
    }) => insuranceService.updateInsurancePolicy(id, data),
    onSuccess: (data, variables) => {
      // Update policy in cache
      queryClient.setQueryData(insuranceKeys.policyDetail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: insuranceKeys.policyLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Delete insurance policy
export const useDeleteInsurancePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: insuranceService.deleteInsurancePolicy,
    onSuccess: (_, policyId) => {
      // Remove policy from cache
      queryClient.removeQueries({
        queryKey: insuranceKeys.policyDetail(policyId),
      });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: insuranceKeys.policyLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Renew insurance policy
export const useRenewInsurancePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      policyId,
      renewalData,
    }: {
      policyId: string;
      renewalData: Partial<CreateInsurancePolicyInput>;
    }) => insuranceService.renewInsurancePolicy(policyId, renewalData),
    onSuccess: (data, variables) => {
      // Update policy in cache
      queryClient.setQueryData(
        insuranceKeys.policyDetail(variables.policyId),
        data
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: insuranceKeys.policyLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.expiring(30) });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Cancel insurance policy
export const useCancelInsurancePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ policyId, reason }: { policyId: string; reason: string }) =>
      insuranceService.cancelInsurancePolicy(policyId, reason),
    onSuccess: (data, variables) => {
      // Update policy in cache
      queryClient.setQueryData(
        insuranceKeys.policyDetail(variables.policyId),
        data
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: insuranceKeys.policyLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Create insurance claim
export const useCreateInsuranceClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: insuranceService.createInsuranceClaim,
    onSuccess: (data) => {
      // Add claim to cache
      const claim = data.claim || data.data;
      if (claim) {
        queryClient.setQueryData(insuranceKeys.claimDetail(claim._id), data);
      }

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: insuranceKeys.claimLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Update insurance claim
export const useUpdateInsuranceClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInsuranceClaimInput;
    }) => insuranceService.updateInsuranceClaim(id, data),
    onSuccess: (data, variables) => {
      // Update claim in cache
      queryClient.setQueryData(insuranceKeys.claimDetail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: insuranceKeys.claimLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Delete insurance claim
export const useDeleteInsuranceClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: insuranceService.deleteInsuranceClaim,
    onSuccess: (_, claimId) => {
      // Remove claim from cache
      queryClient.removeQueries({
        queryKey: insuranceKeys.claimDetail(claimId),
      });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: insuranceKeys.claimLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Submit insurance claim
export const useSubmitInsuranceClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: insuranceService.submitInsuranceClaim,
    onSuccess: (data) => {
      // Update claim in cache
      queryClient.setQueryData(
        insuranceKeys.claimDetail(data.data?._id as string),
        data
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: insuranceKeys.claimLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Process insurance claim
export const useProcessInsuranceClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      data,
    }: {
      id: string;
      action: "approve" | "reject" | "settle";
      data: any;
    }) => insuranceService.processInsuranceClaim(id, action, data),
    onSuccess: (data, variables) => {
      // Update claim in cache
      queryClient.setQueryData(insuranceKeys.claimDetail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: insuranceKeys.claimLists() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Upload claim attachment
export const useUploadClaimAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      claimId,
      file,
      description,
    }: {
      claimId: string;
      file: File;
      description?: string;
    }) => insuranceService.uploadClaimAttachment(claimId, file, description),
    onSuccess: (_, variables) => {
      // Invalidate attachments query
      queryClient.invalidateQueries({
        queryKey: insuranceKeys.attachments(variables.claimId),
      });

      // Update claim in cache
      queryClient.invalidateQueries({
        queryKey: insuranceKeys.claimDetail(variables.claimId),
      });
    },
  });
};

// Delete claim attachment
export const useDeleteClaimAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      claimId,
      attachmentId,
    }: {
      claimId: string;
      attachmentId: string;
    }) => insuranceService.deleteClaimAttachment(claimId, attachmentId),
    onSuccess: (_, variables) => {
      // Invalidate attachments query
      queryClient.invalidateQueries({
        queryKey: insuranceKeys.attachments(variables.claimId),
      });

      // Update claim in cache
      queryClient.invalidateQueries({
        queryKey: insuranceKeys.claimDetail(variables.claimId),
      });
    },
  });
};

// Send insurance reminder
export const useSendInsuranceReminder = () =>
  useMutation({
    mutationFn: ({
      policyId,
      reminderType,
      customMessage,
    }: {
      policyId: string;
      reminderType: "renewal" | "payment" | "document" | "custom";
      customMessage?: string;
    }) =>
      insuranceService.sendInsuranceReminder(
        policyId,
        reminderType,
        customMessage
      ),
  });

// Bulk update policies
export const useBulkUpdatePolicies = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      policyIds,
      updates,
    }: {
      policyIds: string[];
      updates: Partial<UpdateInsurancePolicyInput>;
    }) => insuranceService.bulkUpdatePolicies(policyIds, updates),
    onSuccess: () => {
      // Invalidate all policy queries
      queryClient.invalidateQueries({ queryKey: insuranceKeys.policies() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Bulk update claims
export const useBulkUpdateClaims = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      claimIds,
      updates,
    }: {
      claimIds: string[];
      updates: Partial<UpdateInsuranceClaimInput>;
    }) => insuranceService.bulkUpdateClaims(claimIds, updates),
    onSuccess: () => {
      // Invalidate all claim queries
      queryClient.invalidateQueries({ queryKey: insuranceKeys.claims() });
      queryClient.invalidateQueries({ queryKey: insuranceKeys.stats() });
    },
  });
};

// Generate insurance report
export const useGenerateInsuranceReport = () =>
  useMutation({
    mutationFn: ({
      type,
      filters,
      format,
    }: {
      type: "policies" | "claims" | "summary";
      filters?: any;
      format?: "pdf" | "xlsx" | "csv";
    }) => insuranceService.generateInsuranceReport(type, filters, format),
  });

// Export insurance data
export const useExportInsuranceData = () =>
  useMutation({
    mutationFn: ({
      type,
      filters,
      format,
    }: {
      type: "policies" | "claims";
      filters?: InsurancePolicyQueryParams | InsuranceClaimQueryParams;
      format?: "csv" | "xlsx" | "pdf";
    }) => insuranceService.exportInsuranceData(type, filters, format),
  });

/**
 * Utility functions for cache management
 */

// Prefetch insurance policy
export const usePrefetchInsurancePolicy = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: insuranceKeys.policyDetail(id),
      queryFn: () => insuranceService.getInsurancePolicy(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Prefetch insurance claim
export const usePrefetchInsuranceClaim = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: insuranceKeys.claimDetail(id),
      queryFn: () => insuranceService.getInsuranceClaim(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Invalidate all insurance queries
export const useInvalidateInsurance = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: insuranceKeys.all });
  };
};
