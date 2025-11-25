import jwt from "@elysiajs/jwt";
import { User } from "@kaa/models";
import { UserStatus } from "@kaa/models/types";
import { memberService, roleService } from "@kaa/services";
import { Elysia, sse, t } from "elysia";
import type mongoose from "mongoose";
import { authPlugin } from "./auth.plugin";

export type UserRole = {
  id: string;
  name: string;
  isPrimary: boolean;
};

export type UserMember = {
  id: string;
  type?: string;
  name: string;
  logo?: string;
  plan: string;
};

export type UserOrganization = {
  id: string;
  name: string;
  logo?: string;
  type: string;
};

export type UserProfile = {
  type: string; // 'landlord' | 'tenant' | 'admin'
  data: any; // Role-specific profile data (ILandlord | ITenant)
};

type UserContext = {
  role: UserRole;
  member: UserMember;
  organization: UserOrganization;
  profile: UserProfile;
};

// a simple in‑memory map to keep a reference to each client’s generator
const clients = new Map<string, AsyncGenerator<any, void, unknown>>();

export const meController = new Elysia({
  detail: {
    tags: ["me"],
  },
})
  .use(
    jwt({
      name: "jwt",
      secret: "me-jwt",
    })
  )
  .group("", (app) =>
    app
      .use(authPlugin)
      .get(
        "/me",
        async ({ user, set }) => {
          try {
            // Get full user document
            const currentUser = await User.findById(user.id);
            if (!currentUser) {
              set.status = 404;
              return {
                status: "error",
                message: "User not found",
              };
            }
            // User is attached to req by the auth middleware
            const userProfile = currentUser.getPublicProfile();

            // Get user role with populated role details
            const userRole = await roleService.getUserRoleBy({
              userId: userProfile._id?.toString() ?? "",
            });

            // Get member with populated organization
            const member = await memberService.getMemberBy({
              user: userProfile._id?.toString() ?? "",
            });

            const context: UserContext | null = null;
            let organization: any | null = null;
            let profile: any | null = null;

            // Fetch organization if member exists
            if (member?.organization) {
              const { Organization } = await import("@kaa/models");
              organization = await Organization.findById(
                member.organization
              ).lean();
            }

            // Fetch role-specific profile based on role name
            if (userRole?.roleId) {
              const roleName =
                typeof userRole.roleId === "string"
                  ? userRole.roleId
                  : (userRole.roleId as any).name;

              if (roleName === "landlord") {
                const { Landlord } = await import("@kaa/models");
                const landlord = await Landlord.findOne({ user: user.id })
                  .populate("organizationId")
                  // .populate("property", "title")
                  .lean();
                profile = landlord;
                // Use landlord's organization if it exists
                if (landlord?.organizationId && !organization) {
                  organization = landlord.organizationId;
                }
              } else if (roleName === "tenant") {
                const { Tenant } = await import("@kaa/models");
                const tenant = await Tenant.findOne({ user: user.id })
                  .populate("property", "title landlord")
                  .populate("unit", "unitNumber")
                  // .populate(
                  //   "landlord",
                  //   "personalInfo.firstName personalInfo.lastName"
                  // )
                  .lean();
                profile = tenant;
                // Tenants don't have organizations
                organization = null;
              }
            }

            set.status = 200;
            return {
              status: "success",
              user: {
                id: (userProfile._id as mongoose.Types.ObjectId).toString(),
                memberId: member
                  ? (member._id as mongoose.Types.ObjectId)?.toString()
                  : undefined,
                avatar: userProfile.profile?.avatar,
                username: userProfile.profile?.displayName || "",
                firstName: userProfile.profile?.firstName ?? "",
                lastName: userProfile.profile?.lastName ?? "",
                email: userProfile.contact?.email ?? "",
                status: userProfile.status as UserStatus,
                role: (userRole?.roleId as any)?.name ?? "",
                phone: userProfile.contact?.phone.formatted,
                address: {
                  line1: userProfile.addresses?.[0]?.line1 ?? "",
                  town: userProfile.addresses?.[0]?.town ?? "",
                  county: userProfile.addresses?.[0]?.county ?? "",
                  postalCode: userProfile.addresses?.[0]?.postalCode ?? "",
                  country: userProfile.addresses?.[0]?.country ?? "",
                },
                isActive: userProfile.status === UserStatus.ACTIVE,
                isVerified: !!userProfile.verification?.emailVerifiedAt,
                createdAt: (userProfile.createdAt as Date).toISOString(),
                updatedAt: (userProfile.updatedAt as Date).toISOString(),
              },
              context: {
                role: userRole
                  ? {
                      id: (userRole._id as mongoose.Types.ObjectId)?.toString(),
                      name: (userRole.roleId as any)?.name ?? "",
                      isPrimary: userRole.isPrimary ?? true,
                    }
                  : null,
                member: member
                  ? {
                      id: (member._id as mongoose.Types.ObjectId)?.toString(),
                      type: member.type,
                      name: member.name,
                      logo: member.logo,
                      plan: (member.plan as any)?.name ?? "basic",
                    }
                  : null,
                organization: organization
                  ? {
                      id: (
                        organization._id as mongoose.Types.ObjectId
                      )?.toString(),
                      name: (organization as any).name,
                      logo: (organization as any).logo,
                      type: (organization as any).type,
                    }
                  : null,
                profile: profile
                  ? {
                      type: (userRole?.roleId as any)?.name ?? "",
                      data: profile,
                    }
                  : null,
              },
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            set.status = 500;
            return {
              status: "error",
              message: "Failed to fetch user",
              error: errorMessage,
            };
          }
        },
        {
          response: {
            200: t.Object({
              status: t.Literal("success"),
              user: t.Object({
                id: t.String(),
                memberId: t.Optional(t.String()),
                avatar: t.Optional(t.String()),
                username: t.String(),
                firstName: t.String(),
                lastName: t.String(),
                email: t.String(),
                role: t.String(),
                phone: t.Optional(t.String()),
                address: t.Optional(
                  t.Object({
                    line1: t.String(),
                    town: t.String(),
                    postalCode: t.String(),
                    county: t.String(),
                    country: t.String(),
                  })
                ),
                status: t.Enum(UserStatus),
                isActive: t.Boolean(),
                isVerified: t.Boolean(),
                createdAt: t.String(),
                updatedAt: t.String(),
              }),
              context: t.Optional(
                t.Object({
                  role: t.Optional(
                    t.Nullable(
                      t.Object({
                        id: t.String(),
                        name: t.String(),
                        isPrimary: t.Boolean(),
                      })
                    )
                  ),
                  member: t.Optional(
                    t.Nullable(
                      t.Object({
                        id: t.String(),
                        type: t.Optional(t.String()),
                        name: t.String(),
                        logo: t.Optional(t.String()),
                        plan: t.String(),
                      })
                    )
                  ),
                  organization: t.Optional(
                    t.Nullable(
                      t.Object({
                        id: t.String(),
                        name: t.String(),
                        logo: t.Optional(t.String()),
                        type: t.String(),
                      })
                    )
                  ),
                  profile: t.Optional(
                    t.Nullable(
                      t.Object({
                        type: t.String(),
                        data: t.Any(),
                      })
                    )
                  ),
                })
              ),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
              error: t.String(),
            }),
          },
          detail: {
            tags: ["me"],
            summary: "Fetch current user",
            description: "Fetch the current user",
          },
        }
      )
      .get(
        "/upload-token",
        async ({ user, jwt, query }) => {
          try {
            const { public: isPublic, organization } = query;

            const sub = organization ? `${organization}/${user.id}` : user.id;

            const token = await jwt.sign(
              {
                sub,
                public: isPublic === "true",
                imado: !!process.env.AWS_S3_UPLOAD_ACCESS_KEY_ID,
              }
              // process.env.TUS_SECRET
            );

            return {
              status: "success",
              token,
            };
          } catch (error) {
            return {
              status: "error",
              message: (error as Error).message,
            };
          }
        },
        {
          query: t.Object({
            public: t.Optional(t.String()),
            organization: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              token: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["me"],
            summary: "Get upload token",
            description:
              "This endpoint is used to get an upload token for a user or organization. The token can be used to upload public or private images/files to your S3 bucket using imado.",
          },
        }
      )
      /*
       *  Get SSE stream
       */
      .get(
        "/sse",
        // 👇 the handler is a *generator* (function*), not a regular function
        async function* ({ user, set }) {
          // set SSE headers **once**, before the first yield
          set.headers["Content-Encoding"] = "";
          // ----- 1️⃣ send a “connected” event -----
          yield sse({
            event: "connected",
            data: "connected",
            retry: 5000,
          });
          // store the generator so we could abort it later if needed
          // (Elysia will auto‑cancel when the client disconnects)
          clients.set(user.id, (yield* [] as any) as any); // placeholder, just to keep the map
          console.info("User connected to SSE", user.id);

          // ----- 2️⃣ keep‑alive loop -----
          while (true) {
            yield sse({
              event: "ping",
              data: "pong",
              retry: 5000,
            });
            // pause 30 s between pings
            await new Promise((r) => setTimeout(r, 30_000));
          }
        },
        {
          // optional OpenAPI / swagger detail
          detail: {
            tags: ["me"],
            summary: "Get SSE stream",
            description: "Get a Server-Sent Events stream for the current user",
          },
        }
      )
  );
