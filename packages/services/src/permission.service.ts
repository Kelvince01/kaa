import { Permission, Role, RolePermission, User, UserRole } from "@kaa/models";
import type {
  IPermission,
  IRolePermission,
  IUserRole,
} from "@kaa/models/types";
import { AppError, logger, NotFoundError, ValidationError } from "@kaa/utils";
import mongoose from "mongoose";

export type PermissionCheck = {
  userId: string;
  memberId: string;
  permission: string;
  resource?: any;
  context?: Record<string, any>;
};

export type RolePermissionAssignment = {
  roleId: string;
  permissionId: string;
  memberId: string;
  granted: boolean;
  conditions?: Record<string, any>;
  grantedBy: string;
  expiresAt?: Date;
};

export type UserRoleAssignment = {
  userId: string;
  roleId: string;
  memberId: string;
  isPrimary?: boolean;
  assignedBy: string;
  expiresAt?: Date;
  context?: {
    department?: string;
    project?: string;
    location?: string;
    temporary?: boolean;
    reason?: string;
  };
};

export async function getPermissions({
  q,
  roleId,
  resource,
  action,
  sort = "name",
  order = "asc",
  offset = 0,
  limit = 10,
}: {
  q?: string;
  roleId?: string;
  resource?: string;
  action?: string;
  sort?: string;
  order?: "asc" | "desc";
  offset?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = {};

  if (q) {
    query.$or = [
      { name: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
      { resource: new RegExp(q, "i") },
    ];
  }

  if (roleId) {
    query.$and = [
      { _id: { $in: RolePermission.find({ roleId }).select("permissionId") } },
    ];
  }

  if (resource) {
    query.resource = resource;
  }

  if (action) {
    query.action = action;
  }

  // Build sort object
  const sortObject: Record<string, 1 | -1> = {};
  sortObject[sort] = order === "asc" ? 1 : -1;

  const permissionsResult = await Permission.find(query)
    .sort(sortObject)
    .skip(offset)
    .limit(limit);

  const totalCount = await Permission.countDocuments(query);

  return {
    data: permissionsResult.map((row: IPermission) => ({
      ...row.toObject(),
      createdAt: row.createdAt ? new Date().toISOString() : undefined,
      updatedAt: row.updatedAt ? new Date().toISOString() : undefined,
    })),
    pagination: {
      total: totalCount,
      offset,
      limit,
    },
  };
}

export async function getPermissionById(id: string) {
  const permission = await Permission.findById(id).lean();

  if (permission) {
    return {
      ...permission,
      createdAt: permission.createdAt ? new Date().toISOString() : undefined,
      updatedAt: permission.updatedAt ? new Date().toISOString() : undefined,
    };
  }

  return null;
}

export async function createPermission(data: {
  name: string;
  description?: string;
  resource: string;
  action: string;
  conditions?: any;
}) {
  const permission = await Permission.create(data);
  return permission.toObject();
}

export async function updatePermission(
  id: string,
  data: {
    name?: string;
    description?: string;
    resource?: string;
    action?: string;
    conditions?: any;
  }
) {
  const permission = await Permission.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  );
  return permission?.toObject();
}

export async function deletePermission(id: string) {
  // First remove any role-permission associations
  await RolePermission.deleteMany({ permissionId: id });

  // Then delete the permission
  const deleted = await Permission.findByIdAndDelete(id);

  return !!deleted;
}

export async function checkPermission(
  check: PermissionCheck
): Promise<boolean> {
  try {
    // Super admin check
    if (await isSuperAdmin(check.userId, check.memberId)) {
      return true;
    }

    // Get user's roles
    const userRoles = await UserRole.find({
      userId: check.userId,
      memberId: check.memberId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    }).populate("roleId");

    if (userRoles.length === 0) {
      return false;
    }

    // Check each role's permissions
    for (const userRole of userRoles) {
      const hasPermission = await checkRolePermission(
        userRole.roleId._id.toString(),
        check.permission,
        check.memberId,
        check.resource,
        check.context
      );
      if (hasPermission) {
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error("Permission check failed", error);
    return false;
  }
}

async function checkRolePermission(
  roleId: string,
  permissionCode: string,
  memberId: string,
  resource?: any,
  context?: Record<string, any>
): Promise<boolean> {
  try {
    // Find the permission
    const permission = await Permission.findOne({ name: permissionCode });
    if (!permission) {
      return false;
    }

    // Check if role has this permission
    const rolePermission = await RolePermission.findOne({
      roleId,
      permissionId: permission._id,
      memberId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    if (!rolePermission) {
      return false;
    }

    // If explicitly denied
    if (!rolePermission.granted) {
      return false;
    }

    // Check permission conditions
    if (permission.conditions && permission.conditions.length > 0) {
      const conditionsMet = evaluateConditions(
        permission.conditions,
        resource,
        context
      );
      if (!conditionsMet) {
        return false;
      }
    }

    // Check role-specific conditions
    if (rolePermission.conditions) {
      const roleConditionsMet = evaluateRoleConditions(
        rolePermission.conditions,
        resource,
        context
      );
      if (!roleConditionsMet) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error("Role permission check failed", error);
    return false;
  }
}

async function assignRolePermission(
  assignment: RolePermissionAssignment
): Promise<IRolePermission> {
  try {
    // Validate role exists
    const role = await Role.findById(assignment.roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    // Validate permission exists
    const permission = await Permission.findById(assignment.permissionId);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }

    // Check if assignment already exists
    const existingAssignment = await RolePermission.findOne({
      roleId: assignment.roleId,
      permissionId: assignment.permissionId,
      memberId: assignment.memberId,
    });

    if (existingAssignment) {
      // Update existing assignment
      existingAssignment.granted = assignment.granted;
      existingAssignment.conditions = assignment.conditions;
      existingAssignment.grantedBy = new mongoose.Types.ObjectId(
        assignment.grantedBy
      );
      existingAssignment.grantedAt = new Date();
      existingAssignment.expiresAt = assignment.expiresAt;
      await existingAssignment.save();
      return existingAssignment;
    }

    // Create new assignment
    const rolePermission = new RolePermission(assignment);
    await rolePermission.save();

    logger.info("Role permission assigned", {
      roleId: assignment.roleId,
      permissionId: assignment.permissionId,
      granted: assignment.granted,
    });

    return rolePermission;
  } catch (error) {
    logger.error("Failed to assign role permission", error);
    throw error;
  }
}

async function assignUserRole(
  assignment: UserRoleAssignment
): Promise<IUserRole> {
  try {
    // Validate user exists
    const user = await User.findById(assignment.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Validate role exists
    const role = await Role.findById(assignment.roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    // Check if assignment already exists
    const existingAssignment = await UserRole.findOne({
      userId: assignment.userId,
      roleId: assignment.roleId,
      memberId: assignment.memberId,
    });

    if (existingAssignment) {
      throw new ValidationError("User already has this role");
    }

    // If this is a primary role, unset other primary roles
    if (assignment.isPrimary) {
      await UserRole.updateMany(
        { userId: assignment.userId, memberId: assignment.memberId },
        { isPrimary: false }
      );
    }

    // Create new assignment
    const userRole = new UserRole({
      ...assignment,
      isActive: true,
    });
    await userRole.save();

    logger.info("User role assigned", {
      userId: assignment.userId,
      roleId: assignment.roleId,
      isPrimary: assignment.isPrimary,
    });

    return userRole;
  } catch (error) {
    logger.error("Failed to assign user role", error);
    throw error;
  }
}

async function removeUserRole(
  userId: string,
  roleId: string,
  memberId: string
): Promise<void> {
  try {
    const userRole = await UserRole.findOne({ userId, roleId, memberId });
    if (!userRole) {
      throw new NotFoundError("User role assignment not found");
    }

    await userRole.deleteOne();

    logger.info("User role removed", { userId, roleId });
  } catch (error) {
    logger.error("Failed to remove user role", error);
    throw error;
  }
}

async function getUserRoles(
  userId: string,
  memberId: string
): Promise<IUserRole[]> {
  try {
    return await UserRole.find({
      userId,
      memberId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    }).populate("roleId");
  } catch (error) {
    logger.error("Failed to get user roles", error);
    throw new AppError("Failed to get user roles");
  }
}

async function getRolePermissions(
  roleId: string,
  memberId: string
): Promise<IRolePermission[]> {
  try {
    return await RolePermission.find({
      roleId,
      memberId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    }).populate("permissionId");
  } catch (error) {
    logger.error("Failed to get role permissions", error);
    throw new AppError("Failed to get role permissions");
  }
}

async function isSuperAdmin(
  userId: string,
  memberId: string
): Promise<boolean> {
  try {
    const userRoles = await UserRole.find({
      userId,
      memberId,
      isActive: true,
    }).populate("roleId");

    for (const userRole of userRoles) {
      const role = userRole.roleId as any;
      if (role.name === "Super Admin" || role.level >= 1000) {
        return true;
      }

      // Check if role has * permission
      const superPermission = await Permission.findOne({ name: "*" });
      if (superPermission) {
        const hasSuperPermission = await RolePermission.findOne({
          roleId: role._id,
          permissionId: superPermission._id,
          memberId,
          granted: true,
        });
        if (hasSuperPermission) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    logger.error("Super admin check failed", error);
    return false;
  }
}

function evaluateConditions(
  conditions: any[],
  resource?: any,
  context?: Record<string, any>
): boolean {
  for (const condition of conditions) {
    const value = resource?.[condition.field] || context?.[condition.field];

    switch (condition.operator) {
      case "equals":
        if (value !== condition.value) return false;
        break;
      case "not_equals":
        if (value === condition.value) return false;
        break;
      case "contains":
        if (!value?.toString().includes(condition.value)) return false;
        break;
      case "greater_than":
        if (!value || value <= condition.value) return false;
        break;
      case "less_than":
        if (!value || value >= condition.value) return false;
        break;
      default:
        return false;
    }
  }
  return true;
}

function evaluateRoleConditions(
  conditions: Record<string, any>,
  resource?: any,
  context?: Record<string, any>
): boolean {
  // Custom role condition evaluation logic
  // This can be extended based on specific business requirements
  console.log(conditions, resource, context);
  return true;
}
