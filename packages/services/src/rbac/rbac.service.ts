import { Permission, Role, RolePermission, User, UserRole } from "@kaa/models";
import type mongoose from "mongoose";

export const addPermissionToRole = async (
  roleId: string,
  permissionId: string,
  grantedBy: string
) => {
  try {
    await RolePermission.create({
      roleId,
      permissionId,
      grantedBy,
    });

    return true;
  } catch (error) {
    console.error("Error adding permission to role:", error);
    return false;
  }
};

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string
) {
  const result = await RolePermission.deleteOne({
    roleId,
    permissionId,
  });
  return result.deletedCount && result.deletedCount > 0;
}

export const hasPermission = async (
  userId: string,
  resourceType: string,
  action: string
): Promise<boolean> => {
  const result = await User.findOne(
    {
      _id: userId,
      "members.organizationId": resourceType,
      "members.roles.permissions.action": action,
    },
    {
      "members.$": 1,
      "members.roles.permissions.$": 1,
    }
  );

  return result !== null;
};

export const hasOrganizationPermission = async (
  userId: string,
  organizationId: string,
  _resource: string,
  action: string
): Promise<boolean> => {
  const result = await User.findOne(
    {
      _id: userId,
      "members.organizationId": organizationId,
      "members.roles.permissions.action": action,
    },
    {
      "members.$": 1,
      "members.roles.permissions.$": 1,
    }
  );

  return result !== null;
};

export const getUserPermissions = async (userId: string) =>
  await Permission.aggregate([
    {
      $lookup: {
        from: "rolepermissions",
        localField: "_id",
        foreignField: "permissionId",
        as: "rolePermissions",
      },
    },
    {
      $unwind: {
        path: "$rolePermissions",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "roles",
        localField: "rolePermissions.roleId",
        foreignField: "_id",
        as: "role",
      },
    },
    {
      $unwind: {
        path: "$role",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "userroles",
        localField: "role._id",
        foreignField: "roleId",
        as: "userRoles",
      },
    },
    {
      $unwind: {
        path: "$userRoles",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "members",
        localField: "userRoles.memberId",
        foreignField: "_id",
        as: "member",
      },
    },
    {
      $unwind: {
        path: "$member",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        "member.userId": userId,
      },
    },
    {
      $project: {
        resource: 1,
        action: 1,
        organizationId: "$member.organizationId",
        roleName: "$role.name",
      },
    },
  ]);

export const getUserRolesInOrganization = async (
  userId: string,
  organizationId: string
) =>
  await Role.find(
    {
      "userRoles.memberId": {
        $in: User.find({ _id: userId }, { "members._id": 1 }).select(
          "members._id"
        ),
      },
      "userRoles.organizationId": organizationId,
    },
    {
      name: 1,
      description: 1,
    }
  );

export const getRolePermissions = async (roleId: string) =>
  await Permission.find(
    {
      _id: {
        $in: RolePermission.find({ roleId }, { permissionId: 1 }).select(
          "permissionId"
        ),
      },
    },
    {
      resource: 1,
      action: 1,
      name: 1,
    }
  );

export const hasAllPermissions = async (
  userId: string,
  permissionChecks: Array<{ resource: string; action: string }>
) => {
  const userPermissions = await getUserPermissions(userId);

  return permissionChecks.every((permissionCheck) =>
    userPermissions.some(
      (permission) =>
        permission.resource === permissionCheck.resource &&
        permission.action === permissionCheck.action
    )
  );
};

export const hasAnyPermission = async (
  userId: string,
  permissions: Array<{ resource: string; action: string }>
) => {
  const userPermissions = await getUserPermissions(userId);

  return permissions.some((permission) =>
    userPermissions.some(
      (userPermission) =>
        userPermission.resource === permission.resource &&
        userPermission.action === permission.action
    )
  );
};

// ============ USER ROLE ASSIGNMENTS ============

/**
 * Assign role to user
 */
export const assignRoleToUser = async (
  userId: string,
  roleId: string,
  memberId?: string,
  isPrimary = false,
  assignedBy?: string,
  expiresAt?: Date,
  context?: any
) => {
  const userRole = new UserRole({
    userId,
    roleId,
    memberId,
    isPrimary,
    assignedBy: assignedBy || userId,
    expiresAt,
    context,
    isActive: true,
  });

  await userRole.save();
  return userRole;
};

/**
 * Remove role from user
 */
export const removeRoleFromUser = async (
  userId: string,
  roleId: string,
  memberId?: string
) => {
  const result = await UserRole.deleteOne({
    userId,
    roleId,
    memberId,
  });

  return result.deletedCount > 0;
};

/**
 * Get user roles
 */
