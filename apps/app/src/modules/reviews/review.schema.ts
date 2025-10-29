/**
 * Review Schemas
 * Zod schemas for review form validation
 */

import { PropertyReviewCategory, UserReviewCategory } from "@kaa/models/types";
import { z } from "zod";
import {
  ReviewFlagReasonEnum,
  ReviewSentimentEnum,
  ReviewStatusEnum,
  ReviewTypeEnum,
} from "./review.type";

export const reviewCategorySchema = z.union([
  z.enum(Object.values(PropertyReviewCategory)),
  z.enum(Object.values(UserReviewCategory)),
]);

export type ReviewCategorySchemaType = z.infer<typeof reviewCategorySchema>;

const ratingBreakdownSchema = z.object({
  overall: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must not exceed 5"),
  categories: z
    .record(reviewCategorySchema, z.number().min(1).max(5).optional())
    .optional(),
});

export type RatingBreakdownSchemaType = z.infer<typeof ratingBreakdownSchema>;

/**
 * Review form schema
 */
export const reviewFormSchema = z.object({
  type: z.nativeEnum(ReviewTypeEnum),
  targetId: z.string().min(1, "Target ID is required"),
  applicationId: z.string().optional(),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must not exceed 200 characters"),
  content: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review must not exceed 2000 characters"),
  rating: ratingBreakdownSchema,
  photos: z
    .array(z.string().url())
    .max(10, "Maximum 10 photos allowed")
    .optional(),
  videos: z
    .array(z.string().url())
    .max(3, "Maximum 3 videos allowed")
    .optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
  language: z.enum(["en", "sw"]).default("en").optional(),
  reviewDate: z.date().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
  isAnonymous: z.boolean().default(false).optional(),
});

export type ReviewFormSchemaType = z.infer<typeof reviewFormSchema>;

/**
 * Review update schema
 */
export const reviewUpdateSchema = reviewFormSchema.partial().omit({
  type: true,
  targetId: true,
  applicationId: true,
});

export type ReviewUpdateSchemaType = z.infer<typeof reviewUpdateSchema>;

/**
 * Flag review schema
 */
export const flagReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  reason: z.nativeEnum(ReviewFlagReasonEnum),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

export type FlagReviewSchemaType = z.infer<typeof flagReviewSchema>;

/**
 * Review response schema
 */
export const reviewResponseSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  content: z
    .string()
    .min(10, "Response must be at least 10 characters")
    .max(1000, "Response must not exceed 1000 characters"),
});

export type ReviewResponseSchemaType = z.infer<typeof reviewResponseSchema>;

/**
 * Review filter schema
 */
export const reviewFilterSchema = z.object({
  targetId: z.string().optional(),
  reviewerId: z.string().optional(),
  type: z
    .union([
      z.nativeEnum(ReviewTypeEnum),
      z.array(z.nativeEnum(ReviewTypeEnum)),
    ])
    .optional(),
  status: z
    .union([
      z.nativeEnum(ReviewStatusEnum),
      z.array(z.nativeEnum(ReviewStatusEnum)),
    ])
    .optional(),
  county: z.string().optional(),
  city: z.string().optional(),
  language: z.enum(["en", "sw"]).optional(),
  sentiment: z.nativeEnum(ReviewSentimentEnum).optional(),
  verified: z.boolean().optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxRating: z.number().min(1).max(5).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(20).optional(),
  sortBy: z
    .enum(["createdAt", "rating", "helpfulCount", "reviewDate"])
    .default("createdAt")
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});

export type ReviewFilterSchemaType = z.infer<typeof reviewFilterSchema>;

/**
 * Moderation action schema
 */
export const moderationActionSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  action: z.enum(["approve", "reject", "hide"]),
  reason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export type ModerationActionSchemaType = z.infer<typeof moderationActionSchema>;

/**
 * Bulk moderation schema
 */
export const bulkModerationSchema = z.object({
  reviewIds: z.array(z.string()).min(1, "At least one review must be selected"),
  action: z.enum(["approve", "reject", "hide"]),
  reason: z.string().max(500).optional(),
});

export type BulkModerationSchemaType = z.infer<typeof bulkModerationSchema>;

/**
 * Rating constants
 */
export const RATING_OPTIONS = [
  { value: 1, label: "1 Star - Poor" },
  { value: 2, label: "2 Stars - Fair" },
  { value: 3, label: "3 Stars - Good" },
  { value: 4, label: "4 Stars - Very Good" },
  { value: 5, label: "5 Stars - Excellent" },
] as const;

/**
 * Flag reason options
 */
export const FLAG_REASON_OPTIONS = [
  { value: "inappropriate_language", label: "Inappropriate Language" },
  { value: "fake_review", label: "Fake Review" },
  { value: "spam", label: "Spam" },
  { value: "personal_attack", label: "Personal Attack" },
  { value: "off_topic", label: "Off Topic" },
  { value: "misleading", label: "Misleading Information" },
  { value: "harassment", label: "Harassment" },
  { value: "privacy_violation", label: "Privacy Violation" },
] as const;

/**
 * Review type options
 */
export const REVIEW_TYPE_OPTIONS = [
  { value: "property", label: "Property" },
  { value: "user_landlord", label: "Landlord" },
  { value: "user_tenant", label: "Tenant" },
  { value: "agent", label: "Agent" },
  { value: "platform", label: "Platform" },
] as const;

/**
 * Language options
 */
export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "sw", label: "Swahili" },
] as const;

/**
 * Kenya counties for location filtering
 */
export const KENYA_COUNTIES = [
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
] as const;
