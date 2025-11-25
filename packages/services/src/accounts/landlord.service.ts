import { Landlord } from "@kaa/models";
import {
  type CreateLandlordDto,
  type ILandlord,
  KYCLevel,
  type LandlordAnalytics,
  type LandlordBulkOperationResult,
  type LandlordQueryParams,
  LandlordStatus,
  type LandlordType,
  RiskLevel,
  type UpdateLandlordDto,
  VerificationStatus,
} from "@kaa/models/types";
import { BadRequestError, NotFoundError } from "@kaa/utils";
import mongoose, { type FilterQuery } from "mongoose";

// Enhanced landlord retrieval
export const getLandlordById = async (id: string, populate: string[] = []) => {
  try {
    let query = Landlord.findById(id);

    const defaultPopulates = [
      "user:profile contact",
      "properties:title location", // totalUnits
      "organizationId:name",
    ];

    const populateFields = populate.length > 0 ? populate : defaultPopulates;

    for (const field of populateFields) {
      const [path, select] = field.split(":");
      query = query.populate(path ?? "", select);
    }

    const landlord = await query.exec();

    if (landlord) {
      return landlord;
    }

    return new NotFoundError("Landlord not found");
  } catch (error) {
    console.error("Error fetching landlord:", error);
    throw error;
  }
};

export const getLandlordBy = async (query: {
  memberId?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  registrationNumber?: string;
  taxId?: string;
  nationalId?: string;
  userId?: string;
}) => {
  try {
    const searchQuery: FilterQuery<ILandlord> = {};

    if (query.memberId) {
      searchQuery.memberId = new mongoose.Types.ObjectId(query.memberId);
    }
    if (query.email) {
      searchQuery["personalInfo.email"] = query.email;
    }
    if (query.phone) {
      searchQuery["personalInfo.phone"] = query.phone;
    }
    if (query.companyName) {
      searchQuery["businessInfo.companyName"] = {
        $regex: query.companyName,
        $options: "i",
      };
    }
    if (query.registrationNumber) {
      searchQuery["businessInfo.registrationNumber"] = query.registrationNumber;
    }
    if (query.taxId) {
      searchQuery["businessInfo.taxId"] = query.taxId;
    }
    if (query.nationalId) {
      searchQuery["personalInfo.nationalId"] = query.nationalId;
    }
    if (query.userId) {
      searchQuery.user = new mongoose.Types.ObjectId(query.userId);
    }

    return await Landlord.findOne(searchQuery)
      .populate(
        "user",
        "profile.firstName profile.lastName contact.email contact.phone"
      )
      .populate("properties", "title location media totalUnits")
      .populate("organizationId", "name");
  } catch (error) {
    console.error("Error fetching landlord by query:", error);
    return null;
  }
};

