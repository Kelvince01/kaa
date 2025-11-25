import { Tenant } from "@kaa/models";
import {
  type CreateTenantDto,
  type ITenant,
  type TenantAnalytics,
  type TenantBulkOperationResult,
  type TenantCommunicationLog,
  TenantPriority,
  type TenantQueryParams,
  type TenantSearchFilters,
  TenantStatus,
  TenantType,
  type UpdateTenantDto,
} from "@kaa/models/types";
import { BadRequestError, NotFoundError } from "@kaa/utils";
import mongoose, { type FilterQuery } from "mongoose";

// Enhanced tenant retrieval
export const getTenantById = async (id: string, populate: string[] = []) => {
  try {
    let query = Tenant.findById(id);

    const defaultPopulates = [
      "user:firstName lastName email phone",
      "property:title location",
      "unit:unitNumber rent",
      "contract:startDate endDate monthlyRent",
    ];

    const populateFields = populate.length > 0 ? populate : defaultPopulates;

    for (const field of populateFields) {
      const [path, select] = field.split(":");
      query = query.populate(path as string, select);
    }

    const tenant = await query.exec();

    if (tenant) {
      return tenant;
    }
    throw new NotFoundError("Tenant not found");
  } catch (error) {
    console.error("Error fetching tenant:", error);
    throw error;
  }
};

export const getTenantBy = async (query: {
  memberId?: string;
  email?: string;
  username?: string;
  phone?: string;
  nationalId?: string;
  userId?: string;
}) => {
  try {
    const searchQuery: FilterQuery<ITenant> = {};

    if (query.memberId) {
      searchQuery.memberId = new mongoose.Types.ObjectId(query.memberId);
    }
    if (query.email) {
      searchQuery["personalInfo.email"] = query.email;
    }
    if (query.phone) {
      searchQuery["personalInfo.phone"] = query.phone;
    }
    if (query.nationalId) {
      searchQuery["personalInfo.nationalId"] = query.nationalId;
    }
    if (query.userId) {
      searchQuery.user = new mongoose.Types.ObjectId(query.userId);
    }

    return await Tenant.findOne(searchQuery)
      .populate(
        "user",
        "profile.firstName profile.lastName contact.email contact.phone"
      )
      .populate("property", "title location media")
      .populate("unit", "unitNumber rent");
  } catch (error) {
    console.error("Error fetching tenant by query:", error);
    return null;
  }
};

