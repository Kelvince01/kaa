import config from "@kaa/config/api";
import { Tenant } from "@kaa/models";
import emailService from "./email.service";

/**
 * Send reference request email to reference provider
 */
export const sendReferenceRequestEmail = async ({
  providerEmail,
  providerName,
  tenantName,
  tenantEmail,
  propertyName,
  referenceType,
  referenceToken,
  expiresAt,
  customMessage,
}: {
  providerEmail: string;
  providerName: string;
  tenantName: string;
  tenantEmail: string;
  propertyName?: string;
  referenceType: string;
  referenceToken: string;
  expiresAt: Date;
  customMessage?: string;
}): Promise<boolean> => {
  const baseUrl = config.clientUrl || "https://kaa.co.ke";
  const respondUrl = `${baseUrl}/reference-response/${referenceToken}`;

  return await emailService.sendEmail({
    to: providerEmail,
    subject: `Reference Request for ${tenantName} - Property Application`,
    template: "reference-request",
    context: {
      providerName,
      tenantName,
      tenantEmail,
      propertyName: propertyName || "a rental property",
      referenceType: formatReferenceType(referenceType),
      referenceTypeRaw: referenceType,
      respondUrl,
      expiresAt: expiresAt.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      expiresAtShort: expiresAt.toLocaleDateString(),
      daysUntilExpiry: Math.ceil(
        (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      customMessage: customMessage || getDefaultMessage(referenceType),
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
    tags: [
      { name: "type", value: "reference-request" },
      { name: "reference-type", value: referenceType },
    ],
  });
};

/**
 * Send reference request reminder email
 */
export const sendReferenceReminderEmail = async ({
  providerEmail,
  providerName,
  tenantName,
  propertyName,
  referenceType,
  referenceToken,
  expiresAt,
  daysUntilExpiry,
}: {
  providerEmail: string;
  providerName: string;
  tenantName: string;
  propertyName?: string;
  referenceType: string;
  referenceToken: string;
  expiresAt: Date;
  daysUntilExpiry: number;
}): Promise<boolean> => {
  const baseUrl = config.clientUrl || "https://kaa.co.ke";
  const respondUrl = `${baseUrl}/reference-response/${referenceToken}`;

  const urgencyLevel =
    daysUntilExpiry <= 2
      ? "URGENT"
      : daysUntilExpiry <= 5
        ? "REMINDER"
        : "FOLLOW-UP";
  const isUrgent = daysUntilExpiry <= 2;

  return await emailService.sendEmail({
    to: providerEmail,
    subject: `${urgencyLevel}: Reference Request - ${tenantName} ${isUrgent ? "(Expires Soon!)" : `(${daysUntilExpiry} days left)`}`,
    template: "reference-reminder",
    context: {
      providerName,
      tenantName,
      propertyName: propertyName || "a rental property",
      referenceType: formatReferenceType(referenceType),
      referenceTypeRaw: referenceType,
      respondUrl,
      expiresAt: expiresAt.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      expiresAtShort: expiresAt.toLocaleDateString(),
      daysUntilExpiry,
      urgencyLevel,
      isUrgent,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
    tags: [
      { name: "type", value: "reference-reminder" },
      { name: "reference-type", value: referenceType },
      { name: "urgency", value: urgencyLevel.toLowerCase() },
    ],
  });
};

/**
 * Send notification to tenant when reference is completed
 */
export const sendReferenceCompletedEmail = async ({
  tenantEmail,
  tenantName,
  providerName,
  referenceType,
  propertyName,
  rating,
  feedback,
}: {
  tenantEmail: string;
  tenantName: string;
  providerName: string;
  referenceType: string;
  propertyName?: string;
  rating: number;
  feedback?: string;
}): Promise<boolean> => {
  return await emailService.sendEmail({
    to: tenantEmail,
    subject: `✅ Reference Completed - ${formatReferenceType(referenceType)} from ${providerName}`,
    template: "reference-completed",
    context: {
      tenantName,
      providerName,
      referenceType: formatReferenceType(referenceType),
      referenceTypeRaw: referenceType,
      propertyName: propertyName || "your rental application",
      rating,
      ratingStars: "★".repeat(rating) + "☆".repeat(5 - rating),
      feedback,
      hasFeedback: !!feedback,
      dashboardUrl: `${config.clientUrl}/dashboard/references`,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
    tags: [
      { name: "type", value: "reference-completed" },
      { name: "reference-type", value: referenceType },
      { name: "rating", value: rating.toString() },
    ],
  });
};

/**
 * Send notification to tenant when reference is declined
 */
export const sendReferenceDeclinedEmail = async ({
  tenantEmail,
  tenantName,
  providerName,
  referenceType,
  propertyName,
  declineReason,
  declineComment,
}: {
  tenantEmail: string;
  tenantName: string;
  providerName: string;
  referenceType: string;
  propertyName?: string;
  declineReason: string;
  declineComment?: string;
}): Promise<boolean> => {
  return await emailService.sendEmail({
    to: tenantEmail,
    subject: `Reference Request Declined - ${formatReferenceType(referenceType)}`,
    template: "reference-declined",
    context: {
      tenantName,
      providerName,
      referenceType: formatReferenceType(referenceType),
      referenceTypeRaw: referenceType,
      propertyName: propertyName || "your rental application",
      declineReason: formatDeclineReason(declineReason),
      declineReasonRaw: declineReason,
      declineComment,
      hasDeclineComment: !!declineComment,
      dashboardUrl: `${config.clientUrl}/dashboard/references`,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
      nextSteps: getNextStepsForDeclinedReference(declineReason),
    },
    tags: [
      { name: "type", value: "reference-declined" },
      { name: "reference-type", value: referenceType },
      { name: "decline-reason", value: declineReason },
    ],
  });
};

/**
 * Send welcome email to new reference provider
 */
export const sendReferenceProviderWelcomeEmail = async ({
  providerEmail,
  providerName,
  tenantName,
}: {
  providerEmail: string;
  providerName: string;
  tenantName: string;
}): Promise<boolean> => {
  return await emailService.sendEmail({
    to: providerEmail,
    subject: `Thank You for Providing a Reference for ${tenantName}`,
    template: "reference-provider-welcome",
    context: {
      providerName,
      tenantName,
      platformUrl: config.clientUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
    tags: [{ name: "type", value: "reference-provider-welcome" }],
  });
};

/**
 * Send tenant verification status update email
 */
export const sendTenantVerificationStatusEmail = async ({
  tenantId,
  verificationPercentage,
  newlyVerified = false,
}: {
  tenantId: string;
  verificationPercentage: number;
  newlyVerified?: boolean;
}): Promise<boolean> => {
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return false;

    const tenantName = `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`;
    const tenantEmail = tenant.personalInfo.email;

    return emailService.sendEmail({
      to: tenantEmail,
      subject: newlyVerified
        ? "🎉 Congratulations! Your Profile is Now Verified"
        : `Reference Update - Your Profile is ${verificationPercentage}% Complete`,
      template: newlyVerified
        ? "tenant-verification-complete"
        : "tenant-verification-update",
      context: {
        tenantName,
        verificationPercentage,
        isVerified: verificationPercentage >= 70,
        newlyVerified,
        dashboardUrl: `${config.clientUrl}/dashboard/references`,
        profileUrl: `${config.clientUrl}/dashboard/profile`,
        supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
        year: new Date().getFullYear(),
      },
      tags: [
        {
          name: "type",
          value: newlyVerified
            ? "tenant-verification-complete"
            : "tenant-verification-update",
        },
        {
          name: "verification-percentage",
          value: verificationPercentage.toString(),
        },
      ],
    });
  } catch (error) {
    console.error("Error sending tenant verification status email:", error);
    return false;
  }
};

// Helper functions
const formatReferenceType = (referenceType: string): string => {
  const typeMap: Record<string, string> = {
    employer: "Employment Reference",
    previous_landlord: "Previous Landlord Reference",
    character: "Character Reference",
    business_partner: "Business Partner Reference",
    family_guarantor: "Family Guarantor Reference",
    saccos_member: "SACCOS Member Reference",
    chama_member: "Chama Member Reference",
    religious_leader: "Religious Leader Reference",
    community_elder: "Community Elder Reference",
  };

  return typeMap[referenceType] || "Reference";
};

const formatDeclineReason = (reason: string): string => {
  const reasonMap: Record<string, string> = {
    unreachable: "Unable to reach you at this time",
    not_acquainted: "Not sufficiently acquainted to provide a reference",
    conflict_of_interest: "Has a conflict of interest",
    insufficient_information:
      "Insufficient information to provide a meaningful reference",
    time_constraints: "Does not have time to complete the reference",
    policy_restriction:
      "Company or personal policy prevents providing references",
    other: "Other reason",
  };

  return reasonMap[reason] || "Reason not specified";
};

const getDefaultMessage = (referenceType: string): string => {
  const messageMap: Record<string, string> = {
    employer:
      "We would appreciate your professional assessment of this person's employment history, reliability, and character as it relates to their rental application.",
    previous_landlord:
      "As a previous landlord, your insights about their tenancy, payment history, and property care would be invaluable for their rental application.",
    character:
      "Your personal assessment of this person's character, reliability, and trustworthiness would greatly help with their rental application.",
    business_partner:
      "Your professional relationship provides valuable insight into their business conduct and reliability for rental purposes.",
    family_guarantor:
      "As a potential guarantor, your willingness to support their rental application would be greatly appreciated.",
    saccos_member:
      "Your experience with them through your SACCOS provides valuable insight into their financial responsibility.",
    chama_member:
      "Your experience with them in your Chama group speaks to their financial discipline and commitment.",
    religious_leader:
      "Your spiritual guidance role provides unique insight into their character and community standing.",
    community_elder:
      "Your position as a community elder gives you valuable perspective on their character and reputation.",
  };

  return (
    messageMap[referenceType] ||
    "Your reference would be greatly appreciated for their rental application."
  );
};

const getNextStepsForDeclinedReference = (declineReason: string): string => {
  const nextStepsMap: Record<string, string> = {
    unreachable:
      "You may want to contact your reference provider directly or try requesting a reference from someone else.",
    not_acquainted:
      "Consider requesting a reference from someone who knows you better, such as a long-term employer or landlord.",
    conflict_of_interest:
      "Try requesting a reference from someone without professional or personal conflicts.",
    insufficient_information:
      "Consider providing more context about your relationship when requesting references.",
    time_constraints:
      "You may want to reach out again later or find an alternative reference provider.",
    policy_restriction:
      "Try requesting a reference from someone not bound by similar restrictions.",
    other:
      "Consider discussing the situation with your reference provider or finding an alternative reference.",
  };

  return (
    nextStepsMap[declineReason] ||
    "Consider requesting a reference from an alternative reference provider."
  );
};
