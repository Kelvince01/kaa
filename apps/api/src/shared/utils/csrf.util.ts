import crypto from "node:crypto";
import { SECURITY_CONFIG } from "~/config/security.config";

const CSRF_SECRET = process.env.CSRF_SECRET_KEY || "default-csrf-secret-key";
const TOKEN_LIFETIME = 3_600_000; // 1 hour in milliseconds

type CSRFTokenData = {
  timestamp: number;
  nonce: string;
};

export function generateCSRFToken(): string {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");

  const tokenData: CSRFTokenData = { timestamp, nonce };
  const tokenString = JSON.stringify(tokenData);

  // Create HMAC signature
  const hmac = crypto.createHmac("sha256", CSRF_SECRET);
  hmac.update(tokenString);
  const signature = hmac.digest("hex");

  // Combine token data and signature
  const token = Buffer.from(`${tokenString}.${signature}`).toString("base64");

  return token;
}

export function verifyCSRFToken(token: string): boolean {
  try {
    // Decode token
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [tokenString, signature] = decoded.split(".");

    if (!(tokenString && signature)) {
      return false;
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", CSRF_SECRET);
    hmac.update(tokenString);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
      return false;
    }

    // Parse token data
    const tokenData: CSRFTokenData = JSON.parse(tokenString);

    // Check if token is expired
    const now = Date.now();
    if (now - tokenData.timestamp > TOKEN_LIFETIME) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export function extractCSRFToken(
  headers: Record<string, string | undefined>
): string | null {
  // Check X-CSRF-Token header first
  const headerToken = headers[SECURITY_CONFIG.csrfHeaderName];
  if (headerToken) {
    return headerToken;
  }

  // Check Authorization header for CSRF token
  const authHeader = headers.authorization;
  if (authHeader?.startsWith("CSRF ")) {
    return authHeader.substring(5);
  }

  return null;
}