export const getUserRoles = async (userId: string, memberId?: string) => {
  const filter: any = { userId, isActive: true };
  if (memberId) {
    filter.memberId = memberId;
  }

  return await UserRole.find(filter).populate("roleId").lean();
};

/**
 * Get users with specific role
 */
export const getUsersWithRole = async (
  roleId: string,
  options: { limit?: number; offset?: number } = {}
) => {
  const { limit = 10, offset = 0 } = options;

  const [userRoles, total] = await Promise.all([
    UserRole.find({ roleId, isActive: true })
      .populate("userId")
      .populate("roleId", "name")
      .skip(offset)
      .limit(limit)
      .lean(),
    UserRole.countDocuments({ roleId, isActive: true }),
  ]);

  return {
    users: userRoles.map((ur) => ({
      // ...ur.userId,
      id: ((ur.userId as any)._id as mongoose.Types.ObjectId).toString(),
      username: (ur.userId as any).profile?.displayName,
      firstName: (ur.userId as any).profile?.firstName,
      lastName: (ur.userId as any).profile?.lastName,
      email: (ur.userId as any).contact?.email,
      status: (ur.userId as any).status,
      memberId: (ur.userId as any).memberId,
      isVerified: (ur.userId as any).verification.emailVerified,
      phoneVerified: (ur.userId as any).verification.phoneVerified,
      identityVerified: (ur.userId as any).verification.identityVerified,
      kycStatus: (ur.userId as any).kycStatus,
      county: (ur.userId as any).county,
      estate: (ur.userId as any).estate,
      preferences: (ur.userId as any).preferences,
      stats: (ur.userId as any).stats,
      lastLogin: (ur.userId as any)?.activity?.lastLogin,
      createdAt: (ur.userId as any).createdAt,
      updatedAt: (ur.userId as any).updatedAt,
      userRole: {
        id: ur._id,
        isPrimary: ur.isPrimary,
        assignedAt: ur.assignedAt,
        expiresAt: ur.expiresAt,
        context: ur.context,
      },
      role: {
        id: ur._id,
        name: (ur.roleId as any).name,
      },
    })),
    pagination: {
      total,
      offset,
      limit,
    },
  };
};

// ============ PERMISSION CHECKS ============

/**
 * Check if user has specific permission
 */
export const checkUserPermission = async (
  userId: string,
  resource: string,
  action: string,
  memberId?: string
) => {
  const userPermissions = await getUserPermissions(userId);

  return userPermissions.some(
    (permission) =>
      permission.resource === resource &&
      permission.action === action &&
      (!memberId || permission.organizationId === memberId)
  );
};

/**
 * Bulk delete roles
 */
export const bulkDeleteRoles = async (roleIds: string[]) => {
  const result = await Role.deleteMany({
    _id: { $in: roleIds },
    isSystem: { $ne: true }, // Prevent deletion of system roles
  });

  // Also clean up role permissions and user roles
  await Promise.all([
    RolePermission.deleteMany({ roleId: { $in: roleIds } }),
    UserRole.deleteMany({ roleId: { $in: roleIds } }),
  ]);

  return { deletedCount: result.deletedCount };
};

/**
 * Bulk delete permissions
 */
export const bulkDeletePermissions = async (permissionIds: string[]) => {
  const result = await Permission.deleteMany({
    _id: { $in: permissionIds },
    isSystem: { $ne: 1 }, // Prevent deletion of system permissions
  });

  // Also clean up role permissions
  await RolePermission.deleteMany({ permissionId: { $in: permissionIds } });

  return { deletedCount: result.deletedCount };
};

/**
 * Bulk assign roles to users
 */
export const bulkAssignRoles = async (
  userIds: string[],
  roleId: string,
  options: {
    memberId?: string;
    isPrimary?: boolean;
    expiresAt?: Date;
    assignedBy?: string;
  } = {}
) => {
  const userRoles = userIds.map((userId) => ({
    userId,
    roleId,
    memberId: options.memberId,
    isPrimary: options.isPrimary,
    assignedBy: options.assignedBy,
    expiresAt: options.expiresAt,
    isActive: true,
  }));

  const result = await UserRole.insertMany(userRoles, { ordered: false });
  return { assignedCount: result.length };
};

/**
 * Update role permissions by replacing all current permissions with new ones
 */
export const updateRolePermissions = async (
  roleId: string,
  permissionIds: string[],
  grantedBy?: string
) => {
  try {
    // First, remove all existing permissions for this role
    await RolePermission.deleteMany({ roleId });

    // Then add the new permissions
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
        grantedBy: grantedBy || "system",
      }));

      await RolePermission.insertMany(rolePermissions);
    }

    return { success: true, updatedCount: permissionIds.length };
  } catch (error) {
    console.error("Error updating role permissions:", error);
    return { success: false, error: (error as Error).message };
  }
};
