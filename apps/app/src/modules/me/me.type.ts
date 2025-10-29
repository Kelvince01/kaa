/**
 * User Context Types
 * Unified context for user authentication, role, member, organization, and profile
 */

export type UserRole = {
  id: string;
  name: string;
  isPrimary: boolean;
};

export type UserMember = {
  id: string;
  type?: string;
  name: string;
  logo?: string;
  plan: string;
};

export type UserOrganization = {
  id: string;
  name: string;
  logo?: string;
  type: string;
};

export type UserProfile = {
  type: string; // 'landlord' | 'tenant' | 'admin'
  data: any; // Role-specific profile data (ILandlord | ITenant)
};

export type UserContext = {
  role: UserRole | null;
  member: UserMember | null;
  organization: UserOrganization | null;
  profile: UserProfile | null;
};

/**
 * Response type from /api/me endpoint
 */
export type MeResponse = {
  status: "success";
  user: {
    id: string;
    memberId?: string;
    avatar?: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phone?: string;
    address?: {
      line1: string;
      town: string;
      postalCode: string;
      county: string;
      country: string;
    };
    status: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  context?: UserContext;
};

/**
 * Helper type for organization switcher
 */
export type OrganizationDisplay = {
  name: string;
  logo?: string | React.ElementType;
  plan: string;
  type?: string;
};

/**
 * Helper function to convert UserContext to OrganizationDisplay
 */
export const toOrganizationDisplay = (
  context: UserContext | null
): OrganizationDisplay | null => {
  if (!context) return null;

  // For users with organizations (landlords, admins)
  if (context.organization) {
    return {
      name: context.organization.name,
      logo: context.organization.logo,
      plan: context.member?.plan ?? "basic",
      type: context.organization.type,
    };
  }

  // For tenants (no organization, show personal account)
  if (context.role?.name === "tenant") {
    return {
      name: "Personal Account",
      logo: undefined,
      plan: "Tenant",
      type: "personal",
    };
  }

  return null;
};
