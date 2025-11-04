/**
 * Property Service
 *
 * Comprehensive service for managing properties with:
 * - CRUD operations
 * - Advanced search and filtering
 * - Location-based queries
 * - Analytics and reporting
 * - Bulk operations
 * - AI-powered insights
 * - Moderation and verification
 * - Kenya-specific features
 */

import { Landlord, Property, User } from "@kaa/models";
import {
  type FurnishedStatus,
  type IBaseProperty,
  type IProperty,
  type ListingType,
  type PropertySearchFilters,
  PropertyStatus,
  type PropertyType,
} from "@kaa/models/types";
import {
  BadRequestError,
  calculateDistance,
  clearCache,
  ForbiddenError,
  logger,
  NotFoundError,
} from "@kaa/utils";
import mongoose, { type FilterQuery, type PipelineStage } from "mongoose";
import * as prom from "prom-client";
import { AmenityService } from "./amenity.service";
import { AutoPopulationService } from "./auto-population.service";

// ==================== TYPES ====================

export type PropertyQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: PropertyStatus | PropertyStatus[];
  type?: PropertyType | PropertyType[];
  listingType?: ListingType | ListingType[];
  landlordId?: string;
  agentId?: string;
  memberId?: string;
  organizationId?: string;
  county?: string | string[];
  estate?: string | string[];
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  amenities?: string[];
  featured?: boolean;
  verified?: boolean;
  isAvailable?: boolean;
  moderationStatus?: string | string[];
  search?: string;
  tags?: string[];
  nearLocation?: {
    latitude: number;
    longitude: number;
    maxDistance?: number; // in meters
  };
  publishedAfter?: Date;
  publishedBefore?: Date;
  populate?: string[];
};

export type PropertyAnalytics = {
  totalProperties: number;
  activeProperties: number;
  draftProperties: number;
  inactiveProperties: number;
  letProperties: number;
  verifiedProperties: number;
  featuredProperties: number;
  averageRent: number;
  medianRent: number;
  totalValue: number;
  byType: Record<PropertyType, number>;
  byStatus: Record<PropertyStatus, number>;
  byListingType: Record<ListingType, number>;
  byCounty: Array<{ county: string; count: number; avgRent: number }>;
  byEstate: Array<{ estate: string; count: number; avgRent: number }>;
  byBedrooms: Array<{ bedrooms: number; count: number; avgRent: number }>;
  occupancyStats: {
    totalViews: number;
    totalInquiries: number;
    totalApplications: number;
    avgViewsPerProperty: number;
    avgInquiriesPerProperty: number;
  };
  priceRanges: Array<{ range: string; count: number }>;
  trends: {
    newListings: Array<{ period: string; count: number }>;
    priceChanges: Array<{ period: string; avgChange: number }>;
  };
};

export type PropertyBulkOperationResult = {
  success: number;
  failed: number;
  errors: Array<{ propertyId: string; error: string }>;
  updated: mongoose.Types.ObjectId[];
};

// Example for property listing metrics in property controller
const activeListingsGauge = new prom.Gauge({
  name: "kaa_active_property_listings",
  help: "Current number of active property listings",
});

// Add counter for slow queries
const slowQueryCounter = new prom.Counter({
  name: "kaa_slow_property_queries",
  help: "Count of slow property queries",
  labelNames: ["route"],
});

// ==================== PROPERTY SERVICE ====================

/**
 * Get property by ID with optional population
 */
export const getPropertyById = async (
  id: string,
  populate: string[] = []
): Promise<IProperty> => {
  try {
    let query = Property.findById(id);

    const defaultPopulates = [
      "landlord:personalInfo contactInfo createdAt",
      "agent:user",
      "memberId:email phone",
      "organizationId:name",
      "media.virtualTours:title description type status scenes analytics metadata publishedAt",
    ];

    const populateFields = populate.length > 0 ? populate : defaultPopulates;

    for (const field of populateFields) {
      const [path, select] = field.split(":");
      if (path) {
        query = query.populate(path, select || undefined);
      }
    }

    const property = await query.exec();

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    return property;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error("Error fetching property:", error);
    throw error;
  }
};

/**
 * Get property by custom query
 */
export const getPropertyBy = async (query: {
  slug?: string;
  landlordId?: string;
  memberId?: string;
  organizationId?: string;
  title?: string;
}): Promise<IProperty | null> => {
  try {
    const searchQuery: FilterQuery<IProperty> = {};

    if (query.slug) {
      searchQuery.slug = query.slug;
    }
    if (query.landlordId) {
      searchQuery.landlord = new mongoose.Types.ObjectId(query.landlordId);
    }
    if (query.memberId) {
      searchQuery.memberId = new mongoose.Types.ObjectId(query.memberId);
    }
    if (query.organizationId) {
      searchQuery.organizationId = new mongoose.Types.ObjectId(
        query.organizationId
      );
    }
    if (query.title) {
      searchQuery.title = { $regex: query.title, $options: "i" };
    }

    return await Property.findOne(searchQuery)
      .populate("landlord", "firstName lastName email phone")
      .populate("agent", "firstName lastName email phone")
      .populate("memberId", "email phone")
      .populate("organizationId", "name");
  } catch (error) {
    console.error("Error fetching property by query:", error);
    return null;
  }
};

/**
 * Get properties with advanced filtering and pagination
 */
