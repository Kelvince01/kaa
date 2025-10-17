import { InsuranceClaim, InsurancePolicy } from "@kaa/models";
import {
  ClaimStatus,
  type IInsuranceClaim,
  type IInsurancePolicy,
  InsuranceStatus,
  InsuranceType,
} from "@kaa/models/types";
import { DateTime } from "luxon";
import type mongoose from "mongoose";
import {
  sendClaimApprovalNotification,
  sendClaimRejectionNotification,
  sendClaimSettlementNotification,
  sendClaimStatusUpdateNotification,
  sendClaimSubmissionNotification,
  sendPaymentOverdueNotification,
  sendPolicyCancellationNotification,
  sendPolicyExpiryReminder,
  sendPolicyRenewalConfirmation,
  sendPolicySuspensionNotification,
} from "../comms/notification.factory";

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class InsuranceService {
  /**
   * Create a new insurance policy
   */
  static async createPolicy(
    data: Partial<IInsurancePolicy>
  ): Promise<IInsurancePolicy> {
    // Generate policy number
    const policyNumber = await InsuranceService.generatePolicyNumber();

    // Calculate monthly premium
    const monthlyPremium = data.premium?.annualPremium
      ? data.premium.annualPremium / 12
      : 0;

    // Set next payment date based on frequency
    const nextPaymentDate = InsuranceService.calculateNextPaymentDate(
      data.terms?.startDate || new Date(),
      data.premium?.paymentFrequency || "annually"
    );

    const policy = new InsurancePolicy({
      ...data,
      policyNumber,
      premium: {
        ...data.premium,
        monthlyPremium,
        nextPaymentDate,
        totalPaid: 0,
        outstandingAmount: data.premium?.annualPremium || 0,
      },
      status: InsuranceStatus.ACTIVE,
      claims: [],
    });

    await policy.save();

    // Schedule renewal reminder
    await InsuranceService.scheduleRenewalReminder(policy);

    return policy;
  }

  /**
   * Submit an insurance claim
   */
  static async submitClaim(
    data: Partial<IInsuranceClaim>
  ): Promise<IInsuranceClaim> {
    // Generate claim number
    const claimNumber = await InsuranceService.generateClaimNumber();

    const claim = new InsuranceClaim({
      ...data,
      claimNumber,
      status: ClaimStatus.SUBMITTED,
      reportedDate: new Date(),
      timeline: [
        {
          date: new Date(),
          action: "claim_submitted",
          description: "Insurance claim submitted",
          performedBy: "system",
        },
      ],
      communications: [],
    });

    await claim.save();

    // Update policy with claim reference
    await InsurancePolicy.findByIdAndUpdate(data.policy, {
      $push: { claims: claim._id },
    });

    // Send notification to landlord
    await sendClaimSubmissionNotification(claim);

    // Auto-assign claim for review
    await InsuranceService.assignClaimForReview(claim);

    return claim;
  }

  /**
   * Process insurance claim
   */
  static async processClaim(
    claimId: string,
    action: string,
    data: any
  ): Promise<IInsuranceClaim> {
    const claim = await InsuranceClaim.findById(claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    switch (action) {
      case "review":
        return InsuranceService.reviewClaim(claim, data);
      case "approve":
        return InsuranceService.approveClaim(claim, data);
      case "reject":
        return InsuranceService.rejectClaim(claim, data);
      case "settle":
        return InsuranceService.settleClaim(claim, data);
      default:
        throw new Error("Invalid action");
    }
  }

  /**
   * Review insurance claim
   */
  private static async reviewClaim(
    claim: IInsuranceClaim,
    data: any
  ): Promise<IInsuranceClaim> {
    claim.status = ClaimStatus.UNDER_REVIEW;
    claim.assignedTo = data.assignedTo;

    // Add assessment details
    if (data.assessment) {
      claim.assessment = {
        ...claim.assessment,
        ...data.assessment,
        assessmentDate: new Date(),
      };
    }

    // Add timeline entry
    claim.timeline.push({
      date: new Date(),
      action: "claim_under_review",
      description: "Claim is under review by assessor",
      performedBy: data.reviewedBy || "system",
    });

    await claim.save();

    // Send notification
    await sendClaimStatusUpdateNotification(claim);

    return claim;
  }

  /**
   * Approve insurance claim
   */
  private static async approveClaim(
    claim: IInsuranceClaim,
    data: any
  ): Promise<IInsuranceClaim> {
    claim.status = ClaimStatus.APPROVED;
    claim.approvedAmount = data.approvedAmount;

    // Add timeline entry
    claim.timeline.push({
      date: new Date(),
      action: "claim_approved",
      description: `Claim approved for ${claim.currency} ${data.approvedAmount}`,
      performedBy: data.approvedBy || "system",
    });

    await claim.save();

    // Send notification
    await sendClaimApprovalNotification(claim);

    return claim;
  }

  /**
   * Reject insurance claim
   */
  private static async rejectClaim(
    claim: any,
    data: any
  ): Promise<IInsuranceClaim> {
    claim.status = ClaimStatus.REJECTED;

    // Add timeline entry
    claim.timeline.push({
      date: new Date(),
      action: "claim_rejected",
      description: data.rejectionReason || "Claim rejected",
      performedBy: data.rejectedBy || "system",
    });

    await claim.save();

    // Send notification
    await sendClaimRejectionNotification(claim, data.rejectionReason);

    return claim;
  }

  /**
   * Settle insurance claim
   */
  private static async settleClaim(
    claim: any,
    data: any
  ): Promise<IInsuranceClaim> {
    claim.status = ClaimStatus.SETTLED;
    claim.settledAmount = data.settledAmount;
    claim.settlement = {
      settlementDate: new Date(),
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      paymentDate: data.paymentDate || new Date(),
      finalAmount: data.settledAmount,
    };

    // Add timeline entry
    claim.timeline.push({
      date: new Date(),
      action: "claim_settled",
      description: `Claim settled for ${claim.currency} ${data.settledAmount}`,
      performedBy: data.settledBy || "system",
    });

    await claim.save();

    // Send notification
    await sendClaimSettlementNotification(claim);

    return claim;
  }

  /**
   * Check for expiring policies and send reminders
   */
  static async checkExpiringPolicies(): Promise<void> {
    const thirtyDaysFromNow = DateTime.now().plus({ days: 30 }).toJSDate();

    const expiringPolicies = await InsurancePolicy.find({
      status: InsuranceStatus.ACTIVE,
      "terms.endDate": { $lte: thirtyDaysFromNow },
      "notifications.renewalReminder": true,
    }).populate("landlord property");

    for (const policy of expiringPolicies) {
      const daysUntilExpiry = Math.ceil(
        (policy.terms.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= policy.notifications.reminderDays) {
        await sendPolicyExpiryReminder(policy, daysUntilExpiry);
      }
    }
  }

  /**
   * Check for overdue premium payments
   */
  static async checkOverduePayments(): Promise<void> {
    const today = new Date();

    const overduePayments = await InsurancePolicy.find({
      status: InsuranceStatus.ACTIVE,
      "premium.nextPaymentDate": { $lt: today },
      "premium.outstandingAmount": { $gt: 0 },
      "notifications.paymentReminder": true,
    }).populate("landlord property");

    for (const policy of overduePayments) {
      const daysOverdue = Math.ceil(
        (today.getTime() - policy.premium.nextPaymentDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      await sendPaymentOverdueNotification(policy, daysOverdue);

      // Suspend policy if overdue for more than 30 days
      if (daysOverdue > 30) {
        await InsuranceService.suspendPolicy(
          (policy._id as mongoose.Types.ObjectId).toString(),
          "Payment overdue for more than 30 days"
        );
      }
    }
  }

  /**
   * Renew insurance policy
   */
  static async renewPolicy(
    policyId: string,
    renewalData: any
  ): Promise<IInsurancePolicy> {
    const policy = await InsurancePolicy.findById(policyId);
    if (!policy) {
      throw new Error("Policy not found");
    }

    // Update policy terms
    policy.terms.startDate = renewalData.startDate || policy.terms.endDate;
    policy.terms.endDate = DateTime.fromJSDate(policy.terms.startDate)
      .plus({ years: 1 })
      .toJSDate();
    policy.terms.renewalDate = DateTime.fromJSDate(policy.terms.renewalDate)
      .plus({ years: 1 })
      .toJSDate();

    // Update premium if changed
    if (renewalData.annualPremium) {
      policy.premium.annualPremium = renewalData.annualPremium;
      policy.premium.monthlyPremium = renewalData.annualPremium / 12;
      policy.premium.outstandingAmount = renewalData.annualPremium;
    }

    // Reset payment tracking
    policy.premium.nextPaymentDate = InsuranceService.calculateNextPaymentDate(
      policy.terms.startDate,
      policy.premium.paymentFrequency
    );
    policy.premium.totalPaid = 0;

    // Update coverage if changed
    if (renewalData.coverage) {
      policy.coverage = { ...policy.coverage, ...renewalData.coverage };
    }

    policy.status = InsuranceStatus.ACTIVE;

    await policy.save();

    // Send renewal confirmation
    await sendPolicyRenewalConfirmation(policy);

    return policy;
  }

  /**
   * Cancel insurance policy
   */
  static async cancelPolicy(
    policyId: string,
    reason: string
  ): Promise<IInsurancePolicy> {
    const policy = await InsurancePolicy.findById(policyId);
    if (!policy) {
      throw new Error("Policy not found");
    }

    policy.status = InsuranceStatus.CANCELLED;
    policy.notes = `${policy.notes || ""}\nCancelled: ${reason}`;

    await policy.save();

    // Send cancellation notification
    await sendPolicyCancellationNotification(policy, reason);

    return policy;
  }

  /**
   * Suspend insurance policy
   */
  static async suspendPolicy(
    policyId: string,
    reason: string
  ): Promise<IInsurancePolicy> {
    const policy = await InsurancePolicy.findById(policyId);
    if (!policy) {
      throw new Error("Policy not found");
    }

    policy.status = InsuranceStatus.SUSPENDED;
    policy.notes = `${policy.notes || ""}\nSuspended: ${reason}`;

    await policy.save();

    // Send suspension notification
    await sendPolicySuspensionNotification(policy, reason);

    return policy;
  }

  /**
   * Calculate risk assessment for property
   */
  static async calculateRiskAssessment(propertyId: string): Promise<any> {
    // This would integrate with external risk assessment services
    // For now, we'll provide a simplified implementation

    const property = await InsuranceService.getPropertyDetails(propertyId);
    let riskScore = 50; // Base risk score
    const riskFactors: string[] = [];

    // Location-based risk factors
    if (property.location?.county === "Nairobi") {
      riskScore += 10; // Higher crime risk
      riskFactors.push("High crime area");
    }

    // Property age factor
    if (
      property.details?.yearBuilt &&
      new Date().getFullYear() - property.details.yearBuilt > 20
    ) {
      riskScore += 15;
      riskFactors.push("Older building - higher maintenance risk");
    }

    // Property type factor
    if (property.type === "apartment") {
      riskScore -= 5; // Lower risk than standalone houses
    }

    // Security features
    if (property.details?.security) {
      riskScore -= 10;
    } else {
      riskFactors.push("No security system");
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high";
    if (riskScore <= 40) riskLevel = "low";
    else if (riskScore <= 70) riskLevel = "medium";
    else riskLevel = "high";

    return {
      riskScore: Math.max(0, Math.min(100, riskScore)),
      riskLevel,
      riskFactors,
      lastAssessmentDate: new Date(),
      assessedBy: "automated_system",
    };
  }

  /**
   * Get insurance recommendations for property
   */
  static async getInsuranceRecommendations(propertyId: string): Promise<any> {
    const property = await InsuranceService.getPropertyDetails(propertyId);
    const riskAssessment =
      await InsuranceService.calculateRiskAssessment(propertyId);

    const recommendations: {
      type: InsuranceType;
      priority: "low" | "medium" | "high" | "critical";
      reason: string;
      estimatedPremium: number;
      coverage: {
        buildingValue: number;
        liabilityLimit: number;
      };
    }[] = [];

    // Building insurance (mandatory)
    recommendations.push({
      type: InsuranceType.BUILDING,
      priority: "high",
      reason: "Protects the physical structure of the property",
      estimatedPremium: InsuranceService.estimatePremium(
        property.details?.size * 30_000,
        riskAssessment.riskScore
      ),
      coverage: {
        buildingValue: property.details?.size * 30_000, // KES 30k per sqft
        liabilityLimit: 5_000_000, // 5M KES
      },
    });

    // Landlord insurance
    recommendations.push({
      type: InsuranceType.LANDLORD,
      priority: "high",
      reason: "Covers rental income loss and landlord liability",
      estimatedPremium: InsuranceService.estimatePremium(
        property.pricing?.rentAmount * 12,
        riskAssessment.riskScore
      ),
      coverage: {
        // rentGuaranteeAmount: property.pricing?.rentAmount * 6, // 6 months rent
        buildingValue: 0,
        liabilityLimit: 2_000_000, // 2M KES
      },
    });

    // Contents insurance (if furnished)
    if (property.details?.furnished) {
      recommendations.push({
        type: InsuranceType.CONTENTS,
        priority: "medium",
        reason: "Protects furniture and appliances",
        estimatedPremium: InsuranceService.estimatePremium(
          1_000_000,
          riskAssessment.riskScore
        ), // 1M contents value
        coverage: {
          // contentsValue: 1_000_000,
          liabilityLimit: 1_000_000,
          buildingValue: 0,
        },
      });
    }

    // Legal expenses insurance
    recommendations.push({
      type: InsuranceType.LEGAL_EXPENSES,
      priority: "medium",
      reason: "Covers legal costs for tenant disputes",
      estimatedPremium: 25_000, // Fixed premium
      coverage: {
        // legalExpensesLimit: 500_000, // 500k KES
        liabilityLimit: 500_000, // 500k KES
        buildingValue: 0,
      },
    });

    return {
      property: propertyId,
      riskAssessment,
      recommendations,
      totalEstimatedPremium: recommendations.reduce(
        (sum, rec) => sum + rec.estimatedPremium,
        0
      ),
    };
  }

  // Helper methods
  private static generatePolicyNumber(): string {
    const prefix = "POL";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}${timestamp}${random}`;
  }

  private static generateClaimNumber(): string {
    const prefix = "CLM";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}${timestamp}${random}`;
  }

  private static calculateNextPaymentDate(
    startDate: Date,
    frequency: string
  ): Date {
    switch (frequency) {
      case "monthly":
        return DateTime.fromJSDate(startDate).plus({ months: 1 }).toJSDate();
      case "quarterly":
        return DateTime.fromJSDate(startDate).plus({ months: 3 }).toJSDate();
      case "annually":
        return DateTime.fromJSDate(startDate).plus({ years: 1 }).toJSDate();
      default:
        return DateTime.fromJSDate(startDate).plus({ years: 1 }).toJSDate();
    }
  }

  private static scheduleRenewalReminder(policy: IInsurancePolicy): void {
    // This would integrate with a job scheduler
    // For now, we'll just log the reminder
    console.log(
      `Renewal reminder scheduled for policy ${policy.policyNumber} on ${policy.terms.renewalDate}`
    );
  }

  private static async assignClaimForReview(
    claim: IInsuranceClaim
  ): Promise<void> {
    // Auto-assign to available assessor
    // This would integrate with staff management system
    claim.status = ClaimStatus.UNDER_REVIEW;
    await claim.save();
  }

  private static getPropertyDetails(propertyId: string): any {
    // This would fetch property details from the Property model
    // Simplified for this implementation
    return {
      _id: propertyId,
      type: "apartment",
      details: {
        size: 1000,
        yearBuilt: 2015,
        furnished: true,
        security: true,
      },
      location: {
        county: "Nairobi",
      },
      pricing: {
        rentAmount: 50_000,
      },
    };
  }

  private static estimatePremium(
    coverageAmount: number,
    riskScore: number
  ): number {
    // Basic premium calculation: 0.5% to 2% of coverage amount based on risk
    const baseRate = 0.005; // 0.5%
    const riskMultiplier = 1 + riskScore / 100;
    return Math.round(coverageAmount * baseRate * riskMultiplier);
  }

  /**
   * Get policies by landlord
   */
  static getPoliciesByLandlord(landlordId: string): IInsurancePolicy[] {
    return InsurancePolicy.find({ landlord: landlordId })
      .populate("property claims")
      .sort({ createdAt: -1 })
      .lean() as any;
  }

  /**
   * Get claims by landlord
   */
  static getClaimsByLandlord(landlordId: string): IInsuranceClaim[] {
    return InsuranceClaim.find({ landlord: landlordId })
      .populate("policy property")
      .sort({ createdAt: -1 })
      .lean() as any;
  }

  /**
   * Get policy by ID
   */
  static getPolicyById(policyId: string): IInsurancePolicy | null {
    return InsurancePolicy.findById(policyId)
      .populate("property landlord tenant claims")
      .lean() as any;
  }

  /**
   * Get claim by ID
   */
  static getClaimById(claimId: string): IInsuranceClaim | null {
    return InsuranceClaim.findById(claimId)
      .populate("policy property landlord tenant submittedBy assignedTo")
      .lean() as any;
  }

  /**
   * Get expired policies
   */
  static getExpiredPolicies(): IInsurancePolicy[] {
    const today = new Date();
    return InsurancePolicy.find({
      "terms.endDate": { $lt: today },
      status: { $in: [InsuranceStatus.ACTIVE, InsuranceStatus.EXPIRED] },
    })
      .populate("property landlord tenant")
      .lean() as any;
  }

  /**
   * Get insurance reminders
   */
  static async getInsuranceReminders(): Promise<any[]> {
    const today = DateTime.now();
    const thirtyDaysFromNow = today.plus({ days: 30 }).toJSDate();

    // Get policies expiring in the next 30 days
    const expiringPolicies = await InsurancePolicy.find({
      "terms.endDate": { $gte: today, $lte: thirtyDaysFromNow },
      status: InsuranceStatus.ACTIVE,
    }).populate("property landlord");

    // Get overdue payments
    const overduePayments = await InsurancePolicy.find({
      "premium.nextPaymentDate": { $lt: today },
      "premium.outstandingAmount": { $gt: 0 },
      status: InsuranceStatus.ACTIVE,
    }).populate("property landlord");

    return [
      ...expiringPolicies.map((policy) => ({
        type: "policy_expiry",
        policy,
        message: `Policy ${policy.policyNumber} expires on ${policy.terms.endDate}`,
        priority: "high",
      })),
      ...overduePayments.map((policy) => ({
        type: "payment_overdue",
        policy,
        message: `Payment overdue for policy ${policy.policyNumber}`,
        priority: "urgent",
      })),
    ];
  }

  /**
   * Get claim attachments
   */
  static async getClaimAttachments(claimId: string): Promise<any[]> {
    const claim = await InsuranceClaim.findById(claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }
    return claim.documents || [];
  }

  /**
   * Delete insurance claim
   */
  static async deleteInsuranceClaim(
    claimId: string
  ): Promise<{ message: string }> {
    const claim = await InsuranceClaim.findById(claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    // Only allow deletion of claims in certain statuses
    if (
      ![ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW].includes(claim.status)
    ) {
      throw new Error("Cannot delete claim in current status");
    }

    // Remove claim reference from policy
    await InsurancePolicy.findByIdAndUpdate(claim.policy, {
      $pull: { claims: claimId },
    });

    // Delete the claim
    await InsuranceClaim.findByIdAndDelete(claimId);

    return { message: "Claim deleted successfully" };
  }

  /**
   * Send insurance reminder
   */
  static async sendInsuranceReminder(
    policyId: string,
    _message: string
  ): Promise<{ message: string }> {
    const policy =
      await InsurancePolicy.findById(policyId).populate("landlord");
    if (!policy) {
      throw new Error("Policy not found");
    }

    // Send reminder notification
    const daysUntilExpiry = Math.ceil(
      (policy.terms.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    await sendPolicyExpiryReminder(policy, daysUntilExpiry);

    return { message: "Reminder sent successfully" };
  }

  /**
   * Bulk update claims
   */
  static async bulkUpdateClaims(
    claimIds: string[],
    updates: Partial<IInsuranceClaim>
  ): Promise<{ message: string; updatedCount: number }> {
    const result = await InsuranceClaim.updateMany(
      { _id: { $in: claimIds } },
      { $set: updates }
    );

    // Add timeline entry for bulk update
    if (updates.status) {
      await InsuranceClaim.updateMany(
        { _id: { $in: claimIds } },
        {
          $push: {
            timeline: {
              date: new Date(),
              action: "bulk_update",
              description: `Bulk status update to ${updates.status}`,
              performedBy: "system",
            },
          },
        }
      );
    }

    return {
      message: "Claims updated successfully",
      updatedCount: result.modifiedCount,
    };
  }
}
