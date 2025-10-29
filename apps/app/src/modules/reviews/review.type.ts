/**
 * Review Types for Frontend
 * Based on @kaa/models review types
 */

import type {
  IRatingBreakdown,
  IReview,
  IReviewResponse,
  ReviewFlagReason,
  ReviewSentiment,
  ReviewStatus,
  ReviewType,
} from "@kaa/models/types";

// Re-export types from models
export type {
  IReview,
  IReviewFlag,
  IReviewResponse,
  IReviewStatsResponse,
  ReviewFlagReason,
  ReviewListResponse,
  ReviewSentiment,
  ReviewStatus,
  ReviewType,
} from "@kaa/models/types";

export {
  ReviewFlagReason as ReviewFlagReasonEnum,
  ReviewSentiment as ReviewSentimentEnum,
  ReviewStatus as ReviewStatusEnum,
  ReviewType as ReviewTypeEnum,
} from "@kaa/models/types";

/**
 * Review form data
 */
export type ReviewFormData = {
  type: ReviewType;
  targetId: string;
  applicationId?: string;
  title: string;
  content: string;
  rating: IRatingBreakdown;
  photos?: string[];
  videos?: string[];
  tags?: string[];
  language?: "en" | "sw";
  reviewDate?: Date;
  county?: string;
  city?: string;
  isAnonymous?: boolean;
};

/**
 * Review filter options
 */
export type ReviewFilterOptions = {
  targetId?: string;
  reviewerId?: string;
  type?: ReviewType | ReviewType[];
  status?: ReviewStatus | ReviewStatus[];
  county?: string;
  city?: string;
  language?: "en" | "sw";
  sentiment?: ReviewSentiment;
  verified?: boolean;
  minRating?: number;
  maxRating?: number;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "rating" | "helpfulCount" | "reviewDate";
  sortOrder?: "asc" | "desc";
};

/**
 * Review with user details
 */
export type ReviewWithUser = IReview & {
  reviewer?: {
    profile: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    verification: {
      emailVerifiedAt?: string;
    };
  };
  response?: IReviewResponse;
};

/**
 * Flag review form data
 */
export type FlagReviewFormData = {
  reviewId: string;
  reason: ReviewFlagReason;
  description?: string;
};

/**
 * Review response form data
 */
export type ReviewResponseFormData = {
  reviewId: string;
  content: string;
};

/**
 * Review moderation action
 */
export type ReviewModerationAction = {
  reviewId: string;
  action: "approve" | "reject" | "hide";
  reason?: string;
  notes?: string;
};

/**
 * Bulk moderation action
 */
export type BulkModerationAction = {
  reviewIds: string[];
  action: "approve" | "reject" | "hide";
  reason?: string;
};

/**
 * Review stats display
 */
export type ReviewStatsDisplay = {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  verificationRate: number;
  responseRate: number;
};

/**
 * Review tab options
 */
export type ReviewTab =
  | "all"
  | "positive"
  | "negative"
  | "verified"
  | "withPhotos"
  | "recent";
