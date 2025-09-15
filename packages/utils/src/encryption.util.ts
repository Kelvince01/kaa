import crypto from "node:crypto";
import config from "@kaa/config/api";

type EncryptionConfig = {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  salt: string;
};

const encryptionConfig: EncryptionConfig = {
  algorithm: "aes-256-gcm",
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  salt: process.env.ENCRYPTION_SALT || "kaa-saas-default-salt-2024",
};

/**
 * Derives a key from the JWT secret and salt using PBKDF2
 */
function deriveKey(): Buffer {
  const secret = config.jwt.secret;
  const salt = Buffer.from(encryptionConfig.salt, "utf8");
  return crypto.pbkdf2Sync(
    secret,
    salt,
    100_000,
    encryptionConfig.keyLength,
    "sha256"
  );
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @returns Encrypted data in format: iv:authTag:encryptedData (base64 encoded)
 */
export function encryptSensitiveData(plaintext: string): string {
  try {
    const key = deriveKey();
    const iv = crypto.randomBytes(encryptionConfig.ivLength);
    const cipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv, {
      // @ts-expect-error
      authTagLength: encryptionConfig.tagLength,
    });
    cipher.setAAD(Buffer.from("kaa-saas-auth-data"));

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    const result = `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
    return result;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt sensitive data");
  }
}

/**
 * Decrypts sensitive data using AES-256-GCM
 * @param encryptedData - Encrypted data in format: iv:authTag:encryptedData (base64 encoded)
 * @returns Decrypted plaintext
 */
export function decryptSensitiveData(encryptedData: string): string {
  try {
    const [ivBase64, authTagBase64, encrypted] = encryptedData.split(":");

    if (!(ivBase64 && authTagBase64 && encrypted)) {
      throw new Error("Invalid encrypted data format");
    }

    const key = deriveKey();
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    const decipher = crypto.createDecipheriv(
      encryptionConfig.algorithm,
      key,
      iv,
      {
        // @ts-expect-error
        authTagLength: encryptionConfig.tagLength,
      }
    );
    decipher.setAAD(Buffer.from("kaa-saas-auth-data"));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt sensitive data");
  }
}

/**
 * Encrypts refresh tokens specifically
 * @param token - The refresh token to encrypt
 * @returns Encrypted token
 */
export function encryptRefreshToken(token: string): string {
  return encryptSensitiveData(token);
}

/**
 * Decrypts refresh tokens specifically
 * @param encryptedToken - The encrypted refresh token
 * @returns Decrypted token
 */
export function decryptRefreshToken(encryptedToken: string): string {
  return decryptSensitiveData(encryptedToken);
}

/**
 * Encrypts API keys
 * @param apiKey - The API key to encrypt
 * @returns Encrypted API key
 */
export function encryptApiKey(apiKey: string): string {
  return encryptSensitiveData(apiKey);
}

/**
 * Decrypts API keys
 * @param encryptedApiKey - The encrypted API key
 * @returns Decrypted API key
 */
export function decryptApiKey(encryptedApiKey: string): string {
  return decryptSensitiveData(encryptedApiKey);
}

/**
 * Encrypts OAuth tokens
 * @param token - The OAuth token to encrypt
 * @returns Encrypted token
 */
export function encryptOAuthToken(token: string): string {
  return encryptSensitiveData(token);
}

/**
 * Decrypts OAuth tokens
 * @param encryptedToken - The encrypted OAuth token
 * @returns Decrypted token
 */
export function decryptOAuthToken(encryptedToken: string): string {
  return decryptSensitiveData(encryptedToken);
}

/**
 * Encrypts MFA secrets
 * @param secret - The MFA secret to encrypt
 * @returns Encrypted secret
 */
export function encryptMFASecret(secret: string): string {
  return encryptSensitiveData(secret);
}

/**
 * Decrypts MFA secrets
 * @param encryptedSecret - The encrypted MFA secret
 * @returns Decrypted secret
 */
export function decryptMFASecret(encryptedSecret: string): string {
  return decryptSensitiveData(encryptedSecret);
}

/**
 * Encrypts session tokens
 * @param token - The session token to encrypt
 * @returns Encrypted token
 */
export function encryptSessionToken(token: string): string {
  return encryptSensitiveData(token);
}

/**
 * Decrypts session tokens
 * @param encryptedToken - The encrypted session token
 * @returns Decrypted token
 */
export function decryptSessionToken(encryptedToken: string): string {
  return decryptSensitiveData(encryptedToken);
}

/**
 * Checks if data appears to be encrypted (has the expected format)
 * @param data - Data to check
 * @returns True if data appears encrypted
 */
export function isEncrypted(data: string): boolean {
  if (!data || typeof data !== "string") return false;
  const parts = data.split(":");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

/**
 * Safely encrypts data only if it's not already encrypted
 * @param data - Data to encrypt
 * @returns Encrypted data or original if already encrypted
 */
export function safeEncrypt(data: string): string {
  if (isEncrypted(data)) {
    return data;
  }
  return encryptSensitiveData(data);
}

/**
 * Safely decrypts data only if it appears to be encrypted
 * @param data - Data to decrypt
 * @returns Decrypted data or original if not encrypted
 */
export function safeDecrypt(data: string): string {
  if (!isEncrypted(data)) {
    return data;
  }
  return decryptSensitiveData(data);
}
