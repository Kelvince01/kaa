import { Favorite, Property } from "@kaa/models";
import { AppError } from "@kaa/utils";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

export const propertyFavoriteController = new Elysia().group(
  "/favorites",
  (app) =>
    app
      .use(authPlugin)
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
                "title description type pricing location media details furnished",
            })
            .sort("-createdAt")
            .skip(skip)
            .limit(Number(limit));

          // Get total count for pagination
          const total = await Favorite.countDocuments({ user: user.id });

          set.status = 200;
          return {
            status: "success",
            data: {
              favorites: favorites.map((favorite) => ({
                _id: (favorite._id as mongoose.Types.ObjectId).toString(),
                property: {
                  _id: (
                    favorite.property as unknown as mongoose.Types.ObjectId
                  ).toString(),
                  title: (favorite.property as any).title,
                },
              })),
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
            page: t.Number(),
            limit: t.Number(),
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
      .get(
        "/:propertyId/check",
        async ({ params, user, set }) => {
          try {
            const { propertyId } = params;
            const favorite = await Favorite.findOne({
              user: user.id,
              property: propertyId,
            });

            set.status = 200;
            return {
              status: "success",
              data: {
                isFavorite: !!favorite,
              },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "An error occurred while checking favorite status",
            };
          }
        },
        {
          params: t.Object({
            propertyId: t.String(),
          }),
          detail: {
            tags: ["favorites"],
            summary: "Check if property is in favorites",
            description:
              "Check if property is in favorites for the current user",
            security: [{ bearerAuth: [] }],
          },
        }
      )
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
);