// Enhanced landlord listing with advanced filtering
export const getLandlords = async (params: LandlordQueryParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      landlordType,
      verificationStatus,
      riskLevel,
      search,
      tags,
      city,
      state,
      country,
      createdFrom,
      createdTo,
      verifiedFrom,
      verifiedTo,
      minNetWorth,
      maxNetWorth,
      minPropertyValue,
      maxPropertyValue,
      minOccupancyRate,
      maxOccupancyRate,
      minCollectionRate,
      maxCollectionRate,
      hasValidLicense,
      hasActiveViolations,
      complianceExpiring,
      populate = [],
    } = params;

    const skip = (page - 1) * limit;
    const filter: FilterQuery<ILandlord> = {};

    // Status filters - support arrays
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    }

    // Landlord type filters - support arrays
    if (landlordType) {
      if (Array.isArray(landlordType)) {
        filter.landlordType = { $in: landlordType };
      } else {
        filter.landlordType = landlordType;
      }
    }

    // Verification status filters
    if (verificationStatus) {
      if (Array.isArray(verificationStatus)) {
        filter["verification.status"] = { $in: verificationStatus };
      } else {
        filter["verification.status"] = verificationStatus;
      }
    }

    // Risk level filters
    if (riskLevel) {
      if (Array.isArray(riskLevel)) {
        filter["riskAssessment.riskLevel"] = { $in: riskLevel };
      } else {
        filter["riskAssessment.riskLevel"] = riskLevel;
      }
    }

    // Date range filters
    if (createdFrom || createdTo) {
      filter.createdAt = {};
      if (createdFrom) {
        filter.createdAt.$gte = createdFrom;
      }
      if (createdTo) {
        filter.createdAt.$lte = createdTo;
      }
    }

    if (verifiedFrom || verifiedTo) {
      filter["verification.completedDate"] = {};
      if (verifiedFrom) {
        filter["verification.completedDate"].$gte = verifiedFrom;
      }
      if (verifiedTo) {
        filter["verification.completedDate"].$lte = verifiedTo;
      }
    }

    // Financial filters
    if (minNetWorth !== undefined || maxNetWorth !== undefined) {
      filter["financialInfo.financialCapacity.netWorth"] = {};
      if (minNetWorth !== undefined) {
        filter["financialInfo.financialCapacity.netWorth"].$gte = minNetWorth;
      }
      if (maxNetWorth !== undefined) {
        filter["financialInfo.financialCapacity.netWorth"].$lte = maxNetWorth;
      }
    }

    if (minPropertyValue !== undefined || maxPropertyValue !== undefined) {
      filter["financialInfo.financialCapacity.propertyValue"] = {};
      if (minPropertyValue !== undefined) {
        filter["financialInfo.financialCapacity.propertyValue"].$gte =
          minPropertyValue;
      }
      if (maxPropertyValue !== undefined) {
        filter["financialInfo.financialCapacity.propertyValue"].$lte =
          maxPropertyValue;
      }
    }

    // Performance filters
    if (minOccupancyRate !== undefined || maxOccupancyRate !== undefined) {
      filter["performanceMetrics.occupancyRate"] = {};
      if (minOccupancyRate !== undefined) {
        filter["performanceMetrics.occupancyRate"].$gte = minOccupancyRate;
      }
      if (maxOccupancyRate !== undefined) {
        filter["performanceMetrics.occupancyRate"].$lte = maxOccupancyRate;
      }
    }

    if (minCollectionRate !== undefined || maxCollectionRate !== undefined) {
      filter["performanceMetrics.rentCollectionRate"] = {};
      if (minCollectionRate !== undefined) {
        filter["performanceMetrics.rentCollectionRate"].$gte =
          minCollectionRate;
      }
      if (maxCollectionRate !== undefined) {
        filter["performanceMetrics.rentCollectionRate"].$lte =
          maxCollectionRate;
      }
    }

    // Tags filter
    if (tags) {
      if (Array.isArray(tags)) {
        filter["metadata.tags"] = { $in: tags };
      } else {
        filter["metadata.tags"] = tags;
      }
    }

    // Geographic filters
    if (city) {
      filter["contactInfo.primaryAddress.city"] = {
        $regex: city,
        $options: "i",
      };
    }
    if (state) {
      filter["contactInfo.primaryAddress.state"] = {
        $regex: state,
        $options: "i",
      };
    }
    if (country) {
      filter["contactInfo.primaryAddress.country"] = {
        $regex: country,
        $options: "i",
      };
    }

    // Compliance filters
    if (hasValidLicense !== undefined) {
      filter["compliance.businessLicense.status"] = hasValidLicense
        ? VerificationStatus.COMPLETED
        : { $ne: VerificationStatus.COMPLETED };
    }

    if (hasActiveViolations !== undefined) {
      filter["performanceMetrics.violations"] = hasActiveViolations
        ? { $elemMatch: { resolved: false } }
        : { $not: { $elemMatch: { resolved: false } } };
    }

    if (complianceExpiring) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filter["documents.expiryDate"] = {
        $lte: thirtyDaysFromNow,
        $gte: new Date(),
      };
    }

    // Text search
    if (search) {
      filter.$or = [
        { $text: { $search: search } },
        { "personalInfo.firstName": { $regex: search, $options: "i" } },
        { "personalInfo.lastName": { $regex: search, $options: "i" } },
        { "personalInfo.email": { $regex: search, $options: "i" } },
        { "personalInfo.phone": { $regex: search, $options: "i" } },
        { "businessInfo.companyName": { $regex: search, $options: "i" } },
        {
          "businessInfo.registrationNumber": { $regex: search, $options: "i" },
        },
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Build populate array
    const defaultPopulates = [
      "user:profile contact",
      "properties:title location",
      "organizationId:name",
    ];
    const populateFields = populate.length > 0 ? populate : defaultPopulates;

    // Execute query with population
    let query = Landlord.find(filter).sort(sort).skip(skip).limit(limit);

    for (const field of populateFields) {
      const [path, select] = field.split(":");
      query = query.populate(path ?? "", select);
    }

    const [items, totalCount] = await Promise.all([
      query.exec(),
      Landlord.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

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
    };
  } catch (error) {
    console.error("Error fetching landlords:", error);
    throw error;
  }
};

// Enhanced landlord creation
export const createLandlord = async (
  landlordData: CreateLandlordDto
): Promise<ILandlord> => {
  try {
    // Check for existing landlord with same email or registration number
    const existingQuery: FilterQuery<ILandlord> = {};

    if (landlordData.personalInfo?.email) {
      existingQuery["personalInfo.email"] = landlordData.personalInfo.email;
    }

    if (landlordData.businessInfo?.registrationNumber) {
      existingQuery["businessInfo.registrationNumber"] =
        landlordData.businessInfo.registrationNumber;
    }

    if (Object.keys(existingQuery).length > 0) {
      const existingLandlord = await Landlord.findOne({ $or: [existingQuery] });
      if (existingLandlord) {
        throw new BadRequestError(
          "Landlord with this email or registration number already exists"
        );
      }
    }

    // Set default values
    const landlordDefaults = {
      status: LandlordStatus.PENDING_VERIFICATION,
      verification: {
        status: VerificationStatus.PENDING,
        level: KYCLevel.BASIC,
        startedDate: new Date(),
        identityVerification: {
          status: VerificationStatus.PENDING,
          method: "manual",
          identityScore: 0,
        },
        addressVerification: {
          status: VerificationStatus.PENDING,
          method: "document",
        },
        financialVerification: {
          status: VerificationStatus.PENDING,
          bankVerified: false,
          incomeVerified: false,
        },
        referenceChecks: [],
      },
      documents: [],
      compliance: {
        businessLicense: {
          status: VerificationStatus.PENDING,
        },
        taxCompliance: {
          status: VerificationStatus.PENDING,
          taxNumber: landlordData.businessInfo?.taxId || "",
        },
        propertyLicenses: [],
        complianceChecks: [],
      },
      financialInfo: {
        bankingDetails: {
          primaryBank: "",
          accountNumber: "",
          accountName: "",
          isVerified: false,
        },
        creditInformation: {},
        insurance: {
          hasPropertyInsurance: false,
          hasLiabilityInsurance: false,
          policyNumbers: [],
        },
        financialCapacity: {},
      },
      riskAssessment: {
        overallRiskScore: 50,
        riskLevel: RiskLevel.MEDIUM,
        riskFactors: [],
        mitigatingFactors: [],
        lastAssessmentDate: new Date(),
        nextAssessmentDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months from now
      },
      performanceMetrics: {
        propertyManagementRating: 3,
        tenantSatisfactionRating: 3,
        maintenanceResponseTime: 24,
        occupancyRate: 0,
        rentCollectionRate: 0,
        complaintResolutionTime: 48,
        violations: [],
        trends: {
          rentCollection: [],
          occupancy: [],
          maintenance: [],
        },
      },
      communicationPreferences: {
        preferredMethod: "email",
        language: "en",
        timezone: "UTC",
        receiveMarketingEmails: true,
        receivePropertyAlerts: true,
        receiveMaintenanceUpdates: true,
        receiveRegulatoryUpdates: true,
        receivePerformanceReports: true,
      },
      properties: [],
      propertyStats: {
        totalProperties: 0,
        activeProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        totalValue: 0,
        monthlyRevenue: 0,
      },
      subscription: {
        plan: "basic",
        status: "active",
        startDate: new Date(),
        billingCycle: "monthly",
        paymentMethod: "card",
        autoRenewal: true,
      },
      metadata: {
        source: "website",
        tags: [],
        notes: "",
        internalNotes: "",
        lastLoginDate: undefined,
        lastActivityDate: undefined,
        loginCount: 0,
        profileCompleteness: 0,
        flags: [],
      },
      auditTrail: [],
      isActive: true,
    };

    const newLandlord = new Landlord({
      ...landlordDefaults,
      ...landlordData,
    });

    await newLandlord.save();

    await newLandlord.populate([
      {
        path: "user",
        select:
          "profile.firstName profile.lastName contact.email contact.phone",
      },
      { path: "properties", select: "title location" },
      { path: "organizationId", select: "name" },
    ]);

    return newLandlord;
  } catch (error) {
    console.error("Error creating landlord:", error);
    throw error;
  }
};

// Enhanced landlord update
export const updateLandlord = async (
  id: string,
  updateData: UpdateLandlordDto
): Promise<ILandlord | null> => {
  try {
    const updatedLandlord = await Landlord.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate([
      { path: "user", select: "firstName lastName email phone" },
      { path: "properties", select: "title location" },
      { path: "organizationId", select: "name" },
    ]);

    return updatedLandlord;
  } catch (error) {
    console.error("Error updating landlord:", error);
    throw error;
  }
};

// Soft delete
export const deleteLandlord = async (id: string): Promise<boolean> => {
  try {
    const result = await Landlord.findByIdAndUpdate(
      id,
      {
        isActive: false,
        status: LandlordStatus.INACTIVE,
        deletedAt: new Date(),
      },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error("Error deleting landlord:", error);
    throw error;
  }
};

// Enhanced verification functions
export const verifyLandlord = async (id: string): Promise<ILandlord | null> => {
  try {
    const landlord = await Landlord.findById(id);
    if (!landlord) throw new NotFoundError("Landlord not found");

    // Check if all verification requirements are met
    const isFullyVerified =
      landlord.verification.identityVerification.status ===
        VerificationStatus.COMPLETED &&
      landlord.verification.addressVerification.status ===
        VerificationStatus.COMPLETED &&
      landlord.verification.financialVerification.status ===
        VerificationStatus.COMPLETED &&
      (!landlord.businessInfo ||
        (landlord.verification.businessVerification &&
          landlord.verification.businessVerification.status ===
            VerificationStatus.COMPLETED));

    const updatedLandlord = await Landlord.findByIdAndUpdate(
      id,
      {
        "verification.status": isFullyVerified
          ? VerificationStatus.COMPLETED
          : VerificationStatus.IN_PROGRESS,
        "verification.completedDate": isFullyVerified ? new Date() : undefined,
        status: isFullyVerified ? LandlordStatus.ACTIVE : landlord.status,
      },
      { new: true }
    );

    return updatedLandlord;
  } catch (error) {
    console.error("Error verifying landlord:", error);
    throw error;
  }
};

export const updateLandlordVerification = async (
  id: string,
  verificationType: "identity" | "address" | "financial" | "business",
  verificationData: any
): Promise<ILandlord | null> => {
  try {
    const updateFields: any = {};

    const fieldPrefix = `verification.${verificationType}Verification`;
    for (const key of Object.keys(verificationData)) {
      updateFields[`${fieldPrefix}.${key}`] = verificationData[key];
    }

    const updatedLandlord = await Landlord.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    // Trigger overall verification check
    if (updatedLandlord) {
      await verifyLandlord(id);
    }

    return updatedLandlord;
  } catch (error) {
    console.error("Error updating landlord verification:", error);
    throw error;
  }
};

// Analytics
export const getLandlordAnalytics = async (
  _filters: Partial<LandlordQueryParams> = {}
): Promise<LandlordAnalytics> => {
  try {
    const baseFilter: FilterQuery<ILandlord> = {};

    // Apply any additional filters similar to getLandlords function
    // ... (filter logic would be similar)

    const [
      totalLandlords,
      activeLandlords,
      verifiedLandlords,
      pendingVerification,
      statusCounts,
      typeCounts,
      riskCounts,
      averageMetrics,
      geoStats,
      trends,
    ] = await Promise.all([
      // Basic counts
      Landlord.countDocuments(baseFilter),
      Landlord.countDocuments({ ...baseFilter, status: LandlordStatus.ACTIVE }),
      Landlord.countDocuments({
        ...baseFilter,
        "verification.status": VerificationStatus.COMPLETED,
      }),
      Landlord.countDocuments({
        ...baseFilter,
        status: LandlordStatus.PENDING_VERIFICATION,
      }),

      // Status distribution
      Landlord.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Type distribution
      Landlord.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$landlordType", count: { $sum: 1 } } },
      ]),

      // Risk distribution
      Landlord.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$riskAssessment.riskLevel", count: { $sum: 1 } } },
      ]),

      // Average metrics
      Landlord.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            avgNetWorth: { $avg: "$financialInfo.financialCapacity.netWorth" },
            avgPropertyValue: {
              $avg: "$financialInfo.financialCapacity.propertyValue",
            },
            avgMonthlyRevenue: { $avg: "$propertyStats.monthlyRevenue" },
            totalPropertyValue: {
              $sum: "$financialInfo.financialCapacity.propertyValue",
            },
            avgOccupancyRate: { $avg: "$performanceMetrics.occupancyRate" },
            avgCollectionRate: {
              $avg: "$performanceMetrics.rentCollectionRate",
            },
            avgRating: { $avg: "$performanceMetrics.propertyManagementRating" },
          },
        },
      ]),

      // Geographic distribution
      Landlord.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: {
              city: "$contactInfo.primaryAddress.city",
              state: "$contactInfo.primaryAddress.state",
            },
            count: { $sum: 1 },
            totalPropertyValue: {
              $sum: "$financialInfo.financialCapacity.propertyValue",
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Trends (last 12 months)
      Landlord.aggregate([
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
            registrations: { $sum: 1 },
            avgOccupancy: { $avg: "$performanceMetrics.occupancyRate" },
            avgCollection: { $avg: "$performanceMetrics.rentCollectionRate" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    // Process results
    const avgMetricsData = averageMetrics[0] || {};

    const byStatus = statusCounts.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<LandlordStatus, number>
    );

    const byType = typeCounts.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<LandlordType, number>
    );

    const byRiskLevel = riskCounts.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<RiskLevel, number>
    );

    const geographicDistribution = geoStats.map((item) => ({
      location: `${item._id.city}, ${item._id.state}`,
      count: item.count,
      totalPropertyValue: item.totalPropertyValue || 0,
    }));

    return {
      totalLandlords,
      activeLandlords,
      verifiedLandlords,
      pendingVerification,
      byType,
      byStatus,
      byRiskLevel,
      averageNetWorth: Math.round(avgMetricsData.avgNetWorth || 0),
      averagePropertyValue: Math.round(avgMetricsData.avgPropertyValue || 0),
      averageMonthlyRevenue: Math.round(avgMetricsData.avgMonthlyRevenue || 0),
      totalPropertyValue: Math.round(avgMetricsData.totalPropertyValue || 0),
      averageOccupancyRate: Math.round(avgMetricsData.avgOccupancyRate || 0),
      averageCollectionRate: Math.round(avgMetricsData.avgCollectionRate || 0),
      averageRating: Math.round((avgMetricsData.avgRating || 0) * 10) / 10,
      geographicDistribution,
      complianceMetrics: {
        fullyCompliant: 0, // Would need additional queries
        partiallyCompliant: 0,
        nonCompliant: 0,
        expiringDocuments: 0,
      },
      trends: {
        registrations: trends.map((item) => ({
          period: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
          count: item.registrations,
        })),
        verifications: [], // Would need additional queries
        performance: trends.map((item) => ({
          period: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
          averageOccupancy: Math.round(item.avgOccupancy || 0),
          averageCollection: Math.round(item.avgCollection || 0),
        })),
      },
    };
  } catch (error) {
    console.error("Error getting landlord analytics:", error);
    throw error;
  }
};

