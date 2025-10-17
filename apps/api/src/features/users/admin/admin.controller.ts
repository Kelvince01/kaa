import { Booking, Property, Role, User } from "@kaa/models";
import type { IBooking, IProperty } from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type { FilterQuery, SortOrder } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

export const adminController = new Elysia().group("admin", (app) =>
  app
    // .use(accessPlugin("admin", "read"))
    .use(authPlugin)
    .get(
      "/stats",
      async ({ set }) => {
        try {
          // Get counts of different entities
          const [
            totalUsers,
            landlords,
            tenants,
            totalProperties,
            activeProperties,
            letProperties,
            totalBookings,
            pendingBookings,
          ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({
              role: (await Role.findOne({ name: "landlord" }))?._id,
            }),
            User.countDocuments({
              role: (await Role.findOne({ name: "tenant" }))?._id,
            }),
            Property.countDocuments(),
            Property.countDocuments({ status: "active" }),
            Property.countDocuments({ status: "let" }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: "pending" }),
          ]);

          // Get recent users
          const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("firstName lastName email role createdAt");

          // Get recent properties
          const recentProperties = await Property.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("title location status createdAt")
            .populate("landlord", "firstName lastName");

          // Get recent bookings
          const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("property tenant createdAt")
            .populate("property", "title location")
            .populate("tenant", "firstName lastName");

          // Calculate trend data (simplified for example)
          // In a real implementation, you would calculate this based on time periods
          const userGrowth = {
            percentage: 5.2,
            trend: "up",
          };

          const propertyGrowth = {
            percentage: 3.8,
            trend: "up",
          };

          const bookingGrowth = {
            percentage: 7.5,
            trend: "up",
          };

          // const cacheKey = "api:/api/v1/admin/stats";

          // // Try to get from cache
          // const cachedStats = await redisClient.get(cacheKey);
          // if (cachedStats) {
          // 	set.status = 200;
          // 	return {
          // 		status: "success",
          // 		data: JSON.parse(cachedStats),
          // 		message: "Dashboard stats fetched successfully",
          // 	};
          // }

          const statsData = {
            stats: {
              users: {
                total: totalUsers,
                landlords,
                tenants,
                growth: userGrowth,
              },
              properties: {
                total: totalProperties,
                active: activeProperties,
                let: letProperties,
                growth: propertyGrowth,
              },
              bookings: {
                total: totalBookings,
                pending: pendingBookings,
                growth: bookingGrowth,
              },
            },
            recentUsers,
            recentProperties,
            recentBookings,
          };

          // Cache the result
          // await redisClient.setEx(
          // 	cacheKey,
          // 	3600,
          // 	JSON.stringify({
          // 		status: "success",
          // 		...statsData,
          // 	})
          // );

          return {
            status: "success",
            ...statsData,
            message: "Dashboard stats fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get dashboard stats",
          };
        }
      },
      {
        detail: {
          tags: ["admin"],
          summary: "Get dashboard stats",
        },
      }
    )
    .get(
      "/users",
      async ({ query, set }) => {
        try {
          const {
            page = "1",
            limit = "20",
            role,
            search,
            sortBy = "createdAt",
            sortOrder = "desc",
          } = query;

          // Parse pagination params
          const pageNum = Number.parseInt(page, 10);
          const limitNum = Number.parseInt(limit, 10);
          const skip = (pageNum - 1) * limitNum;

          // Build filter
          const filter: Record<string, unknown> = {};

          if (role) {
            filter.role = role;
          }

          if (search) {
            filter.$or = [
              { firstName: { $regex: search, $options: "i" } },
              { lastName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ] as unknown as Record<string, unknown>;
          }

          // Build sort
          const sort: Record<string, SortOrder> = {};
          sort[sortBy] = sortOrder === "asc" ? 1 : -1;

          // Get users with pagination
          const users = await User.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select(
              "-password -refreshToken -verificationToken -passwordResetToken"
            );

          // Get total count for pagination
          const totalUsers = await User.countDocuments(filter);
          const totalPages = Math.ceil(totalUsers / limitNum);

          return {
            status: "success",
            items: users,
            pagination: {
              total: totalUsers,
              pages: totalPages,
              page: pageNum,
              limit: limitNum,
            },
            message: "Users fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get users",
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          role: t.Optional(t.String()),
          search: t.Optional(t.String()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
        }),
        detail: {
          tags: ["admin"],
          summary: "Get all users",
        },
      }
    )
    .patch(
      "/users/:userId/role",
      async ({ params, body, set, user }) => {
        try {
          const { userId } = params;
          const { role } = body;

          const userObj = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
          ).select("-password");

          if (!userObj) {
            set.status = 404;
            return {
              status: "error",
              message: "User not found",
            };
          }

          return {
            status: "success",
            data: user,
            message: "User role updated successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update user role",
          };
        }
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        body: t.Object({
          role: t.String(),
        }),
        detail: {
          tags: ["admin"],
          summary: "Update user role",
        },
      }
    )
    .patch(
      "/users/:userId/status",
      async ({ params, body, set }) => {
        try {
          const { userId } = params;
          const { active } = body;

          const userObj = await User.findByIdAndUpdate(
            userId,
            { active },
            { new: true }
          ).select("-password");

          if (!userObj) {
            set.status = 404;
            return {
              status: "error",
              message: "User not found",
            };
          }

          return {
            status: "success",
            data: userObj,
            message: `User ${active ? "activated" : "deactivated"} successfully`,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update user status",
          };
        }
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        body: t.Object({
          active: t.Boolean(),
        }),
        detail: {
          tags: ["admin"],
          summary: "Update user status",
        },
      }
    )
    .get(
      "/properties",
      async ({ query, set }) => {
        try {
          const {
            page = "1",
            limit = "20",
            status,
            approved,
            search,
            sortBy = "createdAt",
            sortOrder = "desc",
          } = query;

          // Parse pagination params
          const pageNum = Number.parseInt(page, 10);
          const limitNum = Number.parseInt(limit, 10);
          const skip = (pageNum - 1) * limitNum;

          // Build filter
          const filter: FilterQuery<IProperty> = {};

          if (status) {
            filter.status = status;
          }

          if (approved !== undefined) {
            filter.approved = approved === "true";
          }

          if (search) {
            filter.$or = [
              { title: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
              { "address.city": { $regex: search, $options: "i" } },
              { "address.postalCode": { $regex: search, $options: "i" } },
            ];
          }

          // Build sort
          const sort: Record<string, SortOrder> = {};
          sort[sortBy] = sortOrder === "asc" ? 1 : -1;

          // Get properties with pagination
          const properties = await Property.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate("landlord", "firstName lastName email");

          // Get total count for pagination
          const totalProperties = await Property.countDocuments(filter);
          const totalPages = Math.ceil(totalProperties / limitNum);

          return {
            status: "success",
            properties,
            pagination: {
              total: totalProperties,
              pages: totalPages,
              page: pageNum,
              limit: limitNum,
            },
            message: "Properties fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get properties",
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          status: t.Optional(t.String()),
          approved: t.Optional(t.String()),
          search: t.Optional(t.String()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
        }),
        detail: {
          tags: ["admin"],
          summary: "Get all properties",
        },
      }
    )
    .patch(
      "/properties/:propertyId/approval",
      async ({ params, body, set }) => {
        try {
          const { propertyId } = params;
          const { approved } = body;

          const propertyObj = await Property.findByIdAndUpdate(
            propertyId,
            {
              approved,
              ...(approved ? { status: "active" } : { status: "inactive" }),
            },
            { new: true }
          ).populate("landlord", "firstName lastName email");

          if (!propertyObj) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }
          // TODO: Send notification to property owner
          return {
            status: "success",
            data: propertyObj,
            message: "Property approval updated successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update property approval",
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        body: t.Object({
          approved: t.Boolean(),
        }),
        detail: {
          tags: ["admin"],
          summary: "Update property approval",
        },
      }
    )
    .get(
      "/bookings",
      async ({ query, set }) => {
        try {
          const {
            page = "1",
            limit = "20",
            status,
            sortBy = "createdAt",
            sortOrder = "desc",
          } = query;

          // Parse pagination params
          const pageNum = Number.parseInt(page, 10);
          const limitNum = Number.parseInt(limit, 10);
          const skip = (pageNum - 1) * limitNum;

          // Build filter
          const filter: FilterQuery<IBooking> = {};

          if (status) {
            filter.status = status;
          }

          // Build sort
          const sort: Record<string, SortOrder> = {};
          sort[sortBy] = sortOrder === "asc" ? 1 : -1;

          // Get bookings with pagination
          const bookings = await Booking.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate("property", "title location images")
            .populate("tenant", "firstName lastName email")
            .populate("landlord", "firstName lastName email");

          // Get total count for pagination
          const totalBookings = await Booking.countDocuments(filter);
          const totalPages = Math.ceil(totalBookings / limitNum);

          return {
            status: "success",
            items: bookings,
            pagination: {
              total: totalBookings,
              pages: totalPages,
              page: pageNum,
              limit: limitNum,
            },
            message: "Bookings fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get bookings",
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          status: t.Optional(t.String()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
        }),
        detail: {
          tags: ["admin"],
          summary: "Get all bookings",
        },
      }
    )
    .get(
      "/logs",
      ({ set }) => {
        try {
          // This is a placeholder for a real system logs implementation
          // In a real application, you would fetch logs from a database or log files

          const mockLogs = [
            {
              id: "1",
              timestamp: new Date(),
              level: "info",
              message: "User registration successful",
              metadata: { userId: "user123", email: "user@example.com" },
            },
            {
              id: "2",
              timestamp: new Date(Date.now() - 5 * 60 * 1000),
              level: "error",
              message: "Payment processing failed",
              metadata: { userId: "user456", amount: 750 },
            },
            {
              id: "3",
              timestamp: new Date(Date.now() - 15 * 60 * 1000),
              level: "warning",
              message: "Multiple failed login attempts",
              metadata: { userId: "user789", attempts: 5 },
            },
          ];

          return {
            status: "success",
            items: mockLogs,
            pagination: {
              total: mockLogs.length,
              pages: 1,
              page: 1,
              limit: 10,
            },
            message: "Logs fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get logs",
          };
        }
      },
      {
        detail: {
          tags: ["admin"],
          summary: "Get all logs",
        },
      }
    )
);
