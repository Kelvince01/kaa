import {
  Member,
  Organization,
  User,
  UserRole,
  VerificationToken,
  Wallet,
} from "@kaa/models";
import {
  type IUser,
  type UserResponse as UserResponseType,
  UserStatus,
  WalletStatus,
} from "@kaa/models/types";
import type {
  RegisterUserRequest,
  UserResponse,
  UserUpdate,
} from "@kaa/schemas";
import {
  BadRequestError,
  ConflictError,
  formatKenyanPhone,
  generateVerificationToken,
  logger,
  md5hash,
  NotFoundError,
} from "@kaa/utils";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";
import { memberService } from "..";
import { notificationService } from "../comms/notification.service";
import { auditService } from "../misc/audit.service";
import roleService, {
  assignRole,
  getDefaultRoleId,
  getRoleByName,
} from "../rbac/role.service";

type UserFilter = {
  q?: string;
  role?: string;
  isActive?: boolean;
  memberId?: string;
  status?: string;
};

type PaginationOptions = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

type UserProjection = {
  [key: string]: 0 | 1;
};

const findOne = async (id: string) => {
  try {
    return await User.findById(id).select("-password");
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await findOne(id);
    if (user) {
      return user;
    }
    throw new NotFoundError("User not found");
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const getUserBy = async (query: {
  "contact.email"?: string;
  "profile.displayName"?: string;
  "contact.phone.formatted"?: string;
}) => {
  try {
    return await User.findOne(query);
  } catch (error) {
    console.error("Error fetching user by query:", error);
    return null;
  }
};

/**
 * Check if user exists
 */
export async function userExists(
  email: string,
  phone?: string
): Promise<boolean> {
  const query: any = { "contact.email": email.toLowerCase() };
  if (phone) {
    query.$or = [
      { "contact.email": email.toLowerCase() },
      { "contact.phone.formatted": phone },
    ];
  }

  const user = await User.findOne(query);
  return !!user;
}

/**
 * Verify user credentials
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<IUser | null> {
  const user = await User.findOne({
    "contact.email": email.toLowerCase(),
  }).select("+password");
  if (!(user && (await user.comparePassword(password)))) {
    return null;
  }
  return user;
}

/**
 * Update user activity
 */
export async function updateActivity(
  userId: string,
  ip?: string
): Promise<void> {
  const user = await User.findById(userId);
  if (user) {
    user.activity.lastLogin = new Date();
    user.activity.lastActivity = new Date();
    user.activity.lastLoginIP = ip;
    user.activity.loginAttempts += 1;
    await user.save();
  }
}

/**
 * Update user verification status
 */
export async function updateVerification(
  userId: string,
  type: "email" | "phone" | "identity",
  verifiedAt = new Date()
): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user) return false;

  switch (type) {
    case "email":
      user.verification.emailVerifiedAt = verifiedAt;
      break;
    case "phone":
      user.verification.phoneVerifiedAt = verifiedAt;
      break;
    case "identity":
      user.verification.identityVerifiedAt = verifiedAt;
      break;
    default:
      return false;
  }

  // Check if user should be activated
  if (
    user.verification.emailVerifiedAt &&
    user.verification.phoneVerifiedAt &&
    user.status === UserStatus.PENDING
  ) {
    user.status = UserStatus.ACTIVE;
  }

  await user.save();
  return true;
}

export const getUsers = async (
  filter: UserFilter = {},
  options: PaginationOptions = {},
  _projection: UserProjection = { password: 0 }
) => {
  try {
    const { q, role, memberId, status } = filter;
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
    } = options;

    // Build query
    const query: FilterQuery<IUser> = {
      status: UserStatus.ACTIVE,
      "verification.emailVerifiedAt": { $ne: null },
      // "verification.phoneVerifiedAt": { $ne: null },
    };

    // Apply filters
    if (q) {
      query.$or = [
        {
          "profile.firstName": { $regex: q, $options: "i" },
        },
        {
          "profile.lastName": { $regex: q, $options: "i" },
        },
        { "contact.email": { $regex: q, $options: "i" } },
      ];
    }

    // if (role) {
    //   query.role = new mongoose.Types.ObjectId(role);
    // }

    // if (memberId) {
    //   query.memberId = new mongoose.Types.ObjectId(memberId);
    // }

    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const users = await User.find(query) // , projection
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password");

    // Get total count for pagination
    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      users: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    };
  }
};

