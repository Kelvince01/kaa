import crypto from "node:crypto";
import {
  //   decryptApiKey,
  //   decryptMFASecret,
  //   decryptOAuthToken,
  //   decryptRefreshToken,
  //   decryptSessionToken,
  //   encryptApiKey,
  //   encryptMFASecret,
  //   encryptOAuthToken,
  //   encryptRefreshToken,
  //   encryptSessionToken,
  safeDecrypt,
  safeEncrypt,
} from "@kaa/utils";
import mongoose, { Schema } from "mongoose";
import type {
  IApiKey,
  IMFAChallenge,
  IMFASecret,
  IMFASetup,
  IOAuthConnection,
  IOTP,
  IPasskey,
  IRefreshToken,
  IResetToken,
  ISecurityEvent,
  ISession,
  IVerificationToken,
} from "./types/auth.type";

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceInfo: {
      userAgent: {
        type: String,
        required: true,
      },
      ip: {
        type: String,
        required: true,
      },
      location: String,
      device: String,
      deviceHash: {
        type: String,
        required: true,
      },
      deviceType: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "unknown"],
        required: true,
      },
      browser: {
        type: String,
        required: true,
      },
      os: {
        type: String,
        required: true,
      },
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    token: {
      type: String,
      required: true,
    },

    valid: {
      type: Boolean,
      default: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },

    authStrategy: {
      type: String,
      enum: ["password", "otp", "oauth"],
      required: true,
    },
    authType: {
      type: String,
      enum: ["regular", "impersonation"],
      required: true,
    },
    location: {
      city: String,
      region: String,
      country: String,
      latitude: Number,
      longitude: Number,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ sessionId: 1, userId: 1 });
sessionSchema.index({ "deviceInfo.deviceHash": 1 });
sessionSchema.index({ token: 1 });
sessionSchema.index({ expiresAt: 1 });
sessionSchema.index({ userId: 1, expiresAt: 1 });

// Virtual property for the client-side expected id property
sessionSchema.virtual("id").get(function (this: ISession) {
  return (this._id as mongoose.Types.ObjectId).toString();
});

// Add encryption hooks for session tokens
sessionSchema.pre("save", function (this: ISession, next) {
  if (this.isModified("token") && this.token) {
    try {
      this.token = safeEncrypt(this.token);
    } catch (error) {
      console.error("Error encrypting session token:", error);
    }
  }
  next();
});

// Add decryption method
sessionSchema.methods.getDecryptedToken = function () {
  try {
    return safeDecrypt(this.token);
  } catch (error) {
    console.error("Error decrypting session token:", error);
    return this.token; // Return original if decryption fails
  }
};

// Ensure virtuals are included when converting to JSON
sessionSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    // biome-ignore lint/performance/noDelete: false positive
    delete ret._id;
    //// biome-ignore lint/performance/noDelete: false positive
    //delete ret.__v;
    return ret;
  },
});

const oauthConnectionSchema = new Schema<IOAuthConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
    },
    providerUserId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    profile: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Virtual property for the client-side expected id property
oauthConnectionSchema.virtual("id").get(function (this: IOAuthConnection) {
  return (this._id as mongoose.Types.ObjectId).toString();
});

// Ensure virtuals are included when converting to JSON
oauthConnectionSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    // biome-ignore lint/performance/noDelete: false positive
    delete ret._id;
    //// biome-ignore lint/performance/noDelete: false positive
    //delete ret?.__v;
    return ret;
  },
});

// Add encryption hooks for OAuth tokens
oauthConnectionSchema.pre("save", function (this: IOAuthConnection, next) {
  if (this.isModified("accessToken") && this.accessToken) {
    try {
      this.accessToken = safeEncrypt(this.accessToken);
    } catch (error) {
      console.error("Error encrypting OAuth access token:", error);
    }
  }
  if (this.isModified("refreshToken") && this.refreshToken) {
    try {
      this.refreshToken = safeEncrypt(this.refreshToken);
    } catch (error) {
      console.error("Error encrypting OAuth refresh token:", error);
    }
  }
  next();
});

// Add decryption methods
oauthConnectionSchema.methods.getDecryptedAccessToken = function () {
  try {
    return safeDecrypt(this.accessToken);
  } catch (error) {
    console.error("Error decrypting OAuth access token:", error);
    return this.accessToken; // Return original if decryption fails
  }
};

