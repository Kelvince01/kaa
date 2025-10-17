// import type { ContractTermData } from "@kaa/models/types";

export type ContractTerm = {
  title: string;
  content: string;
};

export type ContractTemplateData = {
  rentAmount: number;
  rentDueDate: number;
  depositAmount: number;
  lateFee: number;
  waterBill: "Included" | "Tenant pays" | "Shared";
  electricityBill: "Included" | "Tenant pays" | "Shared";
  petsAllowed: boolean;
  smokingAllowed: boolean;
  sublettingAllowed: boolean;
};

/**
 * Get the appropriate suffix for a day number (1st, 2nd, 3rd, 4th, etc.)
 */
export function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * Format currency in Kenyan Shillings
 */
export function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

/**
 * Get the standard base terms for a rental contract
 */
export function getBaseTerms(data: ContractTemplateData): ContractTerm[] {
  return [
    {
      title: "RENT PAYMENT",
      content: `The Tenant agrees to pay rent of ${formatCurrency(data.rentAmount)} monthly, due on the ${data.rentDueDate}${getDaySuffix(data.rentDueDate)} of each month. Late payment will attract a fee of ${formatCurrency(data.lateFee || 0)}.`,
    },
    {
      title: "SECURITY DEPOSIT",
      content: `A security deposit of ${formatCurrency(data.depositAmount)} is required and will be refunded at the end of the tenancy, subject to property condition assessment.`,
    },
    {
      title: "UTILITIES",
      content: `Water bills are ${data.waterBill.toLowerCase()}. Electricity bills are ${data.electricityBill.toLowerCase()}.`,
    },
    {
      title: "PETS",
      content: `Pets are ${data.petsAllowed ? "allowed" : "not allowed"} on the premises.`,
    },
    {
      title: "SMOKING",
      content: `Smoking is ${data.smokingAllowed ? "allowed" : "prohibited"} in the property.`,
    },
    {
      title: "SUBLETTING",
      content: `Subletting is ${data.sublettingAllowed ? "allowed with written consent" : "strictly prohibited"}.`,
    },
    {
      title: "MAINTENANCE",
      content:
        "The Tenant shall maintain the property in good condition and report any damages immediately to the Landlord.",
    },
    {
      title: "ALTERATIONS",
      content:
        "No structural alterations or modifications may be made without written consent from the Landlord.",
    },
    {
      title: "INSPECTION",
      content:
        "The Landlord reserves the right to inspect the property with 24 hours written notice.",
    },
    {
      title: "TERMINATION",
      content:
        "Either party may terminate this agreement by giving 30 days written notice.",
    },
    {
      title: "DEFAULT",
      content:
        "Failure to pay rent or breach of any terms may result in immediate termination of the lease.",
    },
    {
      title: "ENTRY",
      content:
        "The Landlord may enter the premises in case of emergency or with reasonable notice for repairs.",
    },
    {
      title: "NOISE",
      content:
        "The Tenant agrees to maintain reasonable noise levels and not disturb neighbors.",
    },
    {
      title: "ILLEGAL ACTIVITIES",
      content: "The premises shall not be used for any illegal activities.",
    },
    {
      title: "INSURANCE",
      content:
        "The Tenant is advised to obtain personal property insurance. The Landlord is not liable for tenant's personal property.",
    },
    {
      title: "COMPLIANCE",
      content:
        "Both parties agree to comply with all applicable laws and regulations of Kenya.",
    },
    {
      title: "DISPUTE RESOLUTION",
      content:
        "Any disputes shall be resolved through mediation or the courts of Kenya.",
    },
    {
      title: "ENTIRE AGREEMENT",
      content:
        "This agreement constitutes the entire agreement between the parties.",
    },
  ];
}

/**
 * Get terms for a specific contract type
 */
export function getContractTerms(
  templateType: "standard" | "furnished" | "commercial",
  data: ContractTemplateData
): ContractTerm[] {
  const baseTerms = getBaseTerms(data);

  switch (templateType) {
    case "furnished":
      return [
        ...baseTerms,
        {
          title: "FURNISHED PROPERTY",
          content:
            "The property is furnished. The Tenant is responsible for maintaining all furniture and fixtures in good condition. An inventory will be provided and checked at the beginning and end of the tenancy.",
        },
      ];
    case "commercial":
      return [
        ...baseTerms.filter(
          (term) => !["PETS", "SMOKING", "SUBLETTING"].includes(term.title)
        ),
        {
          title: "BUSINESS USE",
          content:
            "The premises are let for commercial use only. The Tenant must comply with all business licensing requirements and zoning regulations.",
        },
        {
          title: "OPERATING HOURS",
          content:
            "Business operations must be conducted within reasonable hours and in compliance with local regulations.",
        },
      ];
    default:
      return baseTerms;
  }
}

/**
 * Merge custom terms with base terms
 */
export function mergeContractTerms(
  baseTerms: ContractTerm[],
  customTerms?: ContractTerm[]
): ContractTerm[] {
  if (!customTerms || customTerms.length === 0) {
    return baseTerms;
  }

  // Create a map of base terms for easy lookup
  const baseTermsMap = new Map(baseTerms.map((term) => [term.title, term]));

  // Override base terms with custom terms if they have the same title
  for (const customTerm of customTerms) {
    baseTermsMap.set(customTerm.title, customTerm);
  }

  return Array.from(baseTermsMap.values());
}

/**
 * Contract template constants
 */
export const CONTRACT_TEMPLATES = {
  STANDARD: "standard",
  FURNISHED: "furnished",
  COMMERCIAL: "commercial",
} as const;

export type ContractTemplate =
  (typeof CONTRACT_TEMPLATES)[keyof typeof CONTRACT_TEMPLATES];
