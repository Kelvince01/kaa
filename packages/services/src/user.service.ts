import { Member, Organization, User, VerificationToken } from "@kaa/models";
import type { IUser } from "@kaa/models/types";
import type {
  RegisterUserRequest,
  UserResponse,
  UserUpdate,
} from "@kaa/schemas";
import {
  BadRequestError,
  ConflictError,
  generateVerificationToken,
  logger,
  md5hash,
  NotFoundError,
} from "@kaa/utils";
import mongoose, { type FilterQuery } from "mongoose";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";
import { assignRole, getDefaultRoleId, getRoleByName } from "./role.service";

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
    return await User.findById(id);
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
  email?: string;
  username?: string;
  phone?: string;
}) => {
  try {
    return await User.findOne(query);
  } catch (error) {
    console.error("Error fetching user by query:", error);
    return null;
  }
};

export const getUsers = async (
  filter: UserFilter = {},
  options: PaginationOptions = {},
  _projection: UserProjection = { password: 0 }
) => {
  try {
    const { q, role, isActive, memberId, status } = filter;
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
    } = options;

    // Build query
    const query: FilterQuery<IUser> = {};

    // Apply filters
    if (q) {
      query.$or = [
        {
          firstName: { $regex: q, $options: "i" },
        },
        {
          lastName: { $regex: q, $options: "i" },
        },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    if (role) {
      query.role = new mongoose.Types.ObjectId(role);
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (memberId) {
      query.memberId = new mongoose.Types.ObjectId(memberId);
    }

    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const users = await User.find(query) // , projection
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password")
      .populate("role", "name")
      .populate("memberId", "name");

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
) => {
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
    } = body;

    // Create member
    const name = `${firstName} ${lastName}`;
    const slug = name.toLowerCase().replace(/\s+/g, "-");

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
        organization: org._id as mongoose.Types.ObjectId,
      });
      await member.save();
      memberId = member._id as mongoose.Types.ObjectId;

      // Check member limits
      if (member.usage.users >= member.limits.users) {
        throw new Error("User limit reached for this member"); // ValidationError
      }
    }

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

    const newUser = new User({
      slug,
      email,
      password,
      firstName,
      lastName,
      username,
      role: role ? userRole.id : defaultRoleId,
      phone,
      avatar: avatar || profileImage,
      isVerified,
      isActive,
      status: status || "pending",
    });

    if (role === "landlord") newUser.memberId = memberId;

    // Create verification token
    const { verificationToken, verificationExpires } =
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

    return {
      user: { ...newUser.toObject(), role: newUser.role.toString() },
      verificationToken,
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
      )
        .select("-password")
        .populate("role", "name")
        .populate("memberId", "name");

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
        username: user.username,
        email: user.email,
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
    user.passwordChangedAt = new Date();
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
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  } catch (error) {
    logger.error(`Failed to update last login for user with ID: ${userId}`, {
      error,
    });
    // Don't throw error as this is a non-critical operation
  }
};
