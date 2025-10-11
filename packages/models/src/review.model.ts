/**
 * Reviews Models
 *
 * Mongoose models for comprehensive reviews system
 * Includes reviews, responses, flags, and analytics
 */

import { type Document, model, Schema } from "mongoose";
import {
  type IPropertyReviewSummary,
  type IRatingBreakdown,
  type IReview,
  type IReviewAnalytics,
  type IReviewFlag,
  type IReviewResponse,
  type IUserReviewSummary,
  KENYA_REVIEW_CONSTANTS,
  ReviewFlagReason,
  ReviewSentiment,
  ReviewStatus,
  ReviewType,
} from "./types/review.type";

// ==================== RATING BREAKDOWN SCHEMA ====================

/**
 * Rating breakdown sub-schema
 */
const RatingBreakdownSchema = new Schema<IRatingBreakdown>(
  {
    overall: {
      type: Number,
      required: true,
      min: KENYA_REVIEW_CONSTANTS.MIN_RATING,
      max: KENYA_REVIEW_CONSTANTS.MAX_RATING,
    },
    // categories: {
    //   type: Map,
    //   of: {
    //     type: Number,
    //     min: KENYA_REVIEW_CONSTANTS.MIN_RATING,
    //     max: KENYA_REVIEW_CONSTANTS.MAX_RATING,
    //   },
    //   default: () => new Map(),
    // },
  },
  {
    _id: false,
    timestamps: false,
  }
);

// ==================== REVIEW SCHEMA ====================

/**
 * Main review schema
 */
const ReviewSchema = new Schema<IReview & Document>(
  {
    type: {
      type: String,
      enum: Object.values(ReviewType),
      required: true,
      index: true,
    },

    // Relationships
    reviewerId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator(v: string) {
          return v !== this.reviewerId; // Cannot review self
        },
        message: "Cannot review yourself",
      },
    },
    applicationId: {
      type: String,
      ref: "Application",
      index: true,
    },

    // Review content
    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
      validate: {
        validator: (v: string) => v.trim().length >= 5,
        message: "Title must be at least 5 characters",
      },
    },
    content: {
      type: String,
      required: true,
      minlength: KENYA_REVIEW_CONSTANTS.MIN_REVIEW_LENGTH,
      maxlength: KENYA_REVIEW_CONSTANTS.MAX_REVIEW_LENGTH,
      validate: {
        validator: (v: string) =>
          v.trim().length >= KENYA_REVIEW_CONSTANTS.MIN_REVIEW_LENGTH,
        message: `Review must be at least ${KENYA_REVIEW_CONSTANTS.MIN_REVIEW_LENGTH} characters`,
      },
    },
    rating: {
      type: RatingBreakdownSchema,
      required: true,
    },

    // Media
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: "Maximum 10 photos allowed",
      },
    },
    videos: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 3,
        message: "Maximum 3 videos allowed",
      },
    },

    // Moderation
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      required: true,
      default: ReviewStatus.PENDING,
      index: true,
    },
    moderatorId: {
      type: String,
      ref: "User",
      index: true,
    },
    moderatorNotes: {
      type: String,
      maxlength: 500,
    },
    moderatedAt: {
      type: Date,
      index: true,
    },

    // Metadata
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: "Maximum 10 tags allowed",
      },
    },
    language: {
      type: String,
      enum: ["en", "sw"],
      required: true,
      default: "en",
      index: true,
    },
    sentiment: {
      type: String,
      enum: Object.values(ReviewSentiment),
      index: true,
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Engagement
    helpfulCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    notHelpfulCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    flagCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      index: true,
    },
    responseId: {
      type: String,
      ref: "ReviewResponse",
    },

    // Kenya-specific features
    county: {
      type: String,
      enum: KENYA_REVIEW_CONSTANTS.COUNTIES,
      index: true,
    },
    city: {
      type: String,
      maxlength: 100,
      index: true,
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },

    // Timestamps
    reviewDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // Flags
    isAnonymous: {
      type: Boolean,
      required: true,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== REVIEW SCHEMA INDEXES ====================

// Compound indexes for efficient queries
ReviewSchema.index({ targetId: 1, status: 1, createdAt: -1 }); // Property/user reviews
ReviewSchema.index({ reviewerId: 1, type: 1, createdAt: -1 }); // User's reviews
ReviewSchema.index({ type: 1, status: 1, "rating.overall": -1 }); // Review listings
ReviewSchema.index({ county: 1, city: 1, "rating.overall": -1 }); // Location-based queries
ReviewSchema.index({ verified: 1, status: 1, createdAt: -1 }); // Verified reviews
ReviewSchema.index({ flagCount: -1, status: 1 }); // Moderation queue
ReviewSchema.index({ sentiment: 1, language: 1 }); // Sentiment analysis

// Text search index
ReviewSchema.index(
  { title: "text", content: "text", tags: "text" },
  {
    name: "review_text_search",
    default_language: "english",
  }
);

// Unique compound index to prevent duplicate reviews for same application
ReviewSchema.index(
  { reviewerId: 1, targetId: 1, applicationId: 1 },
  {
    unique: true,
    partialFilterExpression: { applicationId: { $exists: true } },
  }
);

// ==================== REVIEW SCHEMA METHODS ====================

/**
 * Calculate helpfulness ratio
 */
ReviewSchema.methods.getHelpfulnessRatio = function (): number {
  const total = this.helpfulCount + this.notHelpfulCount;
  return total > 0 ? this.helpfulCount / total : 0;
};

/**
 * Mark as helpful
 */
ReviewSchema.methods.markAsHelpful = function () {
  this.helpfulCount += 1;
  return this.save();
};

/**
 * Mark as not helpful
 */
ReviewSchema.methods.markAsNotHelpful = function () {
  this.notHelpfulCount += 1;
  return this.save();
};

/**
 * Add flag
 */
ReviewSchema.methods.addFlag = function () {
  this.flagCount += 1;

  // Auto-hide if too many flags
  if (
    this.flagCount >=
    KENYA_REVIEW_CONSTANTS.AUTO_MODERATION.FLAG_AUTO_HIDE_THRESHOLD
  ) {
    this.status = ReviewStatus.HIDDEN;
  }

  return this.save();
};

/**
 * Approve review
 */
ReviewSchema.methods.approve = function (moderatorId: string, notes?: string) {
  this.status = ReviewStatus.APPROVED;
  this.moderatorId = moderatorId;
  this.moderatorNotes = notes;
  this.moderatedAt = new Date();
  return this.save();
};

/**
 * Reject review
 */
ReviewSchema.methods.reject = function (moderatorId: string, reason: string) {
  this.status = ReviewStatus.REJECTED;
  this.moderatorId = moderatorId;
  this.moderatorNotes = reason;
  this.moderatedAt = new Date();
  return this.save();
};

/**
 * Detect Swahili content
 */
ReviewSchema.methods.detectSwahili = function (): boolean {
  const swahiliTerms = Object.values(KENYA_REVIEW_CONSTANTS.SWAHILI_TERMS);
  const content = `${this.title} ${this.content}`.toLowerCase();
  return swahiliTerms.some((term) => content.includes(term.toLowerCase()));
};

// ==================== REVIEW RESPONSE SCHEMA ====================

/**
 * Review response schema
 */
const ReviewResponseSchema = new Schema<IReviewResponse & Document>(
  {
    reviewId: {
      type: String,
      required: true,
      ref: "Review",
      index: true,
    },
    responderId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      required: true,
      default: ReviewStatus.APPROVED,
    },
  },
  {
    timestamps: true,
  }
);

