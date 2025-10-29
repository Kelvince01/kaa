import { Member, Role, User, UserRole } from "@kaa/models";
import type { IMember } from "@kaa/models/types";
import {
  AuditActionType,
  AuditEntityType,
  AuditStatus,
} from "@kaa/models/types";
import {
  ConflictError,
  logger,
  NotFoundError,
  UnauthorizedError,
} from "@kaa/utils";
import type { FilterQuery } from "mongoose";
import { auditService } from "../misc/audit.service";

export type UpdateMemberData = {
  name?: string;
  domain?: string;
  logo?: string;
  settings?: Partial<IMember["settings"]>;
};

type MemberFilter = FilterQuery<IMember>;

/**
 * Get all tenants (admin only)
 */
export const getAllMembers = async (
  query: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
    organization?: string;
  } = {}
) => {
  const { page = 1, limit = 10, search = "", plan, organization } = query;

  const filter: MemberFilter = {};

  // Add search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
  }

  // Add plan filter
  if (plan) {
    filter.plan = plan;
  }

  // Add organization filter
  if (organization) {
    filter.organization = organization;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const members = await Member.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate(
      "user",
      "profile.firstName profile.lastName contact.email contact.phone"
    )
    .populate("role", "name")
    .populate("organization", "name slug")
    .populate("plan", "name");

  const total = await Member.countDocuments(filter);

  return {
    members,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

export async function getMemberById(memberId: string): Promise<IMember> {
  try {
    const member = await Member.findById(memberId)
      .populate(
        "user",
        "profile.firstName profile.lastName contact.email contact.phone"
      )
      .populate("role", "name")
      .populate("organization", "name slug")
      .populate("plan", "name");

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    return member;
  } catch (error) {
    logger.error("Failed to get member", error);
    throw error;
  }
}

export async function getMemberBy(query: {
  user?: string;
  organization?: string;
  role?: string;
}): Promise<IMember | null> {
  const member = await Member.findOne(query)
    .populate(
      "user",
      "profile.firstName profile.lastName contact.email contact.phone"
    )
    .populate("role", "name")
    .populate("organization", "name slug")
    .populate("plan", "name");

  return member;
}

/**
 * Create new tenant
 */
export const createMember = async (memberData: {
  user: string;
  organization: string;
  role: string;
  name: string;
  slug: string;
  plan?: string;
}) => {
  // Check if tenant with slug already exists
  const existingMember = await Member.findOne({ slug: memberData.slug });
  if (existingMember) {
    throw new ConflictError("Member with this slug already exists");
  }

  // Create tenant
  const member = await Member.create(memberData);

  return member;
};

export async function updateMember(
  memberId: string,
  data: UpdateMemberData,
  userId: string
): Promise<IMember> {
  try {
    const member = await Member.findById(memberId);
    if (!member) {
      throw new NotFoundError("Member not found");
    }

    // Store original data for audit log
    const originalData = {
      name: member.name,
      domain: member.domain,
      logo: member.logo,
      settings: { ...member.settings },
    };

    // Update member fields
    if (data.name) member.name = data.name;
    if (data.domain) member.domain = data.domain;
    if (data.logo) member.logo = data.logo;

    // Update settings
    if (data.settings) {
      member.settings = {
        ...member.settings,
        ...data.settings,
      };
    }

    await member.save();

    // Create audit log
    await auditService.auditLog({
      memberId,
      userId,
      action: AuditActionType.UPDATE,
      resource: AuditEntityType.MEMBER,
      resourceId: memberId,
      status: AuditStatus.SUCCESS,
      changes: {
        before: originalData,
        after: data,
      },
    });

    logger.info("Member updated", { memberId, updatedBy: userId });
    return member;
  } catch (error) {
    logger.error("Failed to update member", error);
    throw error;
  }
}

export async function deleteMember(
  memberId: string,
  userId: string
): Promise<void> {
  try {
    // Check if user is admin of this member
    const user = await UserRole.findById(userId).populate("roleId");
    const role = await Role.findById(user?.roleId._id);
    if (!user || role?.name !== "admin") {
      throw new UnauthorizedError("Only admin can delete a member");
    }

    // In a real app, you might want to implement a soft delete
    // or a more complex deletion process with confirmation
    await Member.findByIdAndDelete(memberId);

    // Create audit log
    // await analyticsService.createAuditLog({
    // 	memberId,
    // 	userId,
    // 	action: "delete",
    // 	resource: "member",
    // 	resourceId: memberId,
    // });

    logger.info("Member deleted", { memberId, deletedBy: userId });
  } catch (error) {
    logger.error("Failed to delete member", error);
    throw error;
  }
}

export async function getMemberStats(memberId: string): Promise<any> {
  try {
    const [member, userCount, activeUserCount] = await Promise.all([
      Member.findById(memberId),
      User.countDocuments({ memberId }),
      User.countDocuments({ memberId, status: "active" }),
    ]);

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    return {
      member: {
        id: member._id,
        name: member.name,
      },
      stats: {
        totalUsers: userCount,
        activeUsers: activeUserCount,
        apiCalls: member.usage.apiCalls,
        storage: member.usage.storage,
        bandwidth: member.usage.bandwidth,
      },
      limits: member.limits,
      usage: {
        users: {
          used: userCount,
          limit: member.limits.users,
          percentage: Math.round((userCount / member.limits.users) * 100),
        },
        apiCalls: {
          used: member.usage.apiCalls,
          limit: member.limits.apiCalls,
          percentage: Math.round(
            (member.usage.apiCalls / member.limits.apiCalls) * 100
          ),
        },
        storage: {
          used: member.usage.storage,
          limit: member.limits.storage,
          percentage: Math.round(
            (member.usage.storage / member.limits.storage) * 100
          ),
        },
        bandwidth: {
          used: member.usage.bandwidth,
          limit: member.limits.bandwidth,
          percentage: Math.round(
            (member.usage.bandwidth / member.limits.bandwidth) * 100
          ),
        },
      },
    };
  } catch (error) {
    logger.error("Failed to get member stats", error);
    throw error;
  }
}

export async function updateMemberLimits(
  memberId: string,
  limits: Partial<IMember["limits"]>
): Promise<IMember> {
  try {
    const member = await Member.findById(memberId);
    if (!member) {
      throw new NotFoundError("Member not found");
    }

    member.limits = {
      ...member.limits,
      ...limits,
    };

    await member.save();
    logger.info("Member limits updated", { memberId, limits });
    return member;
  } catch (error) {
    logger.error("Failed to update member limits", error);
    throw error;
  }
}
