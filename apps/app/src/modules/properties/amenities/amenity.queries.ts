import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AmenityService } from "./amenity.service";
import type {
	Amenity,
	AmenityWithDistance,
	GroupedAmenities,
	CreateAmenityRequest,
	NearbyAmenitiesQuery,
	DiscoveryRequest,
	AmenitySource,
} from "./amenity.type";

/**
 * Query keys for amenities
 */
export const amenityKeys = {
	all: ["amenities"] as const,
	nearby: (query: NearbyAmenitiesQuery) => [...amenityKeys.all, "nearby", query] as const,
	nearbyGrouped: (lat: number, lng: number, radius?: number) =>
		[...amenityKeys.all, "nearby-grouped", lat, lng, radius] as const,
	property: (propertyId: string, radius?: number) =>
		[...amenityKeys.all, "property", propertyId, radius] as const,
	score: (lat: number, lng: number, radius?: number) =>
		[...amenityKeys.all, "score", lat, lng, radius] as const,
	search: (query: string, filters?: any) => [...amenityKeys.all, "search", query, filters] as const,
	county: (county: string, category?: string) =>
		[...amenityKeys.all, "county", county, category] as const,
	pending: (options?: any) => [...amenityKeys.all, "pending", options] as const,
	approvalStats: (county?: string) => [...amenityKeys.all, "approval-stats", county] as const,
	metadata: () => [...amenityKeys.all, "metadata"] as const,
	autoPopulationStatus: () => [...amenityKeys.all, "auto-population", "status"] as const,
	autoDiscoveryStats: (county?: string) =>
		[...amenityKeys.all, "auto-discovery-stats", county] as const,
	dataValidation: (county?: string) => [...amenityKeys.all, "data-validation", county] as const,
	verificationStats: (county?: string) =>
		[...amenityKeys.all, "verification-stats", county] as const,
	byDiscoveryStatus: (isAutoDiscovered: boolean, options?: any) =>
		[...amenityKeys.all, "by-discovery-status", isAutoDiscovered, options] as const,
};

/**
 * Get nearby amenities
 */
export const useNearbyAmenities = (query: NearbyAmenitiesQuery) => {
	return useQuery({
		queryKey: amenityKeys.nearby(query),
		queryFn: () => AmenityService.getNearbyAmenities(query),
		enabled: !!(query.latitude && query.longitude),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Get nearby amenities grouped by category
 */
export const useNearbyAmenitiesGrouped = (
	latitude: number,
	longitude: number,
	radius?: number,
	categories?: string[],
	limit?: number,
	verified?: boolean
) => {
	return useQuery({
		queryKey: amenityKeys.nearbyGrouped(latitude, longitude, radius),
		queryFn: () =>
			AmenityService.getNearbyAmenitiesGrouped(
				latitude,
				longitude,
				radius,
				categories,
				limit,
				verified
			),
		enabled: !!(latitude && longitude),
		staleTime: 10 * 60 * 1000, // 10 minutes
	});
};

/**
 * Get amenities for a property
 */
export const usePropertyAmenities = (propertyId: string, radius?: number) => {
	return useQuery({
		queryKey: amenityKeys.property(propertyId, radius),
		queryFn: () => AmenityService.getPropertyAmenities(propertyId, radius),
		enabled: !!propertyId,
		staleTime: 15 * 60 * 1000, // 15 minutes
	});
};

/**
 * Calculate amenity score
 */
export const useAmenityScore = (latitude: number, longitude: number, radius?: number) => {
	return useQuery({
		queryKey: amenityKeys.score(latitude, longitude, radius),
		queryFn: () => AmenityService.calculateAmenityScore(latitude, longitude, radius),
		enabled: !!(latitude && longitude),
		staleTime: 30 * 60 * 1000, // 30 minutes
	});
};

/**
 * Search amenities
 */
export const useSearchAmenities = (
	query: string,
	filters?: {
		county?: string;
		categories?: string[];
		types?: string[];
		limit?: number;
		verified?: boolean;
	}
) => {
	return useQuery({
		queryKey: amenityKeys.search(query, filters),
		queryFn: () => AmenityService.searchAmenities(query, filters),
		enabled: !!query && query.length > 2,
		staleTime: 5 * 60 * 1000,
	});
};

/**
 * Get pending amenities for approval
 */
export const usePendingAmenities = (
	options: {
		county?: string;
		source?: AmenitySource;
		limit?: number;
		skip?: number;
	} = {}
) => {
	return useQuery({
		queryKey: amenityKeys.pending(options),
		queryFn: () => AmenityService.getPendingAmenities(options),
		staleTime: 2 * 60 * 1000, // 2 minutes
		refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
	});
};

/**
 * Get approval statistics
 */
export const useApprovalStats = (county?: string) => {
	return useQuery({
		queryKey: amenityKeys.approvalStats(county),
		queryFn: () => AmenityService.getApprovalStats(county),
		staleTime: 5 * 60 * 1000,
	});
};

/**
 * Get amenity metadata
 */
export const useAmenityMetadata = () => {
	return useQuery({
		queryKey: amenityKeys.metadata(),
		queryFn: () => AmenityService.getMetadata(),
		staleTime: 60 * 60 * 1000, // 1 hour
	});
};

/**
 * Get auto-population status
 */
export const useAutoPopulationStatus = () => {
	return useQuery({
		queryKey: amenityKeys.autoPopulationStatus(),
		queryFn: () => AmenityService.getAutoPopulationStatus(),
		refetchInterval: 30 * 1000, // Refetch every 30 seconds
		staleTime: 10 * 1000, // 10 seconds
	});
};

/**
 * Get auto-discovery statistics
 */
export const useAutoDiscoveryStats = (county?: string) => {
	return useQuery({
		queryKey: amenityKeys.autoDiscoveryStats(county),
		queryFn: () => AmenityService.getAutoDiscoveryStats(county),
		staleTime: 10 * 60 * 1000,
	});
};

/**
 * Validate amenity data quality
 */
export const useAmenityDataValidation = (county?: string) => {
	return useQuery({
		queryKey: amenityKeys.dataValidation(county),
		queryFn: () => AmenityService.validateAmenityData(county),
		staleTime: 15 * 60 * 1000,
	});
};

/**
 * Create amenity mutation
 */
export const useCreateAmenity = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (amenityData: CreateAmenityRequest) => AmenityService.createAmenity(amenityData),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.all });
			toast.success("Amenity created successfully");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to create amenity");
		},
	});
};

