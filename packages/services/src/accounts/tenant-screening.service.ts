import { Payment, TenantScreening } from "@kaa/models";
import {
  CreditRating,
  EmploymentStatus,
  type ITenantScreening,
  PaymentStatus,
  ScreeningStatus,
  ScreeningType,
} from "@kaa/models/types";
import { DateTime } from "luxon";

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class TenantScreeningService {
  /**
   * Initiate tenant screening process
   */
  static async initiateScreening(data: {
    tenantId: string;
    propertyId: string;
    landlordId: string;
    applicationId: string;
    screeningType: ScreeningType;
    requestedBy: string;
  }): Promise<ITenantScreening> {
    const screening = new TenantScreening({
      tenant: data.tenantId,
      property: data.propertyId,
      landlord: data.landlordId,
      application: data.applicationId,
      screeningType: data.screeningType,
      status: ScreeningStatus.PENDING,
      requestedDate: new Date(),
      expiryDate: DateTime.now().plus({ months: 3 }).toJSDate(), // Valid for 3 months
      requestedBy: data.requestedBy,

      // Initialize with default values
      identityVerification: {
        idNumber: "",
        idType: "national_id",
        verified: false,
        verificationMethod: "manual",
        documents: [],
      },
      creditCheck: {
        creditRating: CreditRating.FAIR,
        creditBureau: "CRB Africa",
        checkDate: new Date(),
        outstandingDebts: [],
        creditHistory: {
          totalAccounts: 0,
          activeAccounts: 0,
          closedAccounts: 0,
          defaultedAccounts: 0,
          paymentHistory: "fair",
        },
      },
      employmentVerification: {
        status: EmploymentStatus.EMPLOYED,
        verified: false,
        verificationMethod: "payslip",
        documents: [],
      },
      incomeVerification: {
        monthlyIncome: 0,
        annualIncome: 0,
        incomeSource: "salary",
        incomeStability: "stable",
        verified: false,
        documents: [],
      },
      backgroundCheck: {
        criminalRecord: {
          checked: false,
          hasRecord: false,
        },
        previousAddresses: [],
        references: [],
      },
      financialAssessment: {
        debtToIncomeRatio: 0,
        rentToIncomeRatio: 0,
        financialStability: "fair",
        affordabilityScore: 50,
      },
      riskAssessment: {
        overallRiskScore: 50,
        riskLevel: "medium",
        riskFactors: [],
        mitigatingFactors: [],
        recommendation: "approve_with_conditions",
      },
      aiInsights: {
        paymentProbability: 70,
        tenancySuccessScore: 70,
        redFlags: [],
        positiveIndicators: [],
        similarTenantPerformance: {
          averagePaymentDelay: 0,
          completionRate: 85,
        },
      },
      externalServices: [],
      results: {
        passed: false,
        score: 0,
        grade: "C",
        summary: "Screening in progress",
        recommendations: [],
        conditions: [],
      },
    });

    await screening.save();

    // Start automated screening process
    await TenantScreeningService.processAutomatedScreening(screening);

    return screening;
  }

  /**
   * Process automated screening
   */
  private static async processAutomatedScreening(
    screening: ITenantScreening
  ): Promise<void> {
    try {
      screening.status = ScreeningStatus.IN_PROGRESS;
      await screening.save();

      // Perform various checks based on screening type
      if (screening.screeningType === ScreeningType.BASIC) {
        await TenantScreeningService.performBasicScreening(screening);
      } else if (screening.screeningType === ScreeningType.STANDARD) {
        await TenantScreeningService.performStandardScreening(screening);
      } else if (screening.screeningType === ScreeningType.COMPREHENSIVE) {
        await TenantScreeningService.performComprehensiveScreening(screening);
      }

      // Calculate final scores and recommendations
      await TenantScreeningService.calculateFinalResults(screening);

      screening.status = ScreeningStatus.COMPLETED;
      screening.completedDate = new Date();
      await screening.save();
    } catch (error) {
      screening.status = ScreeningStatus.FAILED;
      await screening.save();
      throw error;
    }
  }

  /**
   * Perform basic screening (identity + basic credit check)
   */
  private static async performBasicScreening(
    screening: ITenantScreening
  ): Promise<void> {
    // Identity verification (simulated)
    await TenantScreeningService.performIdentityVerification(screening);

    // Basic credit check
    await TenantScreeningService.performCreditCheck(screening);

    // Basic financial assessment
    await TenantScreeningService.performFinancialAssessment(screening);
  }

  /**
   * Perform standard screening (basic + employment + references)
   */
  private static async performStandardScreening(
    screening: ITenantScreening
  ): Promise<void> {
    await TenantScreeningService.performBasicScreening(screening);

    // Employment verification
    await TenantScreeningService.performEmploymentVerification(screening);

    // Reference checks
    await TenantScreeningService.performReferenceChecks(screening);

    // Enhanced financial assessment
    await TenantScreeningService.performFinancialAssessment(screening);
  }

  /**
   * Perform comprehensive screening (standard + background + AI analysis)
   */
  private static async performComprehensiveScreening(
    screening: ITenantScreening
  ): Promise<void> {
    await TenantScreeningService.performStandardScreening(screening);

    // Background check
    await TenantScreeningService.performBackgroundCheck(screening);

    // AI-powered risk assessment
    await TenantScreeningService.performAIRiskAssessment(screening);

    // Comprehensive financial assessment
    await TenantScreeningService.performFinancialAssessment(screening);
  }

  /**
   * Perform identity verification
   */
  private static async performIdentityVerification(
    screening: ITenantScreening
  ): Promise<void> {
    // Simulate identity verification process
    // In real implementation, this would integrate with ID verification services

    screening.identityVerification.verified = true;
    screening.identityVerification.verificationDate = new Date();
    screening.identityVerification.verificationMethod = "automated";

    await screening.save();
  }

  /**
   * Perform credit check
   */
  private static async performCreditCheck(
    screening: ITenantScreening
  ): Promise<void> {
    // Simulate credit check with CRB Africa or similar service
    // In real implementation, this would integrate with credit bureaus

    const simulatedCreditScore = Math.floor(Math.random() * 400) + 350; // 350-750

    screening.creditCheck.creditScore = simulatedCreditScore;
    screening.creditCheck.creditRating =
      TenantScreeningService.getCreditRating(simulatedCreditScore);
    screening.creditCheck.checkDate = new Date();

    // Simulate credit history
    screening.creditCheck.creditHistory = {
      totalAccounts: Math.floor(Math.random() * 10) + 1,
      activeAccounts: Math.floor(Math.random() * 5) + 1,
      closedAccounts: Math.floor(Math.random() * 5),
      defaultedAccounts: Math.floor(Math.random() * 2),
      paymentHistory:
        simulatedCreditScore > 650
          ? "good"
          : simulatedCreditScore > 550
            ? "fair"
            : "poor",
    };

    // Simulate outstanding debts
    if (Math.random() > 0.6) {
      screening.creditCheck.outstandingDebts.push({
        creditor: "Sample Bank",
        amount: Math.floor(Math.random() * 500_000) + 50_000,
        status: Math.random() > 0.7 ? "overdue" : "current",
        monthsOverdue:
          Math.random() > 0.7 ? Math.floor(Math.random() * 6) + 1 : undefined,
      });
    }

    await screening.save();
  }

  /**
   * Perform employment verification
   */
  private static async performEmploymentVerification(
    screening: ITenantScreening
  ): Promise<void> {
    // Simulate employment verification
    // In real implementation, this would verify with employers or payroll systems

    screening.employmentVerification.verified = Math.random() > 0.2; // 80% success rate
    screening.employmentVerification.verificationDate = new Date();

    if (screening.employmentVerification.verified) {
      screening.employmentVerification.employer = "Sample Company Ltd";
      screening.employmentVerification.jobTitle = "Software Developer";
      screening.employmentVerification.employmentDuration =
        Math.floor(Math.random() * 60) + 6; // 6-66 months
      screening.employmentVerification.monthlyIncome =
        Math.floor(Math.random() * 150_000) + 50_000; // 50k-200k
    }

    await screening.save();
  }

  /**
   * Perform reference checks
   */
  private static async performReferenceChecks(
    screening: ITenantScreening
  ): Promise<void> {
    // Simulate reference checks
    const references = [
      {
        name: "John Doe",
        relationship: "employer" as const,
        contact: "+254700000001",
        verified: Math.random() > 0.3,
        feedback: "Reliable and punctual employee",
      },
      {
        name: "Jane Smith",
        relationship: "landlord" as const,
        contact: "+254700000002",
        verified: Math.random() > 0.3,
        feedback: "Good tenant, always paid rent on time",
      },
    ];

    screening.backgroundCheck.references = references;
    await screening.save();
  }

  /**
   * Perform background check
   */
  private static async performBackgroundCheck(
    screening: ITenantScreening
  ): Promise<void> {
    // Simulate criminal background check
    screening.backgroundCheck.criminalRecord = {
      checked: true,
      hasRecord: Math.random() > 0.9, // 10% have records
      checkDate: new Date(),
      details: Math.random() > 0.9 ? "Minor traffic violations" : undefined,
    };

    // Simulate previous addresses
    screening.backgroundCheck.previousAddresses = [
      {
        address: "123 Previous Street, Nairobi",
        duration: 24,
        landlordContact: "+254700000003",
        reason_for_leaving: "Job relocation",
      },
    ];

    await screening.save();
  }

  /**
   * Perform AI risk assessment
   */
  private static async performAIRiskAssessment(
    screening: ITenantScreening
  ): Promise<void> {
    // Get historical payment data for similar tenants
    const similarTenantData =
      await TenantScreeningService.getSimilarTenantPerformance(screening);

    // Calculate payment probability based on various factors
    const paymentProbability =
      TenantScreeningService.calculatePaymentProbability(screening);

    // Calculate tenancy success score
    const tenancySuccessScore =
      TenantScreeningService.calculateTenancySuccessScore(screening);

    // Identify red flags and positive indicators
    const { redFlags, positiveIndicators } =
      TenantScreeningService.identifyRiskIndicators(screening);

    screening.aiInsights = {
      paymentProbability,
      tenancySuccessScore,
      redFlags,
      positiveIndicators,
      similarTenantPerformance: similarTenantData,
    };

    await screening.save();
  }

  /**
   * Perform financial assessment
   */
  private static async performFinancialAssessment(
    screening: ITenantScreening
  ): Promise<void> {
    const monthlyIncome =
      screening.employmentVerification.monthlyIncome ||
      screening.incomeVerification.monthlyIncome;
    const propertyRent = 50_000; // This should come from the property data

    // Calculate ratios
    const rentToIncomeRatio = (propertyRent / monthlyIncome) * 100;
    const debtToIncomeRatio = TenantScreeningService.calculateDebtToIncomeRatio(
      screening,
      monthlyIncome
    );

    // Calculate affordability score
    const affordabilityScore =
      TenantScreeningService.calculateAffordabilityScore(
        rentToIncomeRatio,
        debtToIncomeRatio,
        screening.creditCheck.creditScore || 600
      );

    // Determine financial stability
    const financialStability =
      TenantScreeningService.determineFinancialStability(
        affordabilityScore,
        screening.creditCheck.creditRating
      );

    screening.financialAssessment = {
      debtToIncomeRatio,
      rentToIncomeRatio,
      bankBalance: Math.floor(Math.random() * 200_000) + 50_000,
      savingsAmount: Math.floor(Math.random() * 500_000) + 100_000,
      financialStability,
      affordabilityScore,
    };

    await screening.save();
  }

  /**
   * Calculate final results and recommendations
   */
  private static async calculateFinalResults(
    screening: ITenantScreening
  ): Promise<void> {
    // Calculate overall score
    const score = TenantScreeningService.calculateOverallScore(screening);

    // Determine grade
    const grade = TenantScreeningService.calculateGrade(score);

    // Determine if screening passed
    const passed = score >= 60; // Minimum passing score

    // Generate risk assessment
    const riskAssessment = TenantScreeningService.generateRiskAssessment(
      screening,
      score
    );

    // Generate summary and recommendations
    const { summary, recommendations, conditions } =
      TenantScreeningService.generateSummaryAndRecommendations(
        screening,
        score,
        passed
      );

    screening.riskAssessment = riskAssessment;
    screening.results = {
      passed,
      score,
      grade,
      summary,
      recommendations,
      conditions,
    };

    await screening.save();
  }

  // Helper methods
  static getCreditRating(creditScore: number): CreditRating {
    if (creditScore >= 750) return CreditRating.EXCELLENT;
    if (creditScore >= 650) return CreditRating.GOOD;
    if (creditScore >= 550) return CreditRating.FAIR;
    if (creditScore >= 350) return CreditRating.POOR;
    return CreditRating.VERY_POOR;
  }

  static async getSimilarTenantPerformance(screening: ITenantScreening) {
    // Get payment performance of similar tenants
    const similarPayments = await Payment.find({
      landlord: screening.landlord,
      status: { $in: [PaymentStatus.COMPLETED, PaymentStatus.FAILED] },
    });

    const totalPayments = similarPayments.length;
    const completedPayments = similarPayments.filter(
      (p) => p.status === PaymentStatus.COMPLETED
    ).length;
    const completionRate =
      totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 85;

    // Calculate average payment delay
    const latePayments = similarPayments.filter((p) => p.latePayment?.isLate);
    const averagePaymentDelay =
      latePayments.length > 0
        ? latePayments.reduce(
            (sum, p) => sum + (p.latePayment?.daysLate || 0),
            0
          ) / latePayments.length
        : 0;

    return {
      averagePaymentDelay,
      completionRate,
    };
  }

  static calculatePaymentProbability(screening: ITenantScreening): number {
    let probability = 70; // Base probability

    // Credit score factor
    const creditScore = screening.creditCheck.creditScore || 600;
    if (creditScore >= 700) probability += 20;
    else if (creditScore >= 600) probability += 10;
    else if (creditScore < 500) probability -= 20;

    // Employment factor
    if (screening.employmentVerification.verified) {
      probability += 15;
      if (
        screening.employmentVerification.employmentDuration &&
        screening.employmentVerification.employmentDuration > 24
      ) {
        probability += 5;
      }
    } else {
      probability -= 15;
    }

    // Debt-to-income ratio factor
    if (screening.financialAssessment.debtToIncomeRatio < 30) probability += 10;
    else if (screening.financialAssessment.debtToIncomeRatio > 50)
      probability -= 15;

    // Rent-to-income ratio factor
    if (screening.financialAssessment.rentToIncomeRatio < 30) probability += 10;
    else if (screening.financialAssessment.rentToIncomeRatio > 40)
      probability -= 10;

    return Math.max(0, Math.min(100, probability));
  }

  private static calculateTenancySuccessScore(
    screening: ITenantScreening
  ): number {
    let score = 70; // Base score

    // Reference checks
    const verifiedReferences = screening.backgroundCheck.references.filter(
      (r) => r.verified
    ).length;
    score += verifiedReferences * 5;

    // Criminal background
    if (
      screening.backgroundCheck.criminalRecord.checked &&
      !screening.backgroundCheck.criminalRecord.hasRecord
    ) {
      score += 10;
    } else if (screening.backgroundCheck.criminalRecord.hasRecord) {
      score -= 15;
    }

    // Previous rental history
    if (screening.backgroundCheck.previousAddresses.length > 0) {
      score += 5;
    }

    // Financial stability
    if (screening.financialAssessment.financialStability === "excellent")
      score += 15;
    else if (screening.financialAssessment.financialStability === "good")
      score += 10;
    else if (screening.financialAssessment.financialStability === "poor")
      score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private static identifyRiskIndicators(screening: ITenantScreening) {
    const redFlags: string[] = [];
    const positiveIndicators: string[] = [];

    // Credit-related indicators
    if (
      screening.creditCheck.creditScore &&
      screening.creditCheck.creditScore < 500
    ) {
      redFlags.push("Low credit score");
    } else if (
      screening.creditCheck.creditScore &&
      screening.creditCheck.creditScore > 700
    ) {
      positiveIndicators.push("Excellent credit score");
    }

    // Employment indicators
    if (screening.employmentVerification.verified) {
      positiveIndicators.push("Verified employment");
    } else {
      redFlags.push("Unverified employment");
    }

    // Financial indicators
    if (screening.financialAssessment.rentToIncomeRatio > 40) {
      redFlags.push("High rent-to-income ratio");
    } else if (screening.financialAssessment.rentToIncomeRatio < 30) {
      positiveIndicators.push("Healthy rent-to-income ratio");
    }

    // Background indicators
    if (screening.backgroundCheck.criminalRecord.hasRecord) {
      redFlags.push("Criminal background record");
    }

    // Outstanding debts
    const overdueDebts = screening.creditCheck.outstandingDebts.filter(
      (d) => d.status === "overdue" || d.status === "defaulted"
    );
    if (overdueDebts.length > 0) {
      redFlags.push("Outstanding overdue debts");
    }

    return { redFlags, positiveIndicators };
  }

  private static calculateDebtToIncomeRatio(
    screening: ITenantScreening,
    monthlyIncome: number
  ): number {
    const totalDebt = screening.creditCheck.outstandingDebts.reduce(
      (sum, debt) => sum + debt.amount,
      0
    );
    const monthlyDebtPayment = totalDebt * 0.05; // Assume 5% of total debt as monthly payment
    return (monthlyDebtPayment / monthlyIncome) * 100;
  }

  private static calculateAffordabilityScore(
    rentToIncomeRatio: number,
    debtToIncomeRatio: number,
    creditScore: number
  ): number {
    let score = 100;

    // Rent-to-income penalty
    if (rentToIncomeRatio > 30) score -= (rentToIncomeRatio - 30) * 2;

    // Debt-to-income penalty
    if (debtToIncomeRatio > 30) score -= (debtToIncomeRatio - 30) * 1.5;

    // Credit score bonus/penalty
    if (creditScore > 650) score += (creditScore - 650) / 10;
    else if (creditScore < 550) score -= (550 - creditScore) / 10;

    return Math.max(0, Math.min(100, score));
  }

  private static determineFinancialStability(
    affordabilityScore: number,
    creditRating: CreditRating
  ): "excellent" | "good" | "fair" | "poor" {
    if (
      affordabilityScore >= 80 &&
      (creditRating === CreditRating.EXCELLENT ||
        creditRating === CreditRating.GOOD)
    ) {
      return "excellent";
    }
    if (affordabilityScore >= 60 && creditRating !== CreditRating.VERY_POOR) {
      return "good";
    }
    if (affordabilityScore >= 40) {
      return "fair";
    }
    return "poor";
  }

  private static calculateOverallScore(screening: ITenantScreening): number {
    let score = 0;

    // Credit score (30% weight)
    const creditScore = screening.creditCheck.creditScore || 600;
    score += (creditScore / 750) * 30;

    // Employment verification (20% weight)
    score += screening.employmentVerification.verified ? 20 : 0;

    // Financial assessment (25% weight)
    score += (screening.financialAssessment.affordabilityScore / 100) * 25;

    // AI insights (15% weight)
    score += (screening.aiInsights.paymentProbability / 100) * 15;

    // Background check (10% weight)
    if (
      screening.backgroundCheck.criminalRecord.checked &&
      !screening.backgroundCheck.criminalRecord.hasRecord
    ) {
      score += 10;
    }

    return Math.round(score);
  }

  private static calculateGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  private static generateRiskAssessment(
    screening: ITenantScreening,
    score: number
  ) {
    const riskScore = 100 - score; // Inverse of overall score

    let riskLevel: "low" | "medium" | "high" | "very_high";
    if (riskScore <= 20) riskLevel = "low";
    else if (riskScore <= 40) riskLevel = "medium";
    else if (riskScore <= 60) riskLevel = "high";
    else riskLevel = "very_high";

    const riskFactors: string[] = [];
    const mitigatingFactors: string[] = [];

    // Identify risk factors
    if (
      screening.creditCheck.creditScore &&
      screening.creditCheck.creditScore < 600
    ) {
      riskFactors.push("Below average credit score");
    }
    if (screening.financialAssessment.rentToIncomeRatio > 35) {
      riskFactors.push("High rent-to-income ratio");
    }
    if (!screening.employmentVerification.verified) {
      riskFactors.push("Unverified employment status");
    }

    // Identify mitigating factors
    if (
      screening.financialAssessment.bankBalance &&
      screening.financialAssessment.bankBalance > 100_000
    ) {
      mitigatingFactors.push("Substantial bank balance");
    }
    if (
      screening.backgroundCheck.references.filter((r) => r.verified).length >= 2
    ) {
      mitigatingFactors.push("Multiple verified references");
    }

    let recommendation: "approve" | "approve_with_conditions" | "reject";
    const conditions: string[] = [];

    if (score >= 80) {
      recommendation = "approve";
    } else if (score >= 60) {
      recommendation = "approve_with_conditions";
      conditions.push("Require additional security deposit");
      if (screening.financialAssessment.rentToIncomeRatio > 35) {
        conditions.push("Require guarantor");
      }
    } else {
      recommendation = "reject";
    }

    return {
      overallRiskScore: riskScore,
      riskLevel,
      riskFactors,
      mitigatingFactors,
      recommendation,
      conditions,
    };
  }

  private static generateSummaryAndRecommendations(
    screening: ITenantScreening,
    score: number,
    passed: boolean
  ) {
    let summary = `Tenant screening completed with a score of ${score}/100. `;

    if (passed) {
      summary += "The applicant meets the minimum requirements for tenancy.";
    } else {
      summary +=
        "The applicant does not meet the minimum requirements for tenancy.";
    }

    const recommendations: string[] = [];
    const conditions: string[] = [];

    if (
      screening.creditCheck.creditScore &&
      screening.creditCheck.creditScore < 600
    ) {
      recommendations.push(
        "Consider requiring a guarantor due to low credit score"
      );
    }

    if (screening.financialAssessment.rentToIncomeRatio > 35) {
      recommendations.push(
        "Monitor payment closely due to high rent-to-income ratio"
      );
      conditions.push("Increase security deposit to 2 months rent");
    }

    if (!screening.employmentVerification.verified) {
      recommendations.push(
        "Verify employment before finalizing lease agreement"
      );
    }

    if (screening.aiInsights.paymentProbability < 70) {
      recommendations.push(
        "Consider payment monitoring or automatic payment setup"
      );
    }

    return { summary, recommendations, conditions };
  }

  /**
   * Get screening by ID
   */
  static async getScreeningById(id: string): Promise<ITenantScreening | null> {
    return await TenantScreening.findById(id).populate(
      "tenant landlord property application requestedBy reviewedBy"
    );
  }

  /**
   * Get screenings by tenant
   */
  static async getScreeningsByTenant(
    tenantId: string
  ): Promise<ITenantScreening[]> {
    return await TenantScreening.find({ tenant: tenantId })
      .populate("landlord property application")
      .sort({ createdAt: -1 });
  }

  /**
   * Get screenings by landlord
   */
  static async getScreeningsByLandlord(
    landlordId: string
  ): Promise<ITenantScreening[]> {
    return await TenantScreening.find({ landlord: landlordId })
      .populate("tenant property application")
      .sort({ createdAt: -1 });
  }
}
