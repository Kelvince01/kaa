import { hashPassword, verifyPassword } from "@kaa/utils";
import mongoose, { type Document, type Model, Schema } from "mongoose";
import {
  type IUser,
  KYCStatus,
  type UserActivity,
  type UserAddress,
  type UserContact,
  type UserPreferences,
  type UserProfile,
  type UserSettings,
  type UserStats,
  UserStatus,
  type UserVerification,
} from "./types/user.type";

const userPreferencesSchema = new Schema<UserPreferences>(
  {
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    language: { type: String, enum: ["en", "sw"], default: "en" },
    timezone: {
      type: String,
      enum: ["Africa/Nairobi", "UTC"],
      default: "Africa/Nairobi",
    },
    currency: {
      type: String,
      default: "KES",
    },
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
      whatsapp: {
        type: Boolean,
        default: false,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
    },
    privacy: {
      profileVisible: {
        type: Boolean,
        default: true,
      },
      showPhone: {
        type: Boolean,
        default: false,
      },
      showEmail: {
        type: Boolean,
        default: false,
      },
    },
    properties: {
      propertyTypes: [String],
      locations: [String],
      budget: {
        min: Number,
        max: Number,
      },
      furnished: Boolean,
      bedrooms: Number,
      bathrooms: Number,
      amenities: [String],
      features: [String],
      verified: Boolean,
      featured: Boolean,
      owner: Boolean,
      agent: Boolean,
      admin: Boolean,
      tenant: Boolean,
      landlord: Boolean,
    },
  },
  { _id: false }
);

const userProfileSchema = new Schema<UserProfile>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Please add a full name"],
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, "Please add a display name"],
      trim: true,
    },
    avatar: {
      type: String,
      validate: {
        validator(v: string) {
          // biome-ignore lint/performance/useTopLevelRegex: ignore
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Avatar must be a valid URL",
      },
      default: () =>
        `https://imgz.app/400x300?bg=3b82f6&text=${(this as any)?.firstName}`,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
  },
  { _id: false }
);

const userContactSchema = new Schema<UserContact>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
      trim: true,
      lowercase: true,
    },
    phone: {
      countryCode: {
        type: String,
        required: true,
        default: "+254",
      },
      number: {
        type: String,
        trim: true,
        required: [true, "Please add a phone number"],
        match: [/^[17]\d{8}$/, "Please add a valid Kenyan phone number"],
      },
      formatted: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator(phone: string) {
            // biome-ignore lint/performance/useTopLevelRegex: ignore
            return /^\+254[17][0-9]{8}$/.test(phone);
          },
          message: "Please provide a valid Kenyan phone number",
        },
      },
    },
    alternativePhone: {
      countryCode: String,
      number: {
        type: String,
        trim: true,
        match: /^(?:\+254|0)[17]\d{8}$/,
      },
      formatted: String,
    },
    whatsappNumber: {
      type: String,
      validate: {
        validator(phone: string) {
          // biome-ignore lint/performance/useTopLevelRegex: ignore
          return !phone || /^\+254[17][0-9]{8}$/.test(phone);
        },
        message: "Please provide a valid WhatsApp number",
      },
    },
    preferredContact: {
      type: String,
      enum: ["email", "phone", "whatsapp"],
      default: "email",
    },
  },
  { _id: false }
);

