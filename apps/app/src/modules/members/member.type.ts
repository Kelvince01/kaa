// Member status
export type MemberStatus = "active" | "inactive" | "suspended";

// Member plan types
export type MemberPlan = "free" | "starter" | "professional" | "enterprise";

export type MemberSettings = {
  theme?: string;
  maxUsers: number;
  features: string[];
  customBranding: boolean;
  allowInvites: boolean;
  requireEmailVerification: boolean;
  twoFactorRequired: boolean;
};

export type MemberUsage = {
  users: number;
  apiCalls: number;
  storage: number; // in bytes
  bandwidth: number; // in bytes
};

export type MemberLimits = {
  users: number;
  apiCalls: number;
  storage: number;
  bandwidth: number;
};

export type Member = {
  _id: string;
  type?: "admin" | "agent" | "caretaker" | "viewer";
  user: string | any;
  organization: string | any;
  role: string | any;
  name: string;
  slug: string;
  plan: string | any;
  domain?: string;
  logo?: string;
  isActive: boolean;
  settings: MemberSettings;
  usage: MemberUsage;
  limits: MemberLimits;
  customPermissions?: string[];
  createdAt: string;
  updatedAt: string;
};

export type MemberCreateInput = {
  user: string;
  organization: string;
  role: string;
  name: string;
  slug: string;
  plan?: MemberPlan;
};

export type MemberUpdateInput = {
  name?: string;
  domain?: string;
  logo?: string;
  plan?: MemberPlan;
  isActive?: boolean;
  settings?: Partial<MemberSettings>;
};

export type MemberListResponse = {
  members: Member[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type MemberResponse = {
  data: Member;
  status: "success" | "error";
  message?: string;
};

export type MemberStatsResponse = {
  data: {
    member: {
      id: string;
      name: string;
    };
    stats: {
      totalUsers: number;
      activeUsers: number;
      apiCalls: number;
      storage: number;
      bandwidth: number;
    };
    limits: MemberLimits;
    usage: {
      users: {
        used: number;
        limit: number;
        percentage: number;
      };
      apiCalls: {
        used: number;
        limit: number;
        percentage: number;
      };
      storage: {
        used: number;
        limit: number;
        percentage: number;
      };
      bandwidth: {
        used: number;
        limit: number;
        percentage: number;
      };
    };
  };
  status: "success" | "error";
  message?: string;
};
