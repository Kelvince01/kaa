import { Property, VirtualTour } from "@kaa/models";
import {
  type IVirtualTour,
  SceneType,
  TourStatus,
  TourType,
  TransitionType,
} from "@kaa/models/types";
import { VirtualToursService as VirtualTourService } from "@kaa/services";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";
import { collaborationController } from "./collaboration.controller";

const VirtualToursService = new VirtualTourService();

export const virtualToursController = new Elysia().group(
  "/virtual-tours",
  (app) =>
    app
      .use(authPlugin)
      .post(
        "/",
        async ({ body, set, user }) => {
          try {
            const { propertyId, title, description, type, settings, metadata } =
              body;

            // Find property and ensure user has access (either as landlord or agent)
            const property = await Property.findById(propertyId);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord or agent of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message:
                  "Not authorized to create virtual tours for this property",
              };
            }

            // Create the virtual tour
            const tour = await VirtualToursService.createTour(
              {
                propertyId,
                title,
                description,
                type,
                settings: settings || {},
                metadata,
              },
              user.id
            );

            set.status = 201;
            return {
              status: "success",
              message: "Virtual tour created successfully",
              data: { tour },
            };
          } catch (error) {
            console.error("Create tour error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to create virtual tour",
            };
          }
        },
        {
          body: t.Object({
            propertyId: t.String(),
            title: t.String(),
            description: t.String(),
            type: t.Enum(TourType),
            settings: t.Optional(
              t.Object({
                autoRotate: t.Optional(t.Boolean()),
                autoRotateSpeed: t.Optional(t.Number()),
                initialView: t.Optional(
                  t.Object({
                    yaw: t.Number(),
                    pitch: t.Number(),
                    fov: t.Number(),
                  })
                ),
                controlsEnabled: t.Optional(t.Boolean()),
                gyroscopeEnabled: t.Optional(t.Boolean()),
                vrMode: t.Optional(t.Boolean()),
                arEnabled: t.Optional(t.Boolean()),
                audioEnabled: t.Optional(t.Boolean()),
                branding: t.Optional(
                  t.Object({
                    showLogo: t.Boolean(),
                    logoPosition: t.Union([
                      t.Literal("top-left"),
                      t.Literal("top-right"),
                      t.Literal("bottom-left"),
                      t.Literal("bottom-right"),
                    ]),
                    showWatermark: t.Boolean(),
                    theme: t.Union([
                      t.Literal("light"),
                      t.Literal("dark"),
                      t.Literal("custom"),
                    ]),
                  })
                ),
              })
            ),
            metadata: t.Object({
              propertyType: t.String(),
              totalSize: t.Number(),
              bedrooms: t.Number(),
              bathrooms: t.Number(),
              floor: t.Number(),
              county: t.String(),
              constituency: t.String(),
              ward: t.String(),
              amenities: t.Array(t.String()),
              features: t.Array(t.String()),
            }),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Create a new virtual tour",
            description: "Create a new virtual tour for a property",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/property/:propertyId",
        async ({ params, query, set, user }) => {
          try {
            const { propertyId } = params;
            const { status, type } = query;

            // Find property and ensure user has access
            const property = await Property.findById(propertyId);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord, agent, or tenant of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;
            const isTenant = property.currentTenants?.some(
              (tenant: any) => tenant.toString() === user.id
            );

            if (!(isLandlord || isAgent || isTenant)) {
              set.status = 403;
              return {
                status: "error",
                message:
                  "Not authorized to view virtual tours for this property",
              };
            }

            // Build query
            const queryFilter: FilterQuery<IVirtualTour> = {
              propertyId,
            };

            // Add status filter if provided
            if (status) {
              queryFilter.status = status;
            }

            // Add type filter if provided
            if (type) {
              queryFilter.type = type;
            }

            const tours = await VirtualTour.find(queryFilter)
              .populate("propertyId", "title address")
              .populate("createdBy", "firstName lastName email")
              .populate("updatedBy", "firstName lastName email")
              .sort({ updatedAt: -1 });

            set.status = 200;
            return {
              status: "success",
              message: "Virtual tours retrieved successfully",
              data: { tours },
            };
          } catch (error) {
            console.error("Get tours error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve virtual tours",
            };
          }
        },
        {
          params: t.Object({
            propertyId: t.String(),
          }),
          query: t.Object({
            status: t.Optional(t.Enum(TourStatus)),
            type: t.Optional(t.Enum(TourType)),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get virtual tours for a property",
            description: "Get virtual tours for a specific property",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/:tourId",
        async ({ params, set, user }) => {
          try {
            const { tourId } = params;

            const tour = await VirtualToursService.getTour(tourId);

            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Find property and ensure user has access
            const property = await Property.findById(tour.propertyId);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord, agent, or tenant of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;
            const isTenant = property.currentTenants?.some(
              (tenant: any) => tenant.toString() === user.id
            );

            if (!(isLandlord || isAgent || isTenant)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to view this virtual tour",
              };
            }

            set.status = 200;
            return {
              status: "success",
              message: "Virtual tour retrieved successfully",
              data: { tour },
            };
          } catch (error) {
            console.error("Get tour error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve virtual tour",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get virtual tour by ID",
            description: "Get a specific virtual tour by its ID",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .patch(
        "/:tourId",
        async ({ params, body, set, user }) => {
          try {
            const { tourId } = params;
            const updates = body;

            const tour = await VirtualTour.findById(tourId);

            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Find property and ensure user has access
            const property = await Property.findById(tour.propertyId);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord or agent of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to update this virtual tour",
              };
            }

            const updatedTour = await VirtualToursService.updateTour(
              tourId,
              updates,
              user.id
            );

            set.status = 200;
            return {
              status: "success",
              message: "Virtual tour updated successfully",
              data: { tour: updatedTour },
            };
          } catch (error) {
            console.error("Update tour error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to update virtual tour",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          body: t.Object({
            title: t.Optional(t.String()),
            description: t.Optional(t.String()),
            type: t.Optional(t.Enum(TourType)),
            status: t.Optional(t.Enum(TourStatus)),
            settings: t.Optional(
              t.Object({
                autoRotate: t.Boolean(),
                autoRotateSpeed: t.Number(),
                controlsEnabled: t.Boolean(),
                gyroscopeEnabled: t.Boolean(),
                initialView: t.Object({
                  yaw: t.Number(),
                  pitch: t.Number(),
                  fov: t.Number(),
                }),
                branding: t.Object({
                  showLogo: t.Boolean(),
                  logoPosition: t.Enum({
                    "top-left": "top-left",
                    "top-right": "top-right",
                    "bottom-left": "bottom-left",
                    "bottom-right": "bottom-right",
                  }),
                  showWatermark: t.Boolean(),
                  customCSS: t.Optional(t.String()),
                  theme: t.Enum({
                    light: "light",
                    dark: "dark",
                    custom: "custom",
                  }),
                }),
                vrMode: t.Boolean(),
                arEnabled: t.Boolean(),
                audioEnabled: t.Boolean(),
              })
            ),
            metadata: t.Optional(
              t.Object({
                propertyType: t.String(),
                totalSize: t.Number(),
                bedrooms: t.Number(),
                bathrooms: t.Number(),
                floor: t.Number(),
                county: t.String(),
                constituency: t.String(),
                ward: t.String(),
                amenities: t.Array(t.String()),
                features: t.Array(t.String()),
              })
            ),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Update virtual tour",
            description: "Update an existing virtual tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .delete(
        "/:tourId",
        async ({ params, set, user }) => {
          try {
            const { tourId } = params;

            const tour = await VirtualTour.findById(tourId);

            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Find property and ensure user has access
            const property = await Property.findById(tour.propertyId);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord or agent of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to delete this virtual tour",
              };
            }

            // Delete the tour
            await VirtualToursService.deleteTour(tourId);

            return {
              status: "success",
              message: "Virtual tour deleted successfully",
            };
          } catch (error) {
            console.error("Delete tour error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to delete virtual tour",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Delete virtual tour",
            description: "Delete a virtual tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .post(
        "/:tourId/scenes",
        async ({ params, body, set, user }) => {
          try {
            const { tourId } = params;
            const sceneData = body;

            const tour = await VirtualTour.findById(tourId);

            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Check authorization
            const property = await Property.findById(tour.propertyId);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to add scenes to this tour",
              };
            }

            const scene = await VirtualToursService.addScene(tourId, sceneData);

            set.status = 201;
            return {
              status: "success",
              message: "Scene added successfully",
              data: { scene },
            };
          } catch (error) {
            console.error("Add scene error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to add scene",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          body: t.Object({
            name: t.String(),
            description: t.String(),
            type: t.Enum(SceneType),
            mediaUrl: t.String(),
            thumbnailUrl: t.String(),
            hotspots: t.Array(t.String()),
            position: t.Object({
              latitude: t.Optional(t.Number()),
              longitude: t.Optional(t.Number()),
              altitude: t.Optional(t.Number()),
              floor: t.Optional(t.Number()),
              room: t.Optional(t.String()),
            }),
            connections: t.Array(
              t.Object({
                targetSceneId: t.String(),
                position: t.Object({
                  x: t.Number(),
                  y: t.Number(),
                  z: t.Number(),
                }),
                arrow: t.Boolean(),
                transition: t.Enum(TransitionType),
              })
            ),
            metadata: t.Object({
              captureDate: t.Date(),
              camera: t.Optional(t.String()),
              resolution: t.Object({
                width: t.Number(),
                height: t.Number(),
              }),
              fileSize: t.Number(),
            }),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Add scene to virtual tour",
            description: "Add a new scene to an existing virtual tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .post(
        "/:tourId/upload",
        async ({ params, body, set, user }) => {
          try {
            const { tourId } = params;
            const { file, fileName, mimeType, sceneId, metadata } = body;

            const tour = await VirtualTour.findById(tourId);

            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Check authorization
            const property = await Property.findById(tour.propertyId);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to upload media to this tour",
              };
            }

            // Convert base64 to buffer if needed
            const fileBuffer = Buffer.isBuffer(file)
              ? file
              : Buffer.from(file, "base64");

            const mediaUrl = await VirtualToursService.uploadMedia(
              {
                tourId,
                sceneId,
                file: fileBuffer,
                fileName,
                mimeType,
                metadata,
              },
              user.id
            );

            set.status = 200;
            return {
              status: "success",
              message: "Media uploaded successfully",
              data: { mediaUrl },
            };
          } catch (error) {
            console.error("Upload media error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to upload media",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          body: t.Object({
            file: t.Any(), // File buffer or base64 string
            fileName: t.String(),
            mimeType: t.String(),
            sceneId: t.Optional(t.String()),
            metadata: t.Optional(t.Any()),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Upload media for virtual tour",
            description: "Upload media files for virtual tour scenes",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/:tourId/embed",
        async ({ params, query, set }) => {
          try {
            const { tourId } = params;
            const { width, height, autoplay, controls, responsive, theme } =
              query;

            const embedCode = await VirtualToursService.getTourEmbedCode(
              tourId,
              {
                width: width || 800,
                height: height || 600,
                autoplay,
                controls: controls !== false,
                responsive: responsive !== false,
                theme: theme || "light",
              }
            );

            set.status = 200;
            return {
              status: "success",
              message: "Embed code generated successfully",
              data: { embedCode },
            };
          } catch (error) {
            console.error("Generate embed error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to generate embed code",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          query: t.Object({
            width: t.Optional(t.Number()),
            height: t.Optional(t.Number()),
            autoplay: t.Boolean(),
            controls: t.Optional(t.Boolean()),
            responsive: t.Optional(t.Boolean()),
            theme: t.Optional(t.Union([t.Literal("light"), t.Literal("dark")])),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get tour embed code",
            description: "Generate embed code for a virtual tour",
          },
        }
      )
      .get(
        "/:tourId/analytics",
        async ({ params, set, user }) => {
          try {
            const { tourId } = params;

            const tour = await VirtualTour.findById(tourId);

            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Check authorization
            const property = await Property.findById(tour.propertyId);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to view analytics for this tour",
              };
            }

            const analytics =
              await VirtualToursService.getTourAnalytics(tourId);

            set.status = 200;
            return {
              status: "success",
              message: "Tour analytics retrieved successfully",
              data: { analytics },
            };
          } catch (error) {
            console.error("Get analytics error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve tour analytics",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get tour analytics",
            description: "Get analytics data for a virtual tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/health",
        async ({ set }) => {
          try {
            const health = await VirtualToursService.getServiceHealth();

            set.status =
              health.status === "healthy"
                ? 200
                : health.status === "degraded"
                  ? 206
                  : 503;

            return {
              status: "success",
              message: "Service health retrieved successfully",
              data: health,
            };
          } catch (error) {
            console.error("Health check error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to check service health",
            };
          }
        },
        {
          detail: {
            tags: ["virtual-tours"],
            summary: "Get service health",
            description: "Check the health status of the virtual tours service",
          },
        }
      )
      .post(
        "/:tourId/scenes/:sceneId/hotspots",
        async ({ params, body, set, user }) => {
          try {
            const { tourId, sceneId } = params;
            const hotspotData = body;

            const tour = await VirtualTour.findById(tourId);
            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Check authorization
            const property = await Property.findById(tour.propertyId);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to add hotspots to this tour",
              };
            }

            const hotspot = await VirtualToursService.addHotspot(
              tourId,
              sceneId,
              hotspotData as any
            );

            set.status = 201;
            return {
              status: "success",
              message: "Hotspot added successfully",
              data: { hotspot },
            };
          } catch (error) {
            console.error("Add hotspot error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to add hotspot",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
            sceneId: t.String(),
          }),
          body: t.Object({
            type: t.String(),
            position: t.Object({
              x: t.Number(),
              y: t.Number(),
              z: t.Optional(t.Number()),
              yaw: t.Optional(t.Number()),
              pitch: t.Optional(t.Number()),
            }),
            content: t.Object({
              title: t.String(),
              description: t.Optional(t.String()),
              mediaUrl: t.Optional(t.String()),
              mediaType: t.Optional(
                t.Union([
                  t.Literal("image"),
                  t.Literal("video"),
                  t.Literal("audio"),
                  t.Literal("3d"),
                ])
              ),
              link: t.Optional(t.String()),
            }),
            style: t.Object({
              icon: t.String(),
              color: t.String(),
              size: t.Number(),
              animation: t.Optional(
                t.Union([
                  t.Literal("pulse"),
                  t.Literal("bounce"),
                  t.Literal("rotate"),
                  t.Literal("none"),
                ])
              ),
              visible: t.Optional(t.Boolean()),
            }),
            trigger: t.Optional(t.String()),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Add hotspot to scene",
            description:
              "Add a new hotspot to a specific scene in a virtual tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .post(
        "/:tourId/publish",
        async ({ params, set, user }) => {
          try {
            const { tourId } = params;

            const tour = await VirtualTour.findById(tourId);
            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Check authorization
            const property = await Property.findById(tour.propertyId);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to publish this tour",
              };
            }

            const publishedTour = await VirtualToursService.publishTour(tourId);

            set.status = 200;
            return {
              status: "success",
              message: "Virtual tour published successfully",
              data: { tour: publishedTour },
            };
          } catch (error) {
            console.error("Publish tour error:", error);
            set.status = 500;
            return {
              status: "error",
              message:
                (error as Error).message || "Failed to publish virtual tour",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Publish virtual tour",
            description:
              "Publish a virtual tour to make it publicly accessible",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .post(
        "/:tourId/duplicate",
        async ({ params, body, set, user }) => {
          try {
            const { tourId } = params;
            const { title } = body;

            const tour = await VirtualTour.findById(tourId);
            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Check authorization
            const property = await Property.findById(tour.propertyId);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to duplicate this tour",
              };
            }

            const duplicatedTour = await VirtualToursService.duplicateTour(
              tourId,
              user.id,
              title
            );

            set.status = 201;
            return {
              status: "success",
              message: "Virtual tour duplicated successfully",
              data: { tour: duplicatedTour },
            };
          } catch (error) {
            console.error("Duplicate tour error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to duplicate virtual tour",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          body: t.Object({
            title: t.Optional(t.String()),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Duplicate virtual tour",
            description: "Create a copy of an existing virtual tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/search",
        async ({ query, set }) => {
          try {
            const { q, propertyType, county, status, type } = query;

            if (!q) {
              set.status = 400;
              return {
                status: "error",
                message: "Search query is required",
              };
            }

            const tours = await VirtualToursService.searchTours(q, {
              propertyType,
              county,
              status: status as TourStatus,
              type: type as TourType,
            });

            set.status = 200;
            return {
              status: "success",
              message: "Search results retrieved successfully",
              data: { tours },
            };
          } catch (error) {
            console.error("Search tours error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to search virtual tours",
            };
          }
        },
        {
          query: t.Object({
            q: t.String(),
            propertyType: t.Optional(t.String()),
            county: t.Optional(t.String()),
            status: t.Optional(t.String()),
            type: t.Optional(t.String()),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Search virtual tours",
            description: "Search for virtual tours using various filters",
          },
        }
      )
      .get(
        "/popular",
        async ({ query, set }) => {
          try {
            const { limit } = query;

            const tours = await VirtualToursService.getPopularTours(
              limit || 10
            );

            set.status = 200;
            return {
              status: "success",
              message: "Popular tours retrieved successfully",
              data: { tours },
            };
          } catch (error) {
            console.error("Get popular tours error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve popular tours",
            };
          }
        },
        {
          query: t.Object({
            limit: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get popular virtual tours",
            description: "Get the most viewed virtual tours",
          },
        }
      )
      .get(
        "/user/:userId",
        async ({ params, set, user }) => {
          try {
            const { userId } = params;

            // Users can only view their own tours unless they're admin
            if (userId !== user.id && user.role.toString() !== "admin") {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to view these tours",
              };
            }

            const tours = await VirtualToursService.getToursByUser(userId);

            set.status = 200;
            return {
              status: "success",
              message: "User tours retrieved successfully",
              data: { tours },
            };
          } catch (error) {
            console.error("Get user tours error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve user tours",
            };
          }
        },
        {
          params: t.Object({
            userId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get tours by user",
            description: "Get all virtual tours created by a specific user",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .post(
        "/:tourId/track/view",
        async ({ params, body, set }) => {
          try {
            const { tourId } = params;
            const { deviceType, location, referrer, sessionId } = body;

            await VirtualToursService.trackTourView(tourId, {
              deviceType,
              location,
              referrer,
              sessionId,
            });

            set.status = 200;
            return {
              status: "success",
              message: "Tour view tracked successfully",
            };
          } catch (error) {
            console.error("Track tour view error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to track tour view",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          body: t.Object({
            deviceType: t.String(),
            location: t.Optional(t.String()),
            referrer: t.Optional(t.String()),
            sessionId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Track tour view",
            description: "Track when a user views a virtual tour",
          },
        }
      )
      .post(
        "/:tourId/track/scene/:sceneId",
        async ({ params, body, set }) => {
          try {
            const { tourId, sceneId } = params;
            const { sessionId, duration } = body;

            await VirtualToursService.trackSceneView(
              tourId,
              sceneId,
              sessionId,
              duration
            );

            set.status = 200;
            return {
              status: "success",
              message: "Scene view tracked successfully",
            };
          } catch (error) {
            console.error("Track scene view error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to track scene view",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
            sceneId: t.String(),
          }),
          body: t.Object({
            sessionId: t.String(),
            duration: t.Number(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Track scene view",
            description: "Track when a user views a specific scene in a tour",
          },
        }
      )
      .post(
        "/:tourId/track/hotspot/:hotspotId",
        async ({ params, body, set }) => {
          try {
            const { tourId, hotspotId } = params;
            const { interactionType } = body;

            await VirtualToursService.trackHotspotInteraction(
              tourId,
              hotspotId,
              interactionType
            );

            set.status = 200;
            return {
              status: "success",
              message: "Hotspot interaction tracked successfully",
            };
          } catch (error) {
            console.error("Track hotspot interaction error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to track hotspot interaction",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
            hotspotId: t.String(),
          }),
          body: t.Object({
            interactionType: t.Union([t.Literal("view"), t.Literal("click")]),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Track hotspot interaction",
            description: "Track when a user interacts with a hotspot",
          },
        }
      )
      // Enhanced endpoints for advanced features
      .get(
        "/:tourId/analytics/ml",
        async ({ params, set, user }) => {
          try {
            const { tourId } = params;

            const tour = await VirtualTour.findById(tourId);

            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Check authorization
            const property = await Property.findById(tour.propertyId);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to view ML analytics for this tour",
              };
            }

            const mlAnalytics = await VirtualToursService.getTourAnalytics(
              tourId,
              true
            );

            set.status = 200;
            return {
              status: "success",
              message: "ML analytics retrieved successfully",
              data: { analytics: mlAnalytics },
            };
          } catch (error) {
            console.error("Get ML analytics error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve ML analytics",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get ML-enhanced tour analytics",
            description:
              "Get machine learning enhanced analytics for a virtual tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/:tourId/real-time-metrics",
        async ({ params, set }) => {
          try {
            const { tourId } = params;

            const realTimeMetrics =
              await VirtualToursService.getRealTimeMetrics(tourId);

            set.status = 200;
            return {
              status: "success",
              message: "Real-time metrics retrieved successfully",
              data: realTimeMetrics,
            };
          } catch (error) {
            console.error("Get real-time metrics error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve real-time metrics",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get real-time tour metrics",
            description:
              "Get real-time metrics and analytics for a virtual tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .post(
        "/:tourId/xr-session",
        async ({ params, body, set }) => {
          try {
            const { tourId } = params;
            const { mode, settings } = body;

            const success = await VirtualToursService.startXRSession(
              tourId,
              mode,
              settings
            );

            if (success) {
              set.status = 200;
              return {
                status: "success",
                message: "XR session started successfully",
                data: { tourId, mode, sessionActive: true },
              };
            }
            set.status = 400;
            return {
              status: "error",
              message: "Failed to start XR session",
            };
          } catch (error) {
            console.error("Start XR session error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to start XR session",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          body: t.Object({
            mode: t.Union([t.Literal("vr"), t.Literal("ar")]),
            settings: t.Any(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Start XR session",
            description:
              "Start a virtual reality or augmented reality session for a tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/:tourId/accessibility-report",
        async ({ params, set }) => {
          try {
            const { tourId } = params;

            const report =
              await VirtualToursService.generateAccessibilityReport(tourId);

            set.status = 200;
            return {
              status: "success",
              message: "Accessibility report generated successfully",
              data: report,
            };
          } catch (error) {
            console.error("Generate accessibility report error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to generate accessibility report",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get accessibility report",
            description:
              "Generate accessibility compliance report for a virtual tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .post(
        "/:tourId/voice-control",
        async ({ params, body, set }) => {
          try {
            const { tourId } = params;
            const { platform } = body;

            const success = await VirtualToursService.enableVoiceControl(
              tourId,
              platform
            );

            if (success) {
              set.status = 200;
              return {
                status: "success",
                message: "Voice control enabled successfully",
                data: { tourId, platform, enabled: true },
              };
            }
            set.status = 400;
            return {
              status: "error",
              message: "Failed to enable voice control",
            };
          } catch (error) {
            console.error("Enable voice control error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to enable voice control",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          body: t.Object({
            platform: t.Union([t.Literal("alexa"), t.Literal("google")]),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Enable voice control",
            description:
              "Enable voice control for a virtual tour on smart home platforms",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/:tourId/optimized-content",
        async ({ params, query, set }) => {
          try {
            const { tourId } = params;
            const { originalUrl, contentType, clientIP } = query;

            if (!(originalUrl && contentType && clientIP)) {
              set.status = 400;
              return {
                status: "error",
                message: "originalUrl, contentType, and clientIP are required",
              };
            }

            const optimizedUrl =
              await VirtualToursService.getOptimizedContentUrl(
                originalUrl,
                clientIP,
                contentType as any
              );

            set.status = 200;
            return {
              status: "success",
              message: "Content optimized successfully",
              data: { originalUrl, optimizedUrl },
            };
          } catch (error) {
            console.error("Content optimization error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to optimize content",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          query: t.Object({
            originalUrl: t.String(),
            contentType: t.Union([
              t.Literal("image"),
              t.Literal("video"),
              t.Literal("3d"),
              t.Literal("audio"),
            ]),
            clientIP: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get optimized content URL",
            description: "Get edge-optimized content delivery URL",
          },
        }
      )
      .get(
        "/:tourId/recommendations",
        async ({ params, query, set, user }) => {
          try {
            const { tourId } = params;
            const preferences = query.preferences
              ? JSON.parse(query.preferences)
              : {};

            const recommendations =
              await VirtualToursService.getRecommendedTours(
                user.id,
                preferences
              );

            set.status = 200;
            return {
              status: "success",
              message: "Tour recommendations retrieved successfully",
              data: { recommendations },
            };
          } catch (error) {
            console.error("Get recommendations error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve recommendations",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          query: t.Object({
            preferences: t.Optional(t.String()),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Get tour recommendations",
            description: "Get ML-powered tour recommendations",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/capabilities",
        ({ set }) => {
          try {
            const capabilities = VirtualToursService.getServiceCapabilities();

            set.status = 200;
            return {
              status: "success",
              message: "Service capabilities retrieved successfully",
              data: capabilities,
            };
          } catch (error) {
            console.error("Get capabilities error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve capabilities",
            };
          }
        },
        {
          detail: {
            tags: ["virtual-tours"],
            summary: "Get service capabilities",
            description: "Get available features and service capabilities",
          },
        }
      )
      .post(
        "/:tourId/generate-smart-connections",
        async ({ params, set, user }) => {
          try {
            const { tourId } = params;

            const tour = await VirtualTour.findById(tourId);
            if (!tour) {
              set.status = 404;
              return {
                status: "error",
                message: "Virtual tour not found",
              };
            }

            // Check authorization
            const property = await Property.findById(tour.propertyId);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to generate connections for this tour",
              };
            }

            const result =
              await VirtualToursService.generateSmartConnections(tourId);

            set.status = result.success ? 200 : 400;
            return {
              status: result.success ? "success" : "error",
              message: result.success
                ? "Smart connections generated successfully"
                : result.message || result.error,
              data: result,
            };
          } catch (error) {
            console.error("Generate smart connections error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to generate smart connections",
            };
          }
        },
        {
          params: t.Object({
            tourId: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Generate AI-powered scene connections",
            description:
              "Generate intelligent scene connections using AI analysis",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/advanced-services/health",
        ({ set }) => {
          try {
            const health = VirtualToursService.getAdvancedServicesHealth();

            set.status =
              health.overall === "healthy"
                ? 200
                : health.overall === "degraded"
                  ? 206
                  : 503;
            return {
              status: "success",
              message: "Advanced services health retrieved successfully",
              data: health,
            };
          } catch (error) {
            console.error("Advanced services health error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve advanced services health",
            };
          }
        },
        {
          detail: {
            tags: ["virtual-tours"],
            summary: "Get advanced services health",
            description: "Get health status of all advanced services",
          },
        }
      )
      .post(
        "/advanced-services/:serviceName/restart",
        async ({ params, set }) => {
          try {
            const { serviceName } = params;

            const result =
              await VirtualToursService.restartAdvancedService(serviceName);

            if (result) {
              set.status = 200;
              return {
                status: "success",
                message: `Service ${serviceName} restarted successfully`,
                data: { serviceName, restarted: true },
              };
            }
            set.status = 400;
            return {
              status: "error",
              message: `Failed to restart service ${serviceName}`,
            };
          } catch (error) {
            console.error("Service restart error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to restart service",
            };
          }
        },
        {
          params: t.Object({
            serviceName: t.String(),
          }),
          detail: {
            tags: ["virtual-tours"],
            summary: "Restart advanced service",
            description: "Restart a specific advanced service",
          },
        }
      )
      .post(
        "/advanced-mode/enable",
        async ({ set }) => {
          try {
            await VirtualToursService.enableAdvancedMode();

            set.status = 200;
            return {
              status: "success",
              message: "Advanced mode enabled successfully",
              data: { advancedMode: true },
            };
          } catch (error) {
            console.error("Enable advanced mode error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to enable advanced mode",
            };
          }
        },
        {
          detail: {
            tags: ["virtual-tours"],
            summary: "Enable advanced mode",
            description: "Enable advanced features and AI capabilities",
          },
        }
      )
      .post(
        "/advanced-mode/disable",
        ({ set }) => {
          try {
            VirtualToursService.disableAdvancedMode();

            set.status = 200;
            return {
              status: "success",
              message: "Advanced mode disabled successfully",
              data: { advancedMode: false },
            };
          } catch (error) {
            console.error("Disable advanced mode error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to disable advanced mode",
            };
          }
        },
        {
          detail: {
            tags: ["virtual-tours"],
            summary: "Disable advanced mode",
            description: "Disable advanced features to conserve resources",
          },
        }
      )
      // Add collaboration routes
      .use(collaborationController)
);
