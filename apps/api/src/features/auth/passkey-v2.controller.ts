import { Passkey } from "@kaa/models";
import { passkeyV2Service, userService } from "@kaa/services";
import { Elysia, t } from "elysia";
import type mongoose from "mongoose";
import { authPlugin } from "./auth.plugin";

export const passkeyV2Controller = new Elysia().group("passkey-v2", (app) =>
  app.use(authPlugin).post(
    "/verify",
    async (ctx) => {
      const {
        body,
        cookie: { passkey_challenge },
      } = ctx;
      try {
        const { clientDataJSON, authenticatorData, signature, userEmail } =
          body;
        const strategy = "passkey";

        // Retrieve user and challenge record
        const user = await userService.getUserBy({
          "contact.email": userEmail.toLowerCase(),
        });
        if (!user) {
          return {
            status: "error",
            message: "User not found",
          };
        }

        // Check if passkey challenge exists
        const challengeFromCookie = passkey_challenge.value as string;
        if (!challengeFromCookie) {
          return {
            status: "error",
            message: "Invalid credentials",
          };
        }

        const credentials = await Passkey.findOne({
          userId: user._id as mongoose.Types.ObjectId,
          deletedAt: null,
        });
        if (!credentials) {
          return {
            status: "error",
            message: "Passkey not found",
          };
        }

        const isValid = passkeyV2Service.verifyPassKeyPublic(
          signature,
          authenticatorData,
          clientDataJSON,
          credentials.publicKey,
          challengeFromCookie
        );

        if (!isValid) {
          return {
            status: "error",
            message: "Invalid token",
          };
        }

        return {
          status: "success",
          message: "Passkey verified",
        };
      } catch (error) {
        return {
          status: "error",
          message: "Error verifying passkey",
        };
      }
    },
    {
      body: t.Object({
        signature: t.String(),
        authenticatorData: t.String(),
        clientDataJSON: t.String(),
        userEmail: t.String(),
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
      },
      detail: {
        tags: ["passkey-v2"],
        summary: "Verify passkey v2",
        description:
          "Verify passkey by checking the validity of signature with public key.",
      },
    }
  )
);
