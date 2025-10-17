import {
  AuditLog,
  ConsentRecord,
  DataRequest,
  Event,
  Subscription,
  User,
} from "@kaa/models";
import { ConflictError, logger } from "@kaa/utils";
import type mongoose from "mongoose";

export const gdprService = {
  /**
   * Request data export
   */
  requestDataExport: async (userId: string, tenantId: string) => {
    // Check if there's already a pending request
    const existingRequest = await DataRequest.findOne({
      userId,
      tenantId,
      type: "export",
      status: { $in: ["pending", "processing"] },
    });

    if (existingRequest) {
      throw new ConflictError("Data export request already in progress");
    }

    const request = await DataRequest.create({
      userId,
      tenantId,
      type: "export",
      status: "pending",
    });

    // Process the export asynchronously
    processDataExport((request._id as mongoose.Types.ObjectId).toString());

    return request;
  },

  /**
   * Request data deletion
   */
  requestDataDeletion: async (userId: string, tenantId: string) => {
    const existingRequest = await DataRequest.findOne({
      userId,
      tenantId,
      type: "delete",
      status: { $in: ["pending", "processing"] },
    });

    if (existingRequest) {
      throw new ConflictError("Data deletion request already in progress");
    }

    const request = await DataRequest.create({
      userId,
      tenantId,
      type: "delete",
      status: "pending",
    });

    // Process the deletion asynchronously
    processDataDeletion((request._id as mongoose.Types.ObjectId).toString());

    return request;
  },

  /**
   * Get data requests for user
   */
  getDataRequests: async (userId: string, tenantId: string) => {
    const requests = await DataRequest.find({ userId, tenantId }).sort({
      createdAt: -1,
    });
    return requests;
  },

  /**
   * Record consent
   */
  recordConsent: async (
    userId: string,
    tenantId: string,
    consentType: string,
    granted: boolean,
    ipAddress: string,
    userAgent: string
  ) => {
    const consent = await ConsentRecord.create({
      userId,
      tenantId,
      consentType,
      granted,
      grantedAt: granted ? new Date() : undefined,
      revokedAt: granted ? undefined : new Date(),
      ipAddress,
      userAgent,
    });

    return consent;
  },

  /**
   * Get consent records
   */
  getConsentRecords: async (userId: string, tenantId: string) => {
    const consents = await ConsentRecord.find({ userId, tenantId }).sort({
      createdAt: -1,
    });
    return consents;
  },
};

export const gdprAuditService = {
  /**
   * Generate compliance report
   */
  generateComplianceReport: async (
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const [userCount, dataRequests, auditLogCount, consentRecords] =
      await Promise.all([
        User.countDocuments({ tenantId }),
        DataRequest.find({
          tenantId,
          createdAt: { $gte: startDate, $lte: endDate },
        }),
        AuditLog.countDocuments({
          tenantId,
          timestamp: { $gte: startDate, $lte: endDate },
        }),
        ConsentRecord.find({
          tenantId,
          createdAt: { $gte: startDate, $lte: endDate },
        }),
      ]);

    return {
      period: { startDate, endDate },
      summary: {
        totalUsers: userCount,
        dataRequests: {
          total: dataRequests.length,
          exports: dataRequests.filter((r) => r.type === "export").length,
          deletions: dataRequests.filter((r) => r.type === "delete").length,
        },
        auditEvents: auditLogCount,
        consentRecords: {
          total: consentRecords.length,
          granted: consentRecords.filter((c) => c.granted).length,
          revoked: consentRecords.filter((c) => !c.granted).length,
        },
      },
      details: {
        dataRequests,
        consentRecords,
      },
    };
  },
};

/**
 * Process data export asynchronously
 */
async function processDataExport(requestId: string) {
  try {
    const request = await DataRequest.findById(requestId);
    if (!request) return;

    request.status = "processing";
    await request.save();

    // Collect all user data
    const [user, subscription, events, auditLogs, consents] = await Promise.all(
      [
        User.findById(request.userId),
        Subscription.findOne({ userId: request.userId }),
        Event.find({ userId: request.userId }),
        AuditLog.find({ userId: request.userId }),
        ConsentRecord.find({ userId: request.userId }),
      ]
    );

    const exportData = {
      user: user?.toObject(),
      subscription: subscription?.toObject(),
      events: events.map((e) => e.toObject()),
      auditLogs: auditLogs.map((a) => a.toObject()),
      consents: consents.map((c) => c.toObject()),
      exportedAt: new Date(),
    };

    request.status = "completed";
    request.completedAt = new Date();
    request.data = exportData;
    await request.save();

    logger.info(`Data export completed for user: ${request.userId}`);
  } catch (error) {
    logger.error(`Data export failed for request: ${requestId}`, error);

    await DataRequest.findByIdAndUpdate(requestId, {
      status: "failed",
      completedAt: new Date(),
    });
  }
}

/**
 * Process data deletion asynchronously
 */
async function processDataDeletion(requestId: string) {
  try {
    const request = await DataRequest.findById(requestId);
    if (!request) return;

    request.status = "processing";
    await request.save();

    // Delete user data (be careful with this in production)
    await Promise.all([
      User.findByIdAndDelete(request.userId),
      Subscription.deleteMany({ userId: request.userId }),
      Event.deleteMany({ userId: request.userId }),
      ConsentRecord.deleteMany({ userId: request.userId }),
      // Keep audit logs for compliance
    ]);

    request.status = "completed";
    request.completedAt = new Date();
    await request.save();

    logger.info(`Data deletion completed for user: ${request.userId}`);
  } catch (error) {
    logger.error(`Data deletion failed for request: ${requestId}`, error);

    await DataRequest.findByIdAndUpdate(requestId, {
      status: "failed",
      completedAt: new Date(),
    });
  }
}
