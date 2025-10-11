/**
 * Reviews System Types
 *
 * Comprehensive review and rating system for Kaa SaaS
 * Includes property reviews, user reviews, moderation, and analytics
 */

// import { BUSINESS_HOURS } from "@kaa/constants";
import type { Types } from "mongoose";
import type { BaseDocument } from "./base.type";

// ==================== ENUMS ====================

/**
 * Types of reviews in the system
 */
export enum ReviewType {
  PROPERTY = "property", // Review of a property
  USER_LANDLORD = "user_landlord", // Review of a landlord by tenant
  USER_TENANT = "user_tenant", // Review of a tenant by landlord
  AGENT = "agent", // Review of an agent
  PLATFORM = "platform", // Review of the platform itself
}

/**
 * Review status for moderation
 */
export enum ReviewStatus {
  PENDING = "pending", // Awaiting moderation
  APPROVED = "approved", // Approved and visible
  REJECTED = "rejected", // Rejected by moderator
  FLAGGED = "flagged", // Flagged for review
  HIDDEN = "hidden", // Hidden by admin/moderator
  SPAM = "spam", // Marked as spam
}

/**
 * Review categories for properties
 */
export enum PropertyReviewCategory {
  LOCATION = "location",
  AMENITIES = "amenities",
  CONDITION = "condition",
  LANDLORD = "landlord",
  VALUE_FOR_MONEY = "value_for_money",
  SAFETY = "safety",
  NEIGHBORS = "neighbors",
  MAINTENANCE = "maintenance",
}

/**
 * Review categories for users
 */
export enum UserReviewCategory {
  COMMUNICATION = "communication",
  RELIABILITY = "reliability",
  CLEANLINESS = "cleanliness",
  RESPECT = "respect",
  PAYMENT_TIMELINESS = "payment_timeliness",
  PROPERTY_CARE = "property_care",
  RESPONSIVENESS = "responsiveness",
}

/**
 * Sentiment analysis results
 */
export enum ReviewSentiment {
  POSITIVE = "positive",
  NEGATIVE = "negative",
  NEUTRAL = "neutral",
  MIXED = "mixed",
}

/**
 * Flag reasons for inappropriate reviews
 */
export enum ReviewFlagReason {
  INAPPROPRIATE_LANGUAGE = "inappropriate_language",
  FAKE_REVIEW = "fake_review",
  SPAM = "spam",
  PERSONAL_ATTACK = "personal_attack",
  OFF_TOPIC = "off_topic",
  MISLEADING = "misleading",
  HARASSMENT = "harassment",
  PRIVACY_VIOLATION = "privacy_violation",
}

/**
 * Individual rating breakdown
 */
export type IRatingBreakdown = {
  overall: number; // 1-5 stars
  categories: {
    [key in PropertyReviewCategory | UserReviewCategory]?: number;
  };
};

export interface IPropertyReview extends BaseDocument {
  property: Types.ObjectId;
  reviewer: Types.ObjectId; // supposedly a tenant
  rating: number;
  title: string;
  comment: string;
  isVerifiedStay: boolean;
  stayDate?: Date;
  landlord: Types.ObjectId;
  booking?: Types.ObjectId;
  propertyRating: number;
  landlordRating: number;
  cleanliness: number;
  location: number;
  valueForMoney: number;
  response?: {
    comment: string;
    createdAt: Date;
  };
  status: "pending" | "approved" | "rejected" | "flagged";
  rejectionReason?: string;
  images?: Array<{
    url: string;
    caption?: string;
  }>;

  getAverageRatings(propertyId: string): Promise<{
    average: number;
    cleanliness: number;
    location: number;
    valueForMoney: number;
  }>;
  getLandlordRatings(landlordId: string): Promise<{
    average: number;
    cleanliness: number;
    location: number;
    valueForMoney: number;
  }>;
}

/**
 * Review response interface
 */