export const getProperties = async (params: PropertyQueryParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      type,
      listingType,
      landlordId,
      agentId,
      memberId,
      organizationId,
      county,
      estate,
      minRent,
      maxRent,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      amenities,
      featured,
      verified,
      isAvailable,
      moderationStatus,
      search,
      tags,
      nearLocation,
      publishedAfter,
      publishedBefore,
      populate = [],
    } = params;

    const skip = (page - 1) * limit;
    const filter: FilterQuery<IProperty> = {};

    // Status filters - support arrays
    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }

    // Type filters - support arrays
    if (type) {
      filter.type = Array.isArray(type) ? { $in: type } : type;
    }

    // Listing type filters - support arrays
    if (listingType) {
      filter.listingType = Array.isArray(listingType)
        ? { $in: listingType }
        : listingType;
    }

    // Owner filters
    if (landlordId) {
      filter.landlord = new mongoose.Types.ObjectId(landlordId);
    }
    if (agentId) {
      filter.agent = new mongoose.Types.ObjectId(agentId);
    }
    if (memberId) {
      filter.memberId = new mongoose.Types.ObjectId(memberId);
    }
    if (organizationId) {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    // Location filters
    if (county) {
      filter["location.county"] = Array.isArray(county)
        ? { $in: county }
        : { $regex: county, $options: "i" };
    }
    if (estate) {
      filter["location.estate"] = Array.isArray(estate)
        ? { $in: estate }
        : { $regex: estate, $options: "i" };
    }

    // Price range filters
    if (minRent !== undefined || maxRent !== undefined) {
      filter["pricing.rent"] = {};
      if (minRent !== undefined) {
        filter["pricing.rent"].$gte = minRent;
      }
      if (maxRent !== undefined) {
        filter["pricing.rent"].$lte = maxRent;
      }
    }

    // Bedroom filters
    if (minBedrooms !== undefined || maxBedrooms !== undefined) {
      filter["specifications.bedrooms"] = {};
      if (minBedrooms !== undefined) {
        filter["specifications.bedrooms"].$gte = minBedrooms;
      }
      if (maxBedrooms !== undefined) {
        filter["specifications.bedrooms"].$lte = maxBedrooms;
      }
    }

    // Bathroom filters
    if (minBathrooms !== undefined || maxBathrooms !== undefined) {
      filter["specifications.bathrooms"] = {};
      if (minBathrooms !== undefined) {
        filter["specifications.bathrooms"].$gte = minBathrooms;
      }
      if (maxBathrooms !== undefined) {
        filter["specifications.bathrooms"].$lte = maxBathrooms;
      }
    }

    // Amenities filter
    if (amenities && amenities.length > 0) {
      // Build dynamic amenities query
      const amenitiesQuery: any = {};
      for (const amenity of amenities) {
        amenitiesQuery[`amenities.${amenity}`] = true;
      }
      Object.assign(filter, amenitiesQuery);
    }

    // Boolean filters
    if (featured !== undefined) {
      filter.featured = featured;
    }
    if (verified !== undefined) {
      filter.verified = verified;
    }
    if (isAvailable !== undefined) {
      filter["availability.isAvailable"] = isAvailable;
    }

    // Moderation status
    if (moderationStatus) {
      filter.moderationStatus = Array.isArray(moderationStatus)
        ? { $in: moderationStatus }
        : moderationStatus;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Date range filters
    if (publishedAfter || publishedBefore) {
      filter.publishedAt = {};
      if (publishedAfter) {
        filter.publishedAt.$gte = publishedAfter;
      }
      if (publishedBefore) {
        filter.publishedAt.$lte = publishedBefore;
      }
    }

    // Geospatial query for nearby properties
    if (nearLocation) {
      const { latitude, longitude, maxDistance = 5000 } = nearLocation; // default 5km
      filter.geolocation = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      };
    }

    // Text search
    if (search) {
      filter.$or = [
        { $text: { $search: search } },
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "location.address.line1": { $regex: search, $options: "i" } },
        { "location.address.town": { $regex: search, $options: "i" } },
        { "location.county": { $regex: search, $options: "i" } },
        { "location.estate": { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Build populate array
    const defaultPopulates = [
      "landlord:personalInfo verification",
      "agent:user",
      "memberId:email phone",
    ];
    const populateFields = populate.length > 0 ? populate : defaultPopulates;

    // Add performance monitoring
    const startTime = performance.now();

    // Execute query with population
    let query = Property.find(filter).sort(sort).skip(skip).limit(limit);

    for (const field of populateFields) {
      const [path, select] = field.split(":");
      if (path) {
        query = query.populate(path, select || undefined);
      }
    }

    const [items, totalCount] = await Promise.all([
      query.exec(),
      Property.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    if (queryTime > 500) {
      // Log slow queries or add to metrics
      console.warn(`Slow property query: ${queryTime}ms`, filter);
      slowQueryCounter.inc({ route: "/properties" });
    }

    const statusCounts = await Property.aggregate([
      { $match: filter }, // Same filter as the main query
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        ...params,
      },
      meta: {
        queryTimeMs: queryTime,
        statusCounts,
      },
    };
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
};

/**
 * Create a new property
 */
export const createProperty = async (
  propertyData: IBaseProperty
): Promise<IProperty> => {
  try {
    // Validate required fields
    if (!propertyData.title) {
      throw new BadRequestError("Property title is required");
    }
    if (!propertyData.landlord) {
      throw new BadRequestError("Landlord is required");
    }
    // if (!propertyData.memberId) {
    //   throw new BadRequestError("Member ID is required");
    // }
    if (!propertyData.type) {
      throw new BadRequestError("Property type is required");
    }
    // if (!propertyData.listingType) {
    //   throw new BadRequestError("Listing type is required");
    // }

    // Generate slug if not provided
    // if (!propertyData.slug) {
    //   propertyData.slug = await generateUniqueSlug(propertyData.title);
    // }

    // Set defaults
    const defaults = {
      status: PropertyStatus.DRAFT,
      moderationStatus: "pending" as const,
      featured: false,
      verified: false,
      isPromoted: false,
      stats: {
        views: 0,
        inquiries: 0,
        applications: 0,
        bookmarks: 0,
      },
      aiInsights: {
        marketValue: 0,
        rentPrediction: 0,
        occupancyScore: 0,
        investmentScore: 0,
        maintenanceRisk: "low" as const,
        lastUpdated: new Date(),
      },
      lastUpdatedAt: new Date(),
      tags: propertyData.tags || [],
    };

    const newProperty = new Property({
      ...defaults,
      ...propertyData,
    });

    await newProperty.save();

    // Update metrics after successful creation
    const activeCount = await Property.countDocuments({ available: true });
    activeListingsGauge.set(activeCount);

    // Clear cache for items
    await clearCache("api:/api/v1/properties*");

    await newProperty.populate([
      {
        path: "landlord",
        select:
          "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone",
      },
      { path: "agent", select: "user" },
      { path: "memberId", select: "email phone" },
      { path: "organizationId", select: "name" },
    ]);

    // Trigger AI insights generation asynchronously
    const propertyId = (newProperty._id as mongoose.Types.ObjectId).toString();
    generateAIInsights(propertyId).catch(console.error);

    // Schedule automatic amenity discovery for the new property
    if (newProperty?.location?.coordinates) {
      await AutoPopulationService.handlePropertyCreated(newProperty);
    }

    return newProperty;
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
};

/**
 * Check if property can be published (meets requirements)
 */
export const canPublish = async (
  propertyId: string
): Promise<{
  canPublish: boolean;
  missingRequirements: string[];
  warnings: string[];
}> => {
  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return {
        canPublish: false,
        missingRequirements: ["Property not found"],
        warnings: [],
      };
    }

    const missing: string[] = [];
    const warnings: string[] = [];

    // Required fields check
    if (!property.title || property.title.length < 10) {
      missing.push("Title must be at least 10 characters");
    }
    if (!property.description || property.description.length < 50) {
      missing.push("Description must be at least 50 characters");
    }
    if (!property.location.address) {
      missing.push("Property address is required");
    }
    if (
      !(
        property.location.coordinates.latitude &&
        property.location.coordinates.longitude
      )
    ) {
      missing.push("Property coordinates are required");
    }
    if (property.pricing.rent <= 0) {
      missing.push("Valid rent price is required");
    }
    if (!property.media.images || property.media.images.length === 0) {
      missing.push("At least one image is required");
    }
    if (!property.availability.viewingContact.phone) {
      missing.push("Viewing contact phone is required");
    }

    // Warnings for better listing
    if (property.media.images.length < 3) {
      warnings.push("Consider adding more images for better visibility");
    }
    if (property.description.length < 200) {
      warnings.push("Consider adding more detailed description");
    }
    if (
      !property.location.nearbyAmenities ||
      property.location.nearbyAmenities.length === 0
    ) {
      warnings.push("Consider adding nearby amenities information");
    }

    // Count selected amenities
    const amenitiesCount = Object.values(property.amenities).filter(
      Boolean
    ).length;
    if (amenitiesCount < 3) {
      warnings.push("Consider highlighting more amenities");
    }

    return {
      canPublish: missing.length === 0,
      missingRequirements: missing,
      warnings,
    };
  } catch (error) {
    console.error("Error checking publish requirements:", error);
    return {
      canPublish: false,
      missingRequirements: ["Error checking requirements"],
      warnings: [],
    };
  }
};

/**
 * Update a property
 */
export const updateProperty = async (
  id: string,
  updateData: Partial<IProperty>,
  userId?: string
): Promise<IProperty> => {
  try {
    const property = await Property.findById(id);

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Check permissions if userId is provided
    if (userId) {
      const canEdit = await canUserEditProperty(userId, property);
      if (!canEdit) {
        throw new ForbiddenError(
          "You don't have permission to edit this property"
        );
      }
    }

    // If title is being updated, regenerate slug
    if (updateData.title && updateData.title !== property.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, id);
    }

    // Update lastUpdatedAt
    updateData.lastUpdatedAt = new Date();

    // If status changes to ACTIVE, set publishedAt if not already set
    if (updateData.status === PropertyStatus.ACTIVE && !property.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "landlord", select: "firstName lastName email phone" },
      { path: "agent", select: "firstName lastName email phone" },
      { path: "memberId", select: "email phone" },
      { path: "organizationId", select: "name" },
    ]);

    if (!updatedProperty) {
      throw new NotFoundError("Property not found after update");
    }

    // Clear cache for this item and items list
    await clearCache(`api:/api/v1/properties/${id}`);
    await clearCache("api:/api/v1/properties*");

    // Regenerate AI insights if significant fields changed
    if (
      updateData.pricing ||
      updateData.specifications ||
      updateData.location
    ) {
      generateAIInsights(id).catch(console.error);
    }

    // Check if location was updated and trigger amenity discovery
    if (updatedProperty && updateData.location?.coordinates) {
      const oldLocation = property.location;
      const newLocation = updatedProperty.location;

      await AutoPopulationService.handlePropertyLocationUpdated(
        id,
        oldLocation,
        newLocation
      );
    }

    return updatedProperty;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error("Error updating property:", error);
    throw error;
  }
};

/**
 * Soft delete a property
 */
export const deleteProperty = async (
  id: string,
  userId?: string
): Promise<boolean> => {
  try {
    const property = await Property.findById(id);

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Check permissions if userId is provided
    if (userId) {
      const canDelete = await canUserEditProperty(userId, property);
      if (!canDelete) {
        throw new ForbiddenError(
          "You don't have permission to delete this property"
        );
      }
    }

    const result = await Property.findByIdAndUpdate(
      id,
      {
        status: PropertyStatus.INACTIVE,
        lastUpdatedAt: new Date(),
      },
      { new: true }
    );

    // Clear cache for this item and items list
    await clearCache(`api:/api/v1/properties/${id}`);
    await clearCache("api:/api/v1/properties*");

    return !!result;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error("Error deleting property:", error);
    throw error;
  }
};

/**
 * Hard delete a property (use with caution)
 */
export const hardDeleteProperty = async (
  id: string,
  userId?: string
): Promise<boolean> => {
  try {
    const property = await Property.findById(id);

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Check permissions if userId is provided
    if (userId) {
      const canDelete = await canUserEditProperty(userId, property);
      if (!canDelete) {
        throw new ForbiddenError(
          "You don't have permission to delete this property"
        );
      }
    }

    await Property.findByIdAndDelete(id);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error("Error hard deleting property:", error);
    throw error;
  }
};

/**
 * Search properties with advanced filters
 */
export const searchProperties = async (
  filters: PropertySearchFilters
): Promise<IProperty[]> => {
  try {
    const query: FilterQuery<IProperty> = {};

    // Build query from filters
    if (filters.type) {
      query.type = Array.isArray(filters.type)
        ? { $in: filters.type }
        : filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.county) {
      query["location.county"] = { $regex: filters.county, $options: "i" };
    }

    if (filters.estate) {
      query["location.estate"] = { $regex: filters.estate, $options: "i" };
    }

    if (filters.coordinates && filters.radius) {
      query.geolocation = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              filters.coordinates.longitude,
              filters.coordinates.latitude,
            ],
          },
          $maxDistance: filters.radius * 1000, // convert km to meters
        },
      };
    }

    if (filters.minRent || filters.maxRent) {
      query["pricing.rent"] = {};
      if (filters.minRent) {
        query["pricing.rent"].$gte = filters.minRent;
      }
      if (filters.maxRent) {
        query["pricing.rent"].$lte = filters.maxRent;
      }
    }

    if (filters.minBedrooms || filters.maxBedrooms) {
      query["specifications.bedrooms"] = {};
      if (filters.minBedrooms) {
        query["specifications.bedrooms"].$gte = filters.minBedrooms;
      }
      if (filters.maxBedrooms) {
        query["specifications.bedrooms"].$lte = filters.maxBedrooms;
      }
    }

    if (filters.minBathrooms || filters.maxBathrooms) {
      query["specifications.bathrooms"] = {};
      if (filters.minBathrooms) {
        query["specifications.bathrooms"].$gte = filters.minBathrooms;
      }
      if (filters.maxBathrooms) {
        query["specifications.bathrooms"].$lte = filters.maxBathrooms;
      }
    }

    if (filters.furnished) {
      query["specifications.furnished"] = filters.furnished;
    }

    if (filters.amenities && filters.amenities.length > 0) {
      const amenitiesQuery: any = {};
      for (const amenity of filters.amenities) {
        amenitiesQuery[`amenities.${amenity}`] = true;
      }
      Object.assign(query, amenitiesQuery);
    }

    if (filters.verified !== undefined) {
      query.verified = filters.verified;
    }

    if (filters.featured !== undefined) {
      query.featured = filters.featured;
    }

    if (filters.hasImages !== undefined) {
      query["media.images"] = filters.hasImages
        ? { $exists: true, $ne: [] }
        : { $exists: false };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const sort: any = {};
    if (filters.sort) {
      sort[filters.sort] = filters.order === "asc" ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    return await Property.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("landlord", "personalInfo verification")
      .populate("agent", "personalInfo")
      .exec();
  } catch (error) {
    console.error("Error searching properties:", error);
    throw error;
  }
};

