// import { accessPlugin } from "~/features/rbac/rbac.plugin";
import { Booking, Payment, Property, Review, User } from "@kaa/models";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { analyticsService } from "./analytics.service";
import { marketIntelligenceService } from "./market-intelligence.service";

export const analyticsController = new Elysia().group("analytics", (app) =>
  app
    // .use(accessPlugin("analytics", "read"))
    .use(authPlugin)
    .get(
      "/stats",
      async ({ set }) => {
        try {
          // Get counts
          const propertyCount = await Property.countDocuments();
          const bookingCount = await Booking.countDocuments();
          const userCount = await User.countDocuments();
          const pendingReviewCount = await Review.countDocuments({
            status: "pending",
          });

          // Get revenue stats
          const payments = await Payment.find({ status: "completed" });
          const totalRevenue = payments.reduce(
            (sum, payment) => sum + payment.amount,
            0
          );

          // Get recent bookings
          const recentBookings = await Booking.find()
            .sort("-createdAt")
            .limit(5)
            .populate("property", "title media")
            .populate("tenant", "personalInfo.firstName personalInfo.lastName");

          // Get property stats by type
          const propertyTypeStats = await Property.aggregate([
            {
              $group: {
                _id: "$type",
                count: { $sum: 1 },
              },
            },
          ]);

          // Get user stats by role
          const userRoleStats = await User.aggregate([
            {
              $group: {
                _id: "$role",
                count: { $sum: 1 },
              },
            },
          ]);

          const data = {
            counts: {
              properties: propertyCount,
              bookings: bookingCount,
              users: userCount,
              pendingReviews: pendingReviewCount,
            },
            revenue: {
              total: totalRevenue,
            },
            recentBookings,
            propertyTypeStats,
            userRoleStats,
          };

          return {
            status: "success",
            data,
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
          tags: ["analytics"],
          summary: "Get dashboard stats",
        },
      }
    )
    .get(
      "/users",
      async ({ query, set }) => {
        try {
          // User role distribution
          const roleDistribution = await User.aggregate([
            {
              $group: {
                _id: "$role",
                count: { $sum: 1 },
              },
            },
          ]);

          // User growth over time
          const { period = "monthly", year = new Date().getFullYear() } = query;

          let userGrowth: any;

          if (period === "monthly") {
            // Monthly user growth for a specific year
            userGrowth = await User.aggregate([
              {
                $match: {
                  createdAt: {
                    $gte: new Date(Number(year), 0, 1),
                    $lt: new Date(Number(year) + 1, 0, 1),
                  },
                },
              },
              {
                $group: {
                  _id: { $month: "$createdAt" },
                  count: { $sum: 1 },
                  roles: {
                    $push: "$role",
                  },
                },
              },
              { $sort: { _id: 1 } },
            ]);
          } else if (period === "yearly") {
            // Yearly user growth
            userGrowth = await User.aggregate([
              {
                $group: {
                  _id: { $year: "$createdAt" },
                  count: { $sum: 1 },
                  roles: {
                    $push: "$role",
                  },
                },
              },
              { $sort: { _id: 1 } },
            ]);
          }

          // Process role counts
          const formattedGrowth = userGrowth?.map((item: any) => {
            const roleCounts = {
              tenant: 0,
              landlord: 0,
              admin: 0,
            };

            for (const role of item.roles) {
              if (role in roleCounts) {
                roleCounts[role as keyof typeof roleCounts]++;
              }
            }

            return {
              period: item._id,
              total: item.count,
              roleCounts,
            };
          });

          // Most active users (landlords with most properties)
          const mostActiveLandlords = await Property.aggregate([
            {
              $group: {
                _id: "$landlord",
                propertyCount: { $sum: 1 },
              },
            },
            { $sort: { propertyCount: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $project: {
                _id: "$user._id",
                firstName: "$user.firstName",
                lastName: "$user.lastName",
                email: "$user.email",
                propertyCount: 1,
              },
            },
          ]);

          // Most active tenants (tenants with most bookings)
          const mostActiveTenants = await Booking.aggregate([
            {
              $group: {
                _id: "$tenant",
                bookingCount: { $sum: 1 },
              },
            },
            { $sort: { bookingCount: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "tenants",
                localField: "_id",
                foreignField: "_id",
                as: "tenant",
              },
            },
            { $unwind: "$tenant" },
            {
              $project: {
                _id: "$tenant._id",
                firstName: "$tenant.personalInfo.firstName",
                lastName: "$tenant.personalInfo.lastName",
                email: "$tenant.personalInfo.email",
                bookingCount: 1,
              },
            },
          ]);

          return {
            status: "success",
            data: {
              roleDistribution,
              userGrowth: formattedGrowth,
              mostActiveLandlords,
              mostActiveTenants,
            },
            message: "Users analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get users analytics",
          };
        }
      },
      {
        query: t.Object({
          period: t.String(),
          year: t.Number(),
        }),
        detail: {
          tags: ["analytics"],
          summary: "Get users analytics",
        },
      }
    )
    .get(
      "/properties",
      async ({ set }) => {
        try {
          // Property type distribution
          const propertyTypeDistribution = await Property.aggregate([
            {
              $group: {
                _id: "$type",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ]);

          // Listing type distribution
          const listingTypeDistribution = await Property.aggregate([
            {
              $group: {
                _id: "$listingType",
                count: { $sum: 1 },
              },
            },
          ]);

          // County distribution
          const countyDistribution = await Property.aggregate([
            {
              $group: {
                _id: "$location.county",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]);

          // Price ranges
          const priceRanges = await Property.aggregate([
            {
              $facet: {
                rent: [
                  { $match: { listingType: "rent" } },
                  {
                    $bucket: {
                      groupBy: "$pricing.rent",
                      boundaries: [
                        0, 10_000, 25_000, 50_000, 100_000, 200_000, 500_000,
                      ],
                      default: "Above 500K",
                      output: {
                        count: { $sum: 1 },
                      },
                    },
                  },
                ],
                sale: [
                  { $match: { listingType: "sale" } },
                  {
                    $bucket: {
                      groupBy: "$pricing.rent",
                      boundaries: [
                        0, 1_000_000, 5_000_000, 10_000_000, 20_000_000,
                        50_000_000,
                      ],
                      default: "Above 50M",
                      output: {
                        count: { $sum: 1 },
                      },
                    },
                  },
                ],
              },
            },
          ]);

          // Most viewed properties
          const mostViewedProperties = await Property.find()
            .sort("-stats.views")
            .limit(10)
            .select(
              "title location.address.town pricing.rent stats.views type listingType media"
            );

          // Most booked properties
          const mostBookedProperties = await Booking.aggregate([
            {
              $group: {
                _id: "$property",
                bookingCount: { $sum: 1 },
              },
            },
            { $sort: { bookingCount: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "properties",
                localField: "_id",
                foreignField: "_id",
                as: "property",
              },
            },
            { $unwind: "$property" },
            {
              $project: {
                _id: "$property._id",
                title: "$property.title",
                city: "$property.location.address.town",
                price: "$property.pricing.rent",
                type: "$property.type",
                listingType: "$property.listingType",
                bookingCount: 1,
              },
            },
          ]);

          return {
            status: "success",
            data: {
              propertyTypeDistribution,
              listingTypeDistribution,
              countyDistribution,
              priceRanges: priceRanges[0],
              mostViewedProperties,
              mostBookedProperties,
            },
            message: "Properties analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get properties analytics",
          };
        }
      },
      {
        detail: {
          tags: ["analytics"],
          summary: "Get properties analytics",
        },
      }
    )
    .get(
      "/bookings",
      async ({ query, set }) => {
        try {
          const {
            period = "monthly",
            year = new Date().getFullYear(),
            month,
          } = query;

          let bookingData: any;

          if (period === "daily" && month) {
            // Daily bookings for a specific month
            bookingData = await Booking.aggregate([
              {
                $match: {
                  createdAt: {
                    $gte: new Date(Number(year), Number(month) - 1, 1),
                    $lt: new Date(Number(year), Number(month), 0),
                  },
                },
              },
              {
                $group: {
                  _id: { $dayOfMonth: "$createdAt" },
                  count: { $sum: 1 },
                  statusCounts: {
                    $push: "$status",
                  },
                },
              },
              { $sort: { _id: 1 } },
            ]);
          } else if (period === "monthly") {
            // Monthly bookings for a specific year
            bookingData = await Booking.aggregate([
              {
                $match: {
                  createdAt: {
                    $gte: new Date(Number(year), 0, 1),
                    $lt: new Date(Number(year) + 1, 0, 1),
                  },
                },
              },
              {
                $group: {
                  _id: { $month: "$createdAt" },
                  count: { $sum: 1 },
                  statusCounts: {
                    $push: "$status",
                  },
                },
              },
              { $sort: { _id: 1 } },
            ]);
          } else if (period === "yearly") {
            // Yearly bookings
            bookingData = await Booking.aggregate([
              {
                $group: {
                  _id: { $year: "$createdAt" },
                  count: { $sum: 1 },
                  statusCounts: {
                    $push: "$status",
                  },
                },
              },
              { $sort: { _id: 1 } },
            ]);
          }

          // Process status counts
          const formattedData = bookingData?.map((item: any) => {
            const statusCounts = {
              pending: 0,
              approved: 0,
              rejected: 0,
              cancelled: 0,
              completed: 0,
            };

            for (const status of item.statusCounts) {
              if (status in statusCounts) {
                statusCounts[status as keyof typeof statusCounts]++;
              }
            }

            return {
              period: item._id,
              total: item.count,
              statusCounts,
            };
          });

          return {
            status: "success",
            data: formattedData,
            message: "Bookings analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get bookings analytics",
          };
        }
      },
      {
        query: t.Object({
          period: t.String(),
          year: t.Number(),
          month: t.Number(),
        }),
        detail: {
          tags: ["analytics"],
          summary: "Get bookings analytics",
        },
      }
    )
    .get(
      "/revenue",
      async ({ query, set }) => {
        try {
          const {
            period = "monthly",
            year = new Date().getFullYear(),
            month,
          } = query;

          let revenueData: any;

          if (period === "daily" && month) {
            // Daily revenue for a specific month
            revenueData = await Payment.aggregate([
              {
                $match: {
                  status: "completed",
                  createdAt: {
                    $gte: new Date(Number(year), Number(month) - 1, 1),
                    $lt: new Date(Number(year), Number(month), 0),
                  },
                },
              },
              {
                $group: {
                  _id: { $dayOfMonth: "$createdAt" },
                  revenue: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ]);
          } else if (period === "monthly") {
            // Monthly revenue for a specific year
            revenueData = await Payment.aggregate([
              {
                $match: {
                  status: "completed",
                  createdAt: {
                    $gte: new Date(Number(year), 0, 1),
                    $lt: new Date(Number(year) + 1, 0, 1),
                  },
                },
              },
              {
                $group: {
                  _id: { $month: "$createdAt" },
                  revenue: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ]);
          } else if (period === "yearly") {
            // Yearly revenue
            revenueData = await Payment.aggregate([
              {
                $match: {
                  status: "completed",
                },
              },
              {
                $group: {
                  _id: { $year: "$createdAt" },
                  revenue: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ]);
          }

          // Format data for charts
          const formattedData = revenueData?.map((item: any) => ({
            period: item._id,
            revenue: item.revenue,
            count: item.count,
          }));

          return {
            status: "success",
            data: formattedData,
            message: "Revenue analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get revenue analytics",
          };
        }
      },
      {
        query: t.Object({
          period: t.String(),
          year: t.Number(),
          month: t.Number(),
        }),
        detail: {
          tags: ["analytics"],
          summary: "Get revenue analytics",
        },
      }
    )
    // Event Tracking Endpoint
    .post(
      "/track-event",
      async ({ body, set, user }) => {
        try {
          const eventData = {
            ...body,
            userId: user.id,
            timestamp: new Date(),
          };

          await analyticsService.trackEvent(eventData);

          return {
            status: "success",
            message: "Event tracked successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message || "Failed to track event",
          };
        }
      },
      {
        body: t.Object({
          event: t.String(),
          step: t.Optional(t.String()),
          field: t.Optional(t.String()),
          value: t.Optional(t.Any()),
          sessionId: t.String(),
          metadata: t.Optional(t.Record(t.String(), t.Any())),
        }),
        detail: {
          tags: ["analytics"],
          summary: "Track analytics event",
        },
      }
    )
    .get(
      "/form-analytics/:sessionId",
      async ({ params, set }) => {
        try {
          const analytics = await analyticsService.getFormAnalytics(
            params.sessionId
          );

          return {
            status: "success",
            data: analytics,
            message: "Form analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message || "Failed to get form analytics",
          };
        }
      },
      {
        params: t.Object({
          sessionId: t.String(),
        }),
        detail: {
          tags: ["analytics"],
          summary: "Get form analytics for a session",
        },
      }
    )
    .get(
      "/user-behavior",
      async ({ set, user }) => {
        try {
          const behavior = await analyticsService.getUserBehavior(user.id);

          return {
            status: "success",
            data: behavior,
            message: "User behavior analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              (error as Error).message ||
              "Failed to get user behavior analytics",
          };
        }
      },
      {
        detail: {
          tags: ["analytics"],
          summary: "Get user behavior patterns",
        },
      }
    )
    // Property Analytics Endpoints
    .get(
      "/property-performance/:propertyId",
      async ({ params, set, user }) => {
        try {
          if (!user?.id) {
            set.status = 401;
            return {
              status: "error",
              message: "Unauthorized access",
            };
          }

          const performance = await analyticsService.getPropertyPerformance(
            params.propertyId,
            user.id.toString()
          );

          return {
            status: "success",
            data: performance,
            message: "Property performance analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              (error as Error).message ||
              "Failed to get property performance analytics",
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        detail: {
          tags: ["analytics"],
          summary: "Get property performance analytics",
        },
      }
    )
    .get(
      "/financial/:timeframe?",
      async ({ params, set, user }) => {
        try {
          if (!user?.id) {
            set.status = 401;
            return {
              status: "error",
              message: "Unauthorized access",
            };
          }

          const timeframe =
            (params.timeframe as "month" | "quarter" | "year") || "month";
          const analytics = await analyticsService.getFinancialAnalytics(
            user.id.toString(),
            timeframe
          );

          return {
            status: "success",
            data: analytics,
            message: "Financial analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              (error as Error).message || "Failed to get financial analytics",
          };
        }
      },
      {
        params: t.Object({
          timeframe: t.Optional(t.String()),
        }),
        detail: {
          tags: ["analytics"],
          summary: "Get financial analytics",
        },
      }
    )
    .get(
      "/portfolio",
      async ({ set, user }) => {
        try {
          if (!user?.id) {
            set.status = 401;
            return {
              status: "error",
              message: "Unauthorized access",
            };
          }

          const analytics = await analyticsService.getPortfolioAnalytics(
            user.id.toString()
          );

          return {
            status: "success",
            data: analytics,
            message: "Portfolio analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              (error as Error).message || "Failed to get portfolio analytics",
          };
        }
      },
      {
        detail: {
          tags: ["analytics"],
          summary: "Get portfolio analytics",
        },
      }
    )
    .get(
      "/dashboard",
      async ({ set, user }) => {
        try {
          if (!user?.id) {
            set.status = 401;
            return {
              status: "error",
              message: "Unauthorized access",
            };
          }

          const analytics = await analyticsService.getMemberDashboardAnalytics(
            user.id.toString()
          );

          return {
            status: "success",
            data: analytics,
            message: "Dashboard analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              (error as Error).message || "Failed to get dashboard analytics",
          };
        }
      },
      {
        detail: {
          tags: ["analytics"],
          summary: "Get member dashboard analytics",
        },
      }
    )
    .get(
      "/comparative/:propertyId",
      async ({ params, set, user }) => {
        try {
          if (!user?.id) {
            set.status = 401;
            return {
              status: "error",
              message: "Unauthorized access",
            };
          }

          const analytics = await analyticsService.getComparativeAnalytics(
            params.propertyId,
            user.id.toString()
          );

          return {
            status: "success",
            data: analytics,
            message: "Comparative analytics fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              (error as Error).message || "Failed to get comparative analytics",
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        detail: {
          tags: ["analytics"],
          summary: "Get comparative property analytics",
        },
      }
    )
    // Market Intelligence Endpoints
    .group("market", (market) =>
      market
        .get(
          "/data",
          async ({ query, set, user }) => {
            try {
              const location = query.location;
              const propertyType = query.propertyType || "apartment";

              if (!location) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Location is required",
                };
              }

              const marketData = await marketIntelligenceService.getMarketData(
                location,
                propertyType,
                user.id
              );

              return {
                status: "success",
                data: marketData,
                message: "Market data fetched successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message:
                  (error as Error).message || "Failed to get market data",
              };
            }
          },
          {
            query: t.Object({
              location: t.String(),
              propertyType: t.Optional(t.String()),
            }),
            detail: {
              tags: ["market"],
              summary: "Get market data for location",
            },
          }
        )
        .get(
          "/comparable-properties",
          async ({ query, set, user }) => {
            try {
              const location = query.location;
              const bedrooms = Number(query.bedrooms) || 1;
              const bathrooms = Number(query.bathrooms) || 1;
              const size = query.size ? Number(query.size) : undefined;

              if (!location) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Location is required",
                };
              }

              const comparables =
                await marketIntelligenceService.getComparableProperties(
                  location,
                  bedrooms,
                  bathrooms,
                  size,
                  user.id
                );

              return {
                status: "success",
                data: comparables,
                message: "Comparable properties fetched successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message:
                  (error as Error).message ||
                  "Failed to get comparable properties",
              };
            }
          },
          {
            query: t.Object({
              location: t.String(),
              bedrooms: t.Optional(t.String()),
              bathrooms: t.Optional(t.String()),
              size: t.Optional(t.String()),
            }),
            detail: {
              tags: ["market"],
              summary: "Get comparable properties in the market",
            },
          }
        )
        .post(
          "/insights",
          async ({ body, set, user }) => {
            try {
              const propertyData = body;

              if (!propertyData?.location?.county) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Property data with location is required",
                };
              }

              const insights =
                await marketIntelligenceService.getMarketInsights(
                  propertyData,
                  user.id
                );

              return {
                status: "success",
                data: insights,
                message: "Market insights fetched successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message:
                  (error as Error).message || "Failed to get market insights",
              };
            }
          },
          {
            body: t.Object({
              location: t.Object({
                county: t.String(),
                city: t.Optional(t.String()),
                neighborhood: t.Optional(t.String()),
              }),
              details: t.Optional(
                t.Object({
                  bedrooms: t.Optional(t.Number()),
                  bathrooms: t.Optional(t.Number()),
                  size: t.Optional(t.Number()),
                })
              ),
              pricing: t.Optional(
                t.Object({
                  rent: t.Optional(t.Number()),
                })
              ),
              amenities: t.Optional(t.Array(t.String())),
              type: t.Optional(t.String()),
            }),
            detail: {
              tags: ["market"],
              summary: "Get market insights for a property",
            },
          }
        )
        .get(
          "/demand-forecast",
          async ({ query, set }) => {
            try {
              const location = query.location;

              if (!location) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Location is required",
                };
              }

              const forecast =
                await marketIntelligenceService.getDemandForecast(location);

              return {
                status: "success",
                data: forecast,
                message: "Demand forecast fetched successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message:
                  (error as Error).message || "Failed to get demand forecast",
              };
            }
          },
          {
            query: t.Object({
              location: t.String(),
            }),
            detail: {
              tags: ["market"],
              summary: "Get demand forecast for a location",
            },
          }
        )
        .get(
          "/rental-trends",
          async ({ query, set }) => {
            try {
              const location = query.location;
              const propertyType = query.propertyType || "apartment";
              const timeframe = (query.timeframe as "3m" | "6m" | "1y") || "6m";

              if (!location) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Location is required",
                };
              }

              const trends = await marketIntelligenceService.getRentalTrends(
                location,
                propertyType,
                timeframe
              );

              return {
                status: "success",
                data: trends,
                message: "Rental trends fetched successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message:
                  (error as Error).message || "Failed to get rental trends",
              };
            }
          },
          {
            query: t.Object({
              location: t.String(),
              propertyType: t.Optional(t.String()),
              timeframe: t.Optional(t.String()),
            }),
            detail: {
              tags: ["market"],
              summary: "Get rental market trends",
            },
          }
        )
        .post(
          "/location-analysis",
          async ({ body, set, user }) => {
            try {
              const location = body;

              if (!location?.county) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Location with county is required",
                };
              }

              const analysis =
                await marketIntelligenceService.getLocationAnalysis(
                  location,
                  user.id
                );

              return {
                status: "success",
                data: analysis,
                message: "Location analysis fetched successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message:
                  (error as Error).message || "Failed to get location analysis",
              };
            }
          },
          {
            body: t.Object({
              county: t.String(),
              city: t.Optional(t.String()),
              neighborhood: t.Optional(t.String()),
            }),
            detail: {
              tags: ["market"],
              summary: "Get location analysis and scoring",
            },
          }
        )
        .get(
          "/investment-opportunities",
          async ({ query, set, user }) => {
            try {
              const location = query.location;
              const budget = Number(query.budget) || 5_000_000;
              const riskTolerance =
                (query.riskTolerance as "low" | "medium" | "high") || "medium";

              if (!location) {
                set.status = 400;
                return {
                  status: "error",
                  message: "Location is required",
                };
              }

              const opportunities =
                await marketIntelligenceService.getInvestmentOpportunities(
                  location,
                  budget,
                  riskTolerance,
                  user.id
                );

              return {
                status: "success",
                data: opportunities,
                message: "Investment opportunities fetched successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message:
                  (error as Error).message ||
                  "Failed to get investment opportunities",
              };
            }
          },
          {
            query: t.Object({
              location: t.String(),
              budget: t.Optional(t.String()),
              riskTolerance: t.Optional(t.String()),
            }),
            detail: {
              tags: ["market"],
              summary: "Get investment opportunities in a market",
            },
          }
        )
    )
);