// Enhanced tenant listing with advanced filtering
export const getTenants = async (params: TenantQueryParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      type,
      priority,
      property,
      unit,
      contract,
      isActive,
      isVerified,
      startDateFrom,
      startDateTo,
      endDateFrom,
      endDateTo,
      minScore,
      maxScore,
      minCreditScore,
      maxCreditScore,
      search,
      tags,
      city,
      state,
      country,
      hasViolations,
      hasLatePayments,
      populate = [],
    } = params;

    const skip = (page - 1) * limit;
    const filter: FilterQuery<ITenant> = {};

    // Status filters - support arrays
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else {
        filter.status = status;
      }
    }

    // Tenant type filters - support arrays
    if (type) {
      if (Array.isArray(type)) {
        filter.type = { $in: type };
      } else {
        filter.type = type;
      }
    }

    // Priority filters - support arrays
    if (priority) {
      if (Array.isArray(priority)) {
        filter.priority = { $in: priority };
      } else {
        filter.priority = priority;
      }
    }

    // Property filters - support arrays
    if (property) {
      if (Array.isArray(property)) {
        filter.property = {
          $in: property.map((p) => new mongoose.Types.ObjectId(p)),
        };
      } else {
        filter.property = new mongoose.Types.ObjectId(property);
      }
    }

    // Unit filters - support arrays
    if (unit) {
      if (Array.isArray(unit)) {
        filter.unit = { $in: unit.map((u) => new mongoose.Types.ObjectId(u)) };
      } else {
        filter.unit = new mongoose.Types.ObjectId(unit);
      }
    }

    if (contract) {
      filter.contract = new mongoose.Types.ObjectId(contract);
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (isVerified !== undefined) {
      filter.isVerified = isVerified;
    }

    // Date range filters
    if (startDateFrom || startDateTo) {
      filter.startDate = {};
      if (startDateFrom) {
        filter.startDate.$gte = startDateFrom;
      }
      if (startDateTo) {
        filter.startDate.$lte = startDateTo;
      }
    }

    if (endDateFrom || endDateTo) {
      filter.endDate = {};
      if (endDateFrom) {
        filter.endDate.$gte = endDateFrom;
      }
      if (endDateTo) {
        filter.endDate.$lte = endDateTo;
      }
    }

    // Score filters
    if (minScore !== undefined || maxScore !== undefined) {
      filter["tenantScore.overallScore"] = {};
      if (minScore !== undefined) {
        filter["tenantScore.overallScore"].$gte = minScore;
      }
      if (maxScore !== undefined) {
        filter["tenantScore.overallScore"].$lte = maxScore;
      }
    }

    if (minCreditScore !== undefined || maxCreditScore !== undefined) {
      filter["tenantScore.creditScore"] = {};
      if (minCreditScore !== undefined) {
        filter["tenantScore.creditScore"].$gte = minCreditScore;
      }
      if (maxCreditScore !== undefined) {
        filter["tenantScore.creditScore"].$lte = maxCreditScore;
      }
    }

    // Tags filter
    if (tags) {
      if (Array.isArray(tags)) {
        filter.tags = { $in: tags };
      } else {
        filter.tags = tags;
      }
    }

    // Geographic filters
    if (city) {
      filter["address.city"] = { $regex: city, $options: "i" };
    }
    if (state) {
      filter["address.state"] = { $regex: state, $options: "i" };
    }
    if (country) {
      filter["address.country"] = { $regex: country, $options: "i" };
    }

    // Behavioral filters
    if (hasViolations !== undefined) {
      filter["behaviorMetrics.violationsCount"] = hasViolations
        ? { $gt: 0 }
        : 0;
    }
    if (hasLatePayments !== undefined) {
      filter["behaviorMetrics.latePayments"] = hasLatePayments ? { $gt: 0 } : 0;
    }

    // Text search
    if (search) {
      filter.$or = [
        { $text: { $search: search } },
        { "personalInfo.firstName": { $regex: search, $options: "i" } },
        { "personalInfo.lastName": { $regex: search, $options: "i" } },
        { "personalInfo.email": { $regex: search, $options: "i" } },
        { "personalInfo.phone": { $regex: search, $options: "i" } },
        { "corporateInfo.companyName": { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Build populate array
    const defaultPopulates = [
      "user:profile.firstName profile.lastName contact.email contact.phone",
      "property:title location media",
      "unit:unitNumber rent",
    ];
    const populateFields = populate.length > 0 ? populate : defaultPopulates;

    // Execute query with population
    let query = Tenant.find(filter).sort(sort).skip(skip).limit(limit);

    for (const field of populateFields) {
      const [path, select] = field.split(":");
      query = query.populate(path as string, select);
    }

    const [items, totalCount] = await Promise.all([
      query.exec(),
      Tenant.countDocuments(filter),
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
    console.error("Error fetching tenants:", error);
    throw error;
  }
};

// Enhanced search functionality
export const searchTenants = async (filters: TenantSearchFilters) => {
  try {
    const { text, exact = false, fields = [], dateRange, scores } = filters;

    const searchQuery: FilterQuery<ITenant> = {};

    // Text search
    if (text) {
      if (exact) {
        searchQuery.$or = [
          { "personalInfo.firstName": text },
          { "personalInfo.lastName": text },
          { "personalInfo.email": text },
          { "personalInfo.phone": text },
        ];
      } else {
        searchQuery.$text = { $search: text };
      }
    }

    // Date range search
    if (dateRange) {
      searchQuery[dateRange.field] = {
        $gte: dateRange.from,
        $lte: dateRange.to,
      };
    }

    // Score-based search
    if (scores) {
      const scoreField = `tenantScore.${scores.type}Score`;
      searchQuery[scoreField] = {};
      if (scores.min !== undefined) {
        searchQuery[scoreField].$gte = scores.min;
      }
      if (scores.max !== undefined) {
        searchQuery[scoreField].$lte = scores.max;
      }
    }

    const results = await Tenant.find(searchQuery)
      .populate("property", "title location")
      .populate("unit", "unitNumber rent")
      .limit(100);

    return results;
  } catch (error) {
    console.error("Error searching tenants:", error);
    throw error;
  }
};

// Tenant analytics
export const getTenantAnalytics = async (
  filters: Partial<TenantQueryParams> = {}
): Promise<TenantAnalytics> => {
  try {
    const baseFilter: FilterQuery<ITenant> = {};

    // Apply any additional filters
    if (filters.property) {
      baseFilter.property = Array.isArray(filters.property)
        ? { $in: filters.property.map((p) => new mongoose.Types.ObjectId(p)) }
        : new mongoose.Types.ObjectId(filters.property);
    }

    const [
      totalTenants,
      activeTenants,
      verifiedTenants,
      averageScores,
      statusCounts,
      typeCounts,
      priorityCounts,
      verificationStats,
      riskStats,
      geoStats,
      trends,
    ] = await Promise.all([
      // Basic counts
      Tenant.countDocuments(baseFilter),
      Tenant.countDocuments({ ...baseFilter, status: TenantStatus.ACTIVE }),
      Tenant.countDocuments({ ...baseFilter, isVerified: true }),

      // Average scores
      Tenant.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            avgOverallScore: { $avg: "$tenantScore.overallScore" },
            avgCreditScore: { $avg: "$tenantScore.creditScore" },
            avgMonthlyIncome: { $avg: "$personalInfo.monthlyIncome" },
          },
        },
      ]),

      // Status distribution
      Tenant.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Type distribution
      Tenant.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),

      // Priority distribution
      Tenant.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),

      // Verification progress
      Tenant.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$verificationProgress", 100] },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "completed",
                  },
                  {
                    case: { $gte: ["$verificationProgress", 1] },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "inProgress",
                  },
                ],
                default: "pending",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Risk distribution
      Tenant.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $gte: ["$tenantScore.overallScore", 80] },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "low",
                  },
                  {
                    case: { $gte: ["$tenantScore.overallScore", 60] },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "medium",
                  },
                  {
                    case: { $gte: ["$tenantScore.overallScore", 40] },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "high",
                  },
                ],
                default: "very_high",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Geographic distribution
      Tenant.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: {
              city: "$address.city",
              state: "$address.state",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Trends (last 12 months)
      Tenant.aggregate([
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
            avgScore: { $avg: "$tenantScore.overallScore" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    // Process results
    const avgScoresData = averageScores[0] || {};

    const statusByStatus = statusCounts.reduce(
      (
        acc: Record<TenantStatus, number>,
        item: { _id: TenantStatus; count: number }
      ) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<TenantStatus, number>
    );

    const tenantsByType = typeCounts.reduce(
      (
        acc: Record<TenantType, number>,
        item: { _id: TenantType; count: number }
      ) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<TenantType, number>
    );

    const tenantsByPriority = priorityCounts.reduce(
      (
        acc: Record<TenantPriority, number>,
        item: { _id: TenantPriority; count: number }
      ) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<TenantPriority, number>
    );

    const verificationProgress = verificationStats.reduce(
      (acc: Record<string, number>, item: { _id: string; count: number }) => {
        acc[item._id] = item.count;
        return acc;
      },
      { pending: 0, inProgress: 0, completed: 0 }
    );

    const riskDistribution = riskStats.reduce(
      (acc: Record<string, number>, item: { _id: string; count: number }) => {
        acc[item._id] = item.count;
        return acc;
      },
      { low: 0, medium: 0, high: 0 }
    );

    const geographicDistribution = geoStats.map((item) => ({
      location: `${item._id.city}, ${item._id.state}`,
      count: item.count,
    }));

    const newTenants = trends.map((item) => ({
      period: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
      count: item.count,
    }));

    const scoreImprovement = trends.map(
      (item: { _id: { year: number; month: number }; avgScore: number }) => ({
        period: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
        averageScore: Math.round(item.avgScore || 0),
      })
    );

    return {
      totalTenants,
      activeTenants,
      verifiedTenants,
      averageScore: Math.round(avgScoresData.avgOverallScore || 0),
      averageCreditScore: Math.round(avgScoresData.avgCreditScore || 0),
      averageMonthlyIncome: Math.round(avgScoresData.avgMonthlyIncome || 0),
      tenantsByStatus: statusByStatus,
      tenantsByType,
      tenantsByPriority,
      verificationProgress,
      riskDistribution,
      geographicDistribution,
      trends: {
        newTenants,
        scoreImprovement,
      },
    };
  } catch (error) {
    console.error("Error getting tenant analytics:", error);
    throw error;
  }
};

// Enhanced tenant creation
export const createTenant = async (
  tenantData: CreateTenantDto
): Promise<ITenant> => {
  try {
    // Validate required relationships exist
    const [property, unit, contract] = await Promise.all([
      mongoose.model("Property").findById(tenantData.property),
      mongoose.model("Unit").findById(tenantData.unit),
      tenantData.contract
        ? mongoose.model("Contract").findById(tenantData.contract)
        : undefined,
    ]);

    if (!property) throw new BadRequestError("Property not found");
    if (!unit) throw new BadRequestError("Unit not found");
    // if (!contract) throw new BadRequestError("Contract not found");

    // Check for existing tenant with same email or national ID
    const existingTenant = await Tenant.findOne({
      $or: [
        { "personalInfo.email": tenantData.personalInfo?.email },
        { "personalInfo.nationalId": tenantData.personalInfo?.nationalId },
      ],
    });

    if (existingTenant) {
      throw new BadRequestError(
        "Tenant with this email or national ID already exists"
      );
    }

    // Set default values
    const tenantDefaults = {
      status: TenantStatus.ACTIVE,
      type: TenantType.INDIVIDUAL,
      priority: TenantPriority.MEDIUM,
      isActive: true,
      verificationProgress: 0,
      isVerified: false,
      tenantScore: {
        creditScore: 0,
        riskScore: 0,
        reliabilityScore: 0,
        paymentHistory: 0,
        overallScore: 0,
        lastUpdated: new Date(),
        factors: [],
      },
      backgroundCheck: {
        conducted: false,
        creditCheck: { cleared: false },
        criminalCheck: { cleared: false },
        employmentVerification: {
          verified: false,
          employerConfirmed: false,
          incomeVerified: false,
        },
        previousLandlordCheck: { contacted: false },
        referenceChecks: [],
      },
      communicationPreferences: {
        preferredMethod: "email",
        language: "en",
        timezone: "UTC",
        receiveMarketing: true,
        receiveReminders: true,
        receiveMaintenanceUpdates: true,
      },
      paymentInfo: {
        preferredMethod: "bank_transfer",
        autopayEnabled: false,
        paymentReminders: true,
      },
      behaviorMetrics: {
        communicationRating: 3,
        maintenanceCompliance: 3,
        respectForProperty: 3,
        noiseComplaints: 0,
        latePayments: 0,
        violationsCount: 0,
      },
      leaseHistory: [],
      emergencyContacts: [],
      documents: [],
      tags: [],
    };

    const newTenant = new Tenant({
      ...tenantDefaults,
      ...tenantData,
    });

    await newTenant.save();

    await newTenant.populate([
      {
        path: "user",
        select:
          "profile.firstName profile.lastName contact.email contact.phone",
      },
      { path: "property", select: "title location media" },
      { path: "unit", select: "unitNumber rent" },
      { path: "contract", select: "startDate endDate monthlyRent" },
    ]);

    return newTenant;
  } catch (error) {
    console.error("Error creating tenant:", error);
    throw error;
  }
};

// Enhanced tenant update
export const updateTenant = async (
  id: string,
  updateData: UpdateTenantDto
): Promise<ITenant | null> => {
  try {
    // Validate references if they're being updated
    if (updateData.property) {
      const property = await mongoose
        .model("Property")
        .findById(updateData.property);
      if (!property) throw new BadRequestError("Property not found");
    }

    if (updateData.unit) {
      const unit = await mongoose.model("Unit").findById(updateData.unit);
      if (!unit) throw new BadRequestError("Unit not found");
    }

    if (updateData.contract) {
      const contract = await mongoose
        .model("Contract")
        .findById(updateData.contract);
      if (!contract) throw new BadRequestError("Contract not found");
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate([
      { path: "user", select: "firstName lastName email phone" },
      { path: "property", select: "title location" },
      { path: "unit", select: "unitNumber rent" },
      { path: "contract", select: "startDate endDate monthlyRent" },
    ]);

    return updatedTenant;
  } catch (error) {
    console.error("Error updating tenant:", error);
    throw error;
  }
};

// Bulk operations
export const bulkUpdateTenants = async (
  tenantIds: string[],
  updateData: Partial<UpdateTenantDto>
): Promise<TenantBulkOperationResult> => {
  try {
    const results = await Promise.allSettled(
      tenantIds.map((id) => updateTenant(id, updateData))
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const errors: Array<{ tenantId: string; error: string }> = [];
    const updated: mongoose.Types.ObjectId[] = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push({
          tenantId: tenantIds[index] || "",
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

export const bulkDeleteTenants = async (
  tenantIds: string[]
): Promise<TenantBulkOperationResult> => {
  try {
    const results = await Promise.allSettled(
      tenantIds.map((id) => deleteTenant(id))
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const errors: Array<{ tenantId: string; error: string }> = [];
    const updated: mongoose.Types.ObjectId[] = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push({
          tenantId: tenantIds[index] || "",
          error: result.reason.message || "Unknown error",
        });
      }
      updated.push(new mongoose.Types.ObjectId(tenantIds[index]));
    });

    return { success, failed, errors, updated };
  } catch (error) {
    console.error("Error in bulk delete:", error);
    throw error;
  }
};

// Soft delete
export const deleteTenant = async (id: string): Promise<boolean> => {
  try {
    const result = await Tenant.findByIdAndUpdate(
      id,
      {
        isActive: false,
        status: TenantStatus.INACTIVE,
        deletedAt: new Date(),
      },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error("Error deleting tenant:", error);
    throw error;
  }
};

// Enhanced verification functions
export const verifyTenant = async (id: string): Promise<ITenant | null> => {
  try {
    const tenant = await Tenant.findById(id);
    if (!tenant) throw new NotFoundError("Tenant not found");

    // Check if all verification requirements are met
    const isFullyVerified =
      tenant.backgroundCheck.conducted &&
      tenant.backgroundCheck.creditCheck.cleared &&
      tenant.backgroundCheck.employmentVerification.verified &&
      tenant.personalInfo.email &&
      tenant.personalInfo.phone &&
      tenant.documents &&
      tenant.documents.length > 0;

    const updatedTenant = await Tenant.findByIdAndUpdate(
      id,
      {
        isVerified: isFullyVerified,
        verificationProgress: isFullyVerified
          ? 100
          : tenant.verificationProgress,
        "backgroundCheck.conducted": true,
      },
      { new: true }
    );

    return updatedTenant;
  } catch (error) {
    console.error("Error verifying tenant:", error);
    throw error;
  }
};

export const updateTenantVerification = async (
  id: string,
  verificationData: Partial<ITenant["backgroundCheck"]> &
    ITenant["verificationProgress"]
): Promise<ITenant | null> => {
  try {
    const updateFields: any = {};

    for (const key of Object.keys(verificationData)) {
      updateFields[`backgroundCheck.${key}`] =
        verificationData[key as keyof ITenant["backgroundCheck"]];
      updateFields[`verificationProgress.${key}`] =
        verificationData[key as keyof ITenant["verificationProgress"]];
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    // Trigger verification check
    if (updatedTenant) {
      await verifyTenant(id);
    }

    return updatedTenant;
  } catch (error) {
    console.error("Error updating tenant verification:", error);
    throw error;
  }
};

// Communication logging
export const logTenantCommunication = async (
  communicationData: Omit<TenantCommunicationLog, "_id">
): Promise<void> => {
  try {
    // This would typically be stored in a separate communications collection
    // For now, we'll add it to the tenant's notes or create a simple log
    const tenant = await Tenant.findById(communicationData.tenant);
    if (tenant) {
      const logEntry = `[${new Date().toISOString()}] ${communicationData.type.toUpperCase()}: ${communicationData.subject || "No subject"}\n${communicationData.content}\n---\n`;
      tenant.notes = (tenant.notes || "") + logEntry;
      tenant.lastContactDate = new Date();
      await tenant.save();
    }
  } catch (error) {
    console.error("Error logging communication:", error);
    throw error;
  }
};

// Additional utility functions
export const getTenantStats = async (
  filters: Partial<TenantQueryParams> = {}
) => await getTenantAnalytics(filters);

export const getTenantsRequiringFollowUp = async (): Promise<ITenant[]> => {
  try {
    const today = new Date();
    return await Tenant.find({
      nextFollowUpDate: { $lte: today },
      isActive: true,
    })
      .populate("property", "title location")
      .populate("unit", "unitNumber")
      .sort({ nextFollowUpDate: 1 });
  } catch (error) {
    console.error("Error getting tenants requiring follow-up:", error);
    throw error;
  }
};

export const getExpiringDocuments = async (
  daysAhead = 30
): Promise<ITenant[]> => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await Tenant.find({
      "documents.expiryDate": { $lte: futureDate, $gte: new Date() },
      isActive: true,
    })
      .populate("property", "title location")
      .populate("unit", "unitNumber");
  } catch (error) {
    console.error("Error getting expiring documents:", error);
    throw error;
  }
};

export const updateTenantScore = async (
  id: string,
  scoreData: Partial<ITenant["tenantScore"]>
): Promise<ITenant | null> => {
  try {
    const tenant = await Tenant.findById(id);
    if (!tenant) throw new NotFoundError("Tenant not found");

    const updatedScore = {
      ...tenant.tenantScore,
      ...scoreData,
      lastUpdated: new Date(),
    };

    // Recalculate overall score if individual scores are provided
    if (
      scoreData.creditScore ||
      scoreData.riskScore ||
      scoreData.reliabilityScore ||
      scoreData.paymentHistory
    ) {
      const weights = {
        credit: 0.3,
        risk: 0.25,
        reliability: 0.25,
        payment: 0.2,
      };
      updatedScore.overallScore = Math.round(
        (updatedScore.creditScore / 850) * 100 * weights.credit +
          (100 - updatedScore.riskScore) * weights.risk +
          updatedScore.reliabilityScore * weights.reliability +
          updatedScore.paymentHistory * weights.payment
      );
    }

    return await Tenant.findByIdAndUpdate(
      id,
      { tenantScore: updatedScore },
      { new: true }
    );
  } catch (error) {
    console.error("Error updating tenant score:", error);
    throw error;
  }
};
