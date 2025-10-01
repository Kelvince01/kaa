import crypto from "node:crypto";
import { AppError } from "@kaa/utils";

// Generate timestamp
export const getTimestamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hour}${minute}${second}`;
};

// Generate password
export const getPassword = (
  shortcode: number,
  passkey: string,
  timestamp: string
) => {
  const data = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(data).toString("base64");
};

// Validate phone number
export const validatePhoneNumber = (phoneNumber: string) => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, "");
  // const formattedPhone = phoneNumber.replace(/^(?:\+254|0)/, "254");

  // Check if it starts with 254 (Kenya code)
  if (!cleaned.startsWith("254")) {
    // If it starts with 0, replace with 254
    if (cleaned.startsWith("0")) {
      cleaned = `254${cleaned.substring(1)}`;
    } else {
      // Add 254 prefix
      cleaned = `254${cleaned}`;
    }
  }

  // Ensure it's 12 digits (254 + 9 digits)
  if (cleaned.length !== 12) {
    throw new AppError("Invalid phone number format", 400);
  }

  return cleaned;
};

// Utility function for security credential
export function generateSecurityCredential(
  mpesaPublicKey: string,
  mpesaInitiatorPassword: string
) {
  const publicKey = `-----BEGIN PUBLIC KEY-----
  ${mpesaPublicKey}
  -----END PUBLIC KEY-----`;

  return crypto
    .publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(mpesaInitiatorPassword)
    )
    .toString("base64");
}
