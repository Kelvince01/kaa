import type { Context } from "elysia";

/**
 * Parse user agent to detect device type, browser, and OS
 */
export function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();

  // Device type detection
  let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
  if (ua.includes("mobile") && !ua.includes("tablet")) {
    deviceType = "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    deviceType = "tablet";
  }

  // Browser detection
  let browser = "unknown";
  if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edge")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  // OS detection
  let os = "unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os") || ua.includes("macos")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad"))
    os = "iOS";

  return { deviceType, browser, os };
}

/**
 * Detect if user agent belongs to a bot or crawler
 */
export function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "crawl",
    "scraper",
    "scraping",
    "googlebot",
    "bingbot",
    "slurp",
    "duckduckbot",
    "baiduspider",
    "yandexbot",
    "facebookexternalhit",
    "twitterbot",
    "whatsapp",
    "telegram",
    "linkedinbot",
    "instagram",
    "pinterest",
    "reddit",
    "python-requests",
    "curl",
    "wget",
    "postman",
    "insomnia",
    "httpie",
    "axios",
    "fetch",
    "node-fetch",
  ];

  return botPatterns.some((pattern) => ua.includes(pattern));
}

/**
 * Determine traffic source based on referrer
 */
export function determineSource(
  referrer?: string
): "direct" | "search" | "social" | "email" | "ads" | "other" {
  if (!referrer) return "direct";

  const ref = referrer.toLowerCase();

  // Search engines
  if (
    ref.includes("google") ||
    ref.includes("bing") ||
    ref.includes("yahoo") ||
    ref.includes("duckduckgo") ||
    ref.includes("baidu")
  ) {
    return "search";
  }

  // Social media
  if (
    ref.includes("facebook") ||
    ref.includes("twitter") ||
    ref.includes("instagram") ||
    ref.includes("linkedin") ||
    ref.includes("youtube") ||
    ref.includes("tiktok") ||
    ref.includes("whatsapp") ||
    ref.includes("telegram")
  ) {
    return "social";
  }

  // Email clients
  if (
    ref.includes("mail") ||
    ref.includes("gmail") ||
    ref.includes("outlook")
  ) {
    return "email";
  }

  // Ads platforms
  if (
    ref.includes("googleads") ||
    ref.includes("facebook.com/tr") ||
    ref.includes("doubleclick") ||
    ref.includes("adsystem")
  ) {
    return "ads";
  }

  return "other";
}

/**
 * Extract session ID from Elysia context (from cookie or generate new one)
 */
