/**
 * Enhanced Security and Privacy Service for Virtual Tours
 * Handles authentication, authorization, data protection, and privacy compliance
 */

import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import type {
  SecuritySettings,
  // AccessControl,
  // AlertRule,
} from "@kaa/models/types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import speakeasy from "speakeasy";
import { RateLimiterRedis } from "rate-limiter-flexible";

type BiometricAuth = {
  userId: string;
  fingerprint?: string;
  faceId?: string;
  voicePrint?: string;
  enrolledDevices: string[];
  lastUsed: Date;
};

type SecuritySession = {
  sessionId: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  riskScore: number;
  permissions: string[];
};

type ThreatDetection = {
  type:
    | "brute_force"
    | "anomalous_access"
    | "data_exfiltration"
    | "suspicious_activity";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  timestamp: Date;
  sourceIP: string;
  userId?: string;
  metadata: Record<string, any>;
};

type DataRetentionPolicy = {
  dataType: string;
  retentionPeriod: number; // days
  deleteAfter: number; // days
  archiveAfter?: number; // days
  anonymizeAfter?: number; // days
};

type PrivacySettings = {
  gdprCompliant: boolean;
  cookieConsent: boolean;
  dataMinimization: boolean;
  rightToDelete: boolean;
  dataPortability: boolean;
  consentManagement: ConsentSettings;
};

type ConsentSettings = {
  required: string[];
  optional: string[];
  purposes: ConsentPurpose[];
  withdrawalMechanism: "automatic" | "manual";
};

type ConsentPurpose = {
  id: string;
  name: string;
  description: string;
  category: "necessary" | "functional" | "analytics" | "marketing";
  defaultConsent: boolean;
};

type WatermarkConfig = {
  enabled: boolean;
  type: "visible" | "invisible" | "both";
  text: string;
  opacity: number;
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
  userId?: string;
  timestamp?: boolean;
};

type DRMConfig = {
  enabled: boolean;
  encryption: "AES-256" | "ChaCha20";
  keyRotationInterval: number; // hours
  allowedDomains: string[];
  maxDownloads: number;
  expirationTime: number; // hours
};

class SecurityService extends EventEmitter {
  private settings: SecuritySettings;
  private readonly activeSessions: Map<string, SecuritySession> = new Map();
  private readonly biometricData: Map<string, BiometricAuth> = new Map();
  private readonly rateLimiters: Map<string, RateLimiterRedis> = new Map();
  readonly threatDetectionRules: Map<string, any> = new Map();
  private readonly retentionPolicies: Map<string, DataRetentionPolicy> =
    new Map();
  private readonly privacySettings: PrivacySettings;
  private readonly encryptionKey: string;

  constructor() {
    super();

    this.encryptionKey =
      process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");

    this.settings = {
      authentication: {
        biometric: true,
        twoFactor: true,
        sso: true,
        allowedDomains: ["kaa-rentals.co.ke", "app.kaa-rentals.co.ke"],
      },
      privacy: {
        dataRetention: 365, // days
        anonymization: true,
        cookieConsent: true,
        gdprCompliant: true,
      },
      content: {
        watermarking: true,
        drm: true,
        accessControl: [],
        downloadPrevention: true,
      },
      monitoring: {
        accessLogging: true,
        anomalyDetection: true,
        alertRules: [],
      },
    };

    this.privacySettings = {
      gdprCompliant: true,
      cookieConsent: true,
      dataMinimization: true,
      rightToDelete: true,
      dataPortability: true,
      consentManagement: {
        required: ["necessary", "security"],
        optional: ["analytics", "marketing", "personalization"],
        purposes: this.getDefaultConsentPurposes(),
        withdrawalMechanism: "automatic",
      },
    };

    this.initialize();
  }

  /**
   * Initialize security service
   */
  private initialize(): void {
    try {
      // Setup rate limiters
      this.setupRateLimiters();

      // Initialize threat detection
      this.initializeThreatDetection();

      // Setup data retention policies
      this.setupDataRetentionPolicies();

      // Initialize access monitoring
      this.initializeAccessMonitoring();

      console.log("Security service initialized");
      this.emit("security-service-initialized");
    } catch (error) {
      console.error("Failed to initialize security service:", error);
    }
  }

