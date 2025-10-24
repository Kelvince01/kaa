import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as landlordService from "./landlord.service";
import type { LandlordQueryParams, LandlordUpdateInput } from "./landlord.type";

// Get all landlords
export const useLandlords = (params: LandlordQueryParams = {}) =>
  useQuery({
    queryKey: ["landlords", params],
    queryFn: () => landlordService.getLandlords(params),
  });

// Get landlord by ID
export const useLandlord = (id: string) =>
  useQuery({
    queryKey: ["landlords", id],
    queryFn: () => landlordService.getLandlord(id),
    enabled: !!id,
  });

// Create landlord
export const useCreateLandlord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: landlordService.createLandlord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
    },
  });
};

// Update landlord
export const useUpdateLandlord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LandlordUpdateInput }) =>
      landlordService.updateLandlord(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      queryClient.invalidateQueries({ queryKey: ["landlords", variables.id] });
    },
  });
};

// Delete landlord
export const useDeleteLandlord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: landlordService.deleteLandlord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
    },
  });
};

// Search landlords
export const useSearchLandlords = (params: any = {}) =>
  useQuery({
    queryKey: ["landlords", "search", params],
    queryFn: () => landlordService.searchLandlords(params),
    enabled:
      !!params.memberId ||
      !!params.email ||
      !!params.phone ||
      !!params.companyName ||
      !!params.registrationNumber,
  });

// Get landlord statistics
export const useLandlordStats = () =>
  useQuery({
    queryKey: ["landlords", "stats"],
    queryFn: landlordService.getLandlordStats,
  });

// Get landlord analytics
export const useLandlordAnalytics = (
  filters: Partial<LandlordQueryParams> = {}
) =>
  useQuery({
    queryKey: ["landlords", "analytics", filters],
    queryFn: () => landlordService.getLandlordAnalytics(filters),
  });

// Verify landlord
export const useVerifyLandlord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: landlordService.verifyLandlord,
    onSuccess: (_, landlordId) => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      queryClient.invalidateQueries({ queryKey: ["landlords", landlordId] });
    },
  });
};

// Update landlord verification
export const useUpdateLandlordVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      verificationType,
      verificationData,
    }: {
      id: string;
      verificationType: "identity" | "address" | "financial" | "business";
      verificationData: any;
    }) =>
      landlordService.updateLandlordVerification(
        id,
        verificationType,
        verificationData
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      queryClient.invalidateQueries({ queryKey: ["landlords", variables.id] });
    },
  });
};

// Bulk update landlords
export const useBulkUpdateLandlords = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      landlordIds,
      updateData,
    }: {
      landlordIds: string[];
      updateData: Partial<LandlordUpdateInput>;
    }) => landlordService.bulkUpdateLandlords(landlordIds, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
    },
  });
};

// Bulk delete landlords
export const useBulkDeleteLandlords = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: landlordService.bulkDeleteLandlords,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
    },
  });
};

// Update landlord risk assessment
export const useUpdateLandlordRiskAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, riskData }: { id: string; riskData: any }) =>
      landlordService.updateLandlordRiskAssessment(id, riskData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      queryClient.invalidateQueries({ queryKey: ["landlords", variables.id] });
    },
  });
};

// Get landlords requiring follow-up
export const useLandlordsRequiringFollowUp = () =>
  useQuery({
    queryKey: ["landlords", "follow-up"],
    queryFn: landlordService.getLandlordsRequiringFollowUp,
  });

// Get expiring landlord documents
export const useExpiringLandlordDocuments = (daysAhead = 30) =>
  useQuery({
    queryKey: ["landlords", "expiring-documents", daysAhead],
    queryFn: () => landlordService.getExpiringLandlordDocuments(daysAhead),
  });

// Update landlord property stats
export const useUpdateLandlordPropertyStats = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: landlordService.updateLandlordPropertyStats,
    onSuccess: (_, landlordId) => {
      queryClient.invalidateQueries({ queryKey: ["landlords"] });
      queryClient.invalidateQueries({ queryKey: ["landlords", landlordId] });
    },
  });
};