// Additional utility functions
export const getLandlordStats = async (
  filters: Partial<LandlordQueryParams> = {}
) => getLandlordAnalytics(filters);

export const getLandlordsRequiringFollowUp = async (): Promise<ILandlord[]> => {
  try {
    const today = new Date();
    return await Landlord.find({
      $or: [
        { "verification.nextReviewDate": { $lte: today } },
        { "riskAssessment.nextAssessmentDate": { $lte: today } },
      ],
      isActive: true,
    })
      .populate("properties", "title location")
      .sort({ "verification.nextReviewDate": 1 });
  } catch (error) {
    console.error("Error getting landlords requiring follow-up:", error);
    throw error;
  }
};

export const getExpiringLandlordDocuments = async (
  daysAhead = 30
): Promise<ILandlord[]> => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await Landlord.find({
      "documents.expiryDate": { $lte: futureDate, $gte: new Date() },
      isActive: true,
    }).populate("properties", "title location");
  } catch (error) {
    console.error("Error getting expiring documents:", error);
    throw error;
  }
};

// Bulk operations
export const bulkUpdateLandlords = async (
  landlordIds: string[],
  updateData: Partial<UpdateLandlordDto>
): Promise<LandlordBulkOperationResult> => {
  try {
    const results = await Promise.allSettled(
      landlordIds.map((id) => updateLandlord(id, updateData))
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const errors: Array<{ landlordId: string; error: string }> = [];
    const updated: mongoose.Types.ObjectId[] = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push({
          landlordId: landlordIds[index] || "",
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

export const bulkDeleteLandlords = async (
  landlordIds: string[]
): Promise<LandlordBulkOperationResult> => {
  try {
    const results = await Promise.allSettled(
      landlordIds.map((id) => deleteLandlord(id))
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const errors: Array<{ landlordId: string; error: string }> = [];
    const updated: mongoose.Types.ObjectId[] = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push({
          landlordId: landlordIds[index] || "",
          error: result.reason.message || "Unknown error",
        });
      } else {
        updated.push(new mongoose.Types.ObjectId(landlordIds[index]));
      }
    });

    return { success, failed, errors, updated };
  } catch (error) {
    console.error("Error in bulk delete:", error);
    throw error;
  }
};