/**
 * Get property analytics
 */
export const getPropertyAnalytics = async (
  _filters: Partial<PropertyQueryParams> = {}
): Promise<PropertyAnalytics> => {
  try {
    const baseFilter: FilterQuery<IProperty> = {};

    // Apply filters
    if (_filters.landlordId) {
      baseFilter.landlord = new mongoose.Types.ObjectId(_filters.landlordId);
    }
    if (_filters.organizationId) {
      baseFilter.organizationId = new mongoose.Types.ObjectId(
        _filters.organizationId
      );
    }
    if (_filters.status) {
      baseFilter.status = Array.isArray(_filters.status)
        ? { $in: _filters.status }
        : _filters.status;
    }

    const [
      totalProperties,
      activeProperties,
      draftProperties,
      inactiveProperties,
      letProperties,
      verifiedProperties,
      featuredProperties,
      rentStats,
      typeDistribution,
      statusDistribution,
      listingTypeDistribution,
      countyStats,
      estateStats,
      bedroomStats,
      occupancyStats,
      priceRanges,
      trends,
    ] = await Promise.all([
      // Basic counts
      Property.countDocuments(baseFilter),
      Property.countDocuments({
        ...baseFilter,
        status: PropertyStatus.ACTIVE,
      }),
      Property.countDocuments({
        ...baseFilter,
        status: PropertyStatus.DRAFT,
      }),
      Property.countDocuments({
        ...baseFilter,
        status: PropertyStatus.INACTIVE,
      }),
      Property.countDocuments({ ...baseFilter, status: PropertyStatus.LET }),
      Property.countDocuments({ ...baseFilter, verified: true }),
      Property.countDocuments({ ...baseFilter, featured: true }),

      // Rent statistics
      Property.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            avgRent: { $avg: "$pricing.rent" },
            medianRent: {
              $median: { input: "$pricing.rent", method: "approximate" },
            },
            totalValue: { $sum: "$pricing.rent" },
          },
        },
      ]),

      // Type distribution
      Property.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),

      // Status distribution
      Property.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Listing type distribution
      Property.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$listingType", count: { $sum: 1 } } },
      ]),

      // County statistics
      Property.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: "$location.county",
            count: { $sum: 1 },
            avgRent: { $avg: "$pricing.rent" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Estate statistics
      Property.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: "$location.estate",
            count: { $sum: 1 },
            avgRent: { $avg: "$pricing.rent" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Bedroom statistics
      Property.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: "$specifications.bedrooms",
            count: { $sum: 1 },
            avgRent: { $avg: "$pricing.rent" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Occupancy statistics
      Property.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$stats.views" },
            totalInquiries: { $sum: "$stats.inquiries" },
            totalApplications: { $sum: "$stats.applications" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Price ranges
      Property.aggregate([
        { $match: baseFilter },
        {
          $bucket: {
            groupBy: "$pricing.rent",
            boundaries: [
              0,
              10_000,
              20_000,
              30_000,
              50_000,
              100_000,
              200_000,
              Number.POSITIVE_INFINITY,
            ],
            default: "Other",
            output: {
              count: { $sum: 1 },
            },
          },
        },
      ]),

      // Trends (last 12 months)
      Property.aggregate([
        {
          $match: {
            ...baseFilter,
            createdAt: {
              $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
            avgPriceChange: { $avg: "$pricing.rent" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    // Process results
    const rentStatsData = rentStats[0] || {};
    const occupancyStatsData = occupancyStats[0] || {};

    const byType = typeDistribution.reduce(
      (acc, item) => {
        acc[item._id as PropertyType] = item.count;
        return acc;
      },
      {} as Record<PropertyType, number>
    );

    const byStatus = statusDistribution.reduce(
      (acc, item) => {
        acc[item._id as PropertyStatus] = item.count;
        return acc;
      },
      {} as Record<PropertyStatus, number>
    );

    const byListingType = listingTypeDistribution.reduce(
      (acc, item) => {
        acc[item._id as ListingType] = item.count;
        return acc;
      },
      {} as Record<ListingType, number>
    );

    const byCounty = countyStats.map((item) => ({
      county: item._id,
      count: item.count,
      avgRent: Math.round(item.avgRent || 0),
    }));

    const byEstate = estateStats.map((item) => ({
      estate: item._id,
      count: item.count,
      avgRent: Math.round(item.avgRent || 0),
    }));

    const byBedrooms = bedroomStats.map((item) => ({
      bedrooms: item._id,
      count: item.count,
      avgRent: Math.round(item.avgRent || 0),
    }));

    const processedPriceRanges = priceRanges.map((item) => {
      const ranges: Record<number, string> = {
        0: "0-10K",
        10000: "10K-20K",
        20000: "20K-30K",
        30000: "30K-50K",
        50000: "50K-100K",
        100000: "100K-200K",
        200000: "200K+",
      };
      return {
        range: ranges[item._id] || "Other",
        count: item.count,
      };
    });

    const newListings = trends.map((item) => ({
      period: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
      count: item.count,
    }));

    const priceChanges = trends.map((item) => ({
      period: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
      avgChange: Math.round(item.avgPriceChange || 0),
    }));

    return {
      totalProperties,
      activeProperties,
      draftProperties,
      inactiveProperties,
      letProperties,
      verifiedProperties,
      featuredProperties,
      averageRent: Math.round(rentStatsData.avgRent || 0),
      medianRent: Math.round(rentStatsData.medianRent || 0),
      totalValue: Math.round(rentStatsData.totalValue || 0),
      byType,
      byStatus,
      byListingType,
      byCounty,
      byEstate,
      byBedrooms,
      occupancyStats: {
        totalViews: occupancyStatsData.totalViews || 0,
        totalInquiries: occupancyStatsData.totalInquiries || 0,
        totalApplications: occupancyStatsData.totalApplications || 0,
        avgViewsPerProperty: Math.round(
          (occupancyStatsData.totalViews || 0) / (occupancyStatsData.count || 1)
        ),
        avgInquiriesPerProperty: Math.round(
          (occupancyStatsData.totalInquiries || 0) /
            (occupancyStatsData.count || 1)
        ),
      },
      priceRanges: processedPriceRanges,
      trends: {
        newListings,
        priceChanges,
      },
    };
  } catch (error) {
    console.error("Error getting property analytics:", error);
    throw error;
  }
};

/**
 * Get property statistics for owner/admin
 */
export const getPropertyStats = async (
  propertyId: string
): Promise<{
  views: number;
  inquiries: number;
  applications: number;
  bookmarks: number;
  totalEngagement: number;
  viewsLastWeek: number;
  inquiriesLastWeek: number;
} | null> => {
  try {
    const property = await Property.findById(propertyId);
    if (!property) return null;

    // Get engagement data (placeholder for now - would integrate with analytics)
    const stats = {
      views: property.stats.views,
      inquiries: property.stats.inquiries,
      applications: property.stats.applications,
      bookmarks: property.stats.bookmarks,
      totalEngagement:
        property.stats.views +
        property.stats.inquiries +
        property.stats.applications,
      viewsLastWeek: 0, // Would calculate from analytics data
      inquiriesLastWeek: 0, // Would calculate from inquiries collection
    };

    return stats;
  } catch (error) {
    console.error("Error getting property stats:", error);
    return null;
  }
};

/**
 * Bulk update properties
 */
export const bulkUpdateProperties = async (
  propertyIds: string[],
  updateData: Partial<IProperty>
): Promise<PropertyBulkOperationResult> => {
  try {
    const results = await Promise.allSettled(
      propertyIds.map((id) => updateProperty(id, updateData))
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const errors: Array<{ propertyId: string; error: string }> = [];
    const updated: mongoose.Types.ObjectId[] = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push({
          propertyId: propertyIds[index] || "",
          error: result.reason.message || "Unknown error",
        });
      } else if (result.value) {
        updated.push(result.value._id as mongoose.Types.ObjectId);
      }
    });

    return { success, failed, errors, updated };
  } catch (error) {
    console.error("Error in bulk update:", error);
    throw error;
  }
};

/**
 * Bulk delete properties
 */
export const bulkDeleteProperties = async (
  propertyIds: string[]
): Promise<PropertyBulkOperationResult> => {
  try {
    const results = await Promise.allSettled(
      propertyIds.map((id) => deleteProperty(id))
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const errors: Array<{ propertyId: string; error: string }> = [];
    const updated: mongoose.Types.ObjectId[] = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push({
          propertyId: propertyIds[index] || "",
          error: result.reason.message || "Unknown error",
        });
      } else {
        updated.push(new mongoose.Types.ObjectId(propertyIds[index]));
      }
    });

    return { success, failed, errors, updated };
  } catch (error) {
    console.error("Error in bulk delete:", error);
    throw error;
  }
};

// ==================== PROPERTY MODERATION ====================

/**
 * Approve a property
 */
export const approveProperty = async (
  id: string,
  moderatorId: string
): Promise<IProperty> => {
  try {
    const property = await Property.findById(id);

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        moderationStatus: "approved",
        moderatedBy: new mongoose.Types.ObjectId(moderatorId),
        moderatedAt: new Date(),
        status: PropertyStatus.ACTIVE,
        publishedAt: property.publishedAt || new Date(),
      },
      { new: true }
    ).populate([
      { path: "landlord", select: "firstName lastName email phone" },
      { path: "moderatedBy", select: "firstName lastName email" },
    ]);

    if (!updatedProperty) {
      throw new NotFoundError("Property not found after approval");
    }

    // TODO: Send notification to landlord
    // notificationService.sendPropertyApproved(updatedProperty);

    return updatedProperty;
  } catch (error) {
    console.error("Error approving property:", error);
    throw error;
  }
};

/**
 * Reject a property
 */
export const rejectProperty = async (
  id: string,
  moderatorId: string,
  reason: string
): Promise<IProperty> => {
  try {
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        moderationStatus: "rejected",
        moderatedBy: new mongoose.Types.ObjectId(moderatorId),
        moderatedAt: new Date(),
        rejectionReason: reason,
        status: PropertyStatus.INACTIVE,
      },
      { new: true }
    ).populate([
      { path: "landlord", select: "firstName lastName email phone" },
      { path: "moderatedBy", select: "firstName lastName email" },
    ]);

    if (!updatedProperty) {
      throw new NotFoundError("Property not found");
    }

    // TODO: Send notification to landlord
    // notificationService.sendPropertyRejected(updatedProperty, reason);

    return updatedProperty;
  } catch (error) {
    console.error("Error rejecting property:", error);
    throw error;
  }
};

