import crypto from "node:crypto";

const SIGNING_SECRET =
  process.env.REQUEST_SIGNING_SECRET_KEY || "default-dev-key";
const TIMESTAMP_TOLERANCE = 300; // 5 minutes in seconds

type RequestSignature = {
  signature: string;
  timestamp: number;
  nonce: string;
};

export function verifyRequestSignature(
  method: string,
  url: string,
  body: string,
  headers: Record<string, string | undefined>
): boolean {
  try {
    // Skip verification if request signing is disabled
    if (process.env.ENABLE_REQUEST_SIGNING === "false") {
      return true;
    }

    const signatureHeader = headers["x-signature"];
    const timestampHeader = headers["x-timestamp"];
    const nonceHeader = headers["x-nonce"];

    if (!(signatureHeader && timestampHeader && nonceHeader)) {
      return false;
    }

    const timestamp = Number.parseInt(timestampHeader, 10);
    const currentTime = Math.floor(Date.now() / 1000);

    // Check timestamp tolerance
    if (Math.abs(currentTime - timestamp) > TIMESTAMP_TOLERANCE) {
      return false;
    }

    // Create signature payload
    const payload = `${method}|${url}|${body}|${timestamp}|${nonceHeader}`;

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(payload)
      .digest("hex");

    // Compare signatures using constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (error) {
    return false;
  }
}

export function generateRequestSignature(
  method: string,
  url: string,
  body: string,
  timestamp?: number,
  nonce?: string
): RequestSignature {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const n = nonce || crypto.randomBytes(16).toString("hex");

  const payload = `${method}|${url}|${body}|${ts}|${n}`;

  const signature = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payload)
    .digest("hex");

  return {
    signature,
    timestamp: ts,
    nonce: n,
  };
}
