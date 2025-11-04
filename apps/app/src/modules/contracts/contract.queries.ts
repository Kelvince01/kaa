import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import * as contractService from "./contract.service";
import type {
  ContractQueryParams,
  ContractRenewalInput,
  ContractSigningInput,
  ContractTerminationInput,
  UpdateContractInput,
} from "./contract.type";

/**
 * Contract query keys for consistent cache management
 */
export const contractKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractKeys.all, "list"] as const,
  list: (params: ContractQueryParams) =>
    [...contractKeys.lists(), params] as const,
  details: () => [...contractKeys.all, "detail"] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
  stats: () => [...contractKeys.all, "stats"] as const,
  templates: () => [...contractKeys.all, "templates"] as const,
  expiring: (days: number) => [...contractKeys.all, "expiring", days] as const,
  dueForRenewal: (days: number) =>
    [...contractKeys.all, "due-for-renewal", days] as const,
  byTenant: (tenantId: string) =>
    [...contractKeys.all, "by-tenant", tenantId] as const,
  byProperty: (propertyId: string) =>
    [...contractKeys.all, "by-property", propertyId] as const,
  byUnit: (unitId: string) => [...contractKeys.all, "by-unit", unitId] as const,
  auditLogs: (contractId: string) =>
    [...contractKeys.all, "audit-logs", contractId] as const,
  amendmentHistory: (amendmentId: string) =>
    [...contractKeys.all, "amendment-history", amendmentId] as const,
  pendingAmendments: () => [...contractKeys.all, "pending-amendments"] as const,
};

/**
 * Query Hooks - for fetching data
 */

// Get all contracts with filtering
export const useContracts = (params: ContractQueryParams = {}) => {
  return useQuery({
    queryKey: contractKeys.list(params),
    queryFn: () => contractService.getContracts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get contract by ID
export const useContract = (id: string) =>
  useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => contractService.getContract(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Get contract statistics
export const useContractStats = () => {
  return useQuery({
    queryKey: contractKeys.stats(),
    queryFn: contractService.getContractStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get contract templates
export const useContractTemplates = () => {
  return useQuery({
    queryKey: contractKeys.templates(),
    queryFn: contractService.getContractTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get expiring contracts
export const useExpiringContracts = (days = 30) =>
  useQuery({
    queryKey: contractKeys.expiring(days),
    queryFn: () => contractService.getExpiringContracts(days),
    staleTime: 5 * 60 * 1000,
  });

// Get contracts due for renewal
export const useContractsDueForRenewal = (days = 60) =>
  useQuery({
    queryKey: contractKeys.dueForRenewal(days),
    queryFn: () => contractService.getContractsDueForRenewal(days),
    staleTime: 5 * 60 * 1000,
  });

// Get contracts by tenant
export const useContractsByTenant = (tenantId: string) =>
  useQuery({
    queryKey: contractKeys.byTenant(tenantId),
    queryFn: () => contractService.getContractsByTenant(tenantId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

// Get contracts by property
export const useContractsByProperty = (propertyId: string) =>
  useQuery({
    queryKey: contractKeys.byProperty(propertyId),
    queryFn: () => contractService.getContractsByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

// Get contracts by unit
export const useContractsByUnit = (unitId: string) =>
  useQuery({
    queryKey: contractKeys.byUnit(unitId),
    queryFn: () => contractService.getContractsByUnit(unitId),
    enabled: !!unitId,
    staleTime: 5 * 60 * 1000,
  });

// Get contract audit logs
export const useContractAuditLogs = (contractId: string) => {
  return useQuery({
    queryKey: contractKeys.auditLogs(contractId),
    queryFn: () => contractService.getContractAuditLogs(contractId),
    enabled: !!contractId,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Get contract amendment history
export const useContractAmendmentHistory = (contractId: string) => {
  return useQuery({
    queryKey: contractKeys.amendmentHistory(contractId),
    queryFn: () => contractService.getContractAmendmentHistory(contractId),
    enabled: !!contractId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get pending amendments for user
export const usePendingAmendments = () => {
  return useQuery({
    queryKey: contractKeys.pendingAmendments(),
    queryFn: contractService.getPendingAmendments,
    staleTime: 30 * 1000, // 30 seconds (since these need to be more real-time)
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every minute for pending items
  });
};

/**
 * Mutation Hooks - for modifying data
 */

// Create contract
export const useCreateContract = () => {
  return useMutation({
    mutationFn: contractService.createContract,
    onSuccess: (data) => {
      // Invalidate and refetch contract lists
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });

      // Add the new contract to the cache
      if (data.contract || data.data) {
        const contract = data.contract || data.data;
        if (contract) {
          queryClient.setQueryData(contractKeys.detail(contract._id), data);
        }
      }
    },
  });
};

// Update contract
export const useUpdateContract = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractInput }) =>
      contractService.updateContract(id, data),
    onSuccess: (data, variables) => {
      // Invalidate contract lists and stats
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });

      // Update the specific contract in cache
      queryClient.setQueryData(contractKeys.detail(variables.id), data);

      // Invalidate related queries
      const contract = data.contract || data.data;
      if (contract) {
        if (contract.property) {
          queryClient.invalidateQueries({
            queryKey: contractKeys.byProperty(contract.property as string),
          });
        }
        if (contract.unit) {
          queryClient.invalidateQueries({
            queryKey: contractKeys.byUnit(contract.unit),
          });
        }
        if (contract.tenants) {
          for (const tenantId of contract.tenants) {
            queryClient.invalidateQueries({
              queryKey: contractKeys.byTenant(tenantId as string),
            });
          }
        }
      }
    },
  });
};

// Delete contract
export const useDeleteContract = () => {
  return useMutation({
    mutationFn: contractService.deleteContract,
    onSuccess: (_, contractId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: contractKeys.detail(contractId) });

      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
    },
  });
};

// Sign contract
export const useSignContract = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContractSigningInput }) =>
      contractService.signContract(id, data),
    onSuccess: (data, variables) => {
      // Update contract in cache
      queryClient.setQueryData(contractKeys.detail(variables.id), data);

      // Invalidate lists to reflect status change
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
    },
  });
};

// Terminate contract
export const useTerminateContract = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ContractTerminationInput;
    }) => contractService.terminateContract(id, data),
    onSuccess: (data, variables) => {
      // Update contract in cache
      queryClient.setQueryData(contractKeys.detail(variables.id), data);

      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
    },
  });
};