/**
 * Flag a property for review
 */
export const flagProperty = async (
  id: string,
  reason: string
): Promise<IProperty> => {
  try {
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        moderationStatus: "flagged",
        moderationNotes: reason,
      },
      { new: true }
    );

    if (!updatedProperty) {
      throw new NotFoundError("Property not found");
    }

    return updatedProperty;
  } catch (error) {
    console.error("Error flagging property:", error);
    throw error;
  }
};

// ==================== PROPERTY VERIFICATION ====================

/**
 * Verify a property
 */
export const verifyProperty = async (
  id: string,
  _verifierId: string
): Promise<IProperty> => {
  try {
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        verified: true,
        verifiedAt: new Date(),
      },
      { new: true }
    ).populate([
      {
        path: "landlord",
        select:
          "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone",
      },
    ]);

    if (!updatedProperty) {
      throw new NotFoundError("Property not found");
    }

    // TODO: Send notification to landlord
    // notificationService.sendPropertyVerified(updatedProperty);

    return updatedProperty;
  } catch (error) {
    console.error("Error verifying property:", error);
    throw error;
  }
};

/**
 * Unverify a property
 */
export const unverifyProperty = async (id: string): Promise<IProperty> => {
  try {
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        verified: false,
        verifiedAt: undefined,
      },
      { new: true }
    );

    if (!updatedProperty) {
      throw new NotFoundError("Property not found");
    }

    return updatedProperty;
  } catch (error) {
    console.error("Error unverifying property:", error);
    throw error;
  }
};

