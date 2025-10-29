// Organization types
export type OrganizationType =
  | "landlord"
  | "property_manager"
  | "agency"
  | "other";

export type OrganizationAddress = {
  country: string;
  county: string;
  town: string;
  street: string;
  postalCode?: string;
};

export type Organization = {
  _id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  email: string;
  phone: string;
  address: OrganizationAddress;
  registrationNumber?: string;
  kraPin?: string;
  website?: string;
  logo?: string;
  settings?: Record<string, unknown>;
  isActive: boolean;
  members?: string[]; // Array of member IDs
  properties?: string[]; // Array of property IDs
  createdAt: string;
  updatedAt: string;
};

export type OrganizationCreateInput = {
  slug: string;
  name: string;
  type: OrganizationType;
  email: string;
  phone: string;
  address: OrganizationAddress;
  registrationNumber?: string;
  kraPin?: string;
  website?: string;
  logo?: string;
  settings?: Record<string, unknown>;
};

export type OrganizationUpdateInput = {
  name?: string;
  type?: OrganizationType;
  email?: string;
  phone?: string;
  address?: Partial<OrganizationAddress>;
  registrationNumber?: string;
  kraPin?: string;
  website?: string;
  logo?: string;
  settings?: Record<string, unknown>;
};

export type OrganizationListResponse = {
  status: "success" | "error";
  message: string;
  items: Organization[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type OrganizationResponse = {
  status: "success" | "error";
  message: string;
  organization: Organization;
};

export type SlugCheckResponse = {
  status: "success" | "error";
  message: string;
  available?: boolean;
};

export type AddMemberInput = {
  memberId: string;
};

export type OrganizationFilters = {
  name?: string;
  email?: string;
  phone?: string;
  page?: number;
  limit?: number;
  sort?: "nameAsc" | "nameDesc" | "dateAsc" | "dateDesc";
};
