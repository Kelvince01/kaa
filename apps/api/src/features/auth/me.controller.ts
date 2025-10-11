import jwt from "@elysiajs/jwt";
import Stream from "@elysiajs/stream";
import { Passkey, User } from "@kaa/models";
import { UserStatus } from "@kaa/models/types";
import {
  memberService,
  passkeyV2Service,
  roleService,
  userService,
} from "@kaa/services";
import { Elysia, t } from "elysia";
import type mongoose from "mongoose";
import { authPlugin } from "./auth.plugin";

export const streams = new Map<string, any>();

export const meController = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: "me-jwt",
    })
  )
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

        // Get user role
        const userRole = await roleService.getUserRoleBy({
          userId: userProfile._id?.toString() ?? "",
        });
        const member = await memberService.getMemberBy({
          user: userProfile._id?.toString() ?? "",
        });

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
            firstName: userProfile.profile?.firstName,
            lastName: userProfile.profile?.lastName,
            email: userProfile.contact?.email,
            status: userProfile.status as string,
            role: (userRole?.roleId as any)?.name ?? "",
            phone: userProfile.contact?.phone.formatted,
            address: userProfile.addresses?.[0],
            isActive: userProfile.status === UserStatus.ACTIVE,
            isVerified: !!userProfile.verification?.emailVerifiedAt,
            createdAt: (userProfile.createdAt as Date).toISOString(),
            updatedAt: (userProfile.updatedAt as Date).toISOString(),
          } as any,
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
            status: t.String(),
            isActive: t.Boolean(),
            isVerified: t.Boolean(),
            createdAt: t.String(),
            updatedAt: t.String(),
          }),
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
        tags: ["auth"],
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
  .post(
    "/passkey",
    async ({ set, body, cookie: { passkey_challenge } }) => {
      try {
        const { userEmail, attestationObject, clientDataJSON } = body;

        const userData = await userService.getUserBy({
          "contact.email": userEmail,
        });

        const challengeFromCookie = passkey_challenge.value as string;
        if (!challengeFromCookie) {
          set.status = 401;
          return {
            status: "error",
            message: "Invalid credentials",
          };
        }

        const { credentialId, publicKey } =
          passkeyV2Service.parseAndValidatePasskeyAttestation(
            clientDataJSON,
            attestationObject,
            challengeFromCookie
          );

        await Passkey.create({
          userId: userData?._id as mongoose.Types.ObjectId,
          credentialId,
          publicKey,
          counter: 0,
        });

        set.status = 200;
        return {
          status: "success",
          message: "Passkey created successfully",
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to create passkey",
        };
      }
    },
    {
      body: t.Object({
        userEmail: t.String(),
        attestationObject: t.String(),
        clientDataJSON: t.String(),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          message: t.String(),
        }),
        401: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["me"],
        summary: "Create passkey",
        description:
          "The server associates the public key and the credential ID with the user for future authentication flows and checks the validity of the operation by verifying the signed challenge with the public key.",
      },
    }
  )
  /*
   *  Get SSE stream
   */
  .get(
    "/sse",
    ({ user, set }) => {
      return new Stream(async (stream) => {
        set.headers["Content-Encoding"] = "";
        streams.set(user.id, stream);

        console.info("User connected to SSE", user.id);
        stream.send({
          event: "connected",
          data: "connected",
          retry: 5000,
        });

        //   stream.onAbort(async () => {
        //     console.info("User disconnected from SSE", user.id);
        //     await streams.delete(user.id);
        //   });

        // Keep connection alive
        while (true) {
          stream.send({
            event: "ping",
            data: "pong",
            retry: 5000,
          });
          await stream.wait(30_000);
        }
      });
    },
    {
      detail: {
        tags: ["auth"],
      },
    }
  );
