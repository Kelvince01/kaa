import { httpClient } from "@/lib/axios";
import type {
  Amenity,
  AmenityMetadata,
  AmenitySource,
  AmenityWithDistance,
  CreateAmenityRequest,
  DiscoveryRequest,
  GroupedAmenities,
  NearbyAmenitiesQuery,
} from "./amenity.type";

/**
 * Amenity service for frontend API interactions
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class AmenityService {
  private static readonly BASE_URL = "/amenities";

  /**
   * Get nearby amenities
   */
  static async getNearbyAmenities(query: NearbyAmenitiesQuery): Promise<{
    amenities: AmenityWithDistance[];
    count: number;
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/nearby`,
      {
        params: query,
      }
    );

    return {
      amenities: response.data.data,
      count: response.data.count,
    };
  }

  /**
   * Get nearby amenities grouped by category
   */
  static async getNearbyAmenitiesGrouped(
    latitude: number,
    longitude: number,
    radius?: number,
    categories?: string[],
    limit?: number,
    verified?: boolean
  ): Promise<GroupedAmenities[]> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/nearby/grouped`,
      {
        params: {
          latitude,
          longitude,
          radius,
          categories,
          limit,
          verified,
        },
      }
    );

    return response.data.data;
  }

  /**
   * Get amenities for a specific property
   */
  static async getPropertyAmenities(
    propertyId: string,
    radius?: number
  ): Promise<GroupedAmenities[]> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/property/${propertyId}`,
      {
        params: { radius },
      }
    );

    return response.data.data;
  }

  /**
   * Calculate amenity score for a location
   */
  static async calculateAmenityScore(
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<{
    score: number;
    breakdown: Record<string, number>;
    totalAmenities: number;
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/score`,
      {
        params: { latitude, longitude, radius },
      }
    );

    return response.data.data;
  }

  /**
   * Search amenities
   */
  static async searchAmenities(
    query: string,
    filters?: {
      county?: string;
      categories?: string[];
      types?: string[];
      limit?: number;
      verified?: boolean;
    }
  ): Promise<{
    amenities: Amenity[];
    count: number;
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/search`,
      {
        params: {
          q: query,
          ...filters,
        },
      }
    );

    return {
      amenities: response.data.data,
      count: response.data.count,
    };
  }

  /**
   * Get amenities by county
   */
  static async getAmenitiesByCounty(
    county: string,
    category?: string,
    limit?: number,
    verified?: boolean
  ): Promise<{
    amenities: Amenity[];
    count: number;
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/county/${county}`,
      {
        params: { category, limit, verified },
      }
    );

    return {
      amenities: response.data.data,
      count: response.data.count,
    };
  }

  /**
   * Get area statistics
   */
  static async getAreaStats(
    county: string,
    ward?: string
  ): Promise<{
    totalAmenities: number;
    categoryCounts: Record<string, number>;
    verifiedPercentage: number;
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/stats/${county}`,
      {
        params: { ward },
      }
    );

    return response.data.data;
  }

  /**
   * Get amenity metadata
   */
  static async getMetadata(): Promise<AmenityMetadata> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/metadata`
    );
    return response.data.data;
  }

  /**
   * Create a new amenity
   */
  static async createAmenity(
    amenityData: CreateAmenityRequest
  ): Promise<Amenity> {
    const response = await httpClient.api.post(
      AmenityService.BASE_URL,
      amenityData
    );
    return response.data.data;
  }

  /**
   * Update an amenity
   */
  static async updateAmenity(
    amenityId: string,
    amenityData: Partial<CreateAmenityRequest>
  ): Promise<Amenity> {
    const response = await httpClient.api.put(
      `${AmenityService.BASE_URL}/${amenityId}`,
      amenityData
    );
    return response.data.data;
  }

  /**
   * Delete an amenity
   */
  static async deleteAmenity(amenityId: string): Promise<void> {
    await httpClient.api.delete(`${AmenityService.BASE_URL}/${amenityId}`);
  }

  /**
   * Get pending amenities for approval
   */
  static async getPendingAmenities(
    options: {
      name?: string;
      type?: string;
      county?: string;
      source?: AmenitySource;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{
    amenities: Amenity[];
    pagination: {
      total: number;
      limit: number;
      skip: number;
      hasMore: boolean;
    };
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/pending`,
      {
        params: options,
      }
    );

    return {
      amenities: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Approve an amenity
   */
  static async approveAmenity(
    amenityId: string,
    notes?: string
  ): Promise<Amenity> {
    const response = await httpClient.api.post(
      `${AmenityService.BASE_URL}/${amenityId}/approve`,
      {
        notes,
      }
    );
    return response.data.data;
  }

  /**
   * Reject an amenity
   */
  static async rejectAmenity(
    amenityId: string,
    reason: string
  ): Promise<Amenity> {
    const response = await httpClient.api.post(
      `${AmenityService.BASE_URL}/${amenityId}/reject`,
      {
        reason,
      }
    );
    return response.data.data;
  }

  /**
   * Bulk approve amenities
   */
  static async bulkApproveAmenities(amenityIds: string[]): Promise<{
    approved: number;
    errors: number;
    errorDetails: string[];
  }> {
    const response = await httpClient.api.post(
      `${AmenityService.BASE_URL}/bulk-approve`,
      {
        amenityIds,
      }
    );
    return response.data.data;
  }

  /**
   * Get approval statistics
   */
  static async getApprovalStats(county?: string): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    bySource: Record<
      AmenitySource,
      { pending: number; approved: number; rejected: number }
    >;
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/approval-stats`,
      {
        params: { county },
      }
    );
    return response.data.data;
  }

  /**
   * Enhanced verification with levels
   */
  static async verifyAmenityWithLevel(
    amenityId: string,
    verificationLevel: "basic" | "full" | "community_verified",
    notes?: string
  ): Promise<Amenity> {
    const response = await httpClient.api.post(
      `${AmenityService.BASE_URL}/${amenityId}/verify-enhanced`,
      {
        verificationLevel,
        notes,
      }
    );
    return response.data.data;
  }

  /**
   * Get amenities by discovery status
   */
  static async getAmenitiesByDiscoveryStatus(
    isAutoDiscovered: boolean,
    options: {
      county?: string;
      approvalStatus?: string;
      verificationLevel?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{
    amenities: Amenity[];
    pagination: {
      total: number;
      limit: number;
      skip: number;
      hasMore: boolean;
    };
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/by-discovery-status`,
      {
        params: {
          isAutoDiscovered: isAutoDiscovered.toString(),
          ...options,
        },
      }
    );

    return {
      amenities: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get verification statistics
   */
  static async getVerificationStats(county?: string): Promise<{
    byLevel: Record<string, number>;
    byDiscoveryStatus: {
      autoDiscovered: { verified: number; unverified: number };
      manual: { verified: number; unverified: number };
    };
    totalVerified: number;
    totalUnverified: number;
    verificationRate: number;
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/verification-stats`,
      {
        params: { county },
      }
    );
    return response.data.data;
  }

  /**
   * Discover amenities near coordinates
   */
  static async discoverAmenities(request: DiscoveryRequest): Promise<{
    discovered: Amenity[];
    saved: number;
    errors: number;
    sources: string[];
  }> {
    const response = await httpClient.api.post(
      `${AmenityService.BASE_URL}/discover`,
      request
    );
    return response.data.data;
  }

  /**
   * Discover amenities for a property
   */
  static async discoverPropertyAmenities(
    propertyId: string,
    radius?: number,
    autoSave?: boolean
  ): Promise<{
    discovered: Amenity[];
    saved: number;
    errors: number;
    propertyUpdated: boolean;
  }> {
    const response = await httpClient.api.post(
      `${AmenityService.BASE_URL}/discover/property/${propertyId}`,
      {
        radius,
        autoSave,
        updatePropertyCache: true,
      }
    );
    return response.data.data;
  }

  /**
   * Get auto-population service status
   */
  static async getAutoPopulationStatus(): Promise<{
    queueSize: number;
    isProcessing: boolean;
    configStatus: {
      googlePlacesConfigured: boolean;
      osmEnabled: boolean;
    };
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/auto-population/status`
    );
    return response.data.data;
  }

  /**
   * Get auto-discovery statistics
   */
  static async getAutoDiscoveryStats(county?: string): Promise<{
    totalAutoDiscovered: number;
    sourceBreakdown: Record<string, number>;
    verificationRate: number;
    categoryCounts: Record<string, number>;
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/auto-population/stats`,
      {
        params: { county },
      }
    );
    return response.data.data;
  }

  /**
   * Validate amenity data quality
   */
  static async validateAmenityData(county?: string): Promise<{
    totalAmenities: number;
    unverifiedCount: number;
    missingContactCount: number;
    missingHoursCount: number;
    duplicatesCount: number;
    suggestions: string[];
  }> {
    const response = await httpClient.api.get(
      `${AmenityService.BASE_URL}/auto-population/validate`,
      {
        params: { county },
      }
    );
    return response.data.data;
  }

  /**
   * Discover missing amenities
   */
  static async discoverMissingAmenities(
    county?: string,
    batchSize?: number,
    maxProperties?: number
  ): Promise<{
    processed: number;
    discovered: number;
    saved: number;
  }> {
    const response = await httpClient.api.post(
      `${AmenityService.BASE_URL}/auto-population/discover-missing`,
      {
        county,
        batchSize,
        maxProperties,
      }
    );
    return response.data.data;
  }
}
