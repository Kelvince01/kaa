import type { BaseDocument } from "./base.type";

export enum OrganizationType {
  LANDLORD = "landlord",
  PROPERTY_MANAGER = "property_manager",
  AGENCY = "agency",
  OTHER = "other",
}

export interface IOrganization extends BaseDocument {
  name: string;
  slug: string;
  type: OrganizationType;
  registrationNumber?: string;
  kraPin?: string;
  email: string;
  phone: string;
  website?: string;
  logo?: string;
  address: {
    country: string;
    county: string;
    town: string;
    street: string;
    postalCode?: string;
  };
  settings?: {
    language?: string;
    currency?: string;
    branding?: boolean;
    [key: string]: any;
  };
  isActive: boolean;
}
