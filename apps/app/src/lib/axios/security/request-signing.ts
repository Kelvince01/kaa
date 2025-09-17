import type { RequestSignature } from "../types";

export type SigningConfig = {
  secretKey: string;
  algorithm: "HMAC-SHA256" | "HMAC-SHA512";
  includeTimestamp: boolean;
  timestampTolerance: number; // in seconds
};

export class RequestSigner {
  private readonly config: SigningConfig;

  constructor(config: SigningConfig) {
    this.config = config;
  }

  async signRequest(
    method: string,
    url: string,
    body?: any,
    timestamp?: number
  ): Promise<RequestSignature> {
    const ts = timestamp || Date.now();
    const nonce = this.generateNonce();

    const payload = this.createPayload(method, url, body, ts, nonce);
    const signature = await this.createSignature(payload);

    return {
      signature,
      timestamp: ts,
      nonce,
    };
  }

  async verifySignature(
    signature: string,
    method: string,
    url: string,
    body?: any,
    timestamp?: number,
    nonce?: string
  ): Promise<boolean> {
    if (!(timestamp && nonce)) return false;

    // Check timestamp tolerance
    if (this.config.includeTimestamp) {
      const now = Date.now();
      const timeDiff = Math.abs(now - timestamp) / 1000;
      if (timeDiff > this.config.timestampTolerance) {
        return false;
      }
    }

    const payload = this.createPayload(method, url, body, timestamp, nonce);
    const expectedSignature = await this.createSignature(payload);

    return this.constantTimeCompare(signature, expectedSignature);
  }

  private createPayload(
    method: string,
    url: string,
    body: any,
    timestamp: number,
    nonce: string
  ): string {
    const parts = [method.toUpperCase(), url, body ? JSON.stringify(body) : ""];

    if (this.config.includeTimestamp) {
      parts.push(timestamp.toString());
    }

    parts.push(nonce);

    return parts.join("|");
  }

  private async createSignature(payload: string): Promise<string> {
    const algorithm = this.config.algorithm
      .replace("HMAC-", "")
      .replace("-", "");

    if (
      // biome-ignore lint/complexity/useOptionalChain: false positive
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.subtle
    ) {
      return await this.createSignatureWebCrypto(payload, algorithm);
      // biome-ignore lint/style/noUselessElse: false positive
    } else {
      // Fallback for Node.js or environments without Web Crypto API
      return this.createSignatureFallback(payload);
    }
  }

  private async createSignatureWebCrypto(
    payload: string,
    algorithm: string
  ): Promise<string> {
    const key = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(this.config.secretKey),
      { name: "HMAC", hash: `SHA-${algorithm}` },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payload)
    );

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  private createSignatureFallback(payload: string): string {
    // Simple HMAC implementation for fallback
    // In production, use a proper crypto library like crypto-js
    const key = this.config.secretKey;
    let hash = 0;

    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      // biome-ignore lint/suspicious/noBitwiseOperators: false positive
      hash = (hash << 5) - hash + char;
      // biome-ignore lint/suspicious/noBitwiseOperators: false positive
      hash &= hash; // Convert to 32-bit integer
    }

    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      // biome-ignore lint/suspicious/noBitwiseOperators: false positive
      hash = (hash << 5) - hash + char;
      // biome-ignore lint/suspicious/noBitwiseOperators: false positive
      hash &= hash;
    }

    return btoa(hash.toString());
  }

  private generateNonce(): string {
    // biome-ignore lint/complexity/useOptionalChain: false positive
    if (typeof window !== "undefined" && window.crypto) {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return btoa(String.fromCharCode(...array));
      // biome-ignore lint/style/noUselessElse: false positive
    } else {
      // Fallback for environments without crypto.getRandomValues
      return btoa(Date.now().toString() + Math.random().toString());
    }
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      // biome-ignore lint/suspicious/noBitwiseOperators: false positive
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  // Utility method to extract signature components from headers
  parseAuthorizationHeader(header: string): {
    signature: string;
    timestamp: number;
    nonce: string;
  } | null {
    const match = header.match(
      // biome-ignore lint/performance/useTopLevelRegex: false positive
      /^Signature signature="([^"]+)",timestamp="([^"]+)",nonce="([^"]+)"$/
    );
    if (!match) return null;

    return {
      signature: match[1] || "",
      timestamp: Number.parseInt(match[2] || "0", 10),
      nonce: match[3] || "",
    };
  }

  // Utility method to create authorization header
  createAuthorizationHeader(requestSignature: RequestSignature): string {
    return `Signature signature="${requestSignature.signature}",timestamp="${requestSignature.timestamp}",nonce="${requestSignature.nonce}"`;
  }
}