export type IReviewResponse = {
  _id: string;
  reviewId: string;
  responderId: string; // Usually the landlord or property owner
  content: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Review flag interface
 */
export type IReviewFlag = {
  _id: string;
  reviewId: string;
  flaggerId: string;
  reason: ReviewFlagReason;
  description?: string;
  status: "pending" | "resolved" | "dismissed";
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
};

/**
 * Review analytics interface
 */
export type IReviewAnalytics = {
  _id: string;
  date: Date;
  type: ReviewType;

  // Basic metrics
  totalReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  pendingReviews: number;
  flaggedReviews: number;

  // Rating distribution
  ratingDistribution: {
    [rating: number]: number; // Rating (1-5) -> Count
  };
  averageRating: number;

  // Sentiment analysis
  sentimentDistribution: {
    [sentiment in ReviewSentiment]: number;
  };

  // Response metrics
  responseRate: number; // Percentage of reviews with responses
  averageResponseTime: number; // In hours

  // Kenya-specific metrics
  kenyaMetrics?: {
    swahiliReviews: number;
    verifiedReviews: number;
    countryWideRating: number;
    topCounties: Array<{
      county: string;
      averageRating: number;
      reviewCount: number;
    }>;
  };

  createdAt: Date;
  updatedAt: Date;
};

/**
 * User review summary
 */
export type IUserReviewSummary = {
  userId: string;

  // As reviewer (reviews they wrote)
  asReviewer: {
    totalReviews: number;
    averageRatingGiven: number;
    reviewsByType: Record<ReviewType, number>;
  };

  // As reviewed (reviews about them)
  asReviewed: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    recentReviews: IReview[];
    responseRate: number;
  };

  // Credibility metrics
  credibilityScore: number; // 0-100
  verificationStatus: {
    isVerified: boolean;
    verifiedReviews: number;
    flaggedReviews: number;
  };

  updatedAt: Date;
};

/**
 * Core review interface
 */
export type IReview = {
  _id: string;
  type: ReviewType;

  // Relationships
  reviewerId: string; // User who wrote the review
  targetId: string; // Property ID, User ID, or Agent ID being reviewed
  applicationId?: string; // Related rental application (if any)

  // Review content
  title: string;
  content: string;
  rating: IRatingBreakdown;

  // Media
  photos?: string[]; // URLs to photos
  videos?: string[]; // URLs to videos

  // Moderation
  status: ReviewStatus;
  moderatorId?: string;
  moderatorNotes?: string;
  moderatedAt?: Date;

  // Metadata
  tags: string[];
  language: "en" | "sw";
  sentiment?: ReviewSentiment;
  sentimentScore?: number; // -1 to 1
  data?: Record<string, any>; // Additional data storage

  // Engagement
  helpfulCount: number;
  notHelpfulCount: number;
  flagCount: number;
  responseId?: string; // Response from property owner/user

  // Kenya-specific features
  county?: string;
  city?: string;
  verified: boolean; // Verified as genuine review

  // Timestamps
  reviewDate: Date; // When the rental experience occurred

  // Flags
  isAnonymous: boolean;
  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;

  detectSwahili: () => void;
  addFlag: () => Promise<void>;
  markAsHelpful: () => Promise<void>;
  markAsNotHelpful: () => Promise<void>;
  reject: (moderatorId: string, reason: string) => Promise<void>;
  approve: (moderatorId: string, notes?: string) => Promise<void>;
};

/**
 * Property review summary
 */
export type IPropertyReviewSummary = {
  propertyId: string;

  // Overall metrics
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;

  // Category breakdown
  categoryRatings: {
    [key in PropertyReviewCategory]: {
      average: number;
      count: number;
    };
  };

  // Recent activity
  recentReviews: IReview[];
  monthlyTrend: Array<{
    month: string;
    averageRating: number;
    reviewCount: number;
  }>;

  // Engagement
  responseRate: number;
  averageResponseTime: number; // In hours

  // Quality indicators
  verifiedReviewsPercentage: number;
  sentimentSummary: {
    positive: number;
    neutral: number;
    negative: number;
  };

  updatedAt: Date;
};

// ==================== REQUEST/RESPONSE TYPES ====================

/**
 * Create review request
 */