oauthConnectionSchema.methods.getDecryptedRefreshToken = function () {
  try {
    return this.refreshToken ? safeDecrypt(this.refreshToken) : null;
  } catch (error) {
    console.error("Error decrypting OAuth refresh token:", error);
    return this.refreshToken; // Return original if decryption fails
  }
};

// Create a compound index to ensure uniqueness of provider + providerUserId pairs
oauthConnectionSchema.index(
  { provider: 1, providerUserId: 1 },
  { unique: true }
);
// Create a compound index for provider + userId for quick lookups
oauthConnectionSchema.index({ provider: 1, userId: 1 });

export const OAuthConnection = mongoose.model<IOAuthConnection>(
  "OAuthConnection",
  oauthConnectionSchema
);

export const Session = mongoose.model<ISession>("Session", sessionSchema);

// Token model for refresh tokens
const resetTokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["refresh", "resetPassword", "verifyEmail"],
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic token expiration
resetTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export const ResetToken = mongoose.model<IResetToken>(
  "ResetToken",
  resetTokenSchema
);

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    valid: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: Date,
    revokedReason: String,
    replacedByToken: String,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Add encryption hooks for refresh tokens
refreshTokenSchema.pre("save", function (this: IRefreshToken, next) {
  if (this.isModified("token") && this.token) {
    try {
      this.token = safeEncrypt(this.token);
    } catch (error) {
      console.error("Error encrypting refresh token:", error);
    }
  }
  next();
});

// Add decryption method
refreshTokenSchema.methods.getDecryptedToken = function () {
  try {
    return safeDecrypt(this.token);
  } catch (error) {
    console.error("Error decrypting refresh token:", error);
    return this.token; // Return original if decryption fails
  }
};

// Create and export RefreshToken model
export const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema
);

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: [
        "email-verification",
        "password-reset",
        "account-deletion",
        "email-change",
      ],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Virtual property for the client-side expected id property
verificationTokenSchema.virtual("id").get(function (this: IVerificationToken) {
  return (this._id as mongoose.Types.ObjectId).toString();
});

// Ensure virtuals are included when converting to JSON
verificationTokenSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    // biome-ignore lint/performance/noDelete: false positive
    delete ret._id;
    //// biome-ignore lint/performance/noDelete: false positive
    //delete ret.__v;
    return ret;
  },
});

// Static method to create a verification token
verificationTokenSchema.statics.createToken = async function (
  userId: mongoose.Types.ObjectId,
  purpose: string,
  expiresInHours = 24
) {
  // Generate a secure random token
  const tokenString = crypto.randomBytes(32).toString("hex");

  // Create expiration date
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  // Create and save the token
  return await this.create({
    user: userId,
    token: tokenString,
    purpose,
    expiresAt,
  });
};

const mfaSecretSchema = new Schema<IMFASecret>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    secret: {
      type: String,
      required: true,
    },
    backupCodes: {
      type: [String],
      default: [],
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    lastUsed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add encryption hooks for MFA secrets
mfaSecretSchema.pre("save", function (this: IMFASecret, next) {
  if (this.isModified("secret") && this.secret) {
    try {
      this.secret = safeEncrypt(this.secret);
    } catch (error) {
      console.error("Error encrypting MFA secret:", error);
    }
  }
  if (
    this.isModified("backupCodes") &&
    this.backupCodes &&
    this.backupCodes.length > 0
  ) {
    try {
      this.backupCodes = this.backupCodes.map((code) => safeEncrypt(code));
    } catch (error) {
      console.error("Error encrypting MFA backup codes:", error);
    }
  }
  next();
});

// Add decryption methods
mfaSecretSchema.methods.getDecryptedSecret = function () {
  try {
    return safeDecrypt(this.secret);
  } catch (error) {
    console.error("Error decrypting MFA secret:", error);
    return this.secret; // Return original if decryption fails
  }
};

mfaSecretSchema.methods.getDecryptedBackupCodes = function () {
  try {
    return this.backupCodes.map((code: string) => safeDecrypt(code));
  } catch (error) {
    console.error("Error decrypting MFA backup codes:", error);
    return this.backupCodes; // Return original if decryption fails
  }
};

export const MFASecret = mongoose.model<IMFASecret>(
  "MFASecret",
  mfaSecretSchema
);

const mfaSetupSchema = new Schema<IMFASetup>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["sms", "totp", "backup_code"],
      required: true,
    },
    secret: {
      type: String,
    },
    backupCodes: {
      type: [String],
      default: [],
    },
    phoneNumber: {
      type: String,
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    lastUsed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const MFASetup = mongoose.model<IMFASetup>("MFASetup", mfaSetupSchema);

const mfaChallengeSchema = new Schema<IMFAChallenge>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["sms", "totp", "backup_code"],
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "failed", "expired"],
    },
  },
  {
    timestamps: true,
  }
);