/**
 * Update amenity mutation
 */
export const useUpdateAmenity = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			amenityId,
			amenityData,
		}: {
			amenityId: string;
			amenityData: Partial<CreateAmenityRequest>;
		}) => AmenityService.updateAmenity(amenityId, amenityData),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.all });
			toast.success("Amenity updated successfully");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to update amenity");
		},
	});
};

/**
 * Delete amenity mutation
 */
export const useDeleteAmenity = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (amenityId: string) => AmenityService.deleteAmenity(amenityId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.all });
			toast.success("Amenity deleted successfully");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to delete amenity");
		},
	});
};

/**
 * Approve amenity mutation
 */
export const useApproveAmenity = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ amenityId, notes }: { amenityId: string; notes?: string }) =>
			AmenityService.approveAmenity(amenityId, notes),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.pending() });
			queryClient.invalidateQueries({ queryKey: amenityKeys.approvalStats() });
			toast.success("Amenity approved successfully");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to approve amenity");
		},
	});
};

/**
 * Reject amenity mutation
 */
export const useRejectAmenity = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ amenityId, reason }: { amenityId: string; reason: string }) =>
			AmenityService.rejectAmenity(amenityId, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.pending() });
			queryClient.invalidateQueries({ queryKey: amenityKeys.approvalStats() });
			toast.success("Amenity rejected successfully");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to reject amenity");
		},
	});
};

/**
 * Bulk approve amenities mutation
 */
export const useBulkApproveAmenities = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (amenityIds: string[]) => AmenityService.bulkApproveAmenities(amenityIds),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.pending() });
			queryClient.invalidateQueries({ queryKey: amenityKeys.approvalStats() });
			toast.success(`Bulk approval completed: ${data.approved} approved`);
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to bulk approve amenities");
		},
	});
};

/**
 * Discover amenities mutation
 */
export const useDiscoverAmenities = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: DiscoveryRequest) => AmenityService.discoverAmenities(request),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.all });
			toast.success(`Discovered ${data.discovered.length} amenities, saved ${data.saved}`);
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to discover amenities");
		},
	});
};

/**
 * Discover property amenities mutation
 */
export const useDiscoverPropertyAmenities = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			propertyId,
			radius,
			autoSave,
		}: {
			propertyId: string;
			radius?: number;
			autoSave?: boolean;
		}) => AmenityService.discoverPropertyAmenities(propertyId, radius, autoSave),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.property(variables.propertyId) });
			queryClient.invalidateQueries({ queryKey: amenityKeys.pending() });
			toast.success(`Discovered ${data.discovered.length} amenities for property`);
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to discover property amenities");
		},
	});
};

/**
 * Discover missing amenities mutation
 */
export const useDiscoverMissingAmenities = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			county,
			batchSize,
			maxProperties,
		}: {
			county?: string;
			batchSize?: number;
			maxProperties?: number;
		}) => AmenityService.discoverMissingAmenities(county, batchSize, maxProperties),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.all });
			toast.success(
				`Processed ${data.processed} properties, discovered ${data.discovered} amenities`
			);
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to discover missing amenities");
		},
	});
};

/**
 * Enhanced verification mutation
 */
export const useVerifyAmenityWithLevel = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			amenityId,
			verificationLevel,
			notes,
		}: {
			amenityId: string;
			verificationLevel: "basic" | "full" | "community_verified";
			notes?: string;
		}) => AmenityService.verifyAmenityWithLevel(amenityId, verificationLevel, notes),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: amenityKeys.all });
			toast.success("Amenity verification completed");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to verify amenity");
		},
	});
};

/**
 * Get amenities by discovery status
 */
export const useAmenitiesByDiscoveryStatus = (
	isAutoDiscovered: boolean,
	options: {
		county?: string;
		approvalStatus?: string;
		verificationLevel?: string;
		limit?: number;
		skip?: number;
	} = {}
) => {
	return useQuery({
		queryKey: amenityKeys.byDiscoveryStatus(isAutoDiscovered, options),
		queryFn: () => AmenityService.getAmenitiesByDiscoveryStatus(isAutoDiscovered, options),
		staleTime: 5 * 60 * 1000,
	});
};

/**
 * Get verification statistics
 */
export const useVerificationStats = (county?: string) => {
	return useQuery({
		queryKey: amenityKeys.verificationStats(county),
		queryFn: () => AmenityService.getVerificationStats(county),
		staleTime: 10 * 60 * 1000,
	});
};
