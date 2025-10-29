/**
 * Review Queries
 * React Query hooks for fetching review data
 */

import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { reviewService } from "./review.service";
import type {
  IReview,
  IReviewStatsResponse,
  ReviewFilterOptions,
  ReviewListResponse,
} from "./review.type";

export const reviewKeys = {
  all: ["reviews"] as const,
  lists: () => [...reviewKeys.all, "list"] as const,
  list: (filters?: ReviewFilterOptions) =>
    [...reviewKeys.lists(), filters] as const,
  details: () => [...reviewKeys.all, "detail"] as const,
  detail: (id: string) => [...reviewKeys.details(), id] as const,
  stats: (targetId: string, type?: string) =>
    [...reviewKeys.all, "stats", targetId, type] as const,
  featured: (type?: string, limit?: number) =>
    [...reviewKeys.all, "featured", type, limit] as const,
  county: (county: string, page?: number, limit?: number) =>
    [...reviewKeys.all, "county", county, page, limit] as const,
  swahili: (page?: number, limit?: number) =>
    [...reviewKeys.all, "swahili", page, limit] as const,
  verified: (targetId?: string, page?: number, limit?: number) =>
    [...reviewKeys.all, "verified", targetId, page, limit] as const,
  pending: (page?: number, limit?: number) =>
    [...reviewKeys.all, "pending", page, limit] as const,
  flagged: (page?: number, limit?: number) =>
    [...reviewKeys.all, "flagged", page, limit] as const,
};

/**
 * Get reviews with filtering
 */
export const useReviews = (
  filters?: ReviewFilterOptions,
  options?: UseQueryOptions<ReviewListResponse>
) =>
  useQuery<ReviewListResponse>({
    queryKey: reviewKeys.list(filters),
    queryFn: () => reviewService.getReviews(filters),
    ...options,
  });

/**
 * Get single review
 */
export const useReview = (id: string, options?: UseQueryOptions<IReview>) =>
  useQuery<IReview>({
    queryKey: reviewKeys.detail(id),
    queryFn: () => reviewService.getReview(id),
    enabled: !!id,
    ...options,
  });

/**
 * Get review statistics
 */
export const useReviewStats = (
  targetId: string,
  type?: string,
  options?: UseQueryOptions<IReviewStatsResponse>
) =>
  useQuery<IReviewStatsResponse>({
    queryKey: reviewKeys.stats(targetId, type),
    queryFn: () => reviewService.getReviewStats(targetId, type),
    enabled: !!targetId,
    ...options,
  });

/**
 * Get featured reviews
 */
export const useFeaturedReviews = (
  type?: string,
  limit = 10,
  options?: UseQueryOptions<IReview[]>
) =>
  useQuery<IReview[]>({
    queryKey: reviewKeys.featured(type, limit),
    queryFn: () => reviewService.getFeaturedReviews(type, limit),
    ...options,
  });

/**
 * Get reviews by county
 */
export const useReviewsByCounty = (
  county: string,
  page = 1,
  limit = 20,
  options?: UseQueryOptions<ReviewListResponse>
) =>
  useQuery<ReviewListResponse>({
    queryKey: reviewKeys.county(county, page, limit),
    queryFn: () => reviewService.getReviewsByCounty(county, page, limit),
    enabled: !!county,
    ...options,
  });

/**
 * Get Swahili reviews
 */
export const useSwahiliReviews = (
  page = 1,
  limit = 20,
  options?: UseQueryOptions<ReviewListResponse>
) =>
  useQuery<ReviewListResponse>({
    queryKey: reviewKeys.swahili(page, limit),
    queryFn: () => reviewService.getSwahiliReviews(page, limit),
    ...options,
  });

/**
 * Get verified reviews
 */
export const useVerifiedReviews = (
  targetId?: string,
  page = 1,
  limit = 20,
  options?: UseQueryOptions<ReviewListResponse>
) =>
  useQuery<ReviewListResponse>({
    queryKey: reviewKeys.verified(targetId, page, limit),
    queryFn: () => reviewService.getVerifiedReviews(targetId, page, limit),
    ...options,
  });

/**
 * Get pending reviews for moderation
 */
export const usePendingReviews = (
  page = 1,
  limit = 20,
  options?: UseQueryOptions<ReviewListResponse>
) =>
  useQuery<ReviewListResponse>({
    queryKey: reviewKeys.pending(page, limit),
    queryFn: () => reviewService.getPendingReviews(page, limit),
    ...options,
  });

/**
 * Get flagged reviews
 */
export const useFlaggedReviews = (
  page = 1,
  limit = 20,
  options?: UseQueryOptions<ReviewListResponse>
) =>
  useQuery<ReviewListResponse>({
    queryKey: reviewKeys.flagged(page, limit),
    queryFn: () => reviewService.getFlaggedReviews(page, limit),
    ...options,
  });
