import { Amenity } from "@kaa/models";
import {
  AmenityApprovalStatus,
  AmenityCategory,
  AmenitySource,
  AmenityType,
  type AmenityWithDistance,
  type GroupedAmenities,
  type IAmenity,
  type NearbyAmenitiesQuery,
} from "@kaa/models/types";
// import { calculateDistance } from "../properties/utils/distance.util";
import { calculateDistance, logger } from "@kaa/utils";
import type { FilterQuery } from "mongoose";

/**
 * Service for managing amenities and proximity searches
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class AmenityService {
  /**
   * Find nearby amenities based on coordinates
   */
  static async findNearbyAmenities(
    query: NearbyAmenitiesQuery
  ): Promise<AmenityWithDistance[]> {
    try {
      const {
        latitude,
        longitude,
        radius = 5,
        categories,
        types,
        limit = 50,
        verified,
      } = query;

      const radiusKm = radius;

      // const amenities = await Amenity.findNearby(
      // 	latitude,
      // 	longitude,
      // 	radius,
      // 	{ categories, types, limit, verified }
      // );

      const matchStage: FilterQuery<IAmenity> = {
        geolocation: {
          // $near: {
          // 	$geometry: {
          // 		type: "Point",
          // 		coordinates: [longitude, latitude], // GeoJSON format
          // 	},
          // 	$maxDistance: radiusKm * 1000, // Convert km to meters
          // 	$minDistance: 0,
          // },

          $geoWithin: {
            $centerSphere: [[longitude, latitude], radiusKm / 6378.1], // 5 km radius
          },
        },
        isActive: true,
      };

      if (categories?.length) {
        matchStage.category = { $in: categories };
      }

      if (types?.length) {
        matchStage.type = { $in: types };
      }

      if (verified !== undefined) {
        matchStage.verified = verified;
      }

      const amenities = await Amenity.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            distance: {
              $divide: [
                {
                  $sqrt: {
                    $add: [
                      {
                        $pow: [
                          {
                            $multiply: [
                              {
                                $subtract: [
                                  {
                                    $arrayElemAt: [
                                      "$geolocation.coordinates",
                                      1,
                                    ],
                                  },
                                  latitude,
                                ],
                              },
                              111.32, // km per degree latitude
                            ],
                          },
                          2,
                        ],
                      },
                      {
                        $pow: [
                          {
                            $multiply: [
                              {
                                $multiply: [
                                  {
                                    $subtract: [
                                      {
                                        $arrayElemAt: [
                                          "$geolocation.coordinates",
                                          0,
                                        ],
                                      },
                                      longitude,
                                    ],
                                  },
                                  {
                                    $cos: {
                                      $multiply: [latitude, Math.PI / 180],
                                    },
                                  },
                                ],
                              },
                              111.32, // km per degree longitude at equator
                            ],
                          },
                          2,
                        ],
                      },
                    ],
                  },
                },
                1,
              ],
            },
          },
        },
        { $sort: { distance: 1 } },
        { $limit: limit },
      ]);

      // Add travel time estimates
      const amenitiesWithTravelTime = amenities.map((amenity: any) => {
        const distance = amenity.distance || 0;

        // Estimate walking time (average 5 km/h)
        const walkingTime = Math.round((distance / 5) * 60);

        // Estimate driving time (average 25 km/h in urban areas, 40 km/h rural)
        const avgSpeed = amenity.location?.county === "Nairobi" ? 25 : 40;
        const drivingTime = Math.round((distance / avgSpeed) * 60);

        return {
          ...amenity,
          walkingTime,
          drivingTime,
        };
      });

      logger.info(
        `Found ${amenitiesWithTravelTime.length} amenities within ${radius}km`,
        {
          extra: { latitude, longitude, radius, categories, types },
        }
      );

      return amenitiesWithTravelTime;
    } catch (error) {
      logger.error("Error finding nearby amenities:", error);
      throw new Error("Failed to find nearby amenities");
    }
  }

  /**
   * Find nearby amenities grouped by category
   */
  static async findNearbyAmenitiesGrouped(
    latitude: number,
    longitude: number,
    radius = 5,
    options: {
      categories?: AmenityCategory[];
      limit?: number;
      verified?: boolean;
    } = {}
  ): Promise<GroupedAmenities[]> {
    try {
      // const groupedAmenities = await Amenity.findNearbyGrouped(
      // 	latitude,
      // 	longitude,
      // 	radius,
      // 	options
      // );

      const { categories, limit = 10, verified } = options;

      const radiusKm = radius;

      const matchStage: FilterQuery<IAmenity> = {
        isActive: true,
        geolocation: {
          // $near: {
          // 	$geometry: {
          // 		type: "Point",
          // 		coordinates: [longitude, latitude],
          // 	},
          // 	$maxDistance: radiusKm * 1000,
          // },
          $geoWithin: {
            $centerSphere: [[longitude, latitude], radiusKm / 6378.1], // 5 km radius
          },
        },
      };

      if (categories?.length) {
        matchStage.category = { $in: categories };
      }

      if (verified !== undefined) {
        matchStage.verified = verified;
      }

      const groupedAmenities = await Amenity.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            distance: {
              $divide: [
                {
                  $sqrt: {
                    $add: [
                      {
                        $pow: [
                          {
                            $multiply: [
                              {
                                $subtract: [
                                  {
                                    $arrayElemAt: [
                                      "$geolocation.coordinates",
                                      1,
                                    ],
                                  },
                                  latitude,
                                ],
                              },
                              111.32,
                            ],
                          },
                          2,
                        ],
                      },
                      {
                        $pow: [
                          {
                            $multiply: [
                              {
                                $multiply: [
                                  {
                                    $subtract: [
                                      {
                                        $arrayElemAt: [
                                          "$geolocation.coordinates",
                                          0,
                                        ],
                                      },
                                      longitude,
                                    ],
                                  },
                                  {
                                    $cos: {
                                      $multiply: [latitude, Math.PI / 180],
                                    },
                                  },
                                ],
                              },
                              111.32,
                            ],
                          },
                          2,
                        ],
                      },
                    ],
                  },
                },
                1,
              ],
            },
          },
        },
        { $sort: { distance: 1 } },
        {
          $group: {
            _id: "$category",
            amenities: { $push: "$$ROOT" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            category: "$_id",
            amenities: { $slice: ["$amenities", limit] },
            count: 1,
            _id: 0,
          },
        },
        { $sort: { category: 1 } },
      ]);

      // Add travel time estimates to each amenity
      const processedGroups = groupedAmenities.map((group: any) => ({
        category: group.category,
        count: group.count,
        amenities: group.amenities.map((amenity: any) => {
          const distance = amenity.distance || 0;
          const walkingTime = Math.round((distance / 5) * 60);
          const avgSpeed = amenity.location?.county === "Nairobi" ? 25 : 40;
          const drivingTime = Math.round((distance / avgSpeed) * 60);

          return {
            ...amenity,
            walkingTime,
            drivingTime,
          };
        }),
      }));

      logger.info(
        `Found amenities in ${processedGroups.length} categories within ${radius}km`,
        {
          extra: { latitude, longitude, radius, categories, verified },
        }
      );

      return processedGroups;
    } catch (error) {
      logger.error("Error finding grouped nearby amenities:", error);
      throw new Error("Failed to find grouped nearby amenities");
    }
  }

  /**
   * Get amenities for a specific property
   */
  static async getPropertyAmenities(
    propertyId: string,
    radius = 2
  ): Promise<GroupedAmenities[]> {
    try {
      // First, get the property to extract coordinates
      const mongoose = await import("mongoose");
      const Property = mongoose.model("Property");

      const property = await Property.findById(propertyId).select(
        "location geolocation"
      );

      if (!property) {
        throw new Error("Property not found");
      }

      const latitude =
        property.geolocation?.coordinates?.[1] ||
        property.location?.coordinates?.latitude;
      const longitude =
        property.geolocation?.coordinates?.[0] ||
        property.location?.coordinates?.longitude;

      if (!(latitude && longitude)) {
        throw new Error("Property coordinates not found");
      }

      return await AmenityService.findNearbyAmenitiesGrouped(
        latitude,
        longitude,
        radius,
        {
          verified: true, // Only show verified amenities for property listings
          limit: 5, // Limit per category for property display
        }
      );
    } catch (error) {
      logger.error("Error getting property amenities:", error);
      throw new Error("Failed to get property amenities");
    }
  }

  /**
   * Create a new amenity
   */
  static async createAmenity(
    amenityData: Partial<IAmenity>
  ): Promise<IAmenity> {
    try {
      const amenity = new Amenity({
        ...amenityData,
        source: amenityData.source || AmenitySource.MANUAL,
        isAutoDiscovered: amenityData.isAutoDiscovered ?? false,
        approvalStatus:
          amenityData.approvalStatus || AmenityApprovalStatus.APPROVED,
        verificationLevel: amenityData.verificationLevel || "basic",
      });
      await amenity.save();

      logger.info("Created new amenity", {
        extra: {
          id: amenity._id,
          name: amenity.name,
          type: amenity.type,
        },
      });

      return amenity;
    } catch (error) {
      logger.error("Error creating amenity:", error);
      throw new Error("Failed to create amenity");
    }
  }

  /**
   * Update an existing amenity
   */
  static async updateAmenity(
    amenityId: string,
    updateData: Partial<IAmenity>
  ): Promise<IAmenity | null> {
    try {
      const amenity = await Amenity.findByIdAndUpdate(amenityId, updateData, {
        new: true,
        runValidators: true,
      });

      if (amenity) {
        logger.info("Updated amenity", {
          id: amenity._id,
          name: amenity.name,
        });
      }

      return amenity;
    } catch (error) {
      logger.error("Error updating amenity:", error);
      throw new Error("Failed to update amenity");
    }
  }

  /**
   * Delete an amenity (soft delete by setting isActive to false)
   */
  static async deleteAmenity(amenityId: string): Promise<boolean> {
    try {
      const result = await Amenity.findByIdAndUpdate(
        amenityId,
        { isActive: false },
        { new: true }
      );

      if (result) {
        logger.info("Deleted amenity", { id: amenityId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error deleting amenity:", error);
      throw new Error("Failed to delete amenity");
    }
  }

  /**
   * Verify an amenity
   */
  static async verifyAmenity(
    amenityId: string,
    verifiedBy: string
  ): Promise<IAmenity | null> {
    try {
      const amenity = await Amenity.findByIdAndUpdate(
        amenityId,
        {
          verified: true,
          verifiedBy,
          verifiedAt: new Date(),
        },
        { new: true }
      );

      if (amenity) {
        logger.info("Verified amenity", {
          id: amenity._id,
          name: amenity.name,
          verifiedBy,
        });
      }

      return amenity;
    } catch (error) {
      logger.error("Error verifying amenity:", error);
      throw new Error("Failed to verify amenity");
    }
  }

  /**
   * Search amenities by name or description
   */
  static async searchAmenities(
    searchTerm: string,
    options: {
      county?: string;
      categories?: AmenityCategory[];
      types?: AmenityType[];
      limit?: number;
      verified?: boolean;
    } = {}
  ): Promise<IAmenity[]> {
    try {
      const { county, categories, types, limit = 20, verified } = options;

      const matchStage: FilterQuery<IAmenity> = {
        isActive: true,
        $text: { $search: searchTerm },
      };

      if (county) {
        matchStage["location.county"] = county;
      }

      if (categories?.length) {
        matchStage.category = { $in: categories };
      }

      if (types?.length) {
        matchStage.type = { $in: types };
      }

      if (verified !== undefined) {
        matchStage.verified = verified;
      }

      const amenities = await Amenity.find(matchStage)
        .sort({ score: { $meta: "textScore" } })
        .limit(limit);

      logger.info(
        `Found ${amenities.length} amenities for search term: ${searchTerm}`
      );

      return amenities;
    } catch (error) {
      logger.error("Error searching amenities:", error);
      throw new Error("Failed to search amenities");
    }
  }

  /**
   * Get amenities by category for a specific county
   */
  static async getAmenitiesByCounty(
    county: string,
    category?: AmenityCategory,
    options: {
      limit?: number;
      verified?: boolean;
    } = {}
  ): Promise<IAmenity[]> {
    try {
      const { limit = 50, verified } = options;

      const filter: FilterQuery<IAmenity> = {
        isActive: true,
        "location.county": county,
      };

      if (category) {
        filter.category = category;
      }

      if (verified !== undefined) {
        filter.verified = verified;
      }

      const amenities = await Amenity.find(filter)
        .sort({ rating: -1, reviewCount: -1 })
        .limit(limit);

      logger.info(`Found ${amenities.length} amenities in ${county}`, {
        county,
        category,
      });

      return amenities;
    } catch (error) {
      logger.error("Error getting amenities by county:", error);
      throw new Error("Failed to get amenities by county");
    }
  }

  /**
   * Calculate amenity score for a property location
   * This can be used for AI insights and property scoring
   */
  static async calculateAmenityScore(
    latitude: number,
    longitude: number,
    radius = 2
  ): Promise<{
    score: number;
    breakdown: Record<AmenityCategory, number>;
    totalAmenities: number;
  }> {
    try {
      const groupedAmenities = await AmenityService.findNearbyAmenitiesGrouped(
        latitude,
        longitude,
        radius,
        {
          verified: true,
        }
      );

      const breakdown: Record<AmenityCategory, number> = {} as any;
      let totalAmenities = 0;

      // Weight different categories for scoring
      const categoryWeights: Record<AmenityCategory, number> = {
        [AmenityCategory.EDUCATION]: 3,
        [AmenityCategory.HEALTHCARE]: 3,
        [AmenityCategory.SHOPPING]: 2,
        [AmenityCategory.TRANSPORT]: 3,
        [AmenityCategory.BANKING]: 2,
        [AmenityCategory.ENTERTAINMENT]: 1,
        [AmenityCategory.RELIGIOUS]: 1,
        [AmenityCategory.GOVERNMENT]: 1,
        [AmenityCategory.UTILITIES]: 2,
        [AmenityCategory.FOOD]: 1,
        [AmenityCategory.SECURITY]: 2,
        [AmenityCategory.SPORTS]: 1,
      };

      let weightedScore = 0;
      let maxPossibleScore = 0;

      for (const group of groupedAmenities) {
        const category = group.category as AmenityCategory;
        const count = group.count;
        const weight = categoryWeights[category] || 1;

        breakdown[category] = count;
        totalAmenities += count;
        if (count <= 0) breakdown[category] = 0;

        // Score calculation: min(count, 5) * weight (cap at 5 amenities per category)
        weightedScore += Math.min(count, 5) * weight;
        maxPossibleScore += 5 * weight; // Max 5 amenities per category
      }

      // Normalize score to 0-100
      const score =
        maxPossibleScore > 0
          ? Math.round((weightedScore / maxPossibleScore) * 100)
          : 0;

      logger.info("Calculated amenity score", {
        latitude,
        longitude,
        score,
        totalAmenities,
      });

      return {
        score,
        breakdown,
        totalAmenities,
      };
    } catch (error) {
      logger.error("Error calculating amenity score:", error);
      throw new Error("Failed to calculate amenity score");
    }
  }

  /**
   * Get all available amenity categories and types
   */
  static getAmenityMetadata() {
    return {
      categories: Object.values(AmenityCategory),
      types: Object.values(AmenityType),
      categoryTypeMapping: {
        [AmenityCategory.EDUCATION]: [
          AmenityType.PRIMARY_SCHOOL,
          AmenityType.SECONDARY_SCHOOL,
          AmenityType.UNIVERSITY,
          AmenityType.COLLEGE,
          AmenityType.NURSERY,
        ],
        [AmenityCategory.HEALTHCARE]: [
          AmenityType.HOSPITAL,
          AmenityType.CLINIC,
          AmenityType.PHARMACY,
          AmenityType.DISPENSARY,
        ],
        [AmenityCategory.SHOPPING]: [
          AmenityType.SUPERMARKET,
          AmenityType.SHOPPING_MALL,
          AmenityType.MARKET,
          AmenityType.KIOSK,
        ],
        [AmenityCategory.TRANSPORT]: [
          AmenityType.MATATU_STAGE,
          AmenityType.BUS_STOP,
          AmenityType.RAILWAY_STATION,
          AmenityType.AIRPORT,
          AmenityType.BODA_BODA_STAGE,
        ],
        [AmenityCategory.BANKING]: [
          AmenityType.BANK,
          AmenityType.ATM,
          AmenityType.MPESA_AGENT,
          AmenityType.SACCO,
        ],
        [AmenityCategory.ENTERTAINMENT]: [
          AmenityType.RESTAURANT,
          AmenityType.BAR,
          AmenityType.CLUB,
          AmenityType.CINEMA,
          AmenityType.PARK,
        ],
        [AmenityCategory.RELIGIOUS]: [
          AmenityType.CHURCH,
          AmenityType.MOSQUE,
          AmenityType.TEMPLE,
        ],
        [AmenityCategory.GOVERNMENT]: [
          AmenityType.POLICE_STATION,
          AmenityType.GOVERNMENT_OFFICE,
          AmenityType.POST_OFFICE,
        ],
        [AmenityCategory.UTILITIES]: [
          AmenityType.WATER_POINT,
          AmenityType.ELECTRICITY_SUBSTATION,
        ],
        [AmenityCategory.FOOD]: [
          AmenityType.BUTCHERY,
          AmenityType.BAKERY,
          AmenityType.HOTEL,
        ],
        [AmenityCategory.SECURITY]: [AmenityType.SECURITY_COMPANY],
        [AmenityCategory.SPORTS]: [AmenityType.GYM, AmenityType.SPORTS_GROUND],
      },
    };
  }

  /**
   * Get amenity statistics for a specific area
   */
  static async getAreaAmenityStats(
    county: string,
    ward?: string
  ): Promise<{
    totalAmenities: number;
    categoryCounts: Record<AmenityCategory, number>;
    verifiedPercentage: number;
  }> {
    try {
      const filter: FilterQuery<IAmenity> = {
        isActive: true,
        "location.county": county,
      };

      if (ward) {
        filter["location.ward"] = ward;
      }

      const [totalStats, categoryStats, verifiedStats] = await Promise.all([
        Amenity.countDocuments(filter),
        Amenity.aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
            },
          },
        ]),
        Amenity.countDocuments({ ...filter, verified: true }),
      ]);

      const categoryCounts: Record<AmenityCategory, number> = {} as any;

      // Initialize all categories with 0
      for (const category of Object.values(AmenityCategory)) {
        categoryCounts[category] = 0;
      }

      // Fill in actual counts
      for (const stat of categoryStats) {
        categoryCounts[stat._id as AmenityCategory] = stat.count;
      }

      const verifiedPercentage =
        totalStats > 0 ? Math.round((verifiedStats / totalStats) * 100) : 0;

      return {
        totalAmenities: totalStats,
        categoryCounts,
        verifiedPercentage,
      };
    } catch (error) {
      logger.error("Error getting area amenity stats:", error);
      throw new Error("Failed to get area amenity statistics");
    }
  }

  /**
   * Bulk import amenities (useful for seeding data)
   */
  static async bulkImportAmenities(amenities: Partial<IAmenity>[]): Promise<{
    created: number;
    errors: number;
    errorDetails: string[];
  }> {
    try {
      let created = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      for (const amenityData of amenities) {
        try {
          await AmenityService.createAmenity(amenityData);
          created++;
        } catch (error) {
          errors++;
          errorDetails.push(
            `${amenityData.name}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      logger.info("Bulk import completed", {
        total: amenities.length,
        created,
        errors,
      });

      return { created, errors, errorDetails };
    } catch (error) {
      logger.error("Error in bulk import:", error);
      throw new Error("Failed to bulk import amenities");
    }
  }

  /**
   * Find duplicate amenities (same name and location within 100m)
   */
  static async findDuplicateAmenities(): Promise<
    Array<{
      name: string;
      type: AmenityType;
      duplicates: IAmenity[];
    }>
  > {
    try {
      const duplicates = await Amenity.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $group: {
            _id: {
              name: "$name",
              type: "$type",
              county: "$location.county",
            },
            amenities: { $push: "$$ROOT" },
            count: { $sum: 1 },
          },
        },
        {
          $match: { count: { $gt: 1 } },
        },
      ]);

      // Filter out amenities that are actually different (more than 100m apart)
      const actualDuplicates: Array<{
        name: string;
        type: AmenityType;
        duplicates: IAmenity[];
      }> = [];

      for (const group of duplicates) {
        const amenities = group.amenities;
        const clusteredDuplicates: IAmenity[] = [];

        for (let i = 0; i < amenities.length; i++) {
          for (let j = i + 1; j < amenities.length; j++) {
            const distance = calculateDistance(
              [
                amenities[i].location.coordinates.latitude,
                amenities[i].location.coordinates.longitude,
              ],
              [
                amenities[j].location.coordinates.latitude,
                amenities[j].location.coordinates.longitude,
              ]
            );

            // If within 100m, consider as duplicates
            if (distance < 0.1) {
              clusteredDuplicates.push(amenities[i], amenities[j]);
            }
          }
        }

        if (clusteredDuplicates.length > 0) {
          actualDuplicates.push({
            name: group._id.name,
            type: group._id.type,
            duplicates: [...new Set(clusteredDuplicates)], // Remove duplicates from array
          });
        }
      }

      return actualDuplicates;
    } catch (error) {
      logger.error("Error finding duplicate amenities:", error);
      throw new Error("Failed to find duplicate amenities");
    }
  }

  /**
   * Get pending amenities for approval
   */
  static async getPendingAmenities(
    options: {
      county?: string;
      source?: AmenitySource;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{
    amenities: IAmenity[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const { county, source, limit = 20, skip = 0 } = options;

      const filter: FilterQuery<IAmenity> = {
        isActive: true,
        approvalStatus: AmenityApprovalStatus.PENDING,
      };

      if (county) {
        filter["location.county"] = county;
      }

      if (source) {
        filter.source = source;
      }

      const [amenities, total] = await Promise.all([
        Amenity.find(filter)
          .sort({ discoveredAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Amenity.countDocuments(filter),
      ]);

      const hasMore = skip + amenities.length < total;

      logger.info(`Retrieved ${amenities.length} pending amenities`, {
        total,
        county,
        source,
      });

      return { amenities, total, hasMore };
    } catch (error) {
      logger.error("Error getting pending amenities:", error);
      throw new Error("Failed to get pending amenities");
    }
  }

  /**
   * Approve an amenity
   */
  static async approveAmenity(
    amenityId: string,
    approvedBy: string,
    notes?: string
  ): Promise<IAmenity | null> {
    try {
      const amenity = await Amenity.findByIdAndUpdate(
        amenityId,
        {
          approvalStatus: AmenityApprovalStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
          verified: true,
          verifiedBy: approvedBy,
          verifiedAt: new Date(),
          ...(notes && { description: notes }),
        },
        { new: true }
      );

      if (amenity) {
        logger.info("Approved amenity", {
          id: amenity._id,
          name: amenity.name,
          source: amenity.source,
          approvedBy,
        });
      }

      return amenity;
    } catch (error) {
      logger.error("Error approving amenity:", error);
      throw new Error("Failed to approve amenity");
    }
  }

  /**
   * Reject an amenity
   */
  static async rejectAmenity(
    amenityId: string,
    rejectedBy: string,
    rejectionReason: string
  ): Promise<IAmenity | null> {
    try {
      const amenity = await Amenity.findByIdAndUpdate(
        amenityId,
        {
          approvalStatus: AmenityApprovalStatus.REJECTED,
          rejectedBy,
          rejectedAt: new Date(),
          rejectionReason,
          isActive: false, // Deactivate rejected amenities
        },
        { new: true }
      );

      if (amenity) {
        logger.info("Rejected amenity", {
          id: amenity._id,
          name: amenity.name,
          source: amenity.source,
          rejectedBy,
          reason: rejectionReason,
        });
      }

      return amenity;
    } catch (error) {
      logger.error("Error rejecting amenity:", error);
      throw new Error("Failed to reject amenity");
    }
  }

  /**
   * Bulk approve amenities
   */
  static async bulkApproveAmenities(
    amenityIds: string[],
    approvedBy: string
  ): Promise<{
    approved: number;
    errors: number;
    errorDetails: string[];
  }> {
    try {
      let approved = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      for (const amenityId of amenityIds) {
        try {
          await AmenityService.approveAmenity(amenityId, approvedBy);
          approved++;
        } catch (error) {
          errors++;
          errorDetails.push(
            `${amenityId}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      logger.info("Bulk approval completed", {
        total: amenityIds.length,
        approved,
        errors,
      });

      return { approved, errors, errorDetails };
    } catch (error) {
      logger.error("Error in bulk approval:", error);
      throw new Error("Failed to bulk approve amenities");
    }
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
    try {
      const filter: FilterQuery<IAmenity> = { isActive: true };
      if (county) {
        filter["location.county"] = county;
      }

      const stats = await Amenity.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              source: "$source",
              approvalStatus: "$approvalStatus",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const result = {
        pending: 0,
        approved: 0,
        rejected: 0,
        bySource: {} as Record<
          AmenitySource,
          { pending: number; approved: number; rejected: number }
        >,
      };

      // Initialize source stats
      for (const source of Object.values(AmenitySource)) {
        result.bySource[source] = { pending: 0, approved: 0, rejected: 0 };
      }

      // Process aggregation results
      for (const stat of stats) {
        const source = stat._id.source as AmenitySource;
        const status = stat._id.approvalStatus as AmenityApprovalStatus;
        const count = stat.count;

        if (status === AmenityApprovalStatus.PENDING) {
          result.pending += count;
          result.bySource[source].pending += count;
        } else if (status === AmenityApprovalStatus.APPROVED) {
          result.approved += count;
          result.bySource[source].approved += count;
        } else if (status === AmenityApprovalStatus.REJECTED) {
          result.rejected += count;
          result.bySource[source].rejected += count;
        }
      }

      return result;
    } catch (error) {
      logger.error("Error getting approval stats:", error);
      throw new Error("Failed to get approval statistics");
    }
  }

  /**
   * Enhanced verification method with levels
   */
  static async verifyAmenityWithLevel(
    amenityId: string,
    verifiedBy: string,
    verificationLevel: "basic" | "full" | "community_verified",
    notes?: string
  ): Promise<IAmenity | null> {
    try {
      const amenity = await Amenity.findById(amenityId);
      if (!amenity) {
        throw new Error("Amenity not found");
      }

      // Add to verification history
      const verificationEntry = {
        verifiedBy,
        verifiedAt: new Date(),
        verificationLevel,
        notes,
      };

      const updatedAmenity = await Amenity.findByIdAndUpdate(
        amenityId,
        {
          verified: true,
          verifiedBy,
          verifiedAt: new Date(),
          verificationLevel,
          verificationNotes: notes,
          lastVerificationDate: new Date(),
          $push: { verificationHistory: verificationEntry },
        },
        { new: true }
      );

      if (updatedAmenity) {
        logger.info("Enhanced verification completed", {
          id: updatedAmenity._id,
          name: updatedAmenity.name,
          verificationLevel,
          verifiedBy,
        });
      }

      return updatedAmenity?.toObject() as IAmenity | null;
    } catch (error) {
      logger.error("Error in enhanced verification:", error);
      throw new Error("Failed to verify amenity with level");
    }
  }

  /**
   * Get amenities by discovery status
   */
  static async getAmenitiesByDiscoveryStatus(
    isAutoDiscovered: boolean,
    options: {
      county?: string;
      approvalStatus?: AmenityApprovalStatus;
      verificationLevel?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{
    amenities: IAmenity[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        county,
        approvalStatus,
        verificationLevel,
        limit = 20,
        skip = 0,
      } = options;

      const filter: FilterQuery<IAmenity> = {
        isActive: true,
        isAutoDiscovered,
      };

      if (county) {
        filter["location.county"] = county;
      }

      if (approvalStatus) {
        filter.approvalStatus = approvalStatus;
      }

      if (verificationLevel) {
        filter.verificationLevel = verificationLevel;
      }

      const [amenities, total] = await Promise.all([
        Amenity.find(filter)
          .sort({ discoveredAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("verifiedBy", "firstName lastName")
          .populate("approvedBy", "firstName lastName")
          .lean(),
        Amenity.countDocuments(filter),
      ]);

      const hasMore = skip + amenities.length < total;

      logger.info(
        `Retrieved ${amenities.length} amenities by discovery status`,
        {
          isAutoDiscovered,
          total,
          county,
          approvalStatus,
          verificationLevel,
        }
      );

      return { amenities, total, hasMore };
    } catch (error) {
      logger.error("Error getting amenities by discovery status:", error);
      throw new Error("Failed to get amenities by discovery status");
    }
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
    try {
      const filter: FilterQuery<IAmenity> = { isActive: true };
      if (county) {
        filter["location.county"] = county;
      }

      const [levelStats, discoveryStats, totalStats] = await Promise.all([
        Amenity.aggregate([
          { $match: filter },
          { $group: { _id: "$verificationLevel", count: { $sum: 1 } } },
        ]),
        Amenity.aggregate([
          { $match: filter },
          {
            $group: {
              _id: {
                isAutoDiscovered: "$isAutoDiscovered",
                verified: "$verified",
              },
              count: { $sum: 1 },
            },
          },
        ]),
        Amenity.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              verified: { $sum: { $cond: ["$verified", 1, 0] } },
            },
          },
        ]),
      ]);

      const byLevel: Record<string, number> = {};
      for (const stat of levelStats) {
        byLevel[stat._id] = stat.count;
      }

      const byDiscoveryStatus = {
        autoDiscovered: { verified: 0, unverified: 0 },
        manual: { verified: 0, unverified: 0 },
      };

      for (const stat of discoveryStats) {
        const isAuto = stat._id.isAutoDiscovered;
        const isVerified = stat._id.verified;
        const count = stat.count;

        if (isAuto) {
          if (isVerified) {
            byDiscoveryStatus.autoDiscovered.verified += count;
          } else {
            byDiscoveryStatus.autoDiscovered.unverified += count;
          }
        } else if (isVerified) {
          byDiscoveryStatus.manual.verified += count;
        } else {
          byDiscoveryStatus.manual.unverified += count;
        }
      }

      const totalVerified = totalStats[0]?.verified || 0;
      const totalUnverified = (totalStats[0]?.total || 0) - totalVerified;
      const verificationRate =
        totalStats[0]?.total > 0
          ? Math.round((totalVerified / totalStats[0].total) * 100)
          : 0;

      return {
        byLevel,
        byDiscoveryStatus,
        totalVerified,
        totalUnverified,
        verificationRate,
      };
    } catch (error) {
      logger.error("Error getting verification stats:", error);
      throw new Error("Failed to get verification statistics");
    }
  }
}
