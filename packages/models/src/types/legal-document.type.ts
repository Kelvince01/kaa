// Types and Interfaces
type IDocumentTemplate = {
  id: string;
  name: string;
  type: LegalDocumentType;
  category: LegalDocumentCategory;
  version: string;
  language: Language;
  jurisdiction: "kenya" | "nairobi" | "mombasa" | "kisumu" | "nakuru";
  status: TemplateStatus;
  fields: TemplateField[];
  content: string;
  metadata: DocumentMetadata;
  compliance: ComplianceRequirement[];
  createdAt: Date;
  updatedAt: Date;
};

enum LegalDocumentType {
  TENANCY_AGREEMENT = "tenancy_agreement",
  LEASE_AGREEMENT = "lease_agreement",
  RENTAL_RECEIPT = "rental_receipt",
  NOTICE_TO_QUIT = "notice_to_quit",
  INSPECTION_REPORT = "inspection_report",
  INVENTORY_LIST = "inventory_list",
  MAINTENANCE_AGREEMENT = "maintenance_agreement",
  DEPOSIT_RECEIPT = "deposit_receipt",
  TERMINATION_NOTICE = "termination_notice",
  RENEWAL_AGREEMENT = "renewal_agreement",
  SUBLETTING_AGREEMENT = "subletting_agreement",
  GUARANTOR_AGREEMENT = "guarantor_agreement",
  PROPERTY_MANAGEMENT_AGREEMENT = "property_management_agreement",
  POWER_OF_ATTORNEY = "power_of_attorney",
  AFFIDAVIT = "affidavit",
}

enum LegalDocumentCategory {
  CONTRACTS = "contracts",
  NOTICES = "notices",
  RECEIPTS = "receipts",
  REPORTS = "reports",
  AGREEMENTS = "agreements",
  LEGAL = "legal",
  COMPLIANCE = "compliance",
}

enum Language {
  ENGLISH = "en",
  SWAHILI = "sw",
  BILINGUAL = "en-sw",
}

enum TemplateStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DRAFT = "draft",
  DEPRECATED = "deprecated",
  UNDER_REVIEW = "under_review",
}

type TemplateField = {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  validation?: FieldValidation;
  options?: string[];
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  kenyaSpecific?: boolean;
};

enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  DATE = "date",
  EMAIL = "email",
  PHONE = "phone",
  ID_NUMBER = "id_number",
  KRA_PIN = "kra_pin",
  ADDRESS = "address",
  CURRENCY = "currency",
  PERCENTAGE = "percentage",
  SELECT = "select",
  MULTI_SELECT = "multi_select",
  CHECKBOX = "checkbox",
  SIGNATURE = "signature",
  FILE = "file",
}

type FieldValidation = {
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
  errorMessage?: string;
};

type DocumentMetadata = {
  title: string;
  description: string;
  tags: string[];
  author: string;
  approvedBy?: string;
  legalReviewed: boolean;
  complianceChecked: boolean;
  lastReviewed?: Date;
  nextReviewDue?: Date;
  governingLaw: string;
  court: string;
};

type ComplianceRequirement = {
  law: string;
  section: string;
  description: string;
  mandatory: boolean;
  penalty?: string;
};

type DocumentRequest = {
  templateId: string;
  data: Record<string, any>;
  options: GenerationOptions;
  requesterId: string;
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;
  metadata?: Record<string, any>;
};

type GenerationOptions = {
  format: "pdf" | "docx" | "html";
  language: Language;
  digitalSignature: boolean;
  watermark?: string;
  encryption?: boolean;
  password?: string;
  copies: number;
  delivery: DeliveryMethod[];
};

enum DeliveryMethod {
  EMAIL = "email",
  SMS = "sms",
  WHATSAPP = "whatsapp",
  DOWNLOAD = "download",
  POSTAL = "postal",
}