const userAddressSchema = new Schema<UserAddress>(
  {
    type: {
      type: String,
      enum: ["residential", "work", "postal"],
      default: "residential",
    },
    line1: {
      type: String,
      required: [true, "Please add an address"],
      trim: true,
    },
    line2: {
      type: String,
      trim: true,
    },
    town: {
      type: String,
      required: [true, "Please add a town"],
      trim: true,
    },
    county: {
      type: String,
      required: [true, "Please add a county"],
      trim: true,
    },
    estate: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
      required: [true, "Please add a postal code"],
      match: [/[0-9]{5}/, "Please add a valid postal code"],
    },
    country: {
      type: String,
      default: "Kenya",
    },
    directions: {
      type: String,
      trim: true,
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const userVerificationSchema = new Schema<UserVerification>(
  {
    emailVerifiedAt: {
      type: Date,
    },
    phoneVerifiedAt: {
      type: Date,
    },
    identityVerifiedAt: {
      type: Date,
    },
    kycStatus: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING,
    },
    kycData: {
      identification: {
        type: {
          type: String,
          enum: ["national_id", "passport", "alien_id"],
        },
        number: {
          type: String,
          validate: {
            validator(value: string) {
              // Only apply regex if type is "national_id"
              if (this.kycData?.identification.type === "national_id") {
                // biome-ignore lint/performance/useTopLevelRegex: ignore
                return /^\d{8}$/.test(value);
              }
              return true; // skip validation for other types
            },
            message: "Please add a valid Kenyan ID number (8 digits)",
          },
        },
        verified: {
          type: Boolean,
          default: false,
        },
      },
      documents: {
        idDocument: String,
        proofOfAddress: String,
        bankStatement: String,
        payslip: [String],
      },
      verificationDate: Date,
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      rejectionReason: String,
    },
  },
  { _id: false }
);

const userSettingsSchema = new Schema<UserSettings>(
  {
    twoFactorEnabledAt: {
      type: Date,
      default: null,
    },
    sessionTimeout: {
      type: Number,
      default: 60,
    },
    autoLogout: {
      type: Boolean,
      default: true,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const userActivitySchema = new Schema<UserActivity>(
  {
    lastLogin: Date,
    lastLoginIP: String,
    lastActivity: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    passwordChangedAt: Date,
    accountDeactivatedAt: Date,
    accountSuspendedAt: Date,
    suspensionReason: String,
  },
  { _id: false }
);

// Statistics (for landlords/agents)
const userStatsSchema = new Schema<UserStats>(
  {
    totalProperties: {
      type: Number,
      default: 0,
    },
    activeListings: {
      type: Number,
      default: 0,
    },
    totalApplications: {
      type: Number,
      default: 0,
    },
    totalTenants: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);
/**
 * User schema definition
 */
const userSchema = new Schema<IUser>(
  {
    profile: userProfileSchema,
    contact: userContactSchema,
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
      required: true,
    },

    verification: userVerificationSchema,
    settings: userSettingsSchema,
    activity: userActivitySchema,
    stats: userStatsSchema,
    addresses: [userAddressSchema],
    preferences: userPreferencesSchema,
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 8,
    },

    // Social connections
    connections: {
      followers: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      following: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    // Metadata
    metadata: {
      source: String, // Registration source
      referredBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      tags: [String],
      notes: String, // Admin notes
    },

    permissionFlags: Number,
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        // biome-ignore lint/performance/noDelete: ignore
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ status: 1 });
userSchema.index({ "verification.emailVerifiedAt": 1 });
userSchema.index({ "verification.phoneVerifiedAt": 1 });
userSchema.index({ "verification.identityVerifiedAt": 1 });
userSchema.index({ "verification.kycStatus": 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "activity.lastLogin": -1 });

// Virtual fields
// userSchema.virtual("fullName").get(function (this: IUser) {
//   return `${this.profile.firstName} ${this.profile.lastName}`;
// });

userSchema.virtual("displayName").get(function (this: IUser) {
  return this.profile.firstName;
});

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
  this.activity.passwordChangedAt = new Date(Date.now() - 1000); // 1 second in past
  next();
});

// Pre-save middleware
userSchema.pre("save", function (next) {
  // Set full name
  if (
    this.isModified("profile.firstName") ||
    this.isModified("profile.lastName")
  ) {
    this.profile.fullName = `${this.profile.firstName} ${this.profile.lastName}`;
  }

  // Ensure only one primary address
  if (this.addresses && this.addresses.length > 0) {
    const primaryAddresses = this.addresses.filter((addr) => addr.isPrimary);
    if (primaryAddresses.length > 1) {
      // Keep the first one as primary, set others to false
      this.addresses.forEach((addr, index) => {
        if (index > 0 && addr.isPrimary) {
          addr.isPrimary = false;
        }
      });
    }
  }

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
  if (this.activity.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.activity.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Check if account is locked
userSchema.methods.isLocked = function (): boolean {
  return !!(this.activity.lockUntil && this.activity.lockUntil > Date.now());
};

/**
 * Method to get full name
 * @returns Full name as a string
 */
userSchema.methods.getFullName = function (): string {
  return `${this.profile.firstName} ${this.profile.lastName}`;
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Static method to find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ "contact.email": email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ status: UserStatus.ACTIVE });
};

userSchema.methods.updateLastActivity = function (ip?: string): void {
  this.activity.lastActivity = new Date();
  if (ip) {
    this.activity.lastLoginIP = ip;
  }
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

  return userObject;
};

userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    firstName: this.profile.firstName,
    lastName: this.profile.lastName,
    fullName: this.fullName,
    bio: this.profile.bio,
    avatar: this.profile.avatar,
    // role: this.role,
    verified:
      this.verification.emailVerifiedAt &&
      this.verification.phoneVerifiedAt &&
      this.verification.identityVerifiedAt,
    county: this.addresses.find((addr: any) => addr.isPrimary)?.county,
    estate: this.addresses.find((addr: any) => addr.isPrimary)?.estate,
    // stats:
    //   this.role === UserRole.LANDLORD || this.role === UserRole.AGENT
    //     ? {
    //         totalProperties: this.stats?.totalProperties,
    //         averageRating: this.stats?.averageRating,
    //         totalReviews: this.stats?.totalReviews,
    //       }
    //     : undefined,
    joinedAt: this.createdAt,
  };
};

// Create and export the User model
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export { User };
