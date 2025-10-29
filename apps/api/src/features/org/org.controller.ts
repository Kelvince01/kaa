import { Member, Organization, Role } from "@kaa/models";
import type { IOrganization } from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type { FilterQuery, SortOrder } from "mongoose";
import { authPlugin, rolesPlugin } from "../auth/auth.plugin";

export const organizationController = new Elysia({
  detail: {
    tags: ["organizations"],
  },
}).group("organizations", (app) =>
  app
    .use(authPlugin)
    .use(rolesPlugin(["admin"]))
    // Get all organizations
    .get(
      "/",
      async ({ set, query, user }) => {
        try {
          const {
            page = 1,
            limit = 10,
            sort = "dateDesc",
            name,
            email,
            phone,
          } = query;

          console.log(user);

          const filter: FilterQuery<IOrganization> = { isActive: true };

          // Build sort object
          let sortOrder: Record<string, SortOrder> = {};
          switch (sort) {
            case "nameAsc":
              sortOrder = { name: 1 };
              break;
            case "nameDesc":
              sortOrder = { name: -1 };
              break;
            case "dateAsc":
              sortOrder = { createdAt: 1 };
              break;
            case "dateDesc":
              sortOrder = { createdAt: -1 };
              break;
            default:
              sortOrder = { createdAt: -1 };
          }

          if (name) {
            filter.name = { $regex: name, $options: "i" };
          }

          if (email) {
            filter.email = { $regex: email, $options: "i" };
          }

          if (phone) {
            filter.phone = { $regex: phone, $options: "i" };
          }

          // Parse pagination params
          const skip = (page - 1) * limit;

          const organizations = await Organization.find(filter)
            .skip(skip)
            .limit(limit)
            .sort(sortOrder)
            .lean();

          const total = await Organization.countDocuments(filter);
          const totalPages = Math.ceil(total / limit);

          set.status = 200;
          return {
            status: "success",
            message: "Organizations fetched successfully",
            items: organizations,
            pagination: {
              total,
              pages: totalPages,
              page,
              limit,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1,
            },
          };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Error fetching organizations" };
        }
      },
      {
        query: t.Object({
          name: t.Optional(t.String()),
          email: t.Optional(t.String()),
          phone: t.Optional(t.String()),
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
          sort: t.Optional(t.String()),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            message: t.String(),
            items: t.Array(t.Any()),
            pagination: t.Object({
              total: t.Number(),
              pages: t.Number(),
              page: t.Number(),
              limit: t.Number(),
              hasNextPage: t.Boolean(),
              hasPrevPage: t.Boolean(),
            }),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: { tags: ["organizations"], summary: "List all organizations" },
      }
    )
    // Get organization by ID
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const organization = await Organization.findById(params.id);
          // .populate("members")
          // .populate("properties");

          set.status = 200;
          return {
            status: "success",
            message: "Organization fetched successfully",
            organization,
          };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Error fetching organization" };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: { tags: ["organizations"], summary: "Get organization by ID" },
      }
    )
    // Get organization by slug
    .get(
      "/slug/:slug",
      async ({ params, set }) => {
        try {
          const organization = await Organization.findOne({
            slug: params.slug,
          });

          if (!organization) {
            set.status = 404;
            return { status: "error", message: "Organization not found" };
          }

          set.status = 200;
          return {
            status: "success",
            message: "Organization fetched successfully",
            organization,
          };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Error fetching organization" };
        }
      },
      {
        params: t.Object({ slug: t.String() }),
        detail: {
          tags: ["organizations"],
          summary: "Get organization by slug",
        },
      }
    )
    //check if slug is available
    .get(
      "/slug/:slug/check",
      async ({ set, params }) => {
        try {
          const org = await Organization.findOne({ slug: params.slug });
          if (org) {
            set.status = 400;
            return { status: "error", message: "Slug already exists" };
          }

          set.status = 200;
          return {
            status: "success",
            message: "Slug is available",
            available: true,
          };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Error checking slug" };
        }
      },
      {
        params: t.Object({ slug: t.String() }),
        detail: {
          tags: ["organizations"],
          summary: "Check if slug is available",
        },
      }
    )
    // Create organization
    .post(
      "/",
      async ({ body, set, user }) => {
        try {
          const name = body.name;
          const slug = name.toLowerCase().replace(/\s+/g, "-");

          const org = await Organization.create({
            ...body,
            slug,
          });

          // await checkSlugExists(body.slug);

          // Auto-add creator as 'owner'
          const ownerRole = await Role.findOne({ name: "owner" });
          if (ownerRole)
            await Member.create({
              user: user.id,
              organization: org._id,
              role: ownerRole._id,
              name: `${user.firstName} ${user.lastName}`,
              slug: `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .replace(/\s+/g, "-"),
            });

          set.status = 201;
          return {
            status: "success",
            message: "Organization created successfully",
            organization: org,
          };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Error creating organization" };
        }
      },
      {
        body: t.Object({
          slug: t.String(),
          name: t.String(),
          type: t.String({
            enum: ["landlord", "property_manager", "agency", "other"],
          }),
          email: t.String(),
          phone: t.String(),
          address: t.Object({
            country: t.String(),
            county: t.String(),
            town: t.String(),
            street: t.String(),
            postalCode: t.Optional(t.String()),
          }),
          registrationNumber: t.Optional(t.String()),
          kraPin: t.Optional(t.String()),
          website: t.Optional(t.String()),
          logo: t.Optional(t.String()),
          settings: t.Optional(t.Any()),
        }),
        detail: { tags: ["organizations"], summary: "Create organization" },
      }
    )
    // Update organization
    .patch(
      "/:id",
      async ({ set, params, body }) => {
        try {
          const org = await Organization.findByIdAndUpdate(params.id, body, {
            new: true,
          });

          if (!org) {
            set.status = 404;
            return { status: "error", message: "Organization not found" };
          }

          set.status = 200;
          return {
            status: "success",
            message: "Organization updated successfully",
            organization: org,
          };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Error updating organization" };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          name: t.Optional(t.String()),
          type: t.Optional(
            t.String({
              enum: ["landlord", "property_manager", "agency", "other"],
            })
          ),
          email: t.Optional(t.String()),
          phone: t.Optional(t.String()),
          address: t.Optional(
            t.Object({
              country: t.Optional(t.String()),
              county: t.Optional(t.String()),
              town: t.Optional(t.String()),
              street: t.Optional(t.String()),
              postalCode: t.Optional(t.String()),
            })
          ),
          registrationNumber: t.Optional(t.String()),
          kraPin: t.Optional(t.String()),
          website: t.Optional(t.String()),
          logo: t.Optional(t.String()),
          settings: t.Optional(t.Any()),
        }),
        detail: { tags: ["organizations"], summary: "Update organization" },
      }
    )
    // Delete organization
    .delete(
      "/:id",
      async ({ set, params }) => {
        try {
          const org = await Organization.deleteOne({ _id: params.id });

          set.status = 200;
          return {
            status: "success",
            message: "Organization deleted successfully",
            organization: org,
          };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Error deleting organization" };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: { tags: ["organizations"], summary: "Delete organization" },
      }
    )
    // Add member to organization
    .post(
      "/:id/members",
      async ({ set, params, body, user }) => {
        try {
          const org = await Organization.findById(params.id);

          if (!org) {
            set.status = 404;
            return { status: "error", message: "Organization not found" };
          }

          const member = await Member.findById(body.memberId);
          if (!member) {
            set.status = 404;
            return { status: "error", message: "Member not found" };
          }

          const ownerRole = await Role.findOne({ name: user.role });
          if (ownerRole)
            await Member.create({
              user: user.id,
              organization: org._id,
              role: ownerRole._id,
              name: `${user.firstName} ${user.lastName}`,
              slug: `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .replace(/\s+/g, "-"),
            });

          // await checkSlugExists(body.slug);

          set.status = 200;
          return {
            status: "success",
            message: "Member added to organization successfully",
            organization: org,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Error adding member to organization",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({ memberId: t.String() }),
        detail: {
          tags: ["organizations"],
          summary: "Add member to organization",
        },
      }
    )
    // Remove member from organization
    .delete(
      "/:id/members/:memberId",
      async ({ set, params }) => {
        try {
          const org = await Organization.findById(params.id);
          if (!org) {
            set.status = 404;
            return { status: "error", message: "Organization not found" };
          }

          const member = await Member.deleteOne({
            _id: params.memberId,
            organization: org._id,
          });

          if (!member) {
            set.status = 404;
            return { status: "error", message: "Member not found" };
          }

          set.status = 200;
          return {
            status: "success",
            message: "Member removed from organization successfully",
            organization: org,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Error removing member from organization",
          };
        }
      },
      {
        params: t.Object({ id: t.String(), memberId: t.String() }),
        detail: {
          tags: ["organizations"],
          summary: "Remove member from organization",
        },
      }
    )
);
