import {
  FieldType,
  type IDocumentTemplate,
  KENYA_LEGAL_CONSTANTS,
  Language,
  LegalDocumentCategory,
  LegalDocumentType,
  TemplateStatus,
} from "@kaa/models/types";

export const defaultLegalDocumentTemplates: IDocumentTemplate[] = [
  // Residential Tenancy Agreement Template
  {
    id: "07f1fcf4-1643-44c6-a1d8-dd2ca319ca75",
    name: "Residential Tenancy Agreement (Kenya)",
    type: LegalDocumentType.TENANCY_AGREEMENT,
    category: LegalDocumentCategory.CONTRACTS,
    version: "1.0",
    language: Language.BILINGUAL,
    jurisdiction: "kenya",
    status: TemplateStatus.ACTIVE,
    fields: [
      {
        id: "landlordName",
        name: "Landlord Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "landlordId",
        name: "Landlord ID Number",
        type: FieldType.ID_NUMBER,
        required: true,
        kenyaSpecific: true,
      },
      {
        id: "landlordPhone",
        name: "Landlord Phone",
        type: FieldType.PHONE,
        required: true,
        kenyaSpecific: true,
      },
      {
        id: "tenantName",
        name: "Tenant Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "tenantId",
        name: "Tenant ID Number",
        type: FieldType.ID_NUMBER,
        required: true,
        kenyaSpecific: true,
      },
      {
        id: "tenantPhone",
        name: "Tenant Phone",
        type: FieldType.PHONE,
        required: true,
        kenyaSpecific: true,
      },
      {
        id: "propertyAddress",
        name: "Property Address",
        type: FieldType.ADDRESS,
        required: true,
      },
      {
        id: "county",
        name: "County",
        type: FieldType.SELECT,
        required: true,
        options: KENYA_LEGAL_CONSTANTS.COUNTIES,
        kenyaSpecific: true,
      },
      {
        id: "rentAmount",
        name: "Monthly Rent (KES)",
        type: FieldType.CURRENCY,
        required: true,
      },
      {
        id: "depositAmount",
        name: "Security Deposit (KES)",
        type: FieldType.CURRENCY,
        required: true,
      },
      {
        id: "startDate",
        name: "Tenancy Start Date",
        type: FieldType.DATE,
        required: true,
      },
      {
        id: "duration",
        name: "Duration (Months)",
        type: FieldType.NUMBER,
        required: true,
      },
      {
        id: "rentDueDate",
        name: "Rent Due Date",
        type: FieldType.NUMBER,
        required: true,
        validation: { min: 1, max: 31 },
      },
    ],
    content: getResidentialTenancyTemplate(),
    compliance: [
      {
        law: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
        section: "Section 7",
        description: "Notice requirements for termination",
        mandatory: true,
      },
    ],
    metadata: {
      tags: ["residential", "tenancy", "kenya", "rental"],
      title: "Residential Tenancy Agreement",
      author: "Legal Department",
      // description: "Standard residential tenancy agreement compliant with Kenyan law",
      // description: "Comprehensive tenancy agreement for residential properties",
      description:
        "Standard residential tenancy agreement compliant with Kenyan law. Covers rent, deposit, maintenance, and termination terms.",
      legalReviewed: true,
      complianceChecked: true,
      governingLaw: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
      court: KENYA_LEGAL_CONSTANTS.COURTS.ENVIRONMENT_LAND_COURT,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "notice-to-quit-kenya-v1",
    name: "Notice to Quit (Kenya)",
    type: LegalDocumentType.NOTICE_TO_QUIT,
    category: LegalDocumentCategory.NOTICES,
    version: "1.0",
    language: Language.BILINGUAL,
    jurisdiction: "kenya",
    status: TemplateStatus.ACTIVE,
    fields: [
      {
        id: "landlordName",
        name: "Landlord Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "tenantName",
        name: "Tenant Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "propertyAddress",
        name: "Property Address",
        type: FieldType.ADDRESS,
        required: true,
      },
      {
        id: "reason",
        name: "Reason for Notice",
        type: FieldType.SELECT,
        options: [
          "Non-payment of rent",
          "Breach of tenancy agreement",
          "End of lease",
          "Property sale",
          "Personal use",
          "Other",
        ],
        required: true,
      },
      {
        id: "noticePeriod",
        name: "Notice Period (Days)",
        type: FieldType.NUMBER,
        required: true,
      },
      {
        id: "quitDate",
        name: "Date to Quit",
        type: FieldType.DATE,
        required: true,
      },
      {
        id: "rentArrears",
        name: "Rent Arrears (KES)",
        type: FieldType.CURRENCY,
        required: false,
      },
    ],
    content: getNoticeToQuitTemplate(),
    compliance: [
      {
        law: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
        section: "Section 12",
        description: "Required notice period for termination",
        mandatory: true,
      },
    ],
    metadata: {
      tags: ["notice", "quit", "eviction"],
      title: "Notice to Quit Premises",
      author: "Legal Department",
      // description: "Legal notice for tenant to vacate property",
      description:
        "Legal notice requiring tenant to vacate property. Used for non-payment or breach of agreement.",
      legalReviewed: true,
      complianceChecked: true,
      governingLaw: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
      court: KENYA_LEGAL_CONSTANTS.COURTS.ENVIRONMENT_LAND_COURT,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "b201d75b-e8cc-45a2-972d-a2403f0d17fe",
    name: "Rental Receipt",
    type: LegalDocumentType.RENTAL_RECEIPT,
    category: LegalDocumentCategory.RECEIPTS,
    version: "1.0",
    language: Language.BILINGUAL,
    jurisdiction: "kenya",
    status: TemplateStatus.ACTIVE,
    fields: [
      {
        id: "landlordName",
        name: "Landlord Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "tenantName",
        name: "Tenant Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "propertyAddress",
        name: "Property Address",
        type: FieldType.ADDRESS,
        required: true,
      },
      {
        id: "rentAmount",
        name: "Rent Amount (KES)",
        type: FieldType.CURRENCY,
        required: true,
      },
      {
        id: "paymentDate",
        name: "Payment Date",
        type: FieldType.DATE,
        required: true,
      },
      {
        id: "paymentPeriod",
        name: "Payment Period",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "paymentMethod",
        name: "Payment Method",
        type: FieldType.SELECT,
        options: ["Cash", "Bank Transfer", "Mobile Money", "Check"],
        required: true,
      },
    ],
    content: "",
    compliance: [],
    metadata: {
      tags: ["receipt", "rent", "payment"],
      title: "Rental Receipt",
      author: "Legal Department",
      // description: "Acknowledgment of rent payment",
      description:
        "Receipt for rent payment acknowledgment. Issued by landlord to tenant.",
      legalReviewed: true,
      complianceChecked: true,
      governingLaw: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
      court: KENYA_LEGAL_CONSTANTS.COURTS.ENVIRONMENT_LAND_COURT,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "70daf2f5-6738-441e-8616-45183a89c2d2",
    name: "Property Inspection Report",
    type: LegalDocumentType.INSPECTION_REPORT,
    category: LegalDocumentCategory.REPORTS,
    version: "1.0",
    language: Language.ENGLISH,
    jurisdiction: "kenya",
    status: TemplateStatus.ACTIVE,
    fields: [
      {
        id: "landlordName",
        name: "Landlord Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "tenantName",
        name: "Tenant Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "propertyAddress",
        name: "Property Address",
        type: FieldType.ADDRESS,
        required: true,
      },
      {
        id: "inspectionDate",
        name: "Inspection Date",
        type: FieldType.DATE,
        required: true,
      },
      {
        id: "inspectionType",
        name: "Inspection Type",
        type: FieldType.SELECT,
        options: ["Move-in", "Move-out", "Routine"],
        required: true,
      },
      {
        id: "generalCondition",
        name: "General Condition",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "damagesFound",
        name: "Damages Found",
        type: FieldType.TEXT,
        required: false,
      },
    ],
    content: "",
    compliance: [],
    metadata: {
      tags: ["inspection", "report", "maintenance"],
      title: "Property Inspection Report",
      author: "Legal Department",
      // description: "Property condition documentation",
      description:
        "Detailed inspection report of property condition at start and end of tenancy.",
      legalReviewed: true,
      complianceChecked: true,
      governingLaw: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
      court: KENYA_LEGAL_CONSTANTS.COURTS.ENVIRONMENT_LAND_COURT,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "588d35e2-1035-4604-b63a-3befd60bbc66",
    name: "Lease Agreement",
    type: LegalDocumentType.LEASE_AGREEMENT,
    category: LegalDocumentCategory.CONTRACTS,
    version: "1.0",
    language: Language.BILINGUAL,
    jurisdiction: "kenya",
    status: TemplateStatus.ACTIVE,
    fields: [
      {
        id: "landlordName",
        name: "Landlord Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "tenantName",
        name: "Tenant Name",
        type: FieldType.TEXT,
        required: true,
      },
      {
        id: "propertyAddress",
        name: "Property Address",
        type: FieldType.ADDRESS,
        required: true,
      },
      {
        id: "rentAmount",
        name: "Monthly Rent (KES)",
        type: FieldType.CURRENCY,
        required: true,
      },
      {
        id: "leaseStartDate",
        name: "Lease Start Date",
        type: FieldType.DATE,
        required: true,
      },
      {
        id: "leaseDuration",
        name: "Lease Duration (Years)",
        type: FieldType.NUMBER,
        required: true,
      },
      {
        id: "renewalTerms",
        name: "Renewal Terms",
        type: FieldType.TEXT,
        required: false,
      },
    ],
    content: getLeaseAgreementTemplate(),
    compliance: [
      {
        law: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
        section: "Section 12",
        description: "Required notice period for termination",
        mandatory: true,
      },
    ],
    metadata: {
      tags: ["lease", "commercial", "long-term"],
      title: "Lease Agreement",
      author: "Legal Department",
      // description: "Long-term lease agreement for properties",
      description:
        "Comprehensive lease agreement for commercial or long-term residential properties.",
      legalReviewed: true,
      complianceChecked: true,
      governingLaw: KENYA_LEGAL_CONSTANTS.LAWS.LANDLORD_TENANT_ACT,
      court: KENYA_LEGAL_CONSTANTS.COURTS.ENVIRONMENT_LAND_COURT,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function getLeaseAgreementTemplate(): string {
  return `
  # LEASE AGREEMENT
  
  **THIS AGREEMENT** is made this {currentDate} day between:
  
  **THE LANDLORD**: {landlordName}, ID No. {landlordId}, Phone: {landlordPhone}
  
  **THE TENANT**: {tenantName}, ID No. {tenantId}, Phone: {tenantPhone}
  `;
}

// Helper methods for default templates
function getResidentialTenancyTemplate(): string {
  return `
  # RESIDENTIAL TENANCY AGREEMENT
  
  **THIS AGREEMENT** is made this {currentDate} day between:
  
  **THE LANDLORD**: {landlordName}, ID No. {landlordId}, Phone: {landlordPhone}
  
  **THE TENANT**: {tenantName}, ID No. {tenantId}, Phone: {tenantPhone}
  
  **PROPERTY**: {propertyAddress}, {county} County
  
  ## TERMS AND CONDITIONS
  
  1. **RENT**: The monthly rent is KES {rentAmount}, due on the {rentDueDate} of each month.
  
  2. **SECURITY DEPOSIT**: A security deposit of KES {depositAmount} is required.
  
  3. **TENANCY PERIOD**: This tenancy shall commence on {startDate} for a period of {duration} months.
  
  4. **UTILITIES**: Tenant shall be responsible for electricity, water, and other utilities.
  
  5. **MAINTENANCE**: Tenant shall maintain the property in good condition.
  
  6. **TERMINATION**: Either party may terminate with 30 days written notice.
  
  7. **GOVERNING LAW**: This agreement is governed by the Laws of Kenya.
  
  **IN WITNESS WHEREOF**, the parties have executed this agreement on the date first written above.
  `;
}

function getNoticeToQuitTemplate(): string {
  return `
  # NOTICE TO QUIT
  
  **TO**: {tenantName}
  
  **PROPERTY ADDRESS**: {propertyAddress}
  
  **DATE**: {noticeDate}
  
  You are hereby required to QUIT and deliver up to me the above-mentioned premises which you hold as my tenant.
  
  **REASON**: {reason}
  
  You are required to quit the premises within {noticePeriod} days from the date of service of this notice, failing which proceedings will be instituted against you to recover possession of the said premises.
  
  **QUIT DATE**: {quitDate}
  
  _______________________
  Landlord: {landlordName}
  `;
}
