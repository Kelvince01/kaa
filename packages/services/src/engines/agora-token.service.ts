import { RtcRole, RtcTokenBuilder } from "agora-access-token";

export type TokenOptions = {
  channelName: string;
  uid: string | number;
  role?: "publisher" | "subscriber";
  expirationTimeInSeconds?: number;
};

/**
 * Agora Token Service
 * Generates RTC tokens for secure channel access
 */
export class AgoraTokenService {
  private readonly appId: string;
  private readonly appCertificate: string;

  constructor(appId: string, appCertificate: string) {
    this.appId = appId;
    this.appCertificate = appCertificate;
  }

  /**
   * Generate RTC token for joining a channel
   */
  generateRtcToken(options: TokenOptions): {
    token: string;
    expiresAt: Date;
  } {
    const {
      channelName,
      uid,
      role = "publisher",
      expirationTimeInSeconds = 3600, // 1 hour default
    } = options;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Convert uid to number if string
    const numericUid = typeof uid === "string" ? 0 : uid;

    // Determine role
    const agoraRole =
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Build token
    const token = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      numericUid,
      agoraRole,
      privilegeExpiredTs
    );

    return {
      token,
      expiresAt: new Date(privilegeExpiredTs * 1000),
    };
  }

  /**
   * Generate token with account (string UID)
   */
  generateRtcTokenWithAccount(options: TokenOptions): {
    token: string;
    expiresAt: Date;
  } {
    const {
      channelName,
      uid,
      role = "publisher",
      expirationTimeInSeconds = 3600,
    } = options;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const agoraRole =
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithAccount(
      this.appId,
      this.appCertificate,
      channelName,
      String(uid),
      agoraRole,
      privilegeExpiredTs
    );

    return {
      token,
      expiresAt: new Date(privilegeExpiredTs * 1000),
    };
  }

  /**
   * Generate token for cloud recording
   */
  generateRecordingToken(channelName: string): {
    token: string;
    expiresAt: Date;
  } {
    const expirationTimeInSeconds = 86_400; // 24 hours for recording
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      0, // Use 0 for recording
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    return {
      token,
      expiresAt: new Date(privilegeExpiredTs * 1000),
    };
  }

  /**
   * Validate if token is expired
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingTime(expiresAt: Date): number {
    const now = Date.now();
    const expiry = expiresAt.getTime();
    return Math.max(0, Math.floor((expiry - now) / 1000));
  }
}