// ==================== PROPERTY FEATURES ====================

/**
 * Feature a property
 */
export const featureProperty = async (
  id: string,
  durationDays?: number
): Promise<IProperty> => {
  try {
    const updateData: any = {
      featured: true,
      isPromoted: true,
    };

    if (durationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      updateData.expiresAt = expiresAt;
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedProperty) {
      throw new NotFoundError("Property not found");
    }

    return updatedProperty;
  } catch (error) {
    console.error("Error featuring property:", error);
    throw error;
  }
};

/**
 * Unfeature a property
 */
export const unfeatureProperty = async (id: string): Promise<IProperty> => {
  try {
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        featured: false,
        isPromoted: false,
        expiresAt: undefined,
      },
      { new: true }
    );

    if (!updatedProperty) {
      throw new NotFoundError("Property not found");
    }

    return updatedProperty;
  } catch (error) {
    console.error("Error unfeaturing property:", error);
    throw error;
  }
};

// ==================== PROPERTY STATISTICS ====================

/**
 * Increment property view count
 */
export const incrementViews = async (id: string): Promise<void> => {
  try {
    await Property.findByIdAndUpdate(id, {
      $inc: { "stats.views": 1 },
    });
  } catch (error) {
    console.error("Error incrementing views:", error);
  }
};

/**
 * Increment property inquiry count
 */
export const incrementInquiries = async (id: string): Promise<void> => {
  try {
    await Property.findByIdAndUpdate(id, {
      $inc: { "stats.inquiries": 1 },
    });
  } catch (error) {
    console.error("Error incrementing inquiries:", error);
  }
};

/**
 * Increment property application count
 */
export const incrementApplications = async (id: string): Promise<void> => {
  try {
    await Property.findByIdAndUpdate(id, {
      $inc: { "stats.applications": 1 },
    });
  } catch (error) {
    console.error("Error incrementing applications:", error);
  }
};

/**
 * Increment property bookmark count
 */
