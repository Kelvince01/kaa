import crypto from "node:crypto";
import { Session } from "@kaa/models";
import { getDeviceInfo } from "@kaa/utils";
import axios from "axios";
import Elysia, { type Context, t } from "elysia";
import type mongoose from "mongoose";
import type { SessionStore } from "~/services/session-store";
import { authPlugin } from "./auth.plugin";

export const sessionController = new Elysia().group("sessions", (app) =>
  app
    .use(authPlugin)
    .get(
      "/",
      async ({ set, user, headers, cookie: { session_id } }) => {
        try {
          // Find all sessions for this user
          const sessions = await Session.find({
            userId: user.id,
            isRevoked: false,
          }).sort({
            lastActive: -1,
          });

          // Get the current session ID (from request headers or cookies)
          let currentSessionId = headers["x-session-id"] as string;
          if (!currentSessionId && session_id.value) {
            currentSessionId = session_id.value as string;
          }

          set.status = 200;
          return {
            status: "success",
            sessions,
            currentSessionId,
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Get sessions error:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to retrieve sessions",
            error: errorMessage,
          };
        }
      },
      {
        detail: {
          tags: ["session"],
          summary: "Get all sessions",
        },
      }
    )
    .delete(
      "/",
      async ({ set, user, headers }) => {
        try {
          const currentSessionId = headers["x-session-id"] as string;

          // Delete all sessions except the current one
          const result = await Session.deleteMany({
            user: user.id,
            _id: { $ne: currentSessionId },
          });

          set.status = 200;
          return {
            status: "success",
            message: "All other sessions terminated successfully",
            count: result.deletedCount,
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Terminate all sessions error:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to terminate sessions",
            error: errorMessage,
          };
        }
      },
      {
        detail: {
          tags: ["session"],
          summary: "Delete all sessions",
        },
      }
    )
    .delete(
      "/:id",
      async ({ set, params, user }) => {
        try {
          const { id } = params;

          // Find and delete the session
          const session = await Session.findOneAndDelete({
            _id: id,
            user: user.id,
          });

          if (!session) {
            set.status = 404;
            return {
              status: "error",
              message:
                "Session not found or doesn't belong to the current user",
            };
          }

          set.status = 200;
          return {
            status: "success",
            message: "Session terminated successfully",
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Terminate session error:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to terminate session",
            error: errorMessage,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["session"],
          summary: "Delete session",
        },
      }
    )
);

/**
 * Create or update a session during login
 * @param userId - User ID
 * @param token - JWT token
 * @param req - Express request object
 * @returns Session ID
 */
export const createOrUpdateSession = async (
  userId: string,
  token: string,
  authType: "regular" | "impersonation",
  authStrategy: "password" | "otp" | "oauth",
  ctx: Context,
  sessionStore: SessionStore
): Promise<{ sessionId: string; expiresAt: Date }> => {
  try {
    // const userAgent = req.headers["user-agent"] || "Unknown";
    // const ip = req.ip || req.socket.remoteAddress || "Unknown";
    const device = ctx.headers.device || "Unknown";

    const { userAgent, ip, os, browser } = getDeviceInfo(
      ctx.request,
      ctx.server
    );

    // Try to get location information from IP
    let location = {
      city: "Unknown",
      region: "Unknown",
      country: "Unknown",
      latitude: 0,
      longitude: 0,
    };

    try {
      // Use a free IP geolocation service
      const geoResponse = await axios.get(`https://ipapi.co/${ip}/json/`);
      if (geoResponse.data) {
        location = {
          city: geoResponse.data.city || "Unknown",
          region: geoResponse.data.region || "Unknown",
          country: geoResponse.data.country_name || "Unknown",
          latitude: geoResponse.data.latitude || 0,
          longitude: geoResponse.data.longitude || 0,
        };
      }
    } catch (error) {
      console.warn("Failed to get location information:", error);
      // Continue without location data
    }

    // Check if a session with this user agent and IP already exists
    let session = await Session.findOne({
      userId,
      userAgent,
      ip,
    });

    // const sessionId = randomUUIDv7();
    const sessionId = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    //  const now = Date.now();
    // const expiresAt = new Date(now + SECURITY_CONFIG.sessionMaxAge * 1000);

    if (session) {
      // Update last active time
      session.lastActive = new Date();
      await session.save();
    } else {
      // Create a new session
      session = await Session.create({
        userId,
        sessionId,
        expiresAt,
        deviceInfo: {
          userAgent,
          ip,
          os: os || "Unknown",
          browser: browser || "Unknown",
          deviceType: ctx.headers.device_type || "unknown",
          deviceHash: crypto
            .createHash("sha256")
            .update(device as string)
            .digest("hex"),
        },
        location,
        token,
        lastActive: new Date(),
        authType,
        authStrategy,
      });
    }

    // Also create in SessionStore for consistency if DB storage
    if (sessionStore && process.env.SESSION_STORAGE === "db") {
      await sessionStore.set({
        id: sessionId,
        userId,
        csrfToken: null, // DB sessions don't need CSRF
        createdAt: new Date(),
        expiresAt,

        sessionId,
        token,
        authType,
        authStrategy,
        deviceInfo: {
          userAgent,
          ip: ip ?? "Unknown",
          os: (os as unknown as string) || "Unknown",
          browser: (browser as unknown as string) || "Unknown",
          deviceType:
            (ctx.headers.device_type as
              | "desktop"
              | "mobile"
              | "tablet"
              | "unknown"
              | undefined) || "unknown",
          deviceHash: crypto
            .createHash("sha256")
            .update(device as string)
            .digest("hex"),
        },
        location,
        lastActive: new Date(),
        valid: true,
        isRevoked: false,
      });
    }

    return {
      sessionId: (session._id as mongoose.Types.ObjectId).toString(),
      expiresAt,
    };
  } catch (error) {
    console.error("Error creating/updating session:", error);
    throw error;
  }
};