// Response indexes
ReviewResponseSchema.index({ reviewId: 1 }, { unique: true }); // One response per review
ReviewResponseSchema.index({ responderId: 1, createdAt: -1 });

// ==================== REVIEW FLAG SCHEMA ====================

/**
 * Review flag schema
 */
const ReviewFlagSchema = new Schema<IReviewFlag & Document>(
  {
    reviewId: {
      type: String,
      required: true,
      ref: "Review",
      index: true,
    },
    flaggerId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    reason: {
      type: String,
      enum: Object.values(ReviewFlagReason),
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      required: true,
      default: "pending",
      index: true,
    },
    resolvedBy: {
      type: String,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Flag indexes
ReviewFlagSchema.index({ reviewId: 1, flaggerId: 1 }, { unique: true }); // One flag per user per review
ReviewFlagSchema.index({ status: 1, createdAt: -1 });
ReviewFlagSchema.index({ reason: 1, status: 1 });

// ==================== REVIEW ANALYTICS SCHEMA ====================

/**
 * Review analytics schema
 */
const ReviewAnalyticsSchema = new Schema<IReviewAnalytics & Document>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ReviewType),
      required: true,
      index: true,
    },

    // Basic metrics
    totalReviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    approvedReviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    rejectedReviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    pendingReviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    flaggedReviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Rating distribution
    ratingDistribution: {
      type: Map,
      of: Number,
      required: true,
      default: () =>
        new Map([
          ["1", 0],
          ["2", 0],
          ["3", 0],
          ["4", 0],
          ["5", 0],
        ]),
    },
    averageRating: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 5,
    },

    // Sentiment analysis
    sentimentDistribution: {
      positive: { type: Number, default: 0, min: 0 },
      negative: { type: Number, default: 0, min: 0 },
      neutral: { type: Number, default: 0, min: 0 },
      mixed: { type: Number, default: 0, min: 0 },
    },

    // Response metrics
    responseRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    averageResponseTime: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Kenya-specific metrics
    kenyaMetrics: {
      swahiliReviews: { type: Number, default: 0, min: 0 },
      verifiedReviews: { type: Number, default: 0, min: 0 },
      countryWideRating: { type: Number, default: 0, min: 0, max: 5 },
      topCounties: [
        {
          county: { type: String, required: true },
          averageRating: { type: Number, required: true, min: 0, max: 5 },
          reviewCount: { type: Number, required: true, min: 0 },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Analytics indexes
ReviewAnalyticsSchema.index({ date: -1, type: 1 });
ReviewAnalyticsSchema.index({ type: 1, date: -1 });

// Unique compound index to prevent duplicates
ReviewAnalyticsSchema.index({ date: 1, type: 1 }, { unique: true });

// ==================== USER REVIEW SUMMARY SCHEMA ====================

/**
 * User review summary schema
 */
const UserReviewSummarySchema = new Schema<IUserReviewSummary & Document>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      ref: "User",
      index: true,
    },

    // As reviewer
    asReviewer: {
      totalReviews: { type: Number, default: 0, min: 0 },
      averageRatingGiven: { type: Number, default: 0, min: 0, max: 5 },
      reviewsByType: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
    },

    // As reviewed
    asReviewed: {
      totalReviews: { type: Number, default: 0, min: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      ratingDistribution: {
        type: Map,
        of: Number,
        default: () =>
          new Map([
            ["1", 0],
            ["2", 0],
            ["3", 0],
            ["4", 0],
            ["5", 0],
          ]),
      },
      recentReviews: [
        {
          type: String,
          ref: "Review",
        },
      ],
      responseRate: { type: Number, default: 0, min: 0, max: 1 },
    },

    // Credibility metrics
    credibilityScore: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
      max: 100,
    },
    verificationStatus: {
      isVerified: { type: Boolean, default: false },
      verifiedReviews: { type: Number, default: 0, min: 0 },
      flaggedReviews: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// ==================== PROPERTY REVIEW SUMMARY SCHEMA ====================

/**
 * Property review summary schema
 */
const PropertyReviewSummarySchema = new Schema<
  IPropertyReviewSummary & Document
>(
  {
    propertyId: {
      type: String,
      required: true,
      unique: true,
      ref: "Property",
      index: true,
    },

    // Overall metrics
    totalReviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingDistribution: {
      type: Map,
      of: Number,
      default: () =>
        new Map([
          ["1", 0],
          ["2", 0],
          ["3", 0],
          ["4", 0],
          ["5", 0],
        ]),
    },

    // Category breakdown
    // categoryRatings: {
    //   type: Map,
    //   of: {
    //     average: { type: Number, min: 0, max: 5 },
    //     count: { type: Number, min: 0 },
    //   },
    //   default: () => new Map(),
    // },

    // Recent activity
    recentReviews: [
      {
        type: String,
        ref: "Review",
      },
    ],
    monthlyTrend: [
      {
        month: { type: String, required: true },
        averageRating: { type: Number, required: true, min: 0, max: 5 },
        reviewCount: { type: Number, required: true, min: 0 },
      },
    ],

    // Engagement
    responseRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    averageResponseTime: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Quality indicators
    verifiedReviewsPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    sentimentSummary: {
      positive: { type: Number, default: 0, min: 0 },
      neutral: { type: Number, default: 0, min: 0 },
      negative: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// ==================== PRE-SAVE MIDDLEWARE ====================

/**
 * Auto-detect language and sentiment
 */
ReviewSchema.pre("save", function () {
  // Auto-detect Swahili
  if (this.language === "en" && this.detectSwahili()) {
    this.language = "sw";
  }

  // Simple sentiment detection based on rating
  if (!this.sentiment) {
    const overallRating = this.rating.overall;
    if (overallRating >= 4) {
      this.sentiment = ReviewSentiment.POSITIVE;
      this.sentimentScore = 0.7;
    } else if (overallRating <= 2) {
      this.sentiment = ReviewSentiment.NEGATIVE;
      this.sentimentScore = -0.7;
    } else {
      this.sentiment = ReviewSentiment.NEUTRAL;
      this.sentimentScore = 0;
    }
  }
});

// ==================== EXPORT MODELS ====================

export const Review = model<IReview & Document>("Review", ReviewSchema);
export const ReviewResponse = model<IReviewResponse & Document>(
  "ReviewResponse",
  ReviewResponseSchema
);
export const ReviewFlag = model<IReviewFlag & Document>(
  "ReviewFlag",
  ReviewFlagSchema
);
export const ReviewAnalytics = model<IReviewAnalytics & Document>(
  "ReviewAnalytics",
  ReviewAnalyticsSchema
);
export const UserReviewSummary = model<IUserReviewSummary & Document>(
  "UserReviewSummary",
  UserReviewSummarySchema
);
export const PropertyReviewSummary = model<IPropertyReviewSummary & Document>(
  "PropertyReviewSummary",
  PropertyReviewSummarySchema
);

// Export schemas for testing and extending
export {
  ReviewSchema,
  ReviewResponseSchema,
  ReviewFlagSchema,
  ReviewAnalyticsSchema,
  UserReviewSummarySchema,
  PropertyReviewSummarySchema,
  RatingBreakdownSchema,
};

// Default export
export default {
  Review,
  ReviewResponse,
  ReviewFlag,
  ReviewAnalytics,
  UserReviewSummary,
  PropertyReviewSummary,
};
