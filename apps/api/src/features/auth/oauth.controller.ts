import { cookie } from "@elysiajs/cookie";
import config from "@kaa/config/api";
import { OAuthConnection, User } from "@kaa/models";
import type { IUser } from "@kaa/models/types";
import { userService } from "@kaa/services";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { jwtPlugin } from "~/plugins/security.plugin";
import { authPlugin } from "./auth.plugin";
import { createOrUpdateSession } from "./session.controller";

export const oauthController = new Elysia().group("oauth", (app) =>
  app
    .use(jwtPlugin)
    .use(cookie())
    .get(
      "/google",
      ({ set, redirect }) => {
        try {
          const GOOGLE_OAUTH_URL =
            "https://accounts.google.com/o/oauth2/v2/auth";
          const GOOGLE_CLIENT_ID = config.oauth.google.clientId;
          const GOOGLE_CALLBACK_URL = `${config.app.url}/api/v1/oauth/google/callback`;
          const GOOGLE_OAUTH_SCOPES = [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
          ];
          const state = crypto.randomUUID(); // Generate a CSRF token

          const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_CALLBACK_URL,
            access_type: "offline",
            response_type: "code",
            state,
            scope: GOOGLE_OAUTH_SCOPES.join(" "),
            prompt: "consent",
          });

          const GOOGLE_OAUTH_CONSENT_SCREEN_URL = `${GOOGLE_OAUTH_URL}?${params.toString()}`;

          return redirect(GOOGLE_OAUTH_CONSENT_SCREEN_URL);
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to initiate Google OAuth",
          };
        }
      },
      {
        detail: {
          tags: ["oauth"],
          summary: "Google OAuth login",
        },
      }
    )
    .get(
      "/google/callback",
      async (ctx) => {
        const { set, query, redirect, jwt, cookie } = ctx;
        try {
          const { code, error } = query;

          if (error) {
            console.error("Google auth error:", error);
            return redirect(`${config.clientUrl}/auth/login?error=auth_failed`);
          }

          if (!code) {
            console.error("No code provided");
            return redirect(`${config.clientUrl}/auth/login?error=no_user`);
          }

          try {
            // Exchange code for access token
            const tokenResponse = await fetch(
              "https://oauth2.googleapis.com/token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  client_id: config.oauth.google.clientId,
                  client_secret: config.oauth.google.clientSecret,
                  code,
                  grant_type: "authorization_code",
                  redirect_uri: `${config.app.url}/api/v1/oauth/google/callback`,
                }),
              }
            );

            const tokenData: any = await tokenResponse.json();

            if (!tokenData.access_token) {
              return redirect(
                `${config.clientUrl}/auth/login?error=auth_failed`
              );
            }

            // Get user info from Google
            const userResponse = await fetch(
              "https://www.googleapis.com/oauth2/v2/userinfo",
              {
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                },
              }
            );

            const googleProfile: any = await userResponse.json();

            // Process user with your existing logic
            const user = await processGoogleUser(
              googleProfile,
              tokenData.access_token,
              tokenData.refresh_token
            );

            // Create JWT token
            const token = await jwt.sign({
              sub: (user._id as mongoose.Types.ObjectId).toString(),
              iss: "google",
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
            });

            // Create or update session
            const sessionId = await createOrUpdateSession(
              (user._id as mongoose.Types.ObjectId).toString(),
              token,
              "regular",
              "oauth",
              ctx
            );

            // Set cookie
            cookie.session_id.set({
              value: sessionId,
              httpOnly: true,
              maxAge: config.jwt.expiresIn,
              sameSite: "lax",
            });

            // Set cookie
            cookie.access_token.set({
              value: token,
              httpOnly: true,
              maxAge: config.jwt.expiresIn,
              sameSite: "lax",
            });

            // Set cookie
            cookie.refresh_token.set({
              value: tokenData.refresh_token,
              httpOnly: true,
              maxAge: config.jwt.refreshTokenExpiresIn,
              sameSite: "lax",
            });

            // Redirect to frontend with token
            return redirect(
              `${config.clientUrl}/auth/oauth-callback?token=${token}`
            );
          } catch (error: any) {
            console.error("Google OAuth error:", error);
            return redirect(`${config.clientUrl}/auth/login?error=auth_failed`);
          }
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to process Google OAuth",
          };
        }
      },
      {
        query: t.Object({
          code: t.String(),
          error: t.Optional(t.String()),
          state: t.Optional(t.String()),
        }),
        detail: {
          tags: ["oauth"],
          summary: "Google OAuth callback",
        },
      }
    )
    .get(
      "/microsoft",
      ({ set, redirect }) => {
        try {
          set.status = 200;

          const params = new URLSearchParams({
            client_id: config.oauth.microsoft.clientId,
            response_type: "code",
            redirect_uri: `${config.clientUrl}/auth/microsoft/callback`,
            response_mode: "query",
            scope: "openid profile email User.Read",
            state: "random-state-string", // Use a proper random state in production
          });

          return redirect(
            `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
          );
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to redirect to Microsoft OAuth",
          };
        }
      },
      {
        detail: {
          tags: ["oauth"],
          summary: "Microsoft OAuth login",
        },
      }
    )
    .get(
      "/microsoft/callback",
      async (ctx) => {
        const { set, query, redirect, jwt, cookie } = ctx;
        try {
          const { code, error, state } = query;

          if (error) {
            console.error("Microsoft auth error:", error);
            return redirect(`${config.clientUrl}/auth/login?error=auth_failed`);
          }

          if (!code) {
            return redirect(`${config.clientUrl}/auth/login?error=no_user`);
          }

          try {
            // Exchange code for access token
            const tokenResponse = await fetch(
              "https://login.microsoftonline.com/common/oauth2/v2.0/token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  client_id: config.oauth.microsoft.clientId,
                  client_secret: config.oauth.microsoft.clientSecret,
                  code: code as string,
                  grant_type: "authorization_code",
                  redirect_uri: `${config.clientUrl}/auth/microsoft/callback`,
                }),
              }
            );

            const tokenData: any = await tokenResponse.json();

            if (!tokenData.access_token) {
              return redirect(
                `${config.clientUrl}/auth/login?error=auth_failed`
              );
            }

            // Get user info from Microsoft Graph
            const userResponse = await fetch(
              "https://graph.microsoft.com/v1.0/me",
              {
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                },
              }
            );

            const userData: any = await userResponse.json();

            // Process user with your existing logic
            const user = await processMicrosoftUser(
              userData,
              tokenData.access_token,
              tokenData.refresh_token
            );

            // Create JWT token
            const token = await jwt.sign({
              sub: (user._id as mongoose.Types.ObjectId).toString(),
              iss: "microsoft",
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
            });

            const sessionId = await createOrUpdateSession(
              (user._id as mongoose.Types.ObjectId).toString(),
              token,
              "regular",
              "oauth",
              ctx
            );

            // Set cookie
            cookie.access_token.set({
              value: token,
              httpOnly: true,
              maxAge: config.jwt.expiresIn,
              sameSite: "lax",
            });

            // Set cookie
            cookie.refresh_token.set({
              value: tokenData.refresh_token,
              httpOnly: true,
              maxAge: config.jwt.refreshTokenExpiresIn,
              sameSite: "lax",
            });

            // Set cookie
            cookie.session_id.set({
              value: sessionId,
              httpOnly: true,
              maxAge: config.jwt.expiresIn,
              sameSite: "lax",
            });

            // Redirect to frontend with token
            return redirect(
              `${config.clientUrl}/auth/oauth-callback?token=${token}`
            );
          } catch (error) {
            console.error("Microsoft OAuth error:", error);
            return redirect(`${config.clientUrl}/auth/login?error=auth_failed`);
          }
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to process Microsoft OAuth",
          };
        }
      },
      {
        query: t.Object({
          code: t.String(),
          error: t.Optional(t.String()),
          state: t.Optional(t.String()),
        }),
        detail: {
          tags: ["oauth"],
          summary: "Microsoft OAuth callback",
        },
      }
    )
    .use(authPlugin)

    /**
     * Get user's OAuth connections
     */
    .get(
      "/connections",
      async ({ set, user }) => {
        try {
          // Find the user
          const userObj = await User.findById(user.id);

          if (!userObj) {
            set.status = 404;
            return {
              status: "error",
              message: "User not found",
            };
          }
          // Get all OAuth connections for this user
          const connections = await OAuthConnection.find({
            userId: userObj._id,
          }).select("-accessToken -refreshToken");

          set.status = 200;
          return {
            status: "success",
            connections,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get OAuth connections",
          };
        }
      },
      {
        detail: {
          tags: ["oauth"],
          summary: "Get OAuth connections",
        },
      }
    )

    /**
     * Link OAuth account to existing user
     */
    .post(
      "/link",
      async ({ set, body, user }) => {
        try {
          const {
            provider,
            providerUserId,
            accessToken,
            refreshToken,
            profile,
            expiresAt,
          } = body;

          // Find the user
          const userObj = await User.findById(user.id);

          if (!userObj) {
            set.status = 404;
            return {
              status: "error",
              message: "User not found",
            };
          }

          // Check if this OAuth connection already exists for another user
          const existingConnection = await OAuthConnection.findOne({
            provider,
            providerUserId,
          });

          if (
            existingConnection &&
            !existingConnection.userId.equals(
              userObj._id as mongoose.Types.ObjectId
            )
          ) {
            set.status = 400;
            return {
              status: "error",
              message:
                "This OAuth account is already connected to another user",
            };
          }

          // Create or update OAuth connection
          await OAuthConnection.findOneAndUpdate(
            { provider, providerUserId },
            {
              userId: userObj._id,
              provider,
              providerUserId,
              accessToken,
              refreshToken,
              expiresAt: expiresAt ? new Date(expiresAt) : undefined,
              profile,
            },
            { upsert: true, new: true }
          );

          set.status = 200;
          return {
            status: "success",
            user: userObj.getPublicProfile(),
            message: "OAuth account linked successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to link OAuth account",
          };
        }
      },
      {
        body: t.Object({
          provider: t.String(),
          providerUserId: t.String(),
          accessToken: t.String(),
          refreshToken: t.String(),
          profile: t.Object({}),
          expiresAt: t.Number(),
        }),
        detail: {
          tags: ["oauth"],
          summary: "Link OAuth account",
        },
      }
    )

    /**
     * Unlink OAuth account from existing user
     */
    .post(
      "/unlink",
      async ({ body, set, user }) => {
        try {
          const { provider } = body;

          // Find the user
          const userObj = await User.findById(user.id);

          if (!userObj) {
            set.status = 404;
            return {
              status: "error",
              message: "User not found",
            };
          }

          // Get all OAuth connections for this user
          const connections = await OAuthConnection.find({
            userId: userObj._id,
          });

          // If this is the only OAuth connection and user has no password, prevent unlinking
          if (
            connections.length === 1 &&
            connections[0].provider === provider &&
            !userObj.password
          ) {
            set.status = 400;
            return {
              status: "error",
              message:
                "Cannot unlink the only OAuth account without setting a password first",
            };
          }

          // Remove OAuth connection
          const result = await OAuthConnection.deleteOne({
            userId: userObj._id,
            provider,
          });

          if (result.deletedCount === 0) {
            set.status = 404;
            return {
              status: "error",
              message: `No ${provider} connection found for this user`,
            };
          }

          set.status = 200;
          return {
            status: "success",
            user: userObj.getPublicProfile(),
            message: "OAuth account unlinked successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to unlink OAuth account",
          };
        }
      },
      {
        body: t.Object({
          provider: t.String(),
        }),
        detail: {
          tags: ["oauth"],
          summary: "Unlink OAuth account",
        },
      }
    )
);

/**
 * Handle Google OAuth user processing
 */
async function processGoogleUser(
  profile: any,
  accessToken: string,
  refreshToken?: string
): Promise<IUser> {
  try {
    // Check if an OAuth connection exists
    const oauthConnection = await OAuthConnection.findOne({
      provider: "google",
      providerUserId: profile.id,
    });

    let user: IUser | null;

    if (oauthConnection) {
      // Find user by ID from existing connection
      user = await User.findById(oauthConnection.userId);

      if (!user) {
        throw new Error("User associated with OAuth connection not found");
      }

      // Update tokens
      oauthConnection.accessToken = accessToken;
      if (refreshToken) oauthConnection.refreshToken = refreshToken;

      // Set expiry if available
      if (profile._json?.exp) {
        oauthConnection.expiresAt = new Date(profile._json.exp * 1000);
      }

      await oauthConnection.save();
    } else {
      // Check if user exists with this email
      const email = profile.email;
      if (!email) {
        throw new Error("Email not provided by Google");
      }

      user = await User.findOne({ email });

      if (user) {
        // Create new OAuth connection for existing user
        await OAuthConnection.create({
          userId: user._id,
          provider: "google",
          providerUserId: profile.id,
          accessToken,
          refreshToken,
          expiresAt: profile._json?.exp
            ? new Date(profile._json.exp * 1000)
            : undefined,
          profile: {
            name:
              profile.name ||
              `${profile.given_name || ""} ${profile.family_name || ""}`.trim(),
            picture: profile.picture,
            email,
          },
        });
      } else {
        const existingUser = await userService.getUserBy({ email });
        if (existingUser) {
          throw new Error("User already exists");
        }

        const existingByUsername = await userService.getUserBy({
          username: profile.email,
        });
        if (existingByUsername) {
          throw new Error("Username already in use");
        }

        // TODO: Get phone number from Google or include providence option
        const phone =
          profile.phoneNumber ||
          `+2547${Math.floor(10_000_000 + Math.random() * 90_000_000)}`;

        // Create new user
        const { user } = await userService.createUser(
          {
            body: {
              email,
              firstName: profile.given_name || "",
              lastName: profile.family_name || "",
              avatar: profile.picture,
              role: "user",
              username: profile.email,
              password: Math.random().toString(36).slice(-8),
              phone,
              isVerified: true,
              isActive: true,
              status: "active",
            },
          },
          true
        );

        // Create OAuth connection for new user
        await OAuthConnection.create({
          userId: user._id,
          provider: "google",
          providerUserId: profile.id,
          accessToken,
          refreshToken,
          expiresAt: profile._json?.exp
            ? new Date(profile._json.exp * 1000)
            : undefined,
          profile: {
            name:
              profile.name ||
              `${profile.given_name || ""} ${profile.family_name || ""}`.trim(),
            picture: profile.picture,
            email,
          },
        });
      }
    }

    return user as IUser;
  } catch (error) {
    throw new Error("Failed to process Google user");
  }
}

/**
 * Handle Microsoft OAuth user processing
 */
async function processMicrosoftUser(
  profile: any,
  accessToken: string,
  refreshToken?: string
): Promise<IUser> {
  try {
    // Check if an OAuth connection exists
    const oauthConnection = await OAuthConnection.findOne({
      provider: "microsoft",
      providerUserId: profile.id,
    });

    let user: IUser | null;

    if (oauthConnection) {
      // Find user by ID from existing connection
      user = await User.findById(oauthConnection.userId);

      if (!user) {
        throw new Error("User associated with OAuth connection not found");
      }

      // Update tokens
      oauthConnection.accessToken = accessToken;
      if (refreshToken) oauthConnection.refreshToken = refreshToken;

      // Set expiry if available
      if (profile._json?.exp) {
        oauthConnection.expiresAt = new Date(profile._json.exp * 1000);
      }

      await oauthConnection.save();
    } else {
      // Check if user exists with this email
      const email = profile.emails?.[0].value;
      if (!email) {
        throw new Error("Email not provided by Microsoft");
      }

      user = await User.findOne({ email });

      if (user) {
        // Create new OAuth connection for existing user
        await OAuthConnection.create({
          userId: user._id,
          provider: "microsoft",
          providerUserId: profile.id,
          accessToken,
          refreshToken,
          expiresAt: profile._json?.exp
            ? new Date(profile._json.exp * 1000)
            : undefined,
          profile: {
            name: `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim(),
            picture: profile.photos?.[0]?.value,
            email,
          },
        });
      } else {
        // Create new user
        user = await User.create({
          email,
          firstName: profile.name?.givenName || "",
          lastName: profile.name?.familyName || "",
          profileImage: profile.photos?.[0]?.value,
          isEmailVerified: true,
          password: Math.random().toString(36).slice(-8), // Random password for OAuth users
        });

        // Create OAuth connection for new user
        await OAuthConnection.create({
          userId: user._id,
          provider: "microsoft",
          providerUserId: profile.id,
          accessToken,
          refreshToken,
          expiresAt: profile._json?.exp
            ? new Date(profile._json.exp * 1000)
            : undefined,
          profile: {
            name: `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim(),
            picture: profile.photos?.[0]?.value,
            email,
          },
        });
      }
    }

    return user;
  } catch (error) {
    throw new Error("Failed to process Microsoft user");
  }
}