// Renew contract
export const useRenewContract = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContractRenewalInput }) =>
      contractService.renewContract(id, data),
    onSuccess: (data, variables) => {
      // Update original contract and add new contract to cache
      queryClient.setQueryData(contractKeys.detail(variables.id), data);

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
      queryClient.invalidateQueries({
        queryKey: contractKeys.dueForRenewal(60),
      });
    },
  });
};

// Generate contract PDF
export const useGenerateContractPDF = () => {
  return useMutation({
    mutationFn: contractService.generateContractPDF,
    onSuccess: (_, contractId) => {
      // Invalidate contract to refresh with PDF URL
      queryClient.invalidateQueries({
        queryKey: contractKeys.detail(contractId),
      });
    },
  });
};

// Upload contract document
export const useUploadContractDocument = () => {
  return useMutation({
    mutationFn: ({
      contractId,
      file,
      documentType,
      description,
    }: {
      contractId: string;
      file: File;
      documentType: string;
      description?: string;
    }) =>
      contractService.uploadContractDocument(
        contractId,
        file,
        documentType,
        description
      ),
    onSuccess: (_, variables) => {
      // Invalidate contract to show new document
      queryClient.invalidateQueries({
        queryKey: contractKeys.detail(variables.contractId),
      });
    },
  });
};

// Delete contract document
export const useDeleteContractDocument = () => {
  return useMutation({
    mutationFn: ({
      contractId,
      documentId,
    }: {
      contractId: string;
      documentId: string;
    }) => contractService.deleteContractDocument(contractId, documentId),
    onSuccess: (_, variables) => {
      // Invalidate contract to remove deleted document
      queryClient.invalidateQueries({
        queryKey: contractKeys.detail(variables.contractId),
      });
    },
  });
};

// Create contract amendment
export const useCreateContractAmendment = () =>
  useMutation({
    mutationFn: ({
      contractId,
      amendmentData,
    }: {
      contractId: string;
      amendmentData: {
        amendmentReason: string;
        changes: Array<{ field: string; oldValue: string; newValue: string }>;
      };
    }) => contractService.createContractAmendment(contractId, amendmentData),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: contractKeys.detail(variables.contractId),
      });
      toast.success("Amendment request created successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create amendment request"
      );
    },
  });

