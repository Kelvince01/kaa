import { Favorite, Landlord, Property } from "@kaa/models";
import { AppError } from "@kaa/utils";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

/**
 * Property Favorites Controller
 * Complete implementation of all favorite-related endpoints
 */
export const propertyFavoriteController = new Elysia({
  detail: {
    tags: ["favorites"],
    summary: "Property favorites",
    description: "Property favorites endpoints",
    security: [{ bearerAuth: [] }],
  },
}).group("/properties/favorites", (app) =>
  app
    .use(authPlugin)
    // Get all favorites with pagination
    .get(
      "/",
      async ({ user, query, set }) => {
        const { page = 1, limit = 10 } = query;

        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Get favorites with populated property details
        const favorites = await Favorite.find({ user: user.id })
          .populate({
            path: "property",
            select:
              "title description type pricing location media specifications rules amenities landlord status availability createdAt",
          })
          .sort("-createdAt")
          .skip(skip)
          .limit(Number(limit));

        // Get total count for pagination
        const total = await Favorite.countDocuments({ user: user.id });

        const getLandlord = async (
          landlordId: string
        ): Promise<{ name: string; contact: string }> => {
          const landlord =
            await Landlord.findById(landlordId).populate("personalInfo");

          return {
            name:
              landlord?.personalInfo?.firstName +
              " " +
              landlord?.personalInfo?.lastName,
            contact:
              landlord?.personalInfo?.phone ||
              landlord?.personalInfo?.alternatePhone ||
              "",
          };
        };

        const favoritesData = await Promise.all(
          favorites.map(async (favorite) => ({
            _id: (favorite._id as mongoose.Types.ObjectId).toString(),
            property: {
              _id: (favorite.property as any)._id.toString(),
              title: (favorite.property as any).title,
              address:
                (favorite.property as any).location.address.line1 +
                " " +
                (favorite.property as any).location.address.town +
                " " +
                (favorite.property as any).location.address.postalCode,
              price: (favorite.property as any).pricing.rent,
              currency: (favorite.property as any).pricing.currency,
              propertyType: (favorite.property as any).type,
              status: (favorite.property as any).status,
              image: (favorite.property as any).getMainImage(),
              addedAt: (favorite.property as any)?.createdAt?.toISOString(),
              isAvailable: (favorite.property as any).availability
                ? (favorite.property as any).availability.isAvailable
                : false,
              bedrooms: (favorite.property as any).specifications.bedrooms,
              bathrooms: (favorite.property as any).specifications.bathrooms,
              size: (favorite.property as any).specifications.totalArea ?? 0,
              landlord: await getLandlord(
                (favorite.property as any).landlord.toString()
              ),
            },
          }))
        );

        set.status = 200;
        return {
          status: "success",
          data: {
            favorites: favoritesData,
            pagination: {
              total,
              page: Number(page),
              limit: Number(limit),
              pages: Math.ceil(total / Number(limit)),
            },
          },
        };
      },
      {
        query: t.Object({
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
        }),
        response: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            favorites: t.Array(
              t.Object({
                _id: t.String(),
                property: t.Object({
                  _id: t.String(),
                  title: t.String(),
                  address: t.String(),
                  price: t.Number(),
                  currency: t.String(),
                  propertyType: t.String(),
                  status: t.String(),
                  image: t.String(),
                  addedAt: t.String(),
                  isAvailable: t.Boolean(),
                  bedrooms: t.Number(),
                  bathrooms: t.Number(),
                  size: t.Number(),
                  landlord: t.Object({
                    name: t.String(),
                    contact: t.String(),
                  }),
                }),
              })
            ),
            pagination: t.Object({
              total: t.Number(),
              page: t.Number(),
              limit: t.Number(),
              pages: t.Number(),
            }),
          }),
        }),
        detail: {
          tags: ["favorites"],
          summary: "Get all favorites",
          description: "Get all favorites for the current user",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    // Get favorite by ID
    .get(
      "/:id",
      async ({ params, user, set }) => {
        try {
          const favorite = await Favorite.findOne({
            _id: params.id,
            user: user.id,
          }).populate("property");

          if (!favorite) {
            set.status = 404;
            return {
              status: "error",
              message: "Favorite not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            data: {
              favourite: favorite,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get favorite",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["favorites"],
          summary: "Get favorite by ID",
          description: "Get a specific favorite by ID",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    // Check favorite status
    .get(
      "/status/:propertyId",
      async ({ params, user, set }) => {
        try {
          const favorite = await Favorite.findOne({
            user: user.id,
            property: params.propertyId,
          });

          set.status = 200;
          return {
            status: "success",
            isFavorite: !!favorite,
            favouriteId: favorite?._id?.toString(),
            addedAt: favorite?.createdAt?.toISOString(),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to check favorite status",
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        detail: {
          tags: ["favorites"],
          summary: "Check favorite status",
          description: "Check if a property is in favorites",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    // Get favorite statistics
    .get(
      "/stats",
      async ({ user, set }) => {
        try {
          const favorites = await Favorite.find({ user: user.id }).populate(
            "property"
          );

          // Calculate statistics
          const total = favorites.length;
          const byPropertyType: Record<string, number> = {};
          const byLocation: Record<string, number> = {};
          let totalPrice = 0;
          let availableCount = 0;
          let rentedCount = 0;
          let soldCount = 0;
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          let recentlyAdded = 0;

          for (const favorite of favorites) {
            const property = favorite.property as any;
            if (!property) continue;

            // Property type count
            const type = property.type || "unknown";
            byPropertyType[type] = (byPropertyType[type] || 0) + 1;

            // Location count
            const location = property.location?.address?.town || "unknown";
            byLocation[location] = (byLocation[location] || 0) + 1;

            // Price calculation
            totalPrice += property.pricing?.rent || 0;

            // Status counts
            if (property.availability?.isAvailable) {
              availableCount++;
            }
            if (property.status === "rented") {
              rentedCount++;
            }
            if (property.status === "sold") {
              soldCount++;
            }

            // Recently added
            if (favorite.createdAt && favorite.createdAt >= oneWeekAgo) {
              recentlyAdded++;
            }
          }

          set.status = 200;
          return {
            status: "success",
            stats: {
              total,
              byPropertyType,
              byLocation,
              averagePrice: total > 0 ? totalPrice / total : 0,
              recentlyAdded,
              availableProperties: availableCount,
              rentedProperties: rentedCount,
              soldProperties: soldCount,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get favorite statistics",
          };
        }
      },
      {
        detail: {
          tags: ["favorites"],
          summary: "Get favorite statistics",
          description: "Get statistics about user's favorite properties",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    // Add property to favorites
    .post(
      "/",
      async ({ set, body, user }) => {
        try {
          const { propertyId } = body;

          // Check if property exists
          const property = await Property.findById(propertyId);

          if (!property) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }

          // Check if already in favorites
          const existingFavorite = await Favorite.findOne({
            user: user.id,
            property: propertyId,
          });

          if (existingFavorite) {
            set.status = 400;
            return {
              status: "error",
              message: "Property already in favorites",
            };
          }

          // Add to favorites
          const favorite = new Favorite({
            user: user.id,
            property: propertyId,
          });

          await favorite.save();

          // Increment property's favorite count
          await Property.findByIdAndUpdate(propertyId, {
            $inc: { favoriteCount: 1 },
          });

          set.status = 201;
          return {
            status: "success",
            message: "Property added to favorites",
            data: favorite,
          };
        } catch (error) {
          if (error instanceof AppError) {
            set.status = error.statusCode;
            return {
              status: "error",
              message: error.message,
            };
          }
          if (
            (error as Error).name === "MongoError" &&
            (error as any).code === 11_000
          ) {
            set.status = 400;
            return {
              status: "error",
              message: "Property already in favorites",
            };
          }
          set.status = 500;
          return {
            status: "error",
            message: "Failed to add property to favorites",
          };
        }
      },
      {
        body: t.Object({
          propertyId: t.String(),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            message: t.String(),
          }),
          400: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["favorites"],
          summary: "Add property to favorites",
          description: "Add property to favorites for the current user",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    // Toggle favorite status
    .post(
      "/toggle",
      async ({ user, body, set }) => {
        try {
          const { propertyId } = body;

          // Check if property exists
          const property = await Property.findById(propertyId);
          if (!property) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }

          // Check if already favorited
          const existing = await Favorite.findOne({
            user: user.id,
            property: propertyId,
          });

          if (existing) {
            // Remove from favorites
            await existing.deleteOne();
            await Property.findByIdAndUpdate(propertyId, {
              $inc: { favoriteCount: -1 },
            });

            set.status = 200;
            return {
              status: "success",
              message: "Property removed from favorites",
              data: {
                isFavorite: false,
              },
            };
          }

          // Add to favorites
          const favorite = new Favorite({
            user: user.id,
            property: propertyId,
          });

          await favorite.save();
          await Property.findByIdAndUpdate(propertyId, {
            $inc: { favoriteCount: 1 },
          });

          set.status = 201;
          return {
            status: "success",
            message: "Property added to favorites",
            data: {
              favourite: favorite,
              isFavorite: true,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to toggle favorite status",
          };
        }
      },
      {
        body: t.Object({
          propertyId: t.String(),
        }),
        detail: {
          tags: ["favorites"],
          summary: "Toggle favorite status",
          description: "Toggle property favorite status for the current user",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    // Bulk operations on favorites
    .post(
      "/bulk",
      async ({ user, body, set }) => {
        try {
          const { operation, propertyIds } = body;

          if (operation === "add") {
            // Add multiple properties to favorites
            const newFavorites = propertyIds.map((propertyId: string) => ({
              user: user.id,
              property: propertyId,
            }));

            const result = await Favorite.insertMany(newFavorites, {
              ordered: false,
            });

            // Increment favorite count
            await Property.updateMany(
              { _id: { $in: propertyIds } },
              { $inc: { favoriteCount: 1 } }
            );

            set.status = 200;
            return {
              status: "success",
              message: "Properties added to favorites",
              affected: result.length,
            };
          }

          if (operation === "remove") {
            // Remove multiple properties from favorites
            const result = await Favorite.deleteMany({
              user: user.id,
              property: { $in: propertyIds },
            });

            // Decrement favorite count
            await Property.updateMany(
              { _id: { $in: propertyIds } },
              { $inc: { favoriteCount: -1 } }
            );

            set.status = 200;
            return {
              status: "success",
              message: "Properties removed from favorites",
              affected: result.deletedCount,
            };
          }

          set.status = 400;
          return {
            status: "error",
            message: "Invalid operation",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to perform bulk operation",
          };
        }
      },
      {
        body: t.Object({
          operation: t.Union([
            t.Literal("add"),
            t.Literal("remove"),
            t.Literal("export"),
          ]),
          propertyIds: t.Array(t.String()),
        }),
        detail: {
          tags: ["favorites"],
          summary: "Bulk operations on favorites",
          description: "Perform bulk operations (add/remove) on favorites",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    // Remove property from favorites (path parameter)
    .delete(
      "/:propertyId",
      async ({ set, params, user }) => {
        try {
          const { propertyId } = params;

          const favorite = await Favorite.findOneAndDelete({
            user: user.id,
            property: propertyId,
          });

          if (!favorite) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found in favorites",
            };
          }

          // Decrement property's favorite count
          await Property.findByIdAndUpdate(propertyId, {
            $inc: { favoriteCount: -1 },
          });

          set.status = 200;
          return {
            status: "success",
            message: "Property removed from favorites",
          };
        } catch (error) {
          if (error instanceof AppError) {
            set.status = error.statusCode;
            return {
              status: "error",
              message: error.message,
            };
          }
          set.status = 500;
          return {
            status: "error",
            message: "Failed to remove property from favorites",
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["favorites"],
          summary: "Remove property from favorites",
          description: "Remove property from favorites for the current user",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    // Remove property from favorites (request body)
    .delete(
      "/",
      async ({ user, body, set }) => {
        try {
          const { propertyId } = body;

          const favorite = await Favorite.findOneAndDelete({
            user: user.id,
            property: propertyId,
          });

          if (!favorite) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found in favorites",
            };
          }

          // Decrement property's favorite count
          await Property.findByIdAndUpdate(propertyId, {
            $inc: { favoriteCount: -1 },
          });

          set.status = 200;
          return {
            status: "success",
            message: "Property removed from favorites",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to remove property from favorites",
          };
        }
      },
      {
        body: t.Object({
          propertyId: t.String(),
        }),
        detail: {
          tags: ["favorites"],
          summary: "Remove property from favorites (body)",
          description: "Remove property from favorites using request body",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    // Clear all favorites
    .delete(
      "/clear",
      async ({ user, set }) => {
        try {
          const favorites = await Favorite.find({ user: user.id });
          const propertyIds = favorites.map((f) => f.property);

          // Delete all favorites
          const result = await Favorite.deleteMany({ user: user.id });

          // Decrement favorite count for all properties
          await Property.updateMany(
            { _id: { $in: propertyIds } },
            { $inc: { favoriteCount: -1 } }
          );

          set.status = 200;
          return {
            status: "success",
            message: "All favorites cleared",
            removed: result.deletedCount,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to clear favorites",
          };
        }
      },
      {
        detail: {
          tags: ["favorites"],
          summary: "Clear all favorites",
          description: "Remove all favorites for the current user",
          security: [{ bearerAuth: [] }],
        },
      }
    )
);
