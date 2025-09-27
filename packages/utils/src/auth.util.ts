import crypto, { createHash } from "node:crypto";
import type { Server } from "elysia/universal";
import { UAParser } from "ua-parser-js";

export const hashPassword = async (password: string): Promise<string> => {
  // biome-ignore lint/correctness/noUndeclaredVariables: false positive
  return await Bun.password.hash(password);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  // biome-ignore lint/correctness/noUndeclaredVariables: false positive
  return await Bun.password.verify(password, hashedPassword);
};

export function md5hash(text: string) {
  return createHash("md5").update(text).digest("hex");
}

export const getDeviceInfo = (request: Request, server: Server | null) => {
  const userAgent = request.headers.get("user-agent") || "";
  const { device, os, browser } = new UAParser(userAgent).getResult();
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    server?.requestIP(request)?.address;
  // || ctx.request.socket.remoteAddress;

  const getName = () => {
    if (device.model && device.vendor)
      return `${device.vendor} ${device.model}`;
    return device.model || device.vendor || null;
  };

  const getType = (): "mobile" | "desktop" => {
    return device.type === "wearable" || device.type === "mobile"
      ? "mobile"
      : "desktop";
  };

  const deviceInfo = {
    userAgent,
    ip,
    name: getName(),
    type: getType(),
    os,
    browser,
  };
  return deviceInfo;
};

// Generate and hash verification token
export const generateVerificationToken = () => {
  // Generate token
  const verificationTokenHex = crypto.randomBytes(32).toString("hex");

  // Hash token and set to verificationToken field
  const verificationToken = crypto
    .createHash("sha256")
    .update(verificationTokenHex)
    .digest("hex");

  // Set expire
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { verificationTokenHex, verificationToken, verificationExpires };
};

// Generate and hash password reset token
export const generateResetPasswordToken = () => {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and set to resetPasswordToken field
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return { resetToken: resetTokenHash, resetExpiry };
};
