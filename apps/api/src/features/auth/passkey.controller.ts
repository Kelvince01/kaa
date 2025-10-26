import config from "@kaa/config/api";
import { Passkey, User } from "@kaa/models";
import type { IOTP, IUser } from "@kaa/models/types";
import {
  base64ToUint8Array,
  getPasskeyRpId,
  uint8ArrayToBase64,
} from "@kaa/utils";
import {
  // AuthenticationResponseJSON,
  // RegistrationResponseJSON,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import * as kvService from "~/services/kv.service";

export type Locale = "en" | "sw";

export type GetAuthorizeReqDto = {
  clientId: string;
  redirectUri: string;
  responseType: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  authorizeMethod?: string | undefined;
  scopes: string[];
  locale: Locale;
  policy?: string | undefined;
  org?: string | undefined;
};

export type AuthCodeBody = {
  request: GetAuthorizeReqDto;
  user: IUser;
  otpCode: IOTP;
  appId: string;
  appName: string;
  isFullyAuthorized?: boolean;
};

export type EnrollOptions = {
  rpId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  challenge: string;
};

export const passkeyController = new Elysia().group("passkey", (app) =>
  app
    .post(
      "/enroll",
      async ({ set, body }) => {
        const { userId, credentialId, publicKey, counter } = body;

        const publicKeyUint8Array = Uint8Array.from(Object.values(publicKey));

        const publicKeyBase64 = uint8ArrayToBase64(publicKeyUint8Array);

        try {
          await Passkey.create({
            userId,
            credentialId,
            publicKey: publicKeyBase64,
            counter,
            credentialDeviceType: "singleDevice",
            credentialBackedUp: false,
            name: "Default Passkey",
          });

          set.status = 200;
          return {
            status: "success",
          };
        } catch (error) {
          console.error("Error creating user passkey:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create user passkey",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        body: t.Object({
          userId: t.String(),
          credentialId: t.String(),
          publicKey: t.Union([t.Uint8Array(), t.Any()]),
          counter: t.Number(),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Create user passkey",
        },
      }
    )
    .get(
      "/:userId",
      async ({ set, params }) => {
        const { userId } = params;

        const passkey = await Passkey.findOne({
          userId,
          deletedAt: null,
        });

        if (!passkey) {
          set.status = 404;
          return {
            status: "error",
            message: "Passkey not found",
          };
        }

        set.status = 200;
        return {
          status: "success",
          passkey,
        };
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Get user passkey",
        },
      }
    )
    .get(
      "/:userId/list",
      async ({ set, params }) => {
        const { userId } = params;

        const passkeys = await Passkey.find({
          userId,
          deletedAt: null,
        });

        set.status = 200;

        return {
          status: "success",
          passkeys,
          message: "Passkeys fetched successfully",
        };
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Get user passkeys",
        },
      }
    )
    .get(
      "/user/:email",
      async ({ set, params }) => {
        const { email } = params;

        const user = await User.findOne({
          email,
          deletedAt: null,
        });

        if (!user) {
          set.status = 404;
          return {
            status: "error",
            message: "User not found",
          };
        }

        const passkey = await Passkey.findOne({
          userId: user._id,
          deletedAt: null,
        });

        if (!passkey) {
          set.status = 404;
          return {
            status: "error",
            message: "Passkey not found",
          };
        }

        set.status = 200;
        return {
          status: "success",
          user,
          passkey,
        };
      },
      {
        params: t.Object({
          email: t.String(),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Get user passkey",
        },
      }
    )
    .patch(
      "/:passkeyId",
      async ({ set, params, body }) => {
        const { passkeyId } = params;
        const { counter } = body;

        await Passkey.findByIdAndUpdate(passkeyId, {
          counter,
          updatedAt: new Date(),
        });

        set.status = 200;
        return {
          status: "success",
        };
      },
      {
        params: t.Object({
          passkeyId: t.String(),
        }),
        body: t.Object({
          counter: t.Number(),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Update passkey counter",
        },
      }
    )
    .delete(
      "/:passkeyId/:userId",
      async ({ set, params }) => {
        const { passkeyId, userId } = params;

        const passkey = await Passkey.findOne({
          userId,
          deletedAt: null,
        });

        if (
          !passkey ||
          (passkey._id as mongoose.Types.ObjectId).toString() !== passkeyId
        ) {
          set.status = 401;
          return {
            status: "error",
            message: "Unauthorized",
          };
        }

        await Passkey.findByIdAndUpdate(passkeyId, {
          deletedAt: new Date(),
        });

        set.status = 200;
        return {
          status: "success",
        };
      },
      {
        params: t.Object({
          passkeyId: t.String(),
          userId: t.String(),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Delete passkey",
        },
      }
    )
    .post(
      "/enroll/options",
      async ({ set, body }) => {
        const { authCodeStore } = body;

        const registrationOptions = await generateRegistrationOptions({
          rpName: "",
          rpID: "",
          userName: "",
        });

        const challenge = registrationOptions.challenge;
        await kvService.setPasskeyEnrollChallenge(
          authCodeStore.user.id,
          challenge
        );

        const enrollOptions: EnrollOptions = {
          rpId: getPasskeyRpId(),
          userId: authCodeStore.user.id,
          userEmail: authCodeStore.user.email ?? "",
          userDisplayName: `${authCodeStore.user.firstName ?? ""} ${authCodeStore.user.lastName ?? ""}`,
          challenge,
        };

        set.status = 200;
        return {
          status: "success",
          enrollOptions,
        };
      },
      {
        body: t.Object({
          authCodeStore: t.Object({
            user: t.Object({
              id: t.String(),
              email: t.String(),
              firstName: t.String(),
              lastName: t.String(),
            }),
          }),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Generate passkey enrollment options",
        },
      }
    )
    .post(
      "/verify/options",
      async ({ set, body }) => {
        const { email } = body;

        const user = await User.findOne({
          email,
          deletedAt: null,
        });

        if (!user) {
          set.status = 404;
          return {
            status: "error",
            message: "User not found",
          };
        }

        const passkey = await Passkey.findOne({
          userId: user._id,
          deletedAt: null,
        });

        if (!passkey) {
          set.status = 404;
          return {
            status: "error",
            message: "Passkey not found",
          };
        }

        const options = await generateAuthenticationOptions({
          rpID: getPasskeyRpId(),
          allowCredentials: [{ id: passkey.credentialId }],
          userVerification: "preferred",
          timeout: 60_000,
        });

        return {
          status: "success",
          options,
        };
      },
      {
        body: t.Object({
          email: t.String(),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Generate passkey verification options",
        },
      }
    )
    .post(
      "/process/enroll",
      async ({ set, body }) => {
        const { authCodeStore, enrollInfo } = body;

        const challenge = await kvService.getPasskeyEnrollChallenge(
          authCodeStore.user.id
        );

        if (!challenge) {
          set.status = 401;
          return {
            status: "error",
            message: "Invalid request",
          };
        }

        const authServerUrl = config.clientUrl; // config.app.url;
        if (!authServerUrl) {
          set.status = 500;
          return {
            status: "error",
            message: "API URL not configured",
          };
        }

        let verification: Awaited<
          ReturnType<typeof verifyRegistrationResponse>
        >;
        try {
          verification = await verifyRegistrationResponse({
            response: {
              id: enrollInfo.id,
              rawId: enrollInfo.rawId,
              type: enrollInfo.type as "public-key",
              response: {
                clientDataJSON: enrollInfo.clientDataJSON,
                attestationObject: enrollInfo.attestationObject,
              },
              clientExtensionResults: {},
            },
            expectedChallenge: challenge ?? "",
            expectedOrigin: authServerUrl,
            expectedRPID: getPasskeyRpId(),
            requireUserVerification: false,
            requireUserPresence: false,
            // supportedAlgorithmIDs: [-7, -257],
            // attestationSafetyNetEnforceCTSCheck: true,
          });
        } catch (error) {
          console.error("Error verifying registration response:", error);
          set.status = 401;
          return {
            status: "error",
            message: "Invalid request",
          };
        }

        const passkeyId = verification.registrationInfo?.credential.id;
        const passkeyPublickey =
          verification.registrationInfo?.credential.publicKey;
        const passkeyCounter =
          verification.registrationInfo?.credential.counter || 0;

        if (!(verification.verified && passkeyPublickey && passkeyId)) {
          set.status = 401;
          return {
            status: "error",
            message: "Invalid request",
          };
        }

        return {
          status: "success",
          passkeyId,
          passkeyPublickey,
          passkeyCounter,
        };
      },
      {
        body: t.Object({
          authCodeStore: t.Object({
            user: t.Object({
              id: t.String(),
              email: t.String(),
              firstName: t.String(),
              lastName: t.String(),
            }),
          }),
          enrollInfo: t.Object({
            id: t.String(),
            rawId: t.String(),
            type: t.String(),
            clientDataJSON: t.String(),
            attestationObject: t.String(),
          }),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Process passkey verification",
        },
      }
    )
    .post(
      "/process/verify",
      async ({ set, body, params }) => {
        const { email } = params;
        const { passkeyInfo } = body;

        const challenge = await kvService.getPasskeyVerifyChallenge(email);

        if (!challenge) {
          set.status = 403;
          return {
            status: "error",
            message: "Invalid request",
          };
        }

        const user = await User.findOne({
          email,
          deletedAt: null,
        });

        if (!user) {
          set.status = 404;
          return {
            status: "error",
            message: "User not found",
          };
        }

        const passkey = await Passkey.findOne({
          userId: user._id,
          deletedAt: null,
        });

        if (!passkey) {
          set.status = 404;
          return {
            status: "error",
            message: "Passkey not found",
          };
        }

        const authServerUrl = config.clientUrl;
        if (!authServerUrl) {
          set.status = 500;
          return {
            status: "error",
            message: "API URL not configured",
          };
        }

        let verification: Awaited<
          ReturnType<typeof verifyAuthenticationResponse>
        >;
        try {
          verification = await verifyAuthenticationResponse({
            // TODO: Fix this
            response: passkeyInfo as any,
            expectedChallenge: challenge,
            expectedOrigin: authServerUrl,
            expectedRPID: getPasskeyRpId(),
            credential: {
              id: passkey.credentialId,
              publicKey: base64ToUint8Array(passkey.publicKey),
              counter: passkey.counter,
            },
          });
        } catch (error) {
          set.status = 401;
          return {
            status: "error",
            message: "Invalid request",
          };
        }

        if (!verification.verified) {
          set.status = 401;
          return {
            status: "error",
            message: "Invalid request",
          };
        }

        set.status = 200;
        return {
          status: "success",
          user,
          passkeyId: passkey._id,
          newCounter: verification.authenticationInfo?.newCounter,
        };
      },
      {
        params: t.Object({
          email: t.String(),
        }),
        body: t.Object({
          passkeyInfo: t.Object({
            id: t.String(),
            rawId: t.String(),
            type: t.String(),
            clientDataJSON: t.String(),
            attestationObject: t.String(),
          }),
        }),
        detail: {
          tags: ["passkey"],
          summary: "Process passkey verification",
        },
      }
    )
);
