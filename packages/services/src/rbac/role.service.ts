import { Role, RolePermission, UserRole } from "@kaa/models";
import type { IRole } from "@kaa/models/types";
import type mongoose from "mongoose";
import { type FilterQuery, Types } from "mongoose";
import { permissionManager } from "../managers/permission.manager";

/**
 * Retrieves the ID of the default role (pending) from the database.
 * @returns {Promise<string | undefined>} The ID of the default role, or undefined if not found.
 */
export async function getDefaultRoleId() {
  const defaultRole = await Role.findOne({ name: "pending" })
    .select("_id")
    .lean();
  return defaultRole?._id.toString();
}

/**
 * Assign a role to a user
 */
export async function assignRole(
  userId: string,
  roleId: string,
  memberId: string
) {
  if (!Types.ObjectId.isValid(roleId)) {
    throw new Error("Invalid role ID");
  }

  // Check if role exists
  const role = await Role.findById(roleId);
  if (!role) {
    throw new Error("Role not found");
  }

  // Implementation depends on your UserRole model
  // This is a simplified example
  const userRole = new UserRole({
    userId: new Types.ObjectId(userId),
    roleId: new Types.ObjectId(roleId),
    memberId: new Types.ObjectId(memberId),
    assignedBy: new Types.ObjectId(userId),
  });

  await userRole.save();

  // Clear permission cache for this user

  if (permissionManager) {
    permissionManager.clearCacheForUser(userId);
  }

  return userRole;
}

/**
 * Check if a user has a specific role
 */
export async function userHasRole(
  userId: string,
  roleName: string
): Promise<boolean> {
  const count = await UserRole.countDocuments({
    userId: new Types.ObjectId(userId),
    "roleId.name": roleName,
  });

  return count > 0;
}

/**
 * Get users with a specific role
 */
export async function getUsersWithRole_v1(
  roleName: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 10, offset = 0 } = options;

  const [users, total] = await Promise.all([
    UserRole.find({ "roleId.name": roleName })
      .populate("userId")
      .skip(offset)
      .limit(limit),
    UserRole.countDocuments({ "roleId.name": roleName }),
  ]);

  return {
    data: users.map((ur) => ({
      userId: ur.userId,
      roleAssignedAt: ur.createdAt,
    })),
    pagination: {
      total,
      offset,
      limit,
    },
  };
}

/**
 * Get default role for new users
 */
export async function getDefaultRole() {
  const role = await Role.findOne({ name: "pending" });
  if (!role) {
    throw new Error("Default role pending not found");
  }
  return role;
}

/**
 * Get all roles with filtering and pagination
 */
export async function getRoles({
  q,
  sort = "name",
  order = "asc",
  offset = 0,
  limit = 10,
}: {
  memberId?: string;
  q?: string;
  sort?: string;
  order?: "asc" | "desc";
  offset?: number;
  limit?: number;
}) {
  const query: FilterQuery<IRole> = {};

  // Text search
  if (q) {
    const searchRegex = new RegExp(q, "i");
    query.$or = [
      { name: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
    ];
  }

  // if (memberId) {
  // 	query.$and = [
  // 		{
  // 			_id: {
  // 				$in: UserRole.find({ memberId }).select("roleId"),
  // 			},
  // 		},
  // 	];
  // }

  // Build sort object
  const sortOrder = order === "desc" ? -1 : 1;
  const sortObj: any = {};
  sortObj[sort] = sortOrder;

  // Execute queries in parallel
  const [roles, totalCount] = await Promise.all([
    Role.find(query).sort(sortObj).skip(offset).limit(limit).lean(),
    Role.countDocuments(query),
  ]);

  // Get permission counts for all roles
  const rolesWithPermissionCount = await Promise.all(
    roles.map(async (role) => {
      const permissionCount = await RolePermission.countDocuments({
        roleId: role._id as mongoose.Types.ObjectId,
      });

      return {
        ...role,
        id: (role._id as mongoose.Types.ObjectId).toString(),
        _id: undefined,
        __v: undefined,
        permissionCount,
      };
    })
  );

  return {
    data: rolesWithPermissionCount,
    pagination: {
      total: totalCount,
      offset,
      limit,
    },
  };
}

/**
 * Get a role by ID
 */
export async function getRoleById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;

  const role = await Role.findById(id).lean();
  if (!role) return null;

  const permissionCount = await RolePermission.countDocuments({ roleId: id });

  return {
    ...role,
    id: role._id.toString(),
    _id: undefined,
    __v: undefined,
    permissionCount,
  };
}

/**
 * Get a role by name
 */
export async function getRoleByName(name: string) {
  const role = await Role.findOne({ name }).lean();
  if (!role) return null;

  const permissionCount = await RolePermission.countDocuments({
    roleId: role._id,
  });

  return {
    ...role,
    id: role._id.toString(),
    _id: undefined,
    __v: undefined,
    permissionCount,
  };
}

/**
 * Create a new role
 */
export async function createRole(data: {
  name: string;
  description?: string;
  isSystem?: boolean;
}) {
  const role = new Role({
    ...data,
    isSystem: data.isSystem,
  });

  await role.save();

  // Create audit log
  // await this.analyticsService.createAuditLog({
  // 	memberId: data.memberId,
  // 	userId,
  // 	action: "create",
  // 	resource: "role",
  // 	resourceId: role._id.toString(),
  // });

  return {
    ...role.toObject(),
    id: (role._id as mongoose.Types.ObjectId).toString(),
    _id: undefined,
    __v: undefined,
  };
}

/**
 * Update an existing role
 */
export async function updateRole(
  id: string,
  data: {
    name?: string;
    description?: string;
    isSystem?: boolean;
  }
) {
  if (!Types.ObjectId.isValid(id)) return null;

  const updateData = { ...data };
  if (updateData.isSystem !== undefined) {
    updateData.isSystem = !!updateData.isSystem;
  }

  const role = await Role.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  if (!role) return null;

  return {
    ...role,
    id: role._id.toString(),
    _id: undefined,
    __v: undefined,
  };
}

/**
 * Delete a role
 */
export async function deleteRole(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    return { success: false, error: "Invalid role ID" };
  }

  // Check if it's a system role
  const roleToDelete = await Role.findById(id).select("isSystem").lean();
  if (!roleToDelete) {
    return { success: false, error: "Role not found" };
  }

  // Prevent deletion of system roles
  if (roleToDelete.isSystem === true) {
    return { success: false, error: "Cannot delete system roles" };
  }

  // Use transaction to ensure both operations succeed or fail together
  const session = await Role.startSession();
  session.startTransaction();

  try {
    // Remove role-permission associations
    await RolePermission.deleteMany({ roleId: id }).session(session);

    // Delete the role
    const result = await Role.deleteOne({ _id: id }).session(session);

    await session.commitTransaction();

    return { success: result.deletedCount === 1 };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, roleId: string) {
  const result = await UserRole.deleteOne({
    userId: new Types.ObjectId(userId),
    roleId: new Types.ObjectId(roleId),
  });

  if (result.deletedCount > 0) {
    permissionManager.clearCacheForUser(userId);
  }

  return result.deletedCount > 0;
}

/**
 * Check if a role name already exists (for validation)
 */
export async function isRoleNameTaken(name: string, excludeId?: string) {
  const query: any = { name };

  if (excludeId && Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: excludeId };
  }

  const count = await Role.countDocuments(query);
  return count > 0;
}

export default {
  getDefaultRoleId,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  isRoleNameTaken,
};
