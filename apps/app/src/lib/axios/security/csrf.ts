import { config } from "@/config";

const tokenRegex = /^[a-zA-Z0-9+/]+=*$/;

export class CSRFProtection {
  private readonly tokenCache: Map<string, { token: string; expires: number }> =
    new Map();

  async getCSRFToken(forceRefresh = false): Promise<string | null> {
    if (typeof window === "undefined") return null;

    const cacheKey = "csrf_token";
    const cached = this.tokenCache.get(cacheKey);

    // Return cached token if valid and not forcing refresh
    if (!forceRefresh && cached && Date.now() < cached.expires) {
      return cached.token;
    }

    // Try to get token from meta tag first
    const metaToken = this.getTokenFromMeta();
    if (metaToken) {
      this.cacheToken(cacheKey, metaToken);
      return metaToken;
    }

    // Try to get token from cookie
    const cookieToken = this.getTokenFromCookie();
    if (cookieToken) {
      this.cacheToken(cacheKey, cookieToken);
      return cookieToken;
    }

    // If no token found, request a new one
    return await this.requestNewToken();
  }

  private getTokenFromMeta(): string | null {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag?.getAttribute("content") || null;
  }

  private getTokenFromCookie(): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "csrf_token" || name === "XSRF-TOKEN") {
        return decodeURIComponent(value || "");
      }
    }
    return null;
  }

  private async requestNewToken(): Promise<string | null> {
    try {
      const response = await fetch(`${config.apiUrl}/csrf-token`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      // Handle the response format from api
      const token = data?.data?.token || data?.csrfToken || data?.token;

      if (token) {
        this.cacheToken("csrf_token", token);
        return token;
      }
    } catch (error) {
      console.warn("Failed to fetch CSRF token:", error);
    }

    return null;
  }

  private cacheToken(key: string, token: string): void {
    const expires = Date.now() + 30 * 60 * 1000; // 30 minutes
    this.tokenCache.set(key, { token, expires });
  }

  validateToken(token: string): boolean {
    if (!token || typeof token !== "string") return false;

    // Basic token format validation
    if (!tokenRegex.test(token)) return false;

    // Check minimum length
    if (token.length < 16) return false;

    return true;
  }

  clearCache(): void {
    this.tokenCache.clear();
  }

  // Double submit cookie pattern validation
  validateDoubleSubmit(headerToken: string, cookieToken: string): boolean {
    return headerToken === cookieToken && this.validateToken(headerToken);
  }

  // Generate a client-side token for double submit pattern
  generateClientToken(): string {
    if (typeof window === "undefined") return "";

    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }
}
