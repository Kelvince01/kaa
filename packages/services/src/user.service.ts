import { User } from "@kaa/models";
import type { IUser } from "@kaa/models/types";
import { NotFoundError } from "@kaa/utils";
import mongoose, { type FilterQuery } from "mongoose";

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