export type CreateReviewRequest = {
  type: ReviewType;
  targetId: string; // Property ID, User ID, or Agent ID
  applicationId?: string;

  // Review content
  title: string;
  content: string;
  rating: IRatingBreakdown;

  // Media
  photos?: string[];
  videos?: string[];

  // Metadata
  tags?: string[];
  language?: "en" | "sw";
  reviewDate?: Date;
  county?: string;
  city?: string;

  // Options
  isAnonymous?: boolean;
};

/**
 * Update review request
 */
export type UpdateReviewRequest = {
  title?: string;
  content?: string;
  rating?: IRatingBreakdown;
  photos?: string[];
  videos?: string[];
  tags?: string[];
};

/**
 * Review response request
 */
export type CreateReviewResponseRequest = {
  reviewId: string;
  content: string;
};

/**
 * Flag review request
 */
export type FlagReviewRequest = {
  reviewId: string;
  reason: ReviewFlagReason;
  description?: string;
};

/**
 * Review filters for listing
 */
export type ReviewFilters = {
  type?: ReviewType | ReviewType[];
  status?: ReviewStatus | ReviewStatus[];
  targetId?: string;
  reviewerId?: string;
  rating?: number | number[];
  language?: "en" | "sw";
  verified?: boolean;
  hasResponse?: boolean;

  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  reviewDateAfter?: Date;
  reviewDateBefore?: Date;

  // Location filters
  county?: string;
  city?: string;

  // Content filters
  search?: string; // Full-text search
  tags?: string[];
  sentiment?: ReviewSentiment;

  // Sorting and pagination
  sortBy?: "createdAt" | "rating" | "helpfulCount" | "reviewDate";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

/**
 * Review query interface (alias for ReviewFilters with additional fields)
 */
export type IReviewQuery = Omit<ReviewFilters, "sortBy"> & {
  minRating?: number;
  maxRating?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?:
    | "createdAt"
    | "rating"
    | "rating.overall"
    | "helpfulCount"
    | "reviewDate";
};

/**
 * Review statistics response
 */
export type IReviewStatsResponse = {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  languageDistribution: {
    en: number;
    sw: number;
  };
  verificationRate: number;
  responseRate: number;
};

/**
 * Sentiment analysis result
 */
export type ISentimentAnalysisResult = {
  reviewId: string;
  sentiment: ReviewSentiment;
  score: number; // -1 to 1
  confidence: number; // 0 to 1
};

/**
 * Review analytics query
 */
export type ReviewAnalyticsQuery = {
  startDate?: Date;
  endDate?: Date;
  type?: ReviewType;
  groupBy?: "day" | "week" | "month" | "year";
};

/**
 * Review response with additional data
 */
export type ReviewResponse = {
  review: IReview;
  reviewer: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    reviewCount: number;
    averageRating: number;
  };
  target?: {
    _id: string;
    name: string;
    type: string;
    avatar?: string;
  };
  response?: IReviewResponse;
  canEdit: boolean;
  canDelete: boolean;
  canFlag: boolean;
  canRespond: boolean;
};

/**
 * Review list response
 */
export type ReviewListResponse = {
  reviews: ReviewResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
  summary?: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  };
  filters?: ReviewFilters;
};

/**
 * Review analytics response
 */
export type ReviewAnalyticsResponse = {
  analytics: IReviewAnalytics[];
  summary: {
    totalReviews: number;
    averageRating: number;
    approvalRate: number;
    responseRate: number;
    averageResponseTime: number;
  };
  trends: {
    ratingTrend: Array<{
      period: string;
      averageRating: number;
      reviewCount: number;
    }>;
    sentimentTrend: Array<{
      period: string;
      positive: number;
      neutral: number;
      negative: number;
    }>;
  };
  kenyaInsights?: {
    topCounties: Array<{
      county: string;
      averageRating: number;
      reviewCount: number;
    }>;
    languageDistribution: {
      english: number;
      swahili: number;
    };
    verificationRate: number;
  };
};

// ==================== MODERATION TYPES ====================

/**
 * Review moderation request
 */