type IGeneratedDocument = {
  id: string;
  templateId: string;
  type: LegalDocumentType;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  format: string;
  language: Language;
  checksum: string;
  qrCode?: string;
  digitalSignature?: string;
  watermark?: string;
  encrypted: boolean;
  status: LegalDocumentStatus;
  metadata: Record<string, any>;
  parties: DocumentParty[];
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  generatedBy: string;
};

enum LegalDocumentStatus {
  GENERATED = "generated",
  SIGNED = "signed",
  EXECUTED = "executed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  ARCHIVED = "archived",
}

type DocumentParty = {
  type: "landlord" | "tenant" | "guarantor" | "witness" | "agent";
  name: string;
  idNumber?: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  signed: boolean;
  signedAt?: Date;
  signatureHash?: string;
};

// Kenya-specific constants and templates
const KENYA_LEGAL_CONSTANTS = {
  COURTS: {
    ENVIRONMENT_LAND_COURT: "Environment and Land Court",
    MAGISTRATE_COURT: "Magistrate Court",
    HIGH_COURT: "High Court",
    RENT_RESTRICTION_TRIBUNAL: "Rent Restriction Tribunal",
  },

  LAWS: {
    LANDLORD_TENANT_ACT:
      "Landlord and Tenant (Shops, Hotels and Catering Establishments) Act, Cap 301",
    RENT_RESTRICTION_ACT: "Rent Restriction Act, Cap 296",
    REGISTRATION_OF_DOCUMENTS_ACT: "Registration of Documents Act, Cap 285",
    STAMP_DUTY_ACT: "Stamp Duty Act, Cap 480",
    CONSUMER_PROTECTION_ACT: "Consumer Protection Act, 2012",
    DATA_PROTECTION_ACT: "Data Protection Act, 2019",
  },

  NOTICE_PERIODS: {
    RESIDENTIAL_MONTHLY: 30, // days
    RESIDENTIAL_YEARLY: 90, // days
    COMMERCIAL_MONTHLY: 30, // days
    COMMERCIAL_YEARLY: 180, // days
    FURNISHED: 7, // days
  },

  COUNTIES: [
    "Nairobi",
    "Mombasa",
    "Kiambu",
    "Machakos",
    "Kajiado",
    "Nakuru",
    "Uasin Gishu",
    "Kisumu",
    "Kakamega",
    "Bungoma",
    "Trans Nzoia",
    "Kericho",
    "Bomet",
    "Nyeri",
    "Meru",
    "Embu",
    "Tharaka-Nithi",
    "Kirinyaga",
    "Murang'a",
    "Laikipia",
    "Nyandarua",
  ],
};

const STANDARD_CLAUSES = {
  RENT_PAYMENT: {
    en: "The tenant shall pay rent of KES {amount} monthly, due on the {dueDate} of each month.",
    sw: "Mpangaji atalipa kodi ya KES {amount} kila mwezi, inayodaiwa mnamo tarehe {dueDate} ya kila mwezi.",
  },

  DEPOSIT: {
    en: "A security deposit of KES {amount} equivalent to {months} months rent is required.",
    sw: "Dhamana ya usalama ya KES {amount} sawa na kodi ya miezi {months} inahitajika.",
  },

  TERMINATION: {
    en: "Either party may terminate this agreement by giving {noticePeriod} days written notice.",
    sw: "Mhusika yoyote anaweza kumaliza makubaliano haya kwa kutoa notisi ya maandishi ya siku {noticePeriod}.",
  },
};

export {
  LegalDocumentType,
  LegalDocumentCategory,
  Language,
  TemplateStatus,
  LegalDocumentStatus,
  DeliveryMethod,
  FieldType,
  KENYA_LEGAL_CONSTANTS,
  STANDARD_CLAUSES,
  type IDocumentTemplate,
  type DocumentRequest,
  type GenerationOptions,
  type IGeneratedDocument,
  type DocumentParty,
  type ComplianceRequirement,
  type TemplateField,
  type FieldValidation,
  type DocumentMetadata,
};