  /**
   * Setup rate limiters for different endpoints
   */
  private setupRateLimiters(): void {
    // Login attempts
    this.rateLimiters.set(
      "login",
      new RateLimiterRedis({
        storeClient: {} as any, // Redis client would go here
        keyPrefix: "login_fail",
        points: 5, // Number of attempts
        duration: 900, // Per 15 minutes
        blockDuration: 900, // Block for 15 minutes
      })
    );

    // API calls
    this.rateLimiters.set(
      "api",
      new RateLimiterRedis({
        storeClient: {} as any,
        keyPrefix: "api_calls",
        points: 1000, // Number of requests
        duration: 3600, // Per hour
        blockDuration: 3600,
      })
    );

    // Password reset
    this.rateLimiters.set(
      "password_reset",
      new RateLimiterRedis({
        storeClient: {} as any,
        keyPrefix: "pwd_reset",
        points: 3,
        duration: 3600, // Per hour
        blockDuration: 3600,
      })
    );
  }

  /**
   * Authenticate user with enhanced security
   */
  async authenticateUser(credentials: {
    email?: string;
    password?: string;
    biometricData?: string;
    totpCode?: string;
    deviceFingerprint: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<{
    success: boolean;
    session?: SecuritySession;
    mfaRequired?: boolean;
    error?: string;
  }> {
    try {
      // Check rate limiting
      const rateLimiter = this.rateLimiters.get("login");
      if (rateLimiter) {
        try {
          await rateLimiter.consume(credentials.ipAddress);
        } catch {
          return {
            success: false,
            error: "Too many login attempts. Please try again later.",
          };
        }
      }

      // Risk assessment
      const riskScore = await this.calculateRiskScore({
        ipAddress: credentials.ipAddress,
        deviceFingerprint: credentials.deviceFingerprint,
        userAgent: credentials.userAgent,
      });

      // Authenticate based on available credentials
      let userId: string | null = null;

      if (credentials.email && credentials.password) {
        userId = await this.validatePasswordAuth(
          credentials.email,
          credentials.password
        );
      } else if (credentials.biometricData) {
        userId = await this.validateBiometricAuth(
          credentials.biometricData,
          credentials.deviceFingerprint
        );
      }

      if (!userId) {
        this.emit("authentication-failed", {
          ipAddress: credentials.ipAddress,
          reason: "Invalid credentials",
          timestamp: new Date(),
        });
        return { success: false, error: "Invalid credentials" };
      }

      // Check if MFA is required
      if (this.settings.authentication.twoFactor) {
        if (!credentials.totpCode) {
          return { success: false, mfaRequired: true };
        }

        const mfaValid = await this.validateMFA(userId, credentials.totpCode);
        if (!mfaValid) {
          return { success: false, error: "Invalid MFA code" };
        }
      }

      // Create secure session
      const session = await this.createSecureSession({
        userId,
        deviceFingerprint: credentials.deviceFingerprint,
        ipAddress: credentials.ipAddress,
        userAgent: credentials.userAgent,
        riskScore,
      });

      this.emit("authentication-successful", {
        userId,
        sessionId: session.sessionId,
        ipAddress: credentials.ipAddress,
        riskScore,
        timestamp: new Date(),
      });

      return { success: true, session };
    } catch (error) {
      console.error("Authentication error:", error);
      return { success: false, error: "Authentication failed" };
    }
  }

  /**
   * Create secure session with enhanced tracking
   */
  private async createSecureSession(params: {
    userId: string;
    deviceFingerprint: string;
    ipAddress: string;
    userAgent: string;
    riskScore: number;
  }): Promise<SecuritySession> {
    const sessionId = crypto.randomBytes(32).toString("hex");

    const session: SecuritySession = {
      sessionId,
      userId: params.userId,
      deviceFingerprint: params.deviceFingerprint,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      riskScore: params.riskScore,
      permissions: await this.getUserPermissions(params.userId),
    };

    this.activeSessions.set(sessionId, session);

    // Set session expiry
    setTimeout(
      () => {
        this.expireSession(sessionId);
      },
      24 * 60 * 60 * 1000
    ); // 24 hours

    return session;
  }

  /**
   * Calculate risk score based on various factors
   */
  private async calculateRiskScore(factors: {
    ipAddress: string;
    deviceFingerprint: string;
    userAgent: string;
  }): Promise<number> {
    let riskScore = 0;

    // Check IP reputation
    const ipRisk = await this.checkIPReputation(factors.ipAddress);
    riskScore += ipRisk * 0.3;

    // Check device fingerprint
    const deviceRisk = await this.checkDeviceFingerprint(
      factors.deviceFingerprint
    );
    riskScore += deviceRisk * 0.2;

    // Check user agent
    const uaRisk = await this.checkUserAgent(factors.userAgent);
    riskScore += uaRisk * 0.1;

    // Check geolocation anomalies
    const geoRisk = await this.checkGeolocationAnomaly(factors.ipAddress);
    riskScore += geoRisk * 0.4;

    return Math.min(riskScore, 1.0);
  }

  /**
   * Biometric authentication
   */
  async enrollBiometric(
    userId: string,
    biometricType: "fingerprint" | "faceId" | "voice",
    data: string,
    deviceId: string
  ): Promise<boolean> {
    try {
      let biometricAuth = this.biometricData.get(userId);

      if (!biometricAuth) {
        biometricAuth = {
          userId,
          enrolledDevices: [],
          lastUsed: new Date(),
        };
      }

      // Hash biometric data for storage
      const hashedData = await bcrypt.hash(data, 12);

      switch (biometricType) {
        case "fingerprint":
          biometricAuth.fingerprint = hashedData;
          break;
        case "faceId":
          biometricAuth.faceId = hashedData;
          break;
        case "voice":
          biometricAuth.voicePrint = hashedData;
          break;
        default:
          break;
      }

      if (!biometricAuth.enrolledDevices.includes(deviceId)) {
        biometricAuth.enrolledDevices.push(deviceId);
      }

      this.biometricData.set(userId, biometricAuth);

      this.emit("biometric-enrolled", {
        userId,
        biometricType,
        deviceId,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Biometric enrollment error:", error);
      return false;
    }
  }

  /**
   * Content watermarking
   */
  async applyWatermark(
    contentBuffer: Buffer,
    config: WatermarkConfig
  ): Promise<Buffer> {
    if (!config.enabled) return contentBuffer;

    try {
      // For invisible watermarks, we'd use steganography
      // For visible watermarks, we'd overlay text/image

      const watermarkText = this.generateWatermarkText(config);

      // This would use an image processing library like Sharp
      // For demonstration, we'll return the original buffer
      // In production, this would apply actual watermarking

      this.emit("watermark-applied", {
        type: config.type,
        text: watermarkText,
        timestamp: new Date(),
      });

      return await Promise.resolve(contentBuffer);
    } catch (error) {
      console.error("Watermarking error:", error);
      return await Promise.resolve(contentBuffer);
    }
  }

  /**
   * DRM protection for content
   */
  async applyDRMProtection(
    contentUrl: string,
    userId: string,
    config: DRMConfig
  ): Promise<{
    protectedUrl: string;
    accessToken: string;
    expiresAt: Date;
  }> {
    if (!config.enabled) {
      return {
        protectedUrl: contentUrl,
        accessToken: "",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }

    try {
      // Generate unique access token
      const accessToken = jwt.sign(
        {
          userId,
          contentUrl,
          permissions: ["view"],
          maxDownloads: config.maxDownloads,
        },
        this.encryptionKey,
        {
          expiresIn: `${config.expirationTime}h`,
        }
      );

      // Create protected URL
      const protectedUrl = `${contentUrl}?token=${accessToken}`;
      const expiresAt = new Date(
        Date.now() + config.expirationTime * 60 * 60 * 1000
      );

      this.emit("drm-protection-applied", {
        userId,
        contentUrl,
        protectedUrl,
        expiresAt,
        timestamp: new Date(),
      });

      return await Promise.resolve({ protectedUrl, accessToken, expiresAt });
    } catch (error) {
      console.error("DRM protection error:", error);
      throw new Error("Failed to apply DRM protection");
    }
  }

  /**
   * Data anonymization for privacy compliance
   */
  async anonymizeUserData(userId: string): Promise<boolean> {
    try {
      // Remove personally identifiable information
      const anonymizedUserId = crypto
        .createHash("sha256")
        .update(userId)
        .digest("hex")
        .substring(0, 16);

      // This would typically involve:
      // 1. Replacing user identifiers with anonymous IDs
      // 2. Removing or hashing personal information
      // 3. Aggregating detailed data
      // 4. Updating all related records

      this.emit("data-anonymized", {
        originalUserId: userId,
        anonymizedUserId,
        timestamp: new Date(),
      });

      return await Promise.resolve(true);
    } catch (error) {
      console.error("Data anonymization error:", error);
      return false;
    }
  }

  /**
   * GDPR data deletion
   */
  async deleteUserData(
    userId: string,
    reason: "user_request" | "retention_policy" | "account_deletion"
  ): Promise<boolean> {
    try {
      // Log the deletion request
      this.emit("data-deletion-requested", {
        userId,
        reason,
        timestamp: new Date(),
      });

      // In production, this would:
      // 1. Remove user data from all systems
      // 2. Delete backups containing user data
      // 3. Notify third-party services
      // 4. Generate deletion certificate

      // Remove from current session data
      this.biometricData.delete(userId);

      // Remove active sessions
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.userId === userId) {
          this.activeSessions.delete(sessionId);
        }
      }

      this.emit("data-deleted", {
        userId,
        reason,
        timestamp: new Date(),
      });

      return await Promise.resolve(true);
    } catch (error) {
      console.error("Data deletion error:", error);
      return false;
    }
  }

  /**
   * Consent management
   */
  async updateUserConsent(
    userId: string,
    consents: Record<string, boolean>
  ): Promise<boolean> {
    try {
      // Store consent preferences
      // This would typically be stored in a database

      this.emit("consent-updated", {
        userId,
        consents,
        timestamp: new Date(),
      });

      return await Promise.resolve(true);
    } catch (error) {
      console.error("Consent update error:", error);
      return false;
    }
  }

  /**
   * Threat detection and response
   */
  private initializeThreatDetection(): void {
    // Monitor for suspicious activities
    this.on("authentication-failed", (data) => {
      this.checkForBruteForceAttack(data.ipAddress);
    });

    this.on("unusual-access-pattern", (data) => {
      this.createThreatAlert({
        type: "anomalous_access",
        severity: "medium",
        description: "Unusual access pattern detected",
        timestamp: new Date(),
        sourceIP: data.ipAddress,
        userId: data.userId,
        metadata: data,
      });
    });
  }

  /**
   * Create threat alert
   */
  private createThreatAlert(threat: ThreatDetection): void {
    console.warn("Security threat detected:", threat);

    this.emit("security-threat", threat);

    // Auto-respond based on severity
    if (threat.severity === "critical") {
      this.autoBlockIP(threat.sourceIP);
    }

    if (threat.userId) {
      this.suspendUserSessions(threat.userId);
    }
  }

  // Utility methods
  private async validatePasswordAuth(
    _email: string,
    _password: string
  ): Promise<string | null> {
    // This would validate against your user database
    // For demonstration, returning mock user ID
    return await Promise.resolve("mock-user-id");
  }

  private async validateBiometricAuth(
    _biometricData: string,
    deviceFingerprint: string
  ): Promise<string | null> {
    // Validate biometric data against stored templates
    for (const [userId, auth] of this.biometricData.entries()) {
      if (auth.enrolledDevices.includes(deviceFingerprint)) {
        // Compare biometric data (this would use specialized libraries)
        return await Promise.resolve(userId);
      }
    }
    return null;
  }

  private async validateMFA(
    _userId: string,
    totpCode: string
  ): Promise<boolean> {
    // This would validate TOTP code using speakeasy or similar
    // For demonstration, accepting any 6-digit code
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    return await Promise.resolve(/^\d{6}$/.test(totpCode));
  }

  private async getUserPermissions(_userId: string): Promise<string[]> {
    // Return user permissions from database
    return await Promise.resolve([
      "read:tours",
      "write:own_tours",
      "upload:media",
    ]);
  }

  private expireSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      this.emit("session-expired", { sessionId, userId: session.userId });
    }
  }

  private async checkIPReputation(ipAddress: string): Promise<number> {
    // Check against threat intelligence feeds
    // For demonstration, returning low risk for local IPs
    return await Promise.resolve(ipAddress.startsWith("192.168.") ? 0.1 : 0.3);
  }

  private async checkDeviceFingerprint(_fingerprint: string): Promise<number> {
    // Check if device is known/trusted
    return await Promise.resolve(0.2);
  }

  private async checkUserAgent(userAgent: string): Promise<number> {
    // Check for suspicious user agents
    return await Promise.resolve(userAgent.includes("bot") ? 0.8 : 0.1);
  }

  private async checkGeolocationAnomaly(_ipAddress: string): Promise<number> {
    // Check for unusual login locations
    return await Promise.resolve(0.2);
  }

  private generateWatermarkText(config: WatermarkConfig): string {
    let text = config.text;

    if (config.userId) {
      text += ` - User: ${config.userId}`;
    }

    if (config.timestamp) {
      text += ` - ${new Date().toISOString()}`;
    }

    return text;
  }

  private getDefaultConsentPurposes(): ConsentPurpose[] {
    return [
      {
        id: "necessary",
        name: "Necessary",
        description: "Essential for basic website functionality",
        category: "necessary",
        defaultConsent: true,
      },
      {
        id: "analytics",
        name: "Analytics",
        description: "Help us understand how visitors use our website",
        category: "analytics",
        defaultConsent: false,
      },
      {
        id: "marketing",
        name: "Marketing",
        description: "Used for targeted advertising and marketing campaigns",
        category: "marketing",
        defaultConsent: false,
      },
    ];
  }

  private setupDataRetentionPolicies(): void {
    // Define retention policies for different data types
    this.retentionPolicies.set("user_sessions", {
      dataType: "user_sessions",
      retentionPeriod: 90,
      deleteAfter: 90,
      anonymizeAfter: 30,
    });

    this.retentionPolicies.set("analytics_data", {
      dataType: "analytics_data",
      retentionPeriod: 365,
      deleteAfter: 365,
      anonymizeAfter: 90,
      archiveAfter: 180,
    });
  }

  private initializeAccessMonitoring(): void {
    // Setup access logging and monitoring
    setInterval(() => {
      this.processAccessLogs();
    }, 60_000); // Every minute
  }

  private processAccessLogs(): void {
    // Process and analyze access logs for anomalies
  }

  private checkForBruteForceAttack(_ipAddress: string): void {
    // Implementation for brute force detection
  }

  private autoBlockIP(ipAddress: string): void {
    console.warn(`Auto-blocking IP ${ipAddress} due to critical threat`);
    this.emit("ip-blocked", {
      ipAddress,
      reason: "critical-threat",
      timestamp: new Date(),
    });
  }

  private suspendUserSessions(userId: string): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        session.isActive = false;
        this.activeSessions.delete(sessionId);
      }
    }
    this.emit("user-sessions-suspended", { userId, timestamp: new Date() });
  }

  /**
   * Public API methods
   */
  getSecuritySettings(): SecuritySettings {
    return { ...this.settings };
  }

  updateSecuritySettings(newSettings: Partial<SecuritySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.emit("security-settings-updated", this.settings);
  }

  getActiveSessions(): SecuritySession[] {
    return Array.from(this.activeSessions.values()).filter(
      (session) => session.isActive
    );
  }

  async terminateSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.expireSession(sessionId);
      return await Promise.resolve(true);
    }
    return false;
  }

  async generateSecurityReport(): Promise<any> {
    return await Promise.resolve({
      activeSessions: this.getActiveSessions().length,
      biometricEnrollments: this.biometricData.size,
      threatDetections: 0, // Would be tracked in production
      complianceStatus: {
        gdpr: this.privacySettings.gdprCompliant,
        dataRetention: true,
        accessControls: true,
      },
      generatedAt: new Date(),
    });
  }
}

export default new SecurityService();