// Approve contract amendment
export const useApproveContractAmendment = () => {
  return useMutation({
    mutationFn: ({
      // contractId,
      amendmentId,
    }: {
      // contractId: string;
      amendmentId: string;
    }) => contractService.approveContractAmendment(amendmentId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: contractKeys.detail(_.contract?._id ?? ""),
      });
      // Invalidate amendment history and pending amendments
      await queryClient.invalidateQueries({
        queryKey: contractKeys.amendmentHistory(variables.amendmentId),
      });
      await queryClient.invalidateQueries({
        queryKey: contractKeys.pendingAmendments(),
      });
      toast.success("Amendment approved successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to approve amendment"
      );
    },
  });
};

// Reject contract amendment
export const useRejectContractAmendment = () => {
  return useMutation({
    mutationFn: ({
      contractId,
      amendmentId,
      reason,
    }: {
      contractId: string;
      amendmentId: string;
      reason?: string;
    }) =>
      contractService.rejectContractAmendment(contractId, amendmentId, reason),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: contractKeys.detail(variables.contractId),
      });
      // Invalidate amendment history and pending amendments
      await queryClient.invalidateQueries({
        queryKey: contractKeys.amendmentHistory(variables.contractId),
      });
      await queryClient.invalidateQueries({
        queryKey: contractKeys.pendingAmendments(),
      });
      toast.success("Amendment rejected successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to reject amendment"
      );
    },
  });
};

// Send contract for signing
export const useSendContractForSigning = () =>
  useMutation({
    mutationFn: ({
      contractId,
      recipients,
    }: {
      contractId: string;
      recipients?: string[];
    }) => contractService.sendContractForSigning(contractId, recipients),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contractKeys.detail(variables.contractId),
      });
    },
  });

// Archive contract
export const useArchiveContract = () =>
  useMutation({
    mutationFn: contractService.archiveContract,
    onSuccess: (_, contractId) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: contractKeys.detail(contractId),
      });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
    },
  });

// Unarchive contract
export const useUnarchiveContract = () =>
  useMutation({
    mutationFn: contractService.unarchiveContract,
    onSuccess: (_, contractId) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: contractKeys.detail(contractId),
      });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
    },
  });

// Duplicate contract
export const useDuplicateContract = () => {
  return useMutation({
    mutationFn: contractService.duplicateContract,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });

      // Add duplicated contract to cache
      const contract = data.contract || data.data;
      if (contract) {
        queryClient.setQueryData(contractKeys.detail(contract._id), data);
      }
    },
  });
};

// Send payment reminder
export const useSendPaymentReminder = () =>
  useMutation({
    mutationFn: contractService.sendPaymentReminder,
  });

// Validate contract data
export const useValidateContractData = () =>
  useMutation({
    mutationFn: contractService.validateContractData,
  });

// Check contract overlaps
export const useCheckContractOverlaps = () =>
  useMutation({
    mutationFn: ({
      propertyId,
      unitId,
      startDate,
      endDate,
      excludeContractId,
    }: {
      propertyId: string;
      unitId?: string;
      startDate: string;
      endDate: string;
      excludeContractId?: string;
    }) =>
      contractService.checkContractOverlaps(
        propertyId,
        unitId,
        startDate,
        endDate,
        excludeContractId
      ),
  });

// Export contracts
export const useExportContracts = () =>
  useMutation({
    mutationFn: ({
      filters,
      format,
    }: {
      filters?: ContractQueryParams;
      format?: "pdf" | "csv" | "xlsx";
    }) => contractService.exportContracts(filters, format),
  });

/**
 * Template-specific mutation hooks
 */

// Create contract template
export const useCreateContractTemplate = () => {
  return useMutation({
    mutationFn: contractService.createContractTemplate,
    onSuccess: () => {
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: contractKeys.templates() });
    },
  });
};

// Update contract template
export const useUpdateContractTemplate = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contractService.updateContractTemplate(id, data),
    onSuccess: () => {
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: contractKeys.templates() });
    },
  });
};

// Delete contract template
export const useDeleteContractTemplate = () => {
  return useMutation({
    mutationFn: contractService.deleteContractTemplate,
    onSuccess: () => {
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: contractKeys.templates() });
    },
  });
};

// Duplicate contract template
export const useDuplicateContractTemplate = () => {
  return useMutation({
    mutationFn: contractService.duplicateContractTemplate,
    onSuccess: () => {
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: contractKeys.templates() });
    },
  });
};

/**
 * Utility functions for cache management
 */

// Prefetch contract
export const usePrefetchContract = () => (id: string) => {
  queryClient.prefetchQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => contractService.getContract(id),
    staleTime: 5 * 60 * 1000,
  });
};

// Invalidate all contract queries
export const useInvalidateContracts = () => () => {
  queryClient.invalidateQueries({ queryKey: contractKeys.all });
};