export const incrementBookmarks = async (id: string): Promise<void> => {
  try {
    await Property.findByIdAndUpdate(id, {
      $inc: { "stats.bookmarks": 1 },
    });
  } catch (error) {
    console.error("Error incrementing bookmarks:", error);
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate unique slug from title
 */
const generateUniqueSlug = async (
  title: string,
  excludeId?: string
): Promise<string> => {
  // Simple slug generation: lowercase, replace spaces with hyphens, remove special chars
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let counter = 0;

  while (true) {
    const testSlug = counter === 0 ? slug : `${slug}-${counter}`;
    const query: FilterQuery<IProperty> = { slug: testSlug };
    if (excludeId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    const existing = await Property.findOne(query);
    if (!existing) {
      return testSlug;
    }
    counter++;
  }
};

/**
 * Check if user can edit property
 */
const canUserEditProperty = (userId: string, property: IProperty): boolean => {
  // Check if user is the landlord
  if (property.landlord.toString() === userId) {
    return true;
  }

  // Check if user is the agent
  if (property.agent && property.agent.toString() === userId) {
    return true;
  }

  // TODO: Check if user has admin/moderator role
  // This would require fetching the user and checking their role
  // For now, return false
  return false;
};

/**
 * Generate AI insights for a property
 */
const generateAIInsights = (propertyId: string): Promise<void> => {
  try {
    // TODO: Implement AI insights generation
    // This would integrate with the OpenAI service
    // For now, just update the lastUpdated timestamp
    return Property.findByIdAndUpdate(propertyId, {
      "aiInsights.lastUpdated": new Date(),
    }).then(() => {
      // Intentionally empty - just ensuring promise resolves to void
      return;
    });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return Promise.resolve();
  }
};

// ==================== CONVENIENCE FUNCTIONS ====================

/**
 * Get properties by landlord
 */
export const getPropertiesByLandlord = (
  landlordId: string,
  options: Partial<PropertyQueryParams> = {}
) =>
  getProperties({
    ...options,
    landlordId,
  });

/**
 * Get properties by agent
 */
export const getPropertiesByAgent = (
  agentId: string,
  options: Partial<PropertyQueryParams> = {}
) =>
  getProperties({
    ...options,
    agentId,
  });

/**
 * Get properties by member
 */
export const getPropertiesByMember = (
  memberId: string,
  options: Partial<PropertyQueryParams> = {}
) =>
  getProperties({
    ...options,
    memberId,
  });

/**
 * Get featured properties
 */
export const getFeaturedProperties = async (
  limit = 10
): Promise<IProperty[]> => {
  const properties = await Property.find({
    featured: true,
    status: PropertyStatus.ACTIVE,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("landlord", "personalInfo verification");

  return properties;
};

/**
 * Get verified properties
 */
export const getVerifiedProperties = async (
  limit = 10
): Promise<IProperty[]> => {
  const properties = await Property.find({
    verified: true,
    status: PropertyStatus.ACTIVE,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("landlord", "personalInfo verification");

  return properties;
};

/**
 * Get recently added properties
 */
export const getRecentProperties = async (limit = 10): Promise<IProperty[]> => {
  const properties = await Property.find({
    status: PropertyStatus.ACTIVE,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("landlord", "personalInfo verification");

  return properties;
};

/**
 * Get similar properties based on type, location, and price
 */
export const getSimilarProperties = async (
  propertyId: string,
  limit = 5
): Promise<IProperty[]> => {
  try {
    const property = await Property.findById(propertyId);

    if (!property) {
      return [];
    }

    const priceRange = property.pricing.rent * 0.2; // 20% price variance

    return await Property.find({
      _id: { $ne: propertyId },
      type: property.type,
      "location.county": property.location.county,
      status: PropertyStatus.ACTIVE,
      "pricing.rent": {
        $gte: property.pricing.rent - priceRange,
        $lte: property.pricing.rent + priceRange,
      },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(
        "landlord",
        "personalInfo.firstName personalInfo.lastName personalInfo.phone verification.status"
      );
  } catch (error) {
    console.error("Error getting similar properties:", error);
    return [];
  }
};

/**
 * Get similar properties based on location, price, and type
 */
export const getSimilarProperties_v2 = async (
  propertyId: string,
  limit = 6
): Promise<IProperty[]> => {
  try {
    const property = await Property.findById(propertyId);
    if (!property) return [];

    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(propertyId) },
          status: PropertyStatus.ACTIVE,
          "availability.isAvailable": true,
          moderationStatus: "approved",
          $or: [
            // Same type
            { type: property.type },
            // Similar price range (±30%)
            {
              "pricing.rent": {
                $gte: property.pricing.rent * 0.7,
                $lte: property.pricing.rent * 1.3,
              },
            },
            // Same county/estate
            {
              "location.county": property.location.county,
              "location.estate": property.location.estate,
            },
          ],
        },
      },
      // Add distance calculation
      {
        $addFields: {
          distance: {
            $multiply: [
              {
                $sqrt: {
                  $add: [
                    {
                      $pow: [
                        {
                          $subtract: [
                            "$location.coordinates.longitude",
                            property.location.coordinates.longitude,
                          ],
                        },
                        2,
                      ],
                    },
                    {
                      $pow: [
                        {
                          $subtract: [
                            "$location.coordinates.latitude",
                            property.location.coordinates.latitude,
                          ],
                        },
                        2,
                      ],
                    },
                  ],
                },
              },
              111_000, // Convert to meters
            ],
          },
          similarity: {
            $add: [
              // Same type bonus
              { $cond: [{ $eq: ["$type", property.type] }, 3, 0] },
              // Same county bonus
              {
                $cond: [
                  { $eq: ["$location.county", property.location.county] },
                  2,
                  0,
                ],
              },
              // Same estate bonus
              {
                $cond: [
                  { $eq: ["$location.estate", property.location.estate] },
                  4,
                  0,
                ],
              },
              // Same bedrooms bonus
              {
                $cond: [
                  {
                    $eq: [
                      "$specifications.bedrooms",
                      property.specifications.bedrooms,
                    ],
                  },
                  1,
                  0,
                ],
              },
              // Featured property bonus
              { $cond: [{ $eq: ["$featured", true] }, 1, 0] },
            ],
          },
        },
      },
      {
        $sort: {
          similarity: -1,
          distance: 1,
          "stats.views": -1,
          publishedAt: -1,
        },
      },
      { $limit: limit },
      {
        $lookup: {
          from: "landlords",
          localField: "landlord",
          foreignField: "_id",
          as: "landlord",
          pipeline: [
            {
              $project: {
                "personalInfo.firstName": 1,
                "personalInfo.lastName": 1,
                "verification.status": 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: "$landlord", preserveNullAndEmptyArrays: true } },
    ];

    return Property.aggregate(pipeline as PipelineStage[]) as Promise<
      IProperty[]
    >;
  } catch (error) {
    console.error("Error getting similar properties:", error);
    return [];
  }
};

/**
 * Get property pricing insights for the area
 */
export const getPricingInsights = async (
  propertyId: string
): Promise<{
  averageRent: number;
  medianRent: number;
  priceRange: { min: number; max: number };
  comparableCount: number;
  pricePercentile: number;
  suggestion: string;
} | null> => {
  try {
    const property = await Property.findById(propertyId);
    if (!property) return null;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: { $ne: property._id },
          type: property.type,
          status: PropertyStatus.ACTIVE,
          "availability.isAvailable": true,
          moderationStatus: "approved",
          $or: [
            {
              "location.county": property.location.county,
              "location.estate": property.location.estate,
            },
            {
              "location.county": property.location.county,
              "specifications.bedrooms": property.specifications.bedrooms,
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          avgRent: { $avg: "$pricing.rent" },
          minRent: { $min: "$pricing.rent" },
          maxRent: { $max: "$pricing.rent" },
          rents: { $push: "$pricing.rent" },
          count: { $sum: 1 },
        },
      },
    ];

    const [result] = await Property.aggregate(pipeline as PipelineStage[]);
    if (!result) return null;

    // Calculate median
    const rents = result.rents.sort((a: number, b: number) => a - b);
    const median =
      rents.length % 2 === 0
        ? (rents[rents.length / 2 - 1] + rents[rents.length / 2]) / 2
        : rents[Math.floor(rents.length / 2)];

    // Calculate percentile
    const lowerCount = rents.filter(
      (rent: number) => rent < property.pricing.rent
    ).length;
    const percentile = (lowerCount / rents.length) * 100;

    // Generate suggestion
    let suggestion = "";
    if (percentile < 25) {
      suggestion =
        "Your rent is below market average. Consider increasing price.";
    } else if (percentile > 75) {
      suggestion =
        "Your rent is above market average. Consider competitive pricing.";
    } else {
      suggestion = "Your rent is competitively priced for the market.";
    }

    return {
      averageRent: Math.round(result.avgRent),
      medianRent: Math.round(median),
      priceRange: { min: result.minRent, max: result.maxRent },
      comparableCount: result.count,
      pricePercentile: Math.round(percentile),
      suggestion,
    };
  } catch (error) {
    console.error("Error getting pricing insights:", error);
    return null;
  }
};

/**
 * Get property recommendations for user based on preferences
 */
export const getRecommendations = async (
  userId: string,
  limit = 10
): Promise<IProperty[]> => {
  try {
    const user = await User.findById(userId);
    if (!user?.preferences) return [];

    const prefs = user.preferences;

    const landlord = await Landlord.findOne({ user: userId });

    const pipeline: PipelineStage[] = [
      {
        $match: {
          status: PropertyStatus.ACTIVE,
          "availability.isAvailable": true,
          moderationStatus: "approved",
          landlord: { $ne: landlord?._id },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              // Type preference
              {
                $cond: [
                  { $in: ["$type", prefs.properties.propertyTypes || []] },
                  5,
                  0,
                ],
              },
              // Budget range
              {
                $cond: [
                  {
                    $and: [
                      {
                        $gte: [
                          "$pricing.rent",
                          prefs.properties.budget?.min || 0,
                        ],
                      },
                      {
                        $lte: [
                          "$pricing.rent",
                          prefs.properties.budget?.max || 1_000_000,
                        ],
                      },
                    ],
                  },
                  4,
                  0,
                ],
              },
              // Location preference
              {
                $cond: [
                  {
                    $in: ["$location.county", prefs.properties.locations || []],
                  },
                  3,
                  0,
                ],
              },
              // Bedrooms preference
              {
                $cond: [
                  {
                    $eq: [
                      "$specifications.bedrooms",
                      prefs.properties.bedrooms,
                    ],
                  },
                  2,
                  0,
                ],
              },
              // Furnished preference
              {
                $cond: [
                  {
                    $eq: [
                      "$specifications.furnished",
                      prefs.properties.furnished,
                    ],
                  },
                  1,
                  0,
                ],
              },
              // Featured property bonus
              { $cond: [{ $eq: ["$featured", true] }, 2, 0] },
              // High rating bonus
              { $cond: [{ $gt: ["$stats.views", 100] }, 1, 0] },
            ],
          },
        },
      },
      { $match: { score: { $gt: 0 } } },
      { $sort: { score: -1, publishedAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "landlords",
          localField: "landlord",
          foreignField: "_id",
          as: "landlord",
          pipeline: [
            {
              $project: {
                "personalInfo.firstName": 1,
                "personalInfo.lastName": 1,
                "verification.status": 1,
              },
            },
          ],
        },
      },
      { $unwind: "$owner" },
    ];

    return Property.aggregate(pipeline);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
};

type PropertyNearSearchFilters = {
  minPrice?: string;
  maxPrice?: string;
  minBedrooms?: string;
  bedrooms?: string;
  bathrooms?: string;
  type?: string;
  furnished?: FurnishedStatus;
  petsAllowed?: boolean;
  availableFrom?: Date;
  tenantId?: string;
  userId?: string;
  sortOrder?: string;
  createdAt?: Date;
};

/**
 * Get properties near coordinates
 */
export const getPropertiesNearLocation = async (
  latitude: number,
  longitude: number,
  radiusInMeters = 5000,
  limit = 10,
  page = 1,
  sortBy = "createdAt",
  sortOrder = "desc",
  filters: PropertyNearSearchFilters = {}
): Promise<{
  properties: IProperty & { distance: number }[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    latitude: number;
    longitude: number;
    radius: number;
    priceRange: { min: number; max: number };
  };
  meta: {
    queryTimeMs: number;
    statusCounts: Record<string, number>;
  };
}> => {
  try {
    const startTime = performance.now();

    // Build filter object
    const filter: FilterQuery<IProperty> = {
      status: PropertyStatus.ACTIVE,
      "availability.isAvailable": true,
      moderationStatus: "approved",
      // Use MongoDB geospatial query for proximity search
      geolocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON format: [lng, lat]
          },
          $maxDistance: radiusInMeters, // Convert km to meters
        },
      },
    };

    if (filters.minPrice || filters.maxPrice) {
      // Apply additional filters
      filter.pricing = { rent: {} };
      if (filters.minPrice)
        (filter.pricing.rent as Record<string, number>).$gte = Number(
          filters.minPrice
        );
      if (filters.maxPrice)
        (filter.pricing.rent as Record<string, number>).$lte = Number(
          filters.maxPrice
        );
    }

    if (filters.minBedrooms) {
      filter.specifications = {
        bedrooms: { $gte: Number(filters.minBedrooms) },
      };
    } else if (filters.bedrooms) {
      filter.specifications = { bedrooms: Number(filters.bedrooms) };
    }

    if (filters.bathrooms) {
      filter.specifications = {
        ...filter.details,
        bathrooms: Number(filters.bathrooms),
      };
    }

    if (filters.type) {
      filter.type = filters.type;
    }

    if (filters.furnished !== undefined) {
      filter.specifications = {
        ...filter.specifications,
        furnished: filters.furnished,
      };
    }

    if (filters.petsAllowed !== undefined) {
      filter.specifications = {
        ...filter.specifications,
        petFriendly: filters.petsAllowed,
      };
    }

    if (filters.availableFrom) {
      filter.availability.availableFrom = {
        $lte: new Date(filters.availableFrom),
      };
    }

    if (filters.tenantId) {
      filter.currentTenants = [filters.tenantId];
    }

    if (filters.createdAt) {
      filter.createdAt = { $lte: new Date(filters.createdAt) };
    }

    // Parse pagination params
    const pageNum = Number.parseInt(page.toString(), 10);
    const limitNum = Number.parseInt(limit.toString(), 10);
    const skip = (pageNum - 1) * limitNum;

    let query = Property.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .populate("landlord", "personalInfo verification")
      .populate("agent", "user")
      .populate("memberId", "email phone")
      .populate("organizationId", "name");

    if (sortBy !== "distance") {
      // For distance sorting, $near already sorts by distance ascending
      // For other sorting options, we need to override
      let sort: Record<string, 1 | -1> = {};
      switch (sortBy) {
        case "priceAsc":
          sort = { "pricing.rent": 1 };
          break;
        case "priceDesc":
          sort = { "pricing.rent": -1 };
          break;
        case "dateAsc":
          sort = { createdAt: 1 };
          break;
        case "dateDesc":
          sort = { createdAt: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
      query = query.sort(sort);
    }

    const properties = await query.lean();

    // Calculate exact distances using Haversine formula and add to results
    const propertiesWithDistance = properties.map((property) => {
      const propLng =
        property.geolocation?.coordinates?.[0] ||
        property.location?.coordinates?.longitude ||
        0;
      const propLat =
        property.geolocation?.coordinates?.[1] ||
        property.location?.coordinates?.latitude ||
        0;

      const distance = calculateDistance(
        [longitude, latitude],
        [propLng, propLat]
      );

      return {
        ...property,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      };
    });

    // Get total count for pagination
    const totalProperties = await Property.countDocuments(filter);
    const totalPages = Math.ceil(totalProperties / limitNum);

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    if (queryTime > 500) {
      // Log slow queries
      console.warn(`Slow nearby properties query: ${queryTime}ms`, filter);
      slowQueryCounter.inc({ route: "/properties/nearby" });
    }

    const statusCounts = await Property.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return {
      properties: propertiesWithDistance as any,
      pagination: {
        total: totalProperties,
        pages: totalPages,
        page: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        latitude,
        longitude,
        radius: radiusInMeters,
        priceRange:
          filters.minPrice || filters.maxPrice
            ? {
                min: filters.minPrice ? Number(filters.minPrice) : 0,
                max: filters.maxPrice ? Number(filters.maxPrice) : 0,
              }
            : { min: 0, max: 0 },
      },
      meta: {
        queryTimeMs: Math.round(queryTime),
        statusCounts: Object.fromEntries(
          statusCounts.map(({ _id, count }) => [_id, count])
        ),
      },
    };
  } catch (error) {
    console.error("Error getting properties near location:", error);
    return {
      properties: [] as any,
      pagination: {
        total: 0,
        pages: 0,
        page: 0,
        limit: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        latitude,
        longitude,
        radius: radiusInMeters,
        priceRange: { min: 0, max: 0 },
      },
      meta: {
        queryTimeMs: 0,
        statusCounts: {},
      },
    };
  }
};

/**
 * Get property stats for landlord
 */
export const getLandlordPropertyStats = async (_landlordId: string) => {
  try {
    const stats = await Property.aggregate([
      { $match: { landlord: new mongoose.Types.ObjectId(_landlordId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRent: { $sum: "$pricing.rent" },
          totalViews: { $sum: "$stats.views" },
          totalInquiries: { $sum: "$stats.inquiries" },
        },
      },
    ]);

    return stats;
  } catch (error) {
    console.error("Error getting landlord property stats:", error);
    throw error;
  }
};

/**
 * Get properties expiring soon
 */
export const getExpiringProperties = async (
  daysAhead = 30
): Promise<IProperty[]> => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await Property.find({
      expiresAt: { $lte: futureDate, $gte: new Date() },
      status: PropertyStatus.ACTIVE,
    })
      .sort({ expiresAt: 1 })
      .populate("landlord", "personalInfo");
  } catch (error) {
    console.error("Error getting expiring properties:", error);
    throw error;
  }
};

/**
 * Get properties pending moderation
 */
export const getPropertiesPendingModeration = async (): Promise<
  IProperty[]
> => {
  try {
    return await Property.find({
      moderationStatus: "pending",
    })
      .sort({ createdAt: 1 })
      .populate("landlord", "personalInfo");
  } catch (error) {
    console.error("Error getting properties pending moderation:", error);
    throw error;
  }
};

/**
 * Update property pricing
 */
export const updatePropertyPricing = async (
  id: string,
  pricingData: Partial<IProperty["pricing"]>,
  reason?: string
): Promise<IProperty> => {
  try {
    const property = await Property.findById(id);

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // Add to price history if rent is changing
    if (pricingData.rent && pricingData.rent !== property.pricing.rent) {
      if (!property.pricing.priceHistory) {
        property.pricing.priceHistory = [];
      }
      property.pricing.priceHistory.push({
        price: property.pricing.rent,
        changedAt: new Date(),
        reason,
      });
    }

    // Update pricing
    Object.assign(property.pricing, pricingData);
    property.lastUpdatedAt = new Date();

    await property.save();

    // Regenerate AI insights
    generateAIInsights(id).catch(console.error);

    return property;
  } catch (error) {
    console.error("Error updating property pricing:", error);
    throw error;
  }
};

/**
 * Add image to property
 */
export const addPropertyImage = async (
  id: string,
  imageData: {
    id: string;
    url: string;
    thumbnailUrl?: string;
    caption?: string;
    isPrimary?: boolean;
    order?: number;
  }
): Promise<IProperty> => {
  try {
    const property = await Property.findById(id);

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    // If this is set as primary, unset other primary images
    if (imageData.isPrimary) {
      for (const img of property.media.images) {
        img.isPrimary = false;
      }
    }

    // If no images exist, make this the primary
    if (property.media.images.length === 0) {
      imageData.isPrimary = true;
    }

    property.media.images.push({
      ...imageData,
      uploadedAt: new Date(),
    } as any);

    property.lastUpdatedAt = new Date();
    await property.save();

    return property;
  } catch (error) {
    console.error("Error adding property image:", error);
    throw error;
  }
};

/**
 * Remove image from property
 */
export const removePropertyImage = async (
  id: string,
  imageId: string
): Promise<IProperty> => {
  try {
    const property = await Property.findById(id);

    if (!property) {
      throw new NotFoundError("Property not found");
    }

    const imageIndex = property.media.images.findIndex(
      (img) => img.id === imageId
    );

    if (imageIndex === -1) {
      throw new NotFoundError("Image not found");
    }

    const imageToRemove = property.media.images[imageIndex];
    const wasPrimary = Boolean(imageToRemove?.isPrimary);
    property.media.images.splice(imageIndex, 1);

    // If removed image was primary, set first image as primary
    if (wasPrimary && property.media.images.length > 0) {
      const firstImage = property.media.images[0];
      if (firstImage) {
        firstImage.isPrimary = true;
      }
    }

    property.lastUpdatedAt = new Date();
    await property.save();

    return property;
  } catch (error) {
    console.error("Error removing property image:", error);
    throw error;
  }
};

/**
 * Update property availability
 */
export const updatePropertyAvailability = async (
  id: string,
  isAvailable: boolean,
  availableFrom?: Date
): Promise<IProperty> => {
  try {
    const updateData: any = {
      "availability.isAvailable": isAvailable,
      lastUpdatedAt: new Date(),
    };

    if (availableFrom) {
      updateData["availability.availableFrom"] = availableFrom;
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedProperty) {
      throw new NotFoundError("Property not found");
    }

    return updatedProperty;
  } catch (error) {
    console.error("Error updating property availability:", error);
    throw error;
  }
};

/**
 * Bulk operations for properties
 */
export const bulkUpdateStatus = async (
  propertyIds: string[],
  status: PropertyStatus,
  userId: string,
  userRole: string
): Promise<{ updated: number; errors: string[] }> => {
  const errors: string[] = [];
  let updated = 0;

  try {
    for (const propertyId of propertyIds) {
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        errors.push(`Invalid property ID: ${propertyId}`);
        continue;
      }

      const property = await Property.findById(propertyId);
      if (!property) {
        errors.push(`Property not found: ${propertyId}`);
        continue;
      }

      if (!property.canBeEditedBy(userId, userRole)) {
        errors.push(`No permission to edit property: ${propertyId}`);
        continue;
      }

      property.status = status;
      await property.save();
      updated++;
    }

    return { updated, errors };
  } catch (error) {
    console.error("Error in bulk update:", error);
    return {
      updated,
      errors: [...errors, "Database error during bulk update"],
    };
  }
};

/**
 * Get property with enhanced amenity information
 */

export const getPropertyWithAmenities = async (
  propertyId: string,
  amenityRadius = 2
): Promise<
  (IProperty & { nearbyAmenities?: any; amenityScore?: any }) | null
> => {
  try {
    const property = await Property.findById(propertyId).lean();

    if (!property) {
      return null;
    }

    // Get nearby amenities
    const latitude =
      property.geolocation?.coordinates?.[1] ||
      property.location?.coordinates?.latitude;
    const longitude =
      property.geolocation?.coordinates?.[0] ||
      property.location?.coordinates?.longitude;

    if (latitude && longitude) {
      const [nearbyAmenities, amenityScore] = await Promise.all([
        AmenityService.findNearbyAmenitiesGrouped(
          latitude,
          longitude,
          amenityRadius,
          {
            verified: true,
            limit: 5,
          }
        ),
        AmenityService.calculateAmenityScore(
          latitude,
          longitude,
          amenityRadius
        ),
      ]);

      return {
        ...property.toObject(),
        nearbyAmenities,
        amenityScore,
      } as any;
    }

    return property.toObject() as any;
  } catch (error) {
    logger.error("Error getting property with amenities:", error);
    throw new Error("Failed to get property with amenities");
  }
};

/**
 * Update property's nearby amenities cache
 */
export const updatePropertyAmenitiesCache = async (
  propertyId: string
): Promise<boolean> => {
  try {
    const property = await Property.findById(propertyId);

    if (!property) {
      return false;
    }

    const latitude =
      property.geolocation?.coordinates?.[1] ||
      property.location?.coordinates?.latitude;
    const longitude =
      property.geolocation?.coordinates?.[0] ||
      property.location?.coordinates?.longitude;

    if (latitude && longitude) {
      // Find nearby amenities within 1km for caching
      const nearbyAmenities = await AmenityService.findNearbyAmenities({
        latitude,
        longitude,
        radius: 1,
        verified: true,
        limit: 20,
      });

      // Update the property's nearbyAmenities field
      const amenityNames = nearbyAmenities
        .filter((amenity) => amenity.distance <= 1) // Only include amenities within 1km
        .map((amenity) => `${amenity.name} (${amenity.type})`)
        .slice(0, 10); // Limit to top 10

      await Property.findByIdAndUpdate(
        propertyId,
        { "location.nearbyAmenities": amenityNames },
        { new: true }
      );

      logger.info(`Updated amenities cache for property ${propertyId}`, {
        amenityCount: amenityNames.length,
      });

      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error updating property amenities cache:", error);
    return false;
  }
};