export type ReviewModerationRequest = {
  reviewId: string;
  action: "approve" | "reject" | "flag" | "hide";
  reason?: string;
  notes?: string;
};

/**
 * Bulk moderation request
 */
export type BulkModerationRequest = {
  reviewIds: string[];
  action: "approve" | "reject" | "flag" | "hide";
  reason?: string;
  notes?: string;
};

/**
 * Moderation queue item
 */
export type ModerationQueueItem = {
  review: IReview;
  flagCount: number;
  flags: IReviewFlag[];
  autoModerationScore: number; // 0-1, higher = more likely to need human review
  priority: "low" | "medium" | "high" | "urgent";
  timeInQueue: number; // Hours
};

// ==================== CONSTANTS ====================

/**
 * Kenya-specific review constants
 */
export const KENYA_REVIEW_CONSTANTS = {
  // Minimum review length
  MIN_REVIEW_LENGTH: 10,
  MAX_REVIEW_LENGTH: 2000,

  // Rating scale
  MIN_RATING: 1,
  MAX_RATING: 5,

  EDIT_WINDOW_HOURS: 3,

  BUSINESS_HOURS: {
    START: 9, // 9 AM
    END: 17, // 5 PM
    ENFORCE_BUSINESS_HOURS: true,
  },

  // Common Swahili review terms
  SWAHILI_TERMS: {
    EXCELLENT: "bora sana",
    GOOD: "nzuri",
    AVERAGE: "wastani",
    POOR: "mbaya",
    TERRIBLE: "mbaya sana",
    LANDLORD: "mwenye nyumba",
    TENANT: "mpangaji",
    HOUSE: "nyumba",
    RENT: "kodi",
    CLEAN: "safi",
    DIRTY: "chafu",
    SAFE: "salama",
    DANGEROUS: "hatari",
  },

  // Counties for location validation
  COUNTIES: [
    "Nairobi",
    "Mombasa",
    "Nakuru",
    "Kisumu",
    "Eldoret",
    "Thika",
    "Malindi",
    "Machakos",
    "Meru",
    "Nyeri",
    "Kericho",
    "Garissa",
    "Kakamega",
    "Embu",
  ],

  // Auto-moderation thresholds
  AUTO_MODERATION: {
    SPAM_SCORE_THRESHOLD: 0.8,
    SENTIMENT_EXTREME_THRESHOLD: 0.9,
    FLAG_AUTO_HIDE_THRESHOLD: 5,
    RESPONSE_TIME_TARGET_HOURS: 48,
  },
} as const;

/**
 * Review error codes
 */
export const REVIEW_ERROR_CODES = {
  REVIEW_NOT_FOUND: "REVIEW_NOT_FOUND",
  UNAUTHORIZED_REVIEW: "UNAUTHORIZED_REVIEW",
  DUPLICATE_REVIEW: "DUPLICATE_REVIEW",
  INVALID_RATING: "INVALID_RATING",
  REVIEW_TOO_SHORT: "REVIEW_TOO_SHORT",
  REVIEW_TOO_LONG: "REVIEW_TOO_LONG",
  TARGET_NOT_FOUND: "TARGET_NOT_FOUND",
  CANNOT_REVIEW_SELF: "CANNOT_REVIEW_SELF",
  REVIEW_PERIOD_EXPIRED: "REVIEW_PERIOD_EXPIRED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  MODERATION_ERROR: "MODERATION_ERROR",
  SPAM_DETECTED: "SPAM_DETECTED",
} as const;

/**
 * Custom error class for reviews system
 */
export class ReviewError extends Error {
  constructor(
    _code: keyof typeof REVIEW_ERROR_CODES,
    message: string,
    _statusCode = 400,
    _details?: any
  ) {
    super(message);
    this.name = "ReviewError";
  }
}

export default {
  ReviewType,
  ReviewStatus,
  PropertyReviewCategory,
  UserReviewCategory,
  ReviewSentiment,
  ReviewFlagReason,
  KENYA_REVIEW_CONSTANTS,
  REVIEW_ERROR_CODES,
  ReviewError,
};
