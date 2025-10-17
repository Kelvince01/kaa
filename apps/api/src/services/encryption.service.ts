import crypto from "node:crypto";
import type { EncryptedPayload, KeyPair } from "~/types/encryption.type";

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class E2EEncryption {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 256;

  // Generate a new encryption key
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: E2EEncryption.ALGORITHM,
        length: E2EEncryption.KEY_LENGTH,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  // Generate RSA key pair for signing
  static async generateSigningKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
    return keyPair as KeyPair;
  }

  // Encrypt data

  static async encrypt(data: any, key: CryptoKey): Promise<EncryptedPayload> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: E2EEncryption.ALGORITHM,
        iv,
      },
      key as crypto.webcrypto.CryptoKey,
      encodedData
    );

    // Convert binary data to base64 strings
    return {
      iv: Buffer.from(iv).toString("base64"),
      encryptedData: Buffer.from(encryptedData).toString("base64"),
      signature: "", // Will be added by signPayload method
    };
  }

  // Decrypt data

  static async decrypt(
    payload: EncryptedPayload,
    key: CryptoKey
  ): Promise<any> {
    const iv = Buffer.from(payload.iv, "base64");
    const encryptedData = Buffer.from(payload.encryptedData, "base64");

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: E2EEncryption.ALGORITHM,
        iv,
      },
      key as crypto.webcrypto.CryptoKey,
      encryptedData
    );

    return JSON.parse(new TextDecoder().decode(decryptedData));
  }

  // Sign payload
  static async signPayload(
    payload: EncryptedPayload,
    privateKey: CryptoKey
  ): Promise<string> {
    const dataToSign = payload.iv + payload.encryptedData;
    const signature = await crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      privateKey as crypto.webcrypto.CryptoKey,
      new TextEncoder().encode(dataToSign)
    );
    return Buffer.from(signature).toString("base64");
  }

  // Verify signature
  static async verifySignature(
    payload: EncryptedPayload,
    publicKey: CryptoKey
  ): Promise<boolean> {
    const dataToVerify = payload.iv + payload.encryptedData;
    const signature = Buffer.from(payload.signature, "base64");

    return await crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      publicKey as crypto.webcrypto.CryptoKey,
      signature,
      new TextEncoder().encode(dataToVerify)
    );
  }
}