export const createUser = async (
  { body }: { body: RegisterUserRequest },
  isOAuth = false
): Promise<{ user: UserResponseType; verificationToken: string }> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      avatar,
      isVerified,
      isActive,
      status,
      county,
      estate,
      acceptTerms,
    } = body;

    // Create member
    const name = `${firstName} ${lastName}`;
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
    const emailHash = md5hash(email);
    const profileImage = `https://www.gravatar.com/avatar/${emailHash}?d=identicon`;

    const defaultRoleId = await getDefaultRoleId();
    if (!defaultRoleId) {
      throw new Error("Default role not found");
    }

    const userRole = await getRoleByName(role);
    if (!userRole) {
      throw new Error("Role not found");
    }

    // Format phone number
    const formattedPhone = formatKenyanPhone(phone);
    if (!formattedPhone) {
      throw new Error("Invalid phone number");
    }

    const newUser = new User({
      slug,
      "contact.email": email,
      "contact.phone": formattedPhone,
      password,
      "profile.firstName": firstName,
      "profile.lastName": lastName,
      "profile.displayName": username,
      "profile.avatar": avatar || profileImage,
      "verification.emailVerified": isVerified,
      status: status || "pending",
      addresses:
        county && estate
          ? [
              {
                type: "residential",
                // line1: estate,
                // postalCode: "00100"
                // town: county,
                county,
                estate,
                address: `${estate}, ${county}`,
                isPrimary: true,
              },
            ]
          : [],
    });

    const userRoleObj = await UserRole.create({
      userId: newUser._id,
      roleId: role ? userRole.id : defaultRoleId,
    });

    let memberId: any | null = null;
    let member: any | null = null;
    if (role === "landlord") {
      const org = await Organization.create({
        name,
        slug,
        type: "landlord",
        phone,
        email,
      });

      member = new Member({
        name,
        slug,
        role: userRoleObj.roleId as mongoose.Types.ObjectId,
        organization: org._id as mongoose.Types.ObjectId,
        user: newUser._id as mongoose.Types.ObjectId,
      });
      await member.save();
      memberId = member._id as mongoose.Types.ObjectId;

      // Check member limits
      if (member.usage.users >= member.limits.users) {
        throw new Error("User limit reached for this member"); // ValidationError
      }
    }

    // Create verification token
    const { verificationTokenHex, verificationToken, verificationExpires } =
      generateVerificationToken();

    if (!isOAuth) {
      await VerificationToken.create({
        user: newUser._id,
        token: verificationToken,
        purpose: "email-verification",
        expiresAt: verificationExpires,
      });
    }

    await newUser.save({ validateBeforeSave: false });

    // Update member usage
    if (role === "landlord") {
      member.usage.users += 1;
      await member.save();
    }

    if (role === "tenant") {
      // Create wallet for new user
      await Wallet.create({
        userId: newUser._id as mongoose.Types.ObjectId,
        balance: {
          available: 0,
          pending: 0,
          reserved: 0,
          total: 0,
        },
        status: WalletStatus.ACTIVE,
      });
    }

    await assignRole(
      (newUser._id as mongoose.Types.ObjectId).toString(),
      role ? userRole.id : defaultRoleId,
      memberId ? memberId.toString() : null
    );

    // Send welcome notification
    await notificationService.sendNotification(
      (newUser._id as mongoose.Types.ObjectId).toString(),
      {
        type: "welcome",
        title: "Welcome to the team!",
        message:
          "Your account has been created. Please check your email for login instructions.",
        channels: ["in_app"],
      },
      memberId ? memberId.toString() : null
    );

    // Track event
    await auditService.trackEvent({
      memberId,
      userId: (newUser._id as mongoose.Types.ObjectId).toString(),
      type: "user_created",
      category: "user",
      action: "create",
      properties: {
        targetUserId: (newUser._id as mongoose.Types.ObjectId).toString(),
        targetUserEmail: email,
      },
    });

    logger.info("New user signed up", { userId: newUser._id, memberId });

    // Convert to response format
    const userResponse: UserResponseType = {
      id: (newUser._id as mongoose.Types.ObjectId).toString(),
      email: newUser.contact.email,
      phone: newUser.contact.phone.formatted,
      firstName: newUser.profile.firstName,
      lastName: newUser.profile.lastName,
      fullName: newUser.fullName,
      username: newUser.profile.displayName,
      memberId: memberId ? memberId.toString() : undefined,
      bio: newUser.profile.bio,
      avatar: newUser.profile.avatar,
      role: userRole.name,
      status: newUser.status,
      emailVerified: newUser.verification.emailVerifiedAt !== undefined,
      phoneVerified: newUser.verification.phoneVerifiedAt !== undefined,
      identityVerified: newUser.verification.identityVerifiedAt !== undefined,
      kycStatus: newUser.verification.kycStatus,
      county: newUser.addresses.find((addr) => addr.isPrimary)?.county,
      estate: newUser.addresses.find((addr) => addr.isPrimary)?.estate,
      preferences: newUser.preferences,
      stats: newUser.stats,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return {
      user: userResponse,
      verificationToken: verificationTokenHex,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async ({
  body,
  params: { id },
}: {
  body: UserUpdate;
  params: { id: string };
}) => {
  try {
    // Don't allow updating password here
    if ("password" in body) {
      throw new BadRequestError(
        "Use change password endpoint to update password"
      );
    }

    // Check if email is being updated and if it's already in use
    if (body.email) {
      const existingUser = await User.findOne({
        email: body.email,
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new ConflictError("Email already in use");
      }
    }

    const existingUser = await findOne(id);

    /*
		// Fields that can be updated
		const allowedUpdates = ["firstName", "lastName", "phone", "avatar", "address", "mpesaNumber"];

		// Apply updates to allowed fields only
		for (const key of Object.keys(updates)) {
			if (allowedUpdates.includes(key)) {
				(user as any)[key] = updates[key];
			}
		}
		*/

    if (existingUser) {
      const user = await User.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return user;
    }
    throw new NotFoundError("User not found");
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  try {
    const user = await findOne(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user) {
      await User.findByIdAndDelete(id);

      const userRes: Pick<UserResponse, "id" | "username" | "email"> = {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        username: user.profile.displayName || "",
        email: user.contact.email,
      };

      return userRes;
    }
    throw new NotFoundError("User not found");
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

/**
 * Change user password
 */
export const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string
) => {
  try {
    const user = await User.findById(id).select("+password");

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestError("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    user.activity.passwordChangedAt = new Date();
    await user.save();

    return { success: true };
  } catch (error) {
    logger.error(`Failed to change password for user with ID: ${id}`, {
      error,
    });
    throw error;
  }
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (userId: string) => {
  try {
    await User.findByIdAndUpdate(userId, { "activity.lastLogin": new Date() });
  } catch (error) {
    logger.error(`Failed to update last login for user with ID: ${userId}`, {
      error,
    });
    // Don't throw error as this is a non-critical operation
  }
};

/**
 * Get landlords in a specific county
 */
export async function getLandlordsByCounty(
  county: string,
  limit = 10
): Promise<IUser[]> {
  return await User.find({
    // "role.name": "landlord",
    status: UserStatus.ACTIVE,
    "addresses.county": county,
    "addresses.isPrimary": true,
  })
    .limit(limit)
    .sort({ "stats.averageRating": -1 });
}

/**
 * Get user stats summary
 */
export async function getUserStats(userId: string): Promise<any> {
  const user = await User.findById(userId);
  if (!user) return null;

  return {
    profile: {
      verified:
        user.verification.emailVerifiedAt && user.verification.phoneVerifiedAt,
      kycStatus: user.verification.kycStatus,
      joinDate: user.createdAt,
      lastActive: user.activity.lastActivity,
    },
    stats: user.stats || {},
    social: {
      followers: user.connections?.followers.length || 0,
      following: user.connections?.following.length || 0,
    },
  };
}

/**
 * Get recently active users
 */
export async function getRecentlyActiveUsers(limit = 10): Promise<IUser[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Last 30 days

  return await User.find({
    status: UserStatus.ACTIVE,
    "activity.lastActivity": { $gte: cutoffDate },
  })
    .limit(limit)
    .sort({ "activity.lastActivity": -1 });
}

/**
 * Update user statistics
 */
export async function updateUserStats(
  userId: string,
  statsUpdate: Partial<any>
): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user) return false;

  if (!user.stats) {
    user.stats = {
      totalProperties: 0,
      activeListings: 0,
      totalApplications: 0,
      totalTenants: 0,
      totalEarnings: 0,
      averageRating: 0,
      totalReviews: 0,
    };
  }

  Object.assign(user.stats, statsUpdate);
  await user.save();
  return true;
}

/**
 * Follow/Unfollow user
 */
export async function followUser(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  if (followerId === followeeId) return false;

  const [follower, followee] = await Promise.all([
    User.findById(followerId),
    User.findById(followeeId),
  ]);

  if (!(follower && followee)) return false;

  // Initialize connections if not exist
  if (!follower.connections)
    follower.connections = { followers: [], following: [] };
  if (!followee.connections)
    followee.connections = { followers: [], following: [] };

  // Check if already following
  const isAlreadyFollowing = follower.connections.following.includes(
    followeeId as any
  );

  if (isAlreadyFollowing) {
    // Unfollow
    follower.connections.following = follower.connections.following.filter(
      (id) => id.toString() !== followeeId
    );
    followee.connections.followers = followee.connections.followers.filter(
      (id) => id.toString() !== followerId
    );
  } else {
    // Follow
    follower.connections.following.push(followeeId as any);
    followee.connections.followers.push(followerId as any);
  }

  await Promise.all([follower.save(), followee.save()]);
  return !isAlreadyFollowing; // Return true if followed, false if unfollowed
}

/**
 * Get user followers
 */
export async function getUserFollowers(
  userId: string,
  limit = 10
): Promise<IUser[]> {
  const user = await User.findById(userId);
  if (!user?.connections?.followers) return [];

  return await User.find({
    _id: { $in: user.connections.followers },
    status: UserStatus.ACTIVE,
  })
    .limit(limit)
    .select(
      "profile contact verification.emailVerifiedAt verification.phoneVerifiedAt"
    );
}

/**
 * Get user following
 */
export async function getUserFollowing(
  userId: string,
  limit = 10
): Promise<IUser[]> {
  const user = await User.findById(userId);
  if (!user?.connections?.following) return [];

  return await User.find({
    _id: { $in: user.connections.following },
    status: UserStatus.ACTIVE,
  })
    .limit(limit)
    .select(
      "profile contact role verification.emailVerifiedAt verification.phoneVerifiedAt"
    );
}

/**
 * Get user dashboard data
 */
export async function getUserDashboardData(userId: string): Promise<any> {
  const user = await User.findById(userId);

  if (!user) return null;

  const baseData = {
    profile: {
      id: user._id,
      name: user.fullName,
      email: user.contact.email,
      phone: user.contact.phone.formatted,
      avatar: user.profile.avatar,
      // role: user.role,
      verified:
        user.verification.emailVerifiedAt && user.verification.phoneVerifiedAt,
      kycStatus: user.verification.kycStatus,
    },
    activity: {
      lastLogin: user.activity.lastLogin,
      loginAttempts: user.activity.loginAttempts,
      joinDate: user.createdAt,
    },
  };

  const userRole = await roleService.getUserRoleBy({
    userId: (user._id as mongoose.Types.ObjectId).toString(),
  });

  // Role-specific data
  if (
    (userRole?.roleId as any).name === "landlord" ||
    (userRole?.roleId as any).name === "agent"
  ) {
    return {
      ...baseData,
      stats: user.stats,
      // Could add more landlord-specific data here
    };
  }

  return baseData;
}

/**
 * Update user verification status (admin only)
 */
export async function updateVerificationStatus(
  userId: string,
  verificationData: {
    emailVerified?: Date;
    phoneVerified?: Date;
    identityVerified?: Date;
    kycStatus?: string;
    rejectionReason?: string;
  },
  adminId: string
): Promise<{
  success: boolean;
  data?: UserResponseType;
  error?: string;
  message: string;
}> {
  try {
    const user = await User.findById(userId).populate("role", "name");
    if (!user) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found",
      };
    }

    // Update verification fields
    if (verificationData.emailVerified !== undefined) {
      user.verification.emailVerifiedAt = verificationData.emailVerified;
    }
    if (verificationData.phoneVerified !== undefined) {
      user.verification.phoneVerifiedAt = verificationData.phoneVerified;
    }
    if (verificationData.identityVerified !== undefined) {
      user.verification.identityVerifiedAt = verificationData.identityVerified;
    }
    if (verificationData.kycStatus) {
      user.verification.kycStatus = verificationData.kycStatus as any;
      if (verificationData.kycStatus === "verified") {
        user.verification.kycData = user.verification.kycData || ({} as any);
        (user.verification.kycData as any).verificationDate = new Date();
        (user.verification.kycData as any).verifiedBy = adminId;
      }
    }
    if (verificationData.rejectionReason) {
      user.verification.kycData = user.verification.kycData || ({} as any);
      (user.verification.kycData as any).rejectionReason =
        verificationData.rejectionReason;
    }

    // Update user status if fully verified
    if (
      user.verification.emailVerifiedAt &&
      user.verification.phoneVerifiedAt &&
      user.verification.kycStatus === "verified" &&
      user.status === UserStatus.PENDING
    ) {
      user.status = UserStatus.ACTIVE;
    }

    await user.save();

    const member = await memberService.getMemberBy({
      user: (user._id as mongoose.Types.ObjectId).toString(),
    });
    const userRole = await roleService.getUserRoleBy({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
    });

    const userResponse: UserResponseType = {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.contact.email,
      phone: user.contact.phone.formatted,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      fullName: user.fullName,
      username: user.profile.displayName,
      memberId: member
        ? (member._id as mongoose.Types.ObjectId).toString()
        : undefined,
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      role: (userRole?.roleId as any).name,
      status: user.status,
      emailVerified: user.verification.emailVerifiedAt !== undefined,
      phoneVerified: user.verification.phoneVerifiedAt !== undefined,
      identityVerified: user.verification.identityVerifiedAt !== undefined,
      kycStatus: user.verification.kycStatus,
      county: user.addresses.find((addr) => addr.isPrimary)?.county,
      estate: user.addresses.find((addr) => addr.isPrimary)?.estate,
      preferences: user.preferences,
      stats: user.stats,
      lastLogin: user.activity.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      success: true,
      data: userResponse,
      message: "Verification status updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating verification status:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message || "Failed to update verification status",
    };
  }
}