export const MFAChallenge = mongoose.model<IMFAChallenge>(
  "MFAChallenge",
  mfaChallengeSchema
);

const otpSchema = new Schema<IOTP>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["two-factor", "login", "transaction", "verify-action"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

// Indexes for OTP codes
otpSchema.index({ user: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete after 1 hour

// Virtual property for the client-side expected id property
otpSchema.virtual("id").get(function (this: IOTP) {
  return (this._id as mongoose.Types.ObjectId).toString();
});

// Ensure virtuals are included when converting to JSON
otpSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    // biome-ignore lint/performance/noDelete: false positive
    delete ret._id;
    //// biome-ignore lint/performance/noDelete: false positive
    // delete ret.__v;
    return ret;
  },
});

// Static method to generate a new OTP
otpSchema.statics.generateOTP = async function (
  userId: mongoose.Types.ObjectId,
  purpose: string,
  expiresInMinutes = 10,
  _codeLength = 6
) {
  // Generate a secure random numeric OTP code
  const code = Math.floor(100_000 + Math.random() * 900_000).toString();

  // Create expiration date
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  // Delete any existing unused OTPs for this user and purpose
  await this.deleteMany({ user: userId, purpose, used: false });

  // Create and save the new OTP
  return this.create({
    user: userId,
    code,
    purpose,
    expiresAt,
    maxAttempts: 5,
  });
};

const passkeySchema = new Schema<IPasskey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    credentialId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    credentialDeviceType: {
      type: String,
      req: true,
      enum: ["singleDevice", "multiDevice"],
    },
    credentialBackedUp: {
      type: Boolean,
      required: true,
      default: false,
    },
    transports: [
      {
        type: String,
        enum: ["ble", "internal", "nfc", "usb"],
      },
    ],
    name: {
      type: String,
      required: true,
    },
    lastUsed: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Virtual property for the client-side expected id property
passkeySchema.virtual("id").get(function (this: IPasskey) {
  return (this._id as mongoose.Types.ObjectId).toString();
});

// Ensure virtuals are included when converting to JSON
passkeySchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    // biome-ignore lint/performance/noDelete: false positive
    delete ret._id;
    //// biome-ignore lint/performance/noDelete: false positive
    // delete ret.__v;
    // Don't expose the public key in JSON responses
    //// biome-ignore lint/performance/noDelete: false positive
    //delete ret?.publicKey;
    return ret;
  },
});

// Create compound index for userId and credentialId for quick lookups
passkeySchema.index({ userId: 1, deletedAt: 1 });
passkeySchema.index({ userId: 1, credentialId: 1 });

// Export all models
export const VerificationToken = mongoose.model<IVerificationToken>(
  "VerificationToken",
  verificationTokenSchema
);
export const OTP = mongoose.model<IOTP>("OTP", otpSchema);
export const Passkey = mongoose.model<IPasskey>("Passkey", passkeySchema);

const apiKeySchema = new Schema<IApiKey>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    hashedKey: { type: String, required: true },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastUsedAt: Date,
    expiresAt: Date,
    rateLimit: {
      requests: { type: Number, default: 1000 },
      window: { type: Number, default: 3600 }, // 1 hour
    },
    usage: {
      totalRequests: { type: Number, default: 0 },
      lastRequest: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
apiKeySchema.index({ hashedKey: 1 });
apiKeySchema.index({ memberId: 1, isActive: 1 });
apiKeySchema.index({ userId: 1, isActive: 1 });

export const ApiKey = mongoose.model<IApiKey>("ApiKey", apiKeySchema);

// Security Event Schema
const securityEventSchema = new Schema<ISecurityEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "login",
        "logout",
        "password_change",
        "email_change",
        "phone_change",
        "failed_login",
        "account_locked",
        "suspicious_activity",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for security events
securityEventSchema.index({ userId: 1, timestamp: -1 });
securityEventSchema.index({ type: 1, timestamp: -1 });
securityEventSchema.index({ timestamp: -1 });

export const SecurityEvent = mongoose.model<ISecurityEvent>(
  "SecurityEvent",
  securityEventSchema
);
