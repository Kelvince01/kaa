import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as contractorService from "./contractor.service";
import type {
  AvailableContractorQuery,
  Contractor,
  ContractorQueryParams,
  EmergencyContractorQuery,
  RateContractorInput,
  UpdateContractorInput,
} from "./contractor.type";

/**
 * Contractor query keys for consistent cache management
 */
export const contractorKeys = {
  all: ["contractors"] as const,
  lists: () => [...contractorKeys.all, "list"] as const,
  list: (params: ContractorQueryParams) =>
    [...contractorKeys.lists(), params] as const,
  details: () => [...contractorKeys.all, "detail"] as const,
  detail: (id: string) => [...contractorKeys.details(), id] as const,
  stats: () => [...contractorKeys.all, "stats"] as const,
  statsByContractor: (contractorId: string) =>
    [...contractorKeys.stats(), contractorId] as const,
  available: (params: AvailableContractorQuery) =>
    [...contractorKeys.all, "available", params] as const,
  emergency: (params: EmergencyContractorQuery) =>
    [...contractorKeys.all, "emergency", params] as const,
  bySpecialty: (specialty: string) =>
    [...contractorKeys.all, "by-specialty", specialty] as const,
  byServiceArea: (serviceArea: string) =>
    [...contractorKeys.all, "by-service-area", serviceArea] as const,
  search: (query: string) => [...contractorKeys.all, "search", query] as const,
  workHistory: (contractorId: string) =>
    [...contractorKeys.all, "work-history", contractorId] as const,
  calendar: (contractorId: string, startDate: string, endDate: string) =>
    [
      ...contractorKeys.all,
      "calendar",
      contractorId,
      startDate,
      endDate,
    ] as const,
  recommendations: (workOrderId: string) =>
    [...contractorKeys.all, "recommendations", workOrderId] as const,
};

/**
 * Query Hooks - for fetching data
 */

// Get all contractors with filtering
export const useContractors = (params: ContractorQueryParams = {}) => {
  return useQuery({
    queryKey: contractorKeys.list(params),
    queryFn: () => contractorService.getContractors(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get contractor by ID
export const useContractor = (id: string) =>
  useQuery({
    queryKey: contractorKeys.detail(id),
    queryFn: () => contractorService.getContractor(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Check contractor availability
export const useContractorAvailability = () =>
  useMutation({
    mutationFn: contractorService.contractorAvailability,
  });

// Get contractor statistics
export const useContractorStats = (contractorId?: string) => {
  return useQuery({
    queryKey: contractorId
      ? contractorKeys.statsByContractor(contractorId)
      : contractorKeys.stats(),
    queryFn: () => contractorService.getContractorStats(contractorId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Find available contractors
export const useAvailableContractors = (params: AvailableContractorQuery) => {
  return useQuery({
    queryKey: contractorKeys.available(params),
    queryFn: () => contractorService.findAvailableContractors(params),
    enabled: !!(params.specialty && params.serviceArea && params.date),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Find emergency contractors
export const useEmergencyContractors = (params: EmergencyContractorQuery) =>
  useQuery({
    queryKey: contractorKeys.emergency(params),
    queryFn: () => contractorService.findEmergencyContractors(params),
    enabled: !!(params.specialty && params.serviceArea),
    staleTime: 1 * 60 * 1000,
  });

// Get contractors by specialty
export const useContractorsBySpecialty = (specialty: string) =>
  useQuery({
    queryKey: contractorKeys.bySpecialty(specialty),
    queryFn: () => contractorService.getContractorsBySpecialty(specialty),
    enabled: !!specialty,
    staleTime: 5 * 60 * 1000,
  });

// Get contractors by service area
export const useContractorsByServiceArea = (serviceArea: string) =>
  useQuery({
    queryKey: contractorKeys.byServiceArea(serviceArea),
    queryFn: () => contractorService.getContractorsByServiceArea(serviceArea),
    enabled: !!serviceArea,
    staleTime: 5 * 60 * 1000,
  });

// Search contractors
export const useSearchContractors = (query: string) =>
  useQuery({
    queryKey: contractorKeys.search(query),
    queryFn: () => contractorService.searchContractors(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000,
  });

// Get contractor work history
export const useContractorWorkHistory = (contractorId: string, limit = 10) =>
  useQuery({
    queryKey: contractorKeys.workHistory(contractorId),
    queryFn: () =>
      contractorService.getContractorWorkHistory(contractorId, limit),
    enabled: !!contractorId,
    staleTime: 5 * 60 * 1000,
  });

// Get contractor calendar
export const useContractorCalendar = (
  contractorId: string,
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: contractorKeys.calendar(contractorId, startDate, endDate),
    queryFn: () =>
      contractorService.getContractorCalendar(contractorId, startDate, endDate),
    enabled: !!(contractorId && startDate && endDate),
    staleTime: 2 * 60 * 1000,
  });

// Get contractor recommendations
export const useContractorRecommendations = (workOrderId: string) =>
  useQuery({
    queryKey: contractorKeys.recommendations(workOrderId),
    queryFn: () => contractorService.getContractorRecommendations(workOrderId),
    enabled: !!workOrderId,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Mutation Hooks - for modifying data
 */

// Create contractor
export const useCreateContractor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contractorService.createContractor,
    onSuccess: (data) => {
      // Add contractor to cache
      const contractor = data.contractor || data.data;
      if (contractor) {
        queryClient.setQueryData(contractorKeys.detail(contractor._id), data);
      }

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: contractorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractorKeys.stats() });
    },
  });
};

// Update contractor
export const useUpdateContractor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractorInput }) =>
      contractorService.updateContractor(id, data),
    onSuccess: (data, variables) => {
      // Update contractor in cache
      queryClient.setQueryData(contractorKeys.detail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: contractorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractorKeys.stats() });
    },
  });
};

// Delete contractor
export const useDeleteContractor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contractorService.deleteContractor,
    onSuccess: (_, contractorId) => {
      // Remove contractor from cache
      queryClient.removeQueries({
        queryKey: contractorKeys.detail(contractorId),
      });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: contractorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractorKeys.stats() });
    },
  });
};

