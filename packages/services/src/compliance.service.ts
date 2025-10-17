import { ComplianceRecord, LegalTemplate, RegulatoryReport } from "@kaa/models";
import {
  ComplianceStatus,
  ComplianceType,
  type IComplianceRecord,
  type ILegalTemplate,
  type IRegulatoryReport,
} from "@kaa/models/types";
import { DateTime } from "luxon";
import {
  sendComplianceExpiryReminder,
  sendComplianceStatusUpdate,
  sendComplianceViolationAlert,
  sendInspectionReminder,
  sendInspectionResultNotification,
  sendViolationResolutionNotification,
} from "./comms/notification.factory";

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class ComplianceService {
  /**
   * Create a new compliance record
   */
  static async createComplianceRecord(
    data: Partial<IComplianceRecord>
  ): Promise<IComplianceRecord> {
    const record = new ComplianceRecord({
      ...data,
      status: ComplianceStatus.PENDING,
      requirements: data.requirements || [],
      violations: [],
      inspections: [],
      documents: data.documents || [],
      costs: {
        ...data.costs,
        totalCost: ComplianceService.calculateTotalCost(data.costs),
      },
    });

    await record.save();

    // Schedule compliance reminders
    await ComplianceService.scheduleComplianceReminders(record);

    return record;
  }

  /**
   * Update compliance status
   */
  static async updateComplianceStatus(
    recordId: string,
    status: ComplianceStatus,
    notes?: string
  ): Promise<IComplianceRecord> {
    const record = await ComplianceRecord.findById(recordId);
    if (!record) {
      throw new Error("Compliance record not found");
    }

    record.status = status;
    if (notes) {
      record.notes = `${record.notes || ""}\n${new Date().toISOString()}: ${notes}`;
    }

    await record.save();

    // Send status update notification
    await sendComplianceStatusUpdate(record);

    return record;
  }

  /**
   * Add compliance violation
   */
  static async addViolation(
    recordId: string,
    violation: any
  ): Promise<IComplianceRecord> {
    const record = await ComplianceRecord.findById(recordId);
    if (!record) {
      throw new Error("Compliance record not found");
    }

    record.violations.push({
      ...violation,
      dateIdentified: new Date(),
      resolved: false,
    });

    // Update overall status to non-compliant
    record.status = ComplianceStatus.NON_COMPLIANT;

    await record.save();

    // Send violation alert
    await sendComplianceViolationAlert(record, violation);

    return record;
  }

  /**
   * Resolve compliance violation
   */
  static async resolveViolation(
    recordId: string,
    violationIndex: number,
    resolution: string
  ): Promise<IComplianceRecord> {
    const record = await ComplianceRecord.findById(recordId);
    if (!record) {
      throw new Error("Compliance record not found");
    }

    if (violationIndex >= record.violations.length) {
      throw new Error("Violation not found");
    }

    (record.violations as any)[violationIndex as number].resolved = true;
    (record.violations as any)[violationIndex as number].resolvedDate =
      new Date();
    (record.violations as any)[violationIndex as number].remedialAction =
      resolution;

    // Check if all violations are resolved
    const unresolvedViolations = record.violations.filter((v) => !v.resolved);
    if (unresolvedViolations.length === 0) {
      record.status = ComplianceStatus.COMPLIANT;
    }

    await record.save();

    // Send resolution notification
    await sendViolationResolutionNotification(record, violationIndex);

    return record;
  }

  /**
   * Add inspection record
   */
  static async addInspection(
    recordId: string,
    inspection: any
  ): Promise<IComplianceRecord> {
    const record = await ComplianceRecord.findById(recordId);
    if (!record) {
      throw new Error("Compliance record not found");
    }

    record.inspections.push({
      ...inspection,
      inspectionDate: new Date(),
    });

    // Update last inspection date
    record.lastInspectionDate = new Date();

    // Set next inspection date if provided
    if (inspection.nextInspectionDate) {
      record.nextInspectionDate = inspection.nextInspectionDate;
    }

    // Update compliance status based on inspection result
    if (inspection.passed) {
      record.status = ComplianceStatus.COMPLIANT;
    } else {
      record.status = ComplianceStatus.NON_COMPLIANT;
    }

    await record.save();

    // Send inspection notification
    await sendInspectionResultNotification(record, inspection);

    return record;
  }

  /**
   * Check for expiring compliance records and send reminders
   */
  static async checkExpiringCompliance(): Promise<void> {
    const thirtyDaysFromNow = DateTime.now().plus({ days: 30 }).toJSDate();

    const expiringRecords = await ComplianceRecord.find({
      status: { $in: [ComplianceStatus.COMPLIANT, ComplianceStatus.PENDING] },
      expiryDate: { $lte: thirtyDaysFromNow },
      "notifications.expiryAlert": true,
    }).populate("landlord property");

    for (const record of expiringRecords) {
      const daysUntilExpiry = Math.ceil(
        ((record.expiryDate?.getTime() as number) - DateTime.now().toMillis()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= record.notifications.reminderDays) {
        await sendComplianceExpiryReminder(record, daysUntilExpiry);
      }
    }
  }

  /**
   * Check for upcoming inspections and send reminders
   */
  static async checkUpcomingInspections(): Promise<void> {
    const sevenDaysFromNow = DateTime.now().plus({ days: 7 }).toJSDate();

    const upcomingInspections = await ComplianceRecord.find({
      nextInspectionDate: { $lte: sevenDaysFromNow },
      "notifications.inspectionReminder": true,
    }).populate("landlord property");

    for (const record of upcomingInspections) {
      const daysUntilInspection = Math.ceil(
        ((record.nextInspectionDate?.getTime() as number) - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      await sendInspectionReminder(record, daysUntilInspection);
    }
  }

  /**
   * Generate regulatory report
   */
  static async generateRegulatoryReport(
    landlordId: string,
    reportType: "monthly" | "quarterly" | "annual" | "custom",
    period: { startDate: Date; endDate: Date },
    propertyIds?: string[]
  ): Promise<IRegulatoryReport> {
    // Get properties to include in report
    const properties =
      propertyIds ||
      (await ComplianceService.getLandlordProperties(landlordId));

    // Get compliance records for the period
    const complianceRecords = await ComplianceRecord.find({
      landlord: landlordId,
      property: { $in: properties },
      createdAt: { $gte: period.startDate, $lte: period.endDate },
    }).populate("property");

    // Calculate compliance summary
    const complianceSummary = ComplianceService.calculateComplianceSummary(
      complianceRecords,
      properties
    );

    // Calculate violations summary
    const violationsSummary =
      ComplianceService.calculateViolationsSummary(complianceRecords);

    // Generate property compliance details
    const propertyCompliance =
      await ComplianceService.generatePropertyComplianceDetails(
        properties,
        complianceRecords
      );

    // Generate recommendations
    const recommendations = ComplianceService.generateComplianceRecommendations(
      complianceRecords,
      propertyCompliance
    );

    const report = new RegulatoryReport({
      landlord: landlordId,
      properties,
      reportType,
      period,
      complianceSummary,
      violationsSummary,
      propertyCompliance,
      recommendations,
      generatedDate: new Date(),
      generatedBy: landlordId, // This should be the user generating the report
    });

    await report.save();

    // Generate PDF report (would integrate with PDF generation service)
    const reportUrl = await ComplianceService.generatePDFReport(report);
    report.reportUrl = reportUrl;
    await report.save();

    return report;
  }

  /**
   * Create legal document from template
   */
  static async createDocumentFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    _createdBy: string
  ): Promise<{ content: string; documentUrl?: string }> {
    const template = await LegalTemplate.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Validate required variables
    const missingVariables = template.variables
      .filter((v) => v.required && !variables[v.name])
      .map((v) => v.name);

    if (missingVariables.length > 0) {
      throw new Error(
        `Missing required variables: ${missingVariables.join(", ")}`
      );
    }

    // Replace variables in template content
    let content = template.content;
    for (const variable of template.variables) {
      const value = variables[variable.name] || variable.defaultValue || "";
      const placeholder = `{{${variable.name}}}`;
      content = content.replace(new RegExp(placeholder, "g"), value);
    }

    // Update usage count
    template.usageCount += 1;
    await template.save();

    // Generate PDF document (would integrate with PDF generation service)
    const documentUrl = await ComplianceService.generatePDFDocument(
      content,
      template.name
    );

    return { content, documentUrl };
  }

  /**
   * Get compliance dashboard data
   */
  static async getComplianceDashboard(landlordId: string): Promise<any> {
    const records = await ComplianceRecord.find({
      landlord: landlordId,
    }).populate("property");

    const totalRecords = records.length;
    const compliantRecords = records.filter(
      (r) => r.status === ComplianceStatus.COMPLIANT
    ).length;
    const nonCompliantRecords = records.filter(
      (r) => r.status === ComplianceStatus.NON_COMPLIANT
    ).length;
    const pendingRecords = records.filter(
      (r) => r.status === ComplianceStatus.PENDING
    ).length;
    const expiredRecords = records.filter(
      (r) => r.status === ComplianceStatus.EXPIRED
    ).length;

    // Get expiring records (next 30 days)
    const thirtyDaysFromNow = DateTime.now().plus({ days: 30 }).toJSDate();
    const expiringRecords = records.filter(
      (r) =>
        r.expiryDate &&
        DateTime.fromJSDate(r.expiryDate).toMillis() <
          thirtyDaysFromNow.getTime() &&
        r.status === ComplianceStatus.COMPLIANT
    );

    // Get upcoming inspections (next 7 days)
    const sevenDaysFromNow = DateTime.now().plus({ days: 7 }).toJSDate();
    const upcomingInspections = records.filter(
      (r) =>
        r.nextInspectionDate &&
        DateTime.fromJSDate(r.nextInspectionDate).toMillis() <
          sevenDaysFromNow.getTime()
    );

    // Get recent violations
    const recentViolations = records
      .flatMap((r) =>
        r.violations.map((v) => ({
          ...v,
          property: r.property,
          recordId: r._id,
        }))
      )
      .filter((v) => !v.resolved)
      .sort((a, b) => b.dateIdentified.getTime() - a.dateIdentified.getTime())
      .slice(0, 10);

    // Calculate compliance rate by type
    const complianceByType = Object.values(ComplianceType).map((type) => {
      const typeRecords = records.filter((r) => r.complianceType === type);
      const compliantTypeRecords = typeRecords.filter(
        (r) => r.status === ComplianceStatus.COMPLIANT
      );
      return {
        type,
        total: typeRecords.length,
        compliant: compliantTypeRecords.length,
        rate:
          typeRecords.length > 0
            ? (compliantTypeRecords.length / typeRecords.length) * 100
            : 0,
      };
    });

    return {
      summary: {
        totalRecords,
        compliantRecords,
        nonCompliantRecords,
        pendingRecords,
        expiredRecords,
        complianceRate:
          totalRecords > 0 ? (compliantRecords / totalRecords) * 100 : 0,
      },
      alerts: {
        expiringRecords: expiringRecords.length,
        upcomingInspections: upcomingInspections.length,
        unresolvedViolations: recentViolations.length,
      },
      complianceByType,
      recentViolations,
      expiringRecords: expiringRecords.slice(0, 5),
      upcomingInspections: upcomingInspections.slice(0, 5),
    };
  }

  // Helper methods
  private static calculateTotalCost(costs: any): number {
    if (!costs) return 0;
    return (
      (costs.applicationFee || 0) +
      (costs.renewalFee || 0) +
      (costs.inspectionFee || 0) +
      (costs.penaltyAmount || 0)
    );
  }

  private static async scheduleComplianceReminders(
    record: IComplianceRecord
  ): Promise<void> {
    // This would integrate with a job scheduler
    console.log(`Compliance reminders scheduled for record ${record._id}`);
    await Promise.resolve();
  }

  private static async getLandlordProperties(
    _landlordId: string
  ): Promise<string[]> {
    // This would fetch property IDs from the Property model
    // Simplified for this implementation
    await Promise.resolve();
    return ["property1", "property2", "property3"];
  }

  private static calculateComplianceSummary(
    records: IComplianceRecord[],
    properties: string[]
  ) {
    const totalProperties = properties.length;
    const compliantProperties = new Set(
      records
        .filter((r) => r.status === ComplianceStatus.COMPLIANT)
        .map((r) => r.property.toString())
    ).size;
    const nonCompliantProperties = new Set(
      records
        .filter((r) => r.status === ComplianceStatus.NON_COMPLIANT)
        .map((r) => r.property.toString())
    ).size;
    const pendingProperties = new Set(
      records
        .filter((r) => r.status === ComplianceStatus.PENDING)
        .map((r) => r.property.toString())
    ).size;

    return {
      totalProperties,
      compliantProperties,
      nonCompliantProperties,
      pendingProperties,
      complianceRate:
        totalProperties > 0 ? (compliantProperties / totalProperties) * 100 : 0,
    };
  }

  private static calculateViolationsSummary(records: IComplianceRecord[]) {
    const allViolations = records.flatMap((r) => r.violations);
    const totalViolations = allViolations.length;
    const resolvedViolations = allViolations.filter((v) => v.resolved).length;
    const pendingViolations = totalViolations - resolvedViolations;
    const criticalViolations = allViolations.filter(
      (v) => v.severity === "critical"
    ).length;
    const totalPenalties = allViolations.reduce(
      (sum, v) => sum + (v.penalty?.amount || 0),
      0
    );

    return {
      totalViolations,
      resolvedViolations,
      pendingViolations,
      criticalViolations,
      totalPenalties,
    };
  }

  private static generatePropertyComplianceDetails(
    properties: string[],
    records: IComplianceRecord[]
  ) {
    return properties.map((propertyId) => {
      const propertyRecords = records.filter(
        (r) => r.property.toString() === propertyId
      );
      const compliantRecords = propertyRecords.filter(
        (r) => r.status === ComplianceStatus.COMPLIANT
      );
      const nonCompliantRecords = propertyRecords.filter(
        (r) => r.status === ComplianceStatus.NON_COMPLIANT
      );

      let overallStatus: ComplianceStatus;
      if (nonCompliantRecords.length > 0) {
        overallStatus = ComplianceStatus.NON_COMPLIANT;
      } else if (compliantRecords.length === propertyRecords.length) {
        overallStatus = ComplianceStatus.COMPLIANT;
      } else {
        overallStatus = ComplianceStatus.PENDING;
      }

      const riskLevel =
        nonCompliantRecords.length > 2
          ? "high"
          : nonCompliantRecords.length > 0
            ? "medium"
            : "low";

      const actionItems = propertyRecords
        .filter((r) => r.status !== ComplianceStatus.COMPLIANT)
        .map((r) => `Address ${r.title} compliance`);

      return {
        property: propertyId,
        complianceRecords: propertyRecords.map((r) => r._id),
        overallStatus,
        riskLevel,
        actionItems,
      };
    });
  }

  private static generateComplianceRecommendations(
    records: IComplianceRecord[],
    propertyCompliance: any[]
  ) {
    const recommendations: any[] = [];

    // High-risk properties
    const highRiskProperties = propertyCompliance.filter(
      (p) => p.riskLevel === "high"
    );
    if (highRiskProperties.length > 0) {
      recommendations.push({
        priority: "high" as const,
        category: "Risk Management",
        description: `${highRiskProperties.length} properties have high compliance risk. Immediate action required.`,
        timeline: "Within 7 days",
      });
    }

    // Expiring records
    const expiringRecords = records.filter(
      (r) =>
        r.expiryDate &&
        DateTime.fromJSDate(r.expiryDate).toMillis() <
          DateTime.now().plus({ days: 60 }).toMillis()
    );
    if (expiringRecords.length > 0) {
      recommendations.push({
        priority: "medium" as const,
        category: "Renewal Management",
        description: `${expiringRecords.length} compliance records expiring within 60 days. Plan renewals.`,
        timeline: "Within 30 days",
      });
    }

    // Unresolved violations
    const unresolvedViolations = records
      .flatMap((r) => r.violations)
      .filter((v) => !v.resolved);
    if (unresolvedViolations.length > 0) {
      recommendations.push({
        priority: "high" as const,
        category: "Violation Resolution",
        description: `${unresolvedViolations.length} unresolved violations require attention.`,
        timeline: "Within 14 days",
      });
    }

    return recommendations;
  }

  private static async generatePDFReport(
    report: IRegulatoryReport
  ): Promise<string> {
    // This would integrate with a PDF generation service
    // For now, return a placeholder URL
    await Promise.resolve();
    return `https://example.com/reports/${report._id}.pdf`;
  }

  private static async generatePDFDocument(
    _content: string,
    templateName: string
  ): Promise<string> {
    // This would integrate with a PDF generation service
    // For now, return a placeholder URL
    await Promise.resolve();
    return `https://example.com/documents/${templateName}-${Date.now()}.pdf`;
  }

  /**
   * Get compliance records by landlord
   */
  static async getComplianceRecordsByLandlord(
    landlordId: string
  ): Promise<IComplianceRecord[]> {
    return await ComplianceRecord.find({ landlord: landlordId })
      .populate("property")
      .sort({ createdAt: -1 });
  }

  /**
   * Get compliance records by property
   */
  static async getComplianceRecordsByProperty(
    propertyId: string
  ): Promise<IComplianceRecord[]> {
    return await ComplianceRecord.find({ property: propertyId })
      .populate("landlord")
      .sort({ createdAt: -1 });
  }

  /**
   * Get legal templates
   */
  static async getLegalTemplates(filters?: any): Promise<ILegalTemplate[]> {
    const query = { isActive: true, ...filters };
    return await LegalTemplate.find(query).sort({
      usageCount: -1,
      createdAt: -1,
    });
  }

  /**
   * Get regulatory reports by landlord
   */
  static async getRegulatoryReportsByLandlord(
    landlordId: string
  ): Promise<IRegulatoryReport[]> {
    return await RegulatoryReport.find({ landlord: landlordId }).sort({
      generatedDate: -1,
    });
  }
}