export function getSessionId(ctx: any): string {
  // Try to get from cookie first
  const sessionId = ctx.cookie?.sessionId?.value || ctx.headers["x-session-id"];
  if (sessionId) return sessionId;

  // Generate new session ID
  return generateSessionId();
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get client IP address from Elysia context
 */
export function getClientIP(ctx: any): string {
  // In Elysia, we can access IP from various sources
  return (
    ctx.request?.ip ||
    ctx.headers["x-forwarded-for"]?.split(",")[0] ||
    ctx.headers["x-real-ip"] ||
    ctx.headers["cf-connecting-ip"] || // Cloudflare
    ctx.headers["x-client-ip"] ||
    ctx.connection?.remoteAddress ||
    "127.0.0.1"
  );
}

/**
 * Parse screen resolution from request headers
 */
export function getScreenResolution(ctx: any): string | undefined {
  // Some mobile apps send screen resolution in custom headers
  const resolution =
    ctx.headers["x-screen-resolution"] || ctx.headers["x-viewport-size"];

  if (resolution) return resolution;

  // Estimate from user agent for common devices
  const ua = ctx.headers["user-agent"]?.toLowerCase() || "";

  if (ua.includes("iphone")) {
    if (ua.includes("iphone 13") || ua.includes("iphone 12"))
      return "1170x2532";
    if (ua.includes("iphone 11")) return "828x1792";
    return "750x1334"; // Default iPhone resolution
  }

  if (ua.includes("ipad")) return "1024x1366";

  if (ua.includes("android")) {
    if (ua.includes("pixel")) return "1080x2340";
    return "1080x1920"; // Common Android resolution
  }

  return;
}

/**
 * Simple location estimation from IP (you'd typically use a real IP geolocation service)
 */
export function estimateLocation(ipAddress: string): {
  country?: string;
  city?: string;
} {
  // This is a mock implementation - in production you'd use services like:
  // - MaxMind GeoIP2
  // - ipapi.co
  // - ipinfo.io
  // - Google Cloud IP Geolocation API

  // For now, detect local/private IPs
  if (
    ipAddress === "127.0.0.1" ||
    ipAddress.startsWith("192.168.") ||
    ipAddress.startsWith("10.") ||
    ipAddress.startsWith("172.")
  ) {
    return { country: "Local", city: "Local" };
  }

  // Mock Kenyan location for external IPs (since this is a Kenyan property platform)
  return { country: "Kenya", city: "Nairobi" };
}

/**
 * Validate and sanitize analytics event data
 */
export function sanitizeEventData(data: any): any {
  const sanitized = { ...data };

  // Limit string lengths to prevent abuse
  if (sanitized.event && typeof sanitized.event === "string") {
    sanitized.event = sanitized.event.substring(0, 100);
  }

  if (sanitized.step && typeof sanitized.step === "string") {
    sanitized.step = sanitized.step.substring(0, 50);
  }

  if (sanitized.field && typeof sanitized.field === "string") {
    sanitized.field = sanitized.field.substring(0, 100);
  }

  // Sanitize metadata
  if (sanitized.metadata && typeof sanitized.metadata === "object") {
    // Remove any large objects or circular references
    try {
      const metadataStr = JSON.stringify(sanitized.metadata);
      if (metadataStr.length > 5000) {
        sanitized.metadata = {
          truncated: true,
          originalSize: metadataStr.length,
        };
      }
    } catch (error) {
      sanitized.metadata = { error: "Invalid metadata format" };
    }
  }

  // Limit value size
  if (
    sanitized.value &&
    typeof sanitized.value === "string" &&
    sanitized.value.length > 1000
  ) {
    sanitized.value = sanitized.value.substring(0, 1000);
  }

  return sanitized;
}

/**
 * Check if an event should be tracked (filter spam and irrelevant events)
 */
export function shouldTrackEvent(event: string, userAgent?: string): boolean {
  // Don't track bot events
  if (userAgent && isBot(userAgent)) return false;

  // Filter out common spam or test events
  const spamPatterns = ["test", "spam", "bot", "crawler"];
  if (spamPatterns.some((pattern) => event.toLowerCase().includes(pattern))) {
    return false;
  }

  // Only track meaningful events
  const validEventPatterns = [
    "page_view",
    "property_view",
    "form_",
    "step_",
    "field_",
    "ai_",
    "media_",
    "auto_save",
    "session_",
    "search_",
    "contact_",
    "inquiry_",
    "booking_",
    "payment_",
  ];

  return validEventPatterns.some((pattern) => event.includes(pattern));
}

/**
 * Create a standard event context from Elysia context
 */
export function createEventContext(ctx: Context, sessionId?: string) {
  const userAgent = ctx.headers["user-agent"] || "";
  const { deviceType, browser, os } = parseUserAgent(userAgent);

  return {
    sessionId: sessionId || getSessionId(ctx),
    ipAddress: getClientIP(ctx),
    userAgent,
    deviceType,
    browser,
    os,
    referrer: ctx.headers.referer || ctx.headers.referrer,
    source: determineSource(ctx.headers.referer || ctx.headers.referrer),
    screenResolution: getScreenResolution(ctx),
    location: estimateLocation(getClientIP(ctx)),
    isBot: isBot(userAgent),
  };
}

/**
 * Extract additional tracking metadata from Elysia context
 */
export function extractTrackingMetadata(ctx: Context) {
  return {
    method: ctx.request.method,
    url: ctx.request.url,
    route: ctx.path || ctx.request.url,
    query: ctx.query || {},
    timestamp: new Date(),
    requestId: ctx.headers["x-request-id"] || crypto.randomUUID(),
    contentType: ctx.headers["content-type"],
    acceptLanguage: ctx.headers["accept-language"],
    accept: ctx.headers.accept,
  };
}

/**
 * Check if request is from a mobile device
 */
export function isMobileRequest(ctx: Context): boolean {
  const userAgent = ctx.headers["user-agent"] || "";
  const { deviceType } = parseUserAgent(userAgent);
  return deviceType === "mobile";
}

/**
 * Get the current page/route from context
 */
export function getCurrentPage(ctx: Context): string {
  return ctx.path || new URL(ctx.request.url).pathname;
}