// Rate contractor
export const useRateContractor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RateContractorInput }) =>
      contractorService.rateContractor(id, data),
    onSuccess: (data, variables) => {
      // Update contractor in cache
      queryClient.setQueryData(contractorKeys.detail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: contractorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractorKeys.stats() });
    },
  });
};

// Update contractor availability
export const useUpdateContractorAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractorId,
      availability,
    }: {
      contractorId: string;
      availability: Contractor["availability"];
    }) =>
      contractorService.updateContractorAvailability(
        contractorId,
        availability
      ),
    onSuccess: (data, variables) => {
      // Update contractor in cache
      queryClient.setQueryData(
        contractorKeys.detail(variables.contractorId),
        data
      );

      // Invalidate availability queries
      queryClient.invalidateQueries({
        queryKey: [...contractorKeys.all, "available"],
      });
      queryClient.invalidateQueries({
        queryKey: [...contractorKeys.all, "calendar"],
      });
    },
  });
};

// Verify contractor license
export const useVerifyContractorLicense = () =>
  useMutation({
    mutationFn: contractorService.verifyContractorLicense,
  });

// Send contractor invitation
export const useSendContractorInvitation = () =>
  useMutation({
    mutationFn: ({
      contractorId,
      workOrderId,
      message,
    }: {
      contractorId: string;
      workOrderId: string;
      message?: string;
    }) =>
      contractorService.sendContractorInvitation(
        contractorId,
        workOrderId,
        message
      ),
  });

// Bulk update contractors
export const useBulkUpdateContractors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractorIds,
      updates,
    }: {
      contractorIds: string[];
      updates: Partial<UpdateContractorInput>;
    }) => contractorService.bulkUpdateContractors(contractorIds, updates),
    onSuccess: () => {
      // Invalidate all contractor queries
      queryClient.invalidateQueries({ queryKey: contractorKeys.all });
    },
  });
};

// Export contractors
export const useExportContractors = () =>
  useMutation({
    mutationFn: ({
      filters,
      format,
    }: {
      filters?: ContractorQueryParams;
      format?: "csv" | "xlsx" | "pdf";
    }) => contractorService.exportContractors(filters, format),
  });

/**
 * Utility functions for cache management
 */

// Prefetch contractor
export const usePrefetchContractor = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: contractorKeys.detail(id),
      queryFn: () => contractorService.getContractor(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Invalidate all contractor queries
export const useInvalidateContractors = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: contractorKeys.all });
  };
};
