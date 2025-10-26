import { format, formatDistanceToNow, isAfter } from "date-fns";
import {
  type Reference,
  ReferenceStatus,
  ReferenceType,
} from "../reference.type";

// Format date for display
export const formatDate = (dateString: string) =>
  format(new Date(dateString), "MMM dd, yyyy");

// Format date and time for display
export const formatDateTime = (dateString: string) =>
  format(new Date(dateString), "MMM dd, yyyy 'at' HH:mm");

// Get relative time (e.g., "2 days ago")
export const getRelativeTime = (dateString: string) =>
  formatDistanceToNow(new Date(dateString), { addSuffix: true });

// Check if reference is expired
export const isReferenceExpired = (reference: Reference) =>
  isAfter(new Date(), new Date(reference.expiresAt));

// Get status badge variant
export const getStatusBadgeVariant = (status: ReferenceStatus) => {
  switch (status) {
    case ReferenceStatus.COMPLETED:
      return "default" as const;
    case ReferenceStatus.PENDING:
      return "secondary" as const;
    case ReferenceStatus.EXPIRED:
      return "destructive" as const;
    case ReferenceStatus.DECLINED:
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

// Get reference type display name
export const getReferenceTypeDisplayName = (type: ReferenceType) => {
  switch (type) {
    case ReferenceType.EMPLOYER:
      return "Employment Reference";
    case ReferenceType.PREVIOUS_LANDLORD:
      return "Previous Landlord";
    case ReferenceType.CHARACTER:
      return "Character Reference";
    case ReferenceType.BUSINESS_PARTNER:
      return "Business Partner";
    case ReferenceType.FAMILY_GUARANTOR:
      return "Family Guarantor";
    case ReferenceType.SACCOS_MEMBER:
      return "SACCOS Member";
    case ReferenceType.CHAMA_MEMBER:
      return "Chama Member";
    case ReferenceType.RELIGIOUS_LEADER:
      return "Religious Leader";
    case ReferenceType.COMMUNITY_ELDER:
      return "Community Elder";
    default:
      return "Unknown";
  }
};

// Get reference type icon
export const getReferenceTypeIcon = (type: ReferenceType) => {
  switch (type) {
    case ReferenceType.EMPLOYER:
      return "briefcase";
    case ReferenceType.PREVIOUS_LANDLORD:
      return "home";
    case ReferenceType.CHARACTER:
      return "user";
    case ReferenceType.BUSINESS_PARTNER:
      return "handshake";
    case ReferenceType.FAMILY_GUARANTOR:
      return "users";
    case ReferenceType.SACCOS_MEMBER:
      return "piggy-bank";
    case ReferenceType.CHAMA_MEMBER:
      return "coins";
    case ReferenceType.RELIGIOUS_LEADER:
      return "church";
    case ReferenceType.COMMUNITY_ELDER:
      return "crown";
    default:
      return "help-circle";
  }
};

// Get status display name
export const getStatusDisplayName = (status: ReferenceStatus) => {
  switch (status) {
    case ReferenceStatus.PENDING:
      return "Pending";
    case ReferenceStatus.COMPLETED:
      return "Completed";
    case ReferenceStatus.EXPIRED:
      return "Expired";
    case ReferenceStatus.DECLINED:
      return "Declined";
    default:
      return "Unknown";
  }
};

// Filter references by status
export const filterReferencesByStatus = (
  references: Reference[],
  status: ReferenceStatus
) => references.filter((reference) => reference.status === status);

// Filter references by type
export const filterReferencesByType = (
  references: Reference[],
  type: ReferenceType
) => references.filter((reference) => reference.referenceType === type);

// Search references by text
export const searchReferences = (
  references: Reference[],
  searchTerm: string
) => {
  const lowercaseSearch = searchTerm.toLowerCase();
  return references.filter(
    (reference) =>
      reference.referenceProvider.name
        .toLowerCase()
        .includes(lowercaseSearch) ||
      reference.referenceProvider.email
        .toLowerCase()
        .includes(lowercaseSearch) ||
      reference.referenceProvider.relationship
        .toLowerCase()
        .includes(lowercaseSearch) ||
      getReferenceTypeDisplayName(reference.referenceType)
        .toLowerCase()
        .includes(lowercaseSearch)
  );
};

// Get reference statistics
export const getReferenceStats = (references: Reference[]) => {
  const total = references.length;
  const pending = filterReferencesByStatus(
    references,
    ReferenceStatus.PENDING
  ).length;
  const completed = filterReferencesByStatus(
    references,
    ReferenceStatus.COMPLETED
  ).length;
  const expired = filterReferencesByStatus(
    references,
    ReferenceStatus.EXPIRED
  ).length;
  const declined = filterReferencesByStatus(
    references,
    ReferenceStatus.DECLINED
  ).length;

  const avgRating =
    references
      .filter((ref) => ref.rating && ref.status === ReferenceStatus.COMPLETED)
      .reduce((sum, ref) => sum + (ref.rating || 0), 0) /
      references.filter(
        (ref) => ref.rating && ref.status === ReferenceStatus.COMPLETED
      ).length || 0;

  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  const responseRate = total > 0 ? ((completed + declined) / total) * 100 : 0;

  return {
    total,
    pending,
    completed,
    expired,
    declined,
    avgRating: Number(avgRating.toFixed(1)),
    completionRate: Number(completionRate.toFixed(1)),
    responseRate: Number(responseRate.toFixed(1)),
  };
};

// Sort references by date (newest first)
export const sortReferencesByDate = (
  references: Reference[],
  dateField: "submittedAt" | "completedAt" = "submittedAt"
) =>
  [...references].sort((a, b) => {
    const dateA = dateField === "submittedAt" ? a.submittedAt : a.completedAt;
    const dateB = dateField === "submittedAt" ? b.submittedAt : b.completedAt;

    if (!(dateA || dateB)) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

// Generate reference invitation URL
export const generateReferenceInvitationUrl = (
  referenceToken: string,
  baseUrl?: string
) => {
  const base =
    baseUrl || window?.location.origin || "https://app.kaaproperties.com";
  return `${base}/references/submit/${referenceToken}`;
};

// Validate reference form data
export const validateReferenceData = (data: any) => {
  const errors: Record<string, string> = {};

  if (!data.referenceType) {
    errors.referenceType = "Reference type is required";
  }

  if (!data.referenceProvider?.name?.trim()) {
    errors.name = "Reference provider name is required";
  }

  if (data.referenceProvider?.email?.trim()) {
    // biome-ignore lint/performance/useTopLevelRegex: we need to use a top level regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.referenceProvider.email)) {
      errors.email = "Please enter a valid email address";
    }
  } else {
    errors.email = "Reference provider email is required";
  }

  if (!data.referenceProvider?.relationship?.trim()) {
    errors.relationship = "Relationship to reference provider is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate reference submission data
export const validateReferenceSubmissionData = (
  data: any,
  referenceType: ReferenceType
) => {
  const errors: Record<string, string> = {};

  if (!data.feedback?.trim()) {
    errors.feedback = "Feedback is required";
  }

  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = "Rating must be between 1 and 5";
  }

  // Type-specific validation
  if (referenceType === ReferenceType.EMPLOYER) {
    if (!data.verificationDetails?.employmentStatus?.trim()) {
      errors.employmentStatus = "Employment status is required";
    }
    if (
      !data.verificationDetails?.annualIncome ||
      data.verificationDetails.annualIncome < 0
    ) {
      errors.annualIncome = "Annual income is required and must be positive";
    }
    if (!data.verificationDetails?.positionHeld?.trim()) {
      errors.positionHeld = "Position held is required";
    }
  }

  if (referenceType === ReferenceType.PREVIOUS_LANDLORD) {
    if (!data.verificationDetails?.rentPaymentHistory?.trim()) {
      errors.rentPaymentHistory = "Rent payment history is required";
    }
    if (
      !data.verificationDetails?.rentAmount ||
      data.verificationDetails.rentAmount < 0
    ) {
      errors.rentAmount = "Rent amount is required and must be positive";
    }
    if (!data.verificationDetails?.tenancyLength?.trim()) {
      errors.tenancyLength = "Tenancy length is required";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Get reference completion percentage for a tenant
export const getReferenceCompletionPercentage = (references: Reference[]) => {
  if (references.length === 0) return 0;

  const completed = references.filter(
    (ref) => ref.status === ReferenceStatus.COMPLETED
  ).length;
  return Math.round((completed / references.length) * 100);
};

// Check if tenant has all required references
export const hasAllRequiredReferences = (references: Reference[]) => {
  const requiredTypes = [
    ReferenceType.EMPLOYER,
    ReferenceType.PREVIOUS_LANDLORD,
  ];

  return requiredTypes.every((type) =>
    references.some(
      (ref) =>
        ref.referenceType === type && ref.status === ReferenceStatus.COMPLETED
    )
  );
};

// Get missing reference types
export const getMissingReferenceTypes = (references: Reference[]) => {
  const requiredTypes = [
    ReferenceType.EMPLOYER,
    ReferenceType.PREVIOUS_LANDLORD,
  ];
  const completedTypes = references
    .filter((ref) => ref.status === ReferenceStatus.COMPLETED)
    .map((ref) => ref.referenceType);

  return requiredTypes.filter((type) => !completedTypes.includes(type));
};

// Generate reference summary text
export const generateReferenceSummary = (references: Reference[]) => {
  const stats = getReferenceStats(references);
  const completionPercentage = getReferenceCompletionPercentage(references);

  if (references.length === 0) {
    return "No references requested yet";
  }

  if (stats.completed === references.length) {
    return `All ${references.length} references completed (${stats.avgRating}/5 avg rating)`;
  }

  return `${stats.completed}/${references.length} references completed (${completionPercentage}%)`;
};

// Get reference type metadata
export const getReferenceTypeMetadata = (type: ReferenceType) => ({
  value: type,
  label: getReferenceTypeDisplayName(type),
  description: getReferenceTypeDescription(type),
  icon: getReferenceTypeIcon(type),
  color: getReferenceTypeColor(type),
  requiredFields: getReferenceTypeRequiredFields(type),
});

// Get reference type description
export const getReferenceTypeDescription = (type: ReferenceType) => {
  switch (type) {
    case ReferenceType.EMPLOYER:
      return "Verification from your current or previous employer";
    case ReferenceType.PREVIOUS_LANDLORD:
      return "Reference from your previous landlord or property manager";
    case ReferenceType.CHARACTER:
      return "Personal reference from someone who knows you well";
    case ReferenceType.BUSINESS_PARTNER:
      return "Professional reference from a business partner or associate";
    case ReferenceType.FAMILY_GUARANTOR:
      return "Family member willing to guarantee your tenancy";
    case ReferenceType.SACCOS_MEMBER:
      return "Reference from your SACCOS (Savings and Credit Cooperative)";
    case ReferenceType.CHAMA_MEMBER:
      return "Reference from your Chama (investment group) members";
    case ReferenceType.RELIGIOUS_LEADER:
      return "Reference from your religious leader or spiritual advisor";
    case ReferenceType.COMMUNITY_ELDER:
      return "Reference from a respected community elder or leader";
    default:
      return "Reference verification";
  }
};

// Get reference type color
export const getReferenceTypeColor = (type: ReferenceType) => {
  switch (type) {
    case ReferenceType.EMPLOYER:
      return "blue";
    case ReferenceType.PREVIOUS_LANDLORD:
      return "green";
    case ReferenceType.CHARACTER:
      return "purple";
    case ReferenceType.BUSINESS_PARTNER:
      return "orange";
    case ReferenceType.FAMILY_GUARANTOR:
      return "pink";
    case ReferenceType.SACCOS_MEMBER:
      return "emerald";
    case ReferenceType.CHAMA_MEMBER:
      return "teal";
    case ReferenceType.RELIGIOUS_LEADER:
      return "amber";
    case ReferenceType.COMMUNITY_ELDER:
      return "violet";
    default:
      return "gray";
  }
};

// Get required fields for reference type
export const getReferenceTypeRequiredFields = (type: ReferenceType) => {
  switch (type) {
    case ReferenceType.EMPLOYER:
      return [
        "employment_duration",
        "position",
        "salary_range",
        "performance_rating",
      ];
    case ReferenceType.PREVIOUS_LANDLORD:
      return [
        "tenancy_duration",
        "rent_payment_history",
        "property_condition",
        "reason_for_leaving",
      ];
    case ReferenceType.CHARACTER:
      return [
        "relationship_duration",
        "character_assessment",
        "reliability_rating",
      ];
    case ReferenceType.BUSINESS_PARTNER:
      return [
        "business_relationship",
        "financial_reliability",
        "professional_conduct",
      ];
    case ReferenceType.FAMILY_GUARANTOR:
      return [
        "relationship_type",
        "financial_capacity",
        "guarantee_willingness",
      ];
    case ReferenceType.SACCOS_MEMBER:
      return [
        "membership_status",
        "savings_history",
        "loan_repayment_history",
        "standing",
      ];
    case ReferenceType.CHAMA_MEMBER:
      return [
        "membership_duration",
        "contribution_consistency",
        "group_standing",
      ];
    case ReferenceType.RELIGIOUS_LEADER:
      return [
        "congregation_membership",
        "character_assessment",
        "community_involvement",
      ];
    case ReferenceType.COMMUNITY_ELDER:
      return [
        "community_standing",
        "character_assessment",
        "recommendation_strength",
      ];
    default:
      return [];
  }
};

// Check if reference can be resent
export const canResendReference = (reference: Reference) =>
  reference.status === ReferenceStatus.PENDING &&
  !isReferenceExpired(reference) &&
  reference.requestAttempts.length < 3;

// Get days until expiry
export const getDaysUntilExpiry = (expiresAt: string) => {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format decline reason
export const formatDeclineReason = (reason: string) => {
  switch (reason) {
    case "unreachable":
      return "Person is unreachable";
    case "not_acquainted":
      return "Not well acquainted";
    case "conflict_of_interest":
      return "Conflict of interest";
    case "insufficient_information":
      return "Insufficient information";
    case "other":
      return "Other reason";
    default:
      return reason.replace(/_/g, " ");
  }
};

// Get all reference types as array
export const getAllReferenceTypes = () =>
  Object.values(ReferenceType).map((type) => getReferenceTypeMetadata(type));

// Get recommended reference types for Kenya
export const getRecommendedReferenceTypes = () => [
  ReferenceType.EMPLOYER,
  ReferenceType.PREVIOUS_LANDLORD,
  ReferenceType.CHARACTER,
  ReferenceType.SACCOS_MEMBER,
];
