import { hashPassword, verifyPassword } from "@kaa/utils";
import mongoose, { type Document, type Model, Schema } from "mongoose";
import { addressSchema } from "./base.model";
import {
  type IBaseUserSubscription,
  type IUser,
  type IUserPreference,
  UserStatus,
} from "./types/user.type";

const userPreferencesSchema = new Schema<IUserPreference>({
  theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
  language: { type: String, default: "en" },
  timezone: { type: String, default: "UTC" },
  accessibility: {
    prefersReducedMotion: Boolean,
    prefersContrast: {
      type: String,
      enum: ["no-preference", "high", "low", "custom"],
    },
    prefersDarkMode: Boolean,
    fontSize: { type: String, enum: ["small", "medium", "large"] },
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
});

const baseUserSubscriptionSchema = new Schema<IBaseUserSubscription>({
  plan: {
    type: String,
    enum: ["free", "basic", "premium", "enterprise"],
    default: "free",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "canceled", "trial"],
    default: "trial",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 30); // 30-day trial
      return date;
    },
  },
  autoRenew: {
    type: Boolean,
    default: true,
  },
  usageQuota: {
    requests: {
      type: Number,
      default: 1000,
    },
    storage: {
      type: Number,
      default: 1024, // MB
    },
    users: {
      type: Number,
      default: 1,
    },
  },
  usageCurrent: {
    requests: {
      type: Number,
      default: 0,
    },
    storage: {
      type: Number,
      default: 0,
    },
    users: {
      type: Number,
      default: 0,
    },
  },
});

/**
 * User schema definition
 */
const userSchema = new Schema<IUser>(
  {
    slug: { type: String, required: true, trim: true, unique: true },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 8,
    },
    passwordChangedAt: Date,
    firstName: {
      type: String,
      required: [true, "Please add a first name"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Please add a last name"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Please add a username"],
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      required: [true, "Please add a phone number"],
      match: [
        /^(?:\+254|0)[17]\d{8}$/,
        "Please add a valid Kenyan phone number",
      ],
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
    },
    avatar: {
      type: String,
      default: () =>
        `https://imgz.app/400x300?bg=3b82f6&text=${(this as any)?.firstName}`,
    },
    idNumber: {
      type: String,
      match: [/^\d{8}$/, "Please add a valid Kenyan ID number"],
    },
    idVerified: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    lastActiveAt: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    address: addressSchema,
    dateOfBirth: Date,
    identityVerified: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: String,
    notifications: [
      {
        message: String,
        type: String,
        read: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    permissionFlags: Number,
    settings: {
      type: {
        disableEmailNotifications: {
          type: Boolean,
          default: false,
        },
        disablePushNotifications: {
          type: Boolean,
          default: false,
        },
        // Add more settings here as needed
      },
      default: {},
    },
    deviceTokens: [
      {
        token: String,
        platform: {
          type: String,
          enum: ["ios", "android", "web"],
        },
        deviceId: String,
        appVersion: String,
        osVersion: String,
        isActive: {
          type: Boolean,
          default: true,
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    locale: { type: String, enum: ["en", "sw"] },
    preferences: userPreferencesSchema,
    subscription: baseUserSubscriptionSchema,
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ memberId: 1 });

/**
 * Pre-save hook to hash password
 */
userSchema.pre("save", async function (this: Document & IUser, next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified("password")) return next();

  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error: unknown) {
    next(error as Error);
  }
});

// Update passwordChangedAt when password is modified
userSchema.pre<IUser>("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000); // 1 second in past
  next();
});

/**
 * Method to compare password
 * @param candidatePassword - The password to compare against the stored hash
 * @returns Boolean indicating if the password matches
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await verifyPassword(candidatePassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Check if account is locked
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Method to get full name
 * @returns Full name as a string
 */
userSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

/**
 * Method to get user profile without sensitive information
 * @returns User object without sensitive fields
 */
userSchema.methods.getPublicProfile = function (): Partial<IUser> {
  const userObject = this.toObject();

  // Remove sensitive information
  // biome-ignore lint/performance/noDelete: false positive
  delete userObject.password;
  // biome-ignore lint/performance/noDelete: false positive
  delete userObject.stripeCustomerId;

  return userObject;
};

// Create and export the User model
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export { User };
