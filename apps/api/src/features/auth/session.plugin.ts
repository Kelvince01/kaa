import { ApiKey, User } from "@kaa/models";
import mongoose from "mongoose";
import { randomUUIDv7 } from "bun";
import { Elysia } from "elysia";
import { SECURITY_CONFIG } from "~/config/security.config";
import { SessionStore } from "~/services/session-store";
import { parseCookies } from "~/shared/utils/parse-cookies";

function extractBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const [type, token] = header.split(" ");
  return type === "Bearer" ? token : null;
}

export function sessionPlugin() {
  const sessionStore = new SessionStore(process.env.SESSION_STORAGE as any);

  return new Elysia({ name: "session" })
    .derive(async ({ request, cookie }) => {
      const headers = request.headers;
      const cookies = parseCookies(headers.get("cookie") ?? "");
      const sessionId = cookies[SECURITY_CONFIG.sessionCookieName];

      let session = sessionId ? await sessionStore.get(sessionId) : null;
      let user = session?.userId
        ? await sessionStore.getUser(session.userId)
        : null;

      // Try to authorize by API key (priority above session)
      const apiKey =
        headers.get("x-api-key") ||
        extractBearerToken(headers.get("authorization"));
      if (apiKey) {
        const key = await ApiKey.findOne({ key: apiKey });
        user = (await User.findById(key?.userId)) ?? null;
      }

      // If there is no valid session — create a new guest session
      if (!session) {
        session = sessionStore.createNew();
        await sessionStore.set({
          id: session.id,
          userId: session.userId ?? new mongoose.Types.ObjectId("000000000000000000000000").toString(),
          csrfToken: session.csrfToken,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          sessionId: session.sessionId ?? randomUUIDv7(),
          token: session.token ?? "token",
          authType: session.authType ?? "regular",
          authStrategy: session.authStrategy ?? "password",
          deviceInfo: session.deviceInfo ?? {
            userAgent: "Unknown",
            ip: "Unknown",
            os: "Unknown",
            browser: "Unknown",
            deviceType: "unknown" as "desktop" | "mobile" | "tablet" | "unknown",
            deviceHash: "Unknown",
          },
          location: session.location ?? {
            city: "Unknown",
            region: "Unknown",
            country: "Unknown",
            latitude: 0,
            longitude: 0,
          },
          lastActive: session.lastActive ?? new Date(),
          valid: session.valid ?? true,
          isRevoked: session.isRevoked ?? false,
        });

        cookie[SECURITY_CONFIG.sessionCookieName].set({
          value: session.id,
          httpOnly: true,
          path: "/",
          maxAge: SECURITY_CONFIG.sessionMaxAge,
        });

        cookie[SECURITY_CONFIG.csrfCookieName].set({
          value: session.csrfToken,
          path: "/",
          sameSite: "strict",
        });
      }

      const csrfHeader = headers.get(SECURITY_CONFIG.csrfHeaderName) ?? null;

      return {
        session,
        sessionStore,
        sessionId: session.id,
        csrfToken: session.csrfToken,
        user,
        validateCsrf(): boolean {
          return (
            session.csrfToken !== null &&
            csrfHeader !== null &&
            session.csrfToken === csrfHeader
          );
        },
        getCsrfToken(): string {
          return randomUUIDv7();
        },
      };
    })
    .as("scoped");
}
