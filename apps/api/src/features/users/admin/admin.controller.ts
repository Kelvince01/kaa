import { Booking, Payment, Property, Role, User, UserRole } from "@kaa/models";
import type { IBooking, IPayment, IProperty } from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type { FilterQuery, SortOrder } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

/**
 * Calculate growth percentage and trend
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Object with percentage and trend
 */
const calculateGrowth = (
  current: number,
  previous: number
): { percentage: number; trend: "up" | "down" | "flat" } => {
  if (previous === 0) {
    return {
      percentage: current > 0 ? 100 : 0,
      trend: current > 0 ? "up" : "flat",
    };
  }

  const percentageChange = ((current - previous) / previous) * 100;
  const roundedPercentage = Math.round(percentageChange * 10) / 10;

  let trend: "up" | "down" | "flat" = "flat";
  if (roundedPercentage > 0) {
    trend = "up";
  } else if (roundedPercentage < 0) {
    trend = "down";
  }

  return {
    percentage: Math.abs(roundedPercentage),
    trend,
  };
};

export const adminController = new Elysia().group("admin", (app) =>
  app
    // .use(accessPlugin("admin", "read"))
    .use(authPlugin)
    .get(
      "/stats",
      async ({ query, set }) => {
        try {
          const { year, month, period, startDate, endDate } = query;

          // Determine date ranges based on filters
          let currentPeriodStart: Date;
          let currentPeriodEnd: Date;
          let previousPeriodStart: Date;
          let previousPeriodEnd: Date;

          const now = new Date();

          if (period === "custom" && startDate && endDate) {
            // Custom date range
            currentPeriodStart = new Date(startDate);
            currentPeriodEnd = new Date(endDate);

            // Calculate previous period with same duration
            const duration =
              currentPeriodEnd.getTime() - currentPeriodStart.getTime();
            previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
            previousPeriodStart = new Date(
              previousPeriodEnd.getTime() - duration
            );
          } else if (year && month) {
            // Specific year and month
            const yearNum = Number.parseInt(year, 10);
            const monthNum = Number.parseInt(month, 10);

            currentPeriodStart = new Date(yearNum, monthNum - 1, 1);
            currentPeriodEnd = new Date(yearNum, monthNum, 0, 23, 59, 59);

            // Previous month
            previousPeriodStart = new Date(yearNum, monthNum - 2, 1);
            previousPeriodEnd = new Date(yearNum, monthNum - 1, 0, 23, 59, 59);
          } else if (year) {
            // Specific year (full year stats)
            const yearNum = Number.parseInt(year, 10);

            currentPeriodStart = new Date(yearNum, 0, 1);
            currentPeriodEnd = new Date(yearNum, 11, 31, 23, 59, 59);

            // Previous year
            previousPeriodStart = new Date(yearNum - 1, 0, 1);
            previousPeriodEnd = new Date(yearNum - 1, 11, 31, 23, 59, 59);
          } else {
            // Default: current month
            currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            currentPeriodEnd = now;

            previousPeriodStart = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              1
            );
            previousPeriodEnd = new Date(
              now.getFullYear(),
              now.getMonth(),
              0,
              23,
              59,
              59
            );
          }
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
            totalPayments,
            completedPayments,
          ] = await Promise.all([
            User.countDocuments(),
            UserRole.countDocuments({
              roleId: (await Role.findOne({ name: "landlord" }))?._id,
            }),
            UserRole.countDocuments({
              roleId: (await Role.findOne({ name: "tenant" }))?._id,
            }),
            Property.countDocuments(),
            Property.countDocuments({ status: "active" }),
            Property.countDocuments({ status: "let" }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: "pending" }),
            Payment.countDocuments(),
            Payment.countDocuments({ status: "completed" }),
          ]);

          // Calculate revenue stats for the selected period
          const revenueStats = await Payment.aggregate([
            {
              $facet: {
                totalRevenue: [
                  { $match: { status: "completed" } },
                  { $group: { _id: null, total: { $sum: "$amount" } } },
                ],
                currentPeriodRevenue: [
                  {
                    $match: {
                      status: "completed",
                      completedAt: {
                        $gte: currentPeriodStart,
                        $lte: currentPeriodEnd,
                      },
                    },
                  },
                  { $group: { _id: null, total: { $sum: "$amount" } } },
                ],
                pendingRevenue: [
                  { $match: { status: "pending" } },
                  { $group: { _id: null, total: { $sum: "$amount" } } },
                ],
              },
            },
          ]);

          const revenue = {
            total: revenueStats[0]?.totalRevenue[0]?.total || 0,
            period: revenueStats[0]?.currentPeriodRevenue[0]?.total || 0,
            pending: revenueStats[0]?.pendingRevenue[0]?.total || 0,
          };

          // Get recent users
          const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select(
              "profile.firstName profile.lastName contact.email createdAt"
            );

          // Get recent properties
          const recentProperties = await Property.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("title location status createdAt media")
            .populate("landlord", "personalInfo");

          // Get recent bookings
          const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("property tenant createdAt")
            .populate("property", "title location media")
            .populate("tenant", "personalInfo");

          // Calculate growth trends using the filtered periods
          // Calculate user growth
          const [currentPeriodUsers, previousPeriodUsers] = await Promise.all([
            User.countDocuments({
              createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd },
            }),
            User.countDocuments({
              createdAt: {
                $gte: previousPeriodStart,
                $lte: previousPeriodEnd,
              },
            }),
          ]);
          const userGrowth = calculateGrowth(
            currentPeriodUsers,
            previousPeriodUsers
          );

          // Calculate property growth
          const [currentPeriodProperties, previousPeriodProperties] =
            await Promise.all([
              Property.countDocuments({
                createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd },
              }),
              Property.countDocuments({
                createdAt: {
                  $gte: previousPeriodStart,
                  $lte: previousPeriodEnd,
                },
              }),
            ]);
          const propertyGrowth = calculateGrowth(
            currentPeriodProperties,
            previousPeriodProperties
          );

          // Calculate booking growth
          const [currentPeriodBookings, previousPeriodBookings] =
            await Promise.all([
              Booking.countDocuments({
                createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd },
              }),
              Booking.countDocuments({
                createdAt: {
                  $gte: previousPeriodStart,
                  $lte: previousPeriodEnd,
                },
              }),
            ]);
          const bookingGrowth = calculateGrowth(
            currentPeriodBookings,
            previousPeriodBookings
          );

          // Calculate revenue growth
          const previousPeriodRevenueStats = await Payment.aggregate([
            {
              $match: {
                status: "completed",
                completedAt: {
                  $gte: previousPeriodStart,
                  $lte: previousPeriodEnd,
                },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]);
          const previousPeriodRevenue =
            previousPeriodRevenueStats[0]?.total || 0;
          const revenueGrowth = calculateGrowth(
            revenue.period,
            previousPeriodRevenue
          );

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
              payments: {
                total: totalPayments,
                completed: completedPayments,
                pending: totalPayments - completedPayments,
              },
              revenue: {
                total: revenue.total,
                period: revenue.period,
                pending: revenue.pending,
                growth: revenueGrowth,
              },
            },
            period: {
              current: {
                start: currentPeriodStart,
                end: currentPeriodEnd,
              },
              previous: {
                start: previousPeriodStart,
                end: previousPeriodEnd,
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
        query: t.Object({
          year: t.Optional(t.String()),
          month: t.Optional(t.String()),
          period: t.Optional(
            t.Union([
              t.Literal("custom"),
              t.Literal("daily"),
              t.Literal("monthly"),
              t.Literal("yearly"),
            ])
          ),
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        detail: {
          tags: ["admin"],
          summary: "Get dashboard stats with optional period filters",
          description:
            "Filter stats by year, month, or custom period. Examples: ?year=2024, ?year=2024&month=12, ?period=custom&startDate=2024-01-01&endDate=2024-12-31",
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
            .select("-password");

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
      async ({ params, body, set }) => {
        try {
          const { userId } = params;
          const { role } = body;

          const userObj = await UserRole.findByIdAndUpdate(
            userId,
            { roleId: role },
            { new: true }
          ).populate("userId", "profile contact");

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
            .populate("landlord", "personalInfo");

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
          ).populate("landlord", "personalInfo");

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
            .populate("property", "title location media")
            .populate("tenant", "personalInfo")
            .populate("landlord", "personalInfo");

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
      "/payments",
      async ({ query, set }) => {
        try {
          const {
            page = "1",
            limit = "20",
            status,
            type,
            search,
            sortBy = "createdAt",
            sortOrder = "desc",
          } = query;

          // Parse pagination params
          const pageNum = Number.parseInt(page, 10);
          const limitNum = Number.parseInt(limit, 10);
          const skip = (pageNum - 1) * limitNum;

          // Build filter
          const filter: FilterQuery<IPayment> = {};

          if (status) {
            filter.status = status;
          }

          if (type) {
            filter.type = type;
          }

          if (search) {
            filter.$or = [
              { referenceNumber: { $regex: search, $options: "i" } },
              { transactionId: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
            ];
          }

          // Build sort
          const sort: Record<string, SortOrder> = {};
          sort[sortBy] = sortOrder === "asc" ? 1 : -1;

          // Get payments with pagination
          const payments = await Payment.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate("property", "title location")
            .populate("tenant", "personalInfo")
            .populate("landlord", "personalInfo")
            .populate("booking", "startDate endDate");

          // Get total count for pagination
          const totalPayments = await Payment.countDocuments(filter);
          const totalPages = Math.ceil(totalPayments / limitNum);

          return {
            status: "success",
            items: payments,
            pagination: {
              total: totalPayments,
              pages: totalPages,
              page: pageNum,
              limit: limitNum,
            },
            message: "Payments fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get payments",
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          status: t.Optional(t.String()),
          type: t.Optional(t.String()),
          search: t.Optional(t.String()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
        }),
        detail: {
          tags: ["admin"],
          summary: "Get all payments",
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
