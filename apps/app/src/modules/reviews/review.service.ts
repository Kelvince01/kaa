/**
 * Review Service
 * Handles all API calls for reviews
 */

import { httpClient } from "@/lib/axios";
import type {
  BulkModerationAction,
  FlagReviewFormData,
  IReview,
  IReviewFlag,
  IReviewResponse,
  IReviewStatsResponse,
  ReviewFilterOptions,
  ReviewFormData,
  ReviewListResponse,
  ReviewModerationAction,
  ReviewResponseFormData,
} from "./review.type";

const BASE_URL = "/reviews";

export class ReviewService {
  /**
   * Get reviews with filtering
   */
  async getReviews(filters?: ReviewFilterOptions): Promise<ReviewListResponse> {
    const { data } = await httpClient.api.get<{
      status: string;
      data: ReviewListResponse;
    }>(BASE_URL, {
      params: filters,
    });
    return data.data;
  }

  /**
   * Get single review by ID
   */
  async getReview(id: string): Promise<IReview> {
    const { data } = await httpClient.api.get<{
      status: string;
      data: { review: IReview };
    }>(`${BASE_URL}/${id}`);
    return data.data.review;
  }

  /**
   * Get review statistics
   */
  async getReviewStats(
    targetId: string,
    type?: string
  ): Promise<IReviewStatsResponse> {
    const { data } = await httpClient.api.get<{
      status: string;
      data: { stats: IReviewStatsResponse };
    }>(`${BASE_URL}/stats/${targetId}`, {
      params: { type },
    });
    return data.data.stats;
  }

  /**
   * Get featured reviews
   */
  async getFeaturedReviews(type?: string, limit = 10): Promise<IReview[]> {
    const { data } = await httpClient.api.get<{
      status: string;
      data: { reviews: IReview[] };
    }>(`${BASE_URL}/featured/list`, {
      params: { type, limit },
    });
    return data.data.reviews;
  }

  /**
   * Get reviews by county
   */
  async getReviewsByCounty(
    county: string,
    page = 1,
    limit = 20
  ): Promise<ReviewListResponse> {
    const { data } = await httpClient.api.get<{
      status: string;
      data: ReviewListResponse;
    }>(`${BASE_URL}/county/${county}`, {
      params: { page, limit },
    });
    return data.data;
  }

  /**
   * Get Swahili reviews
   */
  async getSwahiliReviews(page = 1, limit = 20): Promise<ReviewListResponse> {
    const { data } = await httpClient.api.get<{
      status: string;
      data: ReviewListResponse;
    }>(`${BASE_URL}/swahili/list`, {
      params: { page, limit },
    });
    return data.data;
  }

  /**
   * Get verified reviews
   */
  async getVerifiedReviews(
    targetId?: string,
    page = 1,
    limit = 20
  ): Promise<ReviewListResponse> {
    const { data } = await httpClient.api.get<{
      status: string;
      data: ReviewListResponse;
    }>(`${BASE_URL}/verified/list`, {
      params: { targetId, page, limit },
    });
    return data.data;
  }

  /**
   * Create a new review
   */
  async createReview(formData: ReviewFormData): Promise<IReview> {
    const { data } = await httpClient.api.post<{
      status: string;
      message: string;
      data: { review: IReview };
    }>(BASE_URL, formData);
    return data.data.review;
  }

  /**
   * Update a review
   */
  async updateReview(
    id: string,
    formData: Partial<ReviewFormData>
  ): Promise<IReview> {
    const { data } = await httpClient.api.patch<{
      status: string;
      message: string;
      data: { review: IReview };
    }>(`${BASE_URL}/${id}`, formData);
    return data.data.review;
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string): Promise<void> {
    await httpClient.api.delete(`${BASE_URL}/${id}`);
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(id: string): Promise<IReview> {
    const { data } = await httpClient.api.post<{
      status: string;
      data: { review: IReview };
    }>(`${BASE_URL}/${id}/helpful`);
    return data.data.review;
  }

  /**
   * Mark review as not helpful
   */
  async markNotHelpful(id: string): Promise<IReview> {
    const { data } = await httpClient.api.post<{
      status: string;
      data: { review: IReview };
    }>(`${BASE_URL}/${id}/not-helpful`);
    return data.data.review;
  }

  /**
   * Flag a review
   */
  async flagReview(formData: FlagReviewFormData): Promise<IReviewFlag> {
    const { data } = await httpClient.api.post<{
      status: string;
      message: string;
      data: { flag: IReviewFlag };
    }>(`${BASE_URL}/${formData.reviewId}/flag`, {
      reason: formData.reason,
      description: formData.description,
    });
    return data.data.flag;
  }

  /**
   * Create a response to a review
   */
  async createResponse(
    formData: ReviewResponseFormData
  ): Promise<IReviewResponse> {
    const { data } = await httpClient.api.post<{
      status: string;
      message: string;
      data: { response: IReviewResponse };
    }>(`${BASE_URL}/${formData.reviewId}/respond`, {
      content: formData.content,
    });
    return data.data.response;
  }

  /**
   * Update a review response
   */
  async updateResponse(
    reviewId: string,
    content: string
  ): Promise<IReviewResponse> {
    const { data } = await httpClient.api.patch<{
      status: string;
      data: { response: IReviewResponse };
    }>(`${BASE_URL}/${reviewId}/respond`, { content });
    return data.data.response;
  }

  /**
   * Delete a review response
   */
  async deleteResponse(reviewId: string): Promise<void> {
    await httpClient.api.delete(`${BASE_URL}/${reviewId}/respond`);
  }

  // ==================== MODERATION ENDPOINTS ====================

  /**
   * Get pending reviews for moderation
   */
  async getPendingReviews(page = 1, limit = 20): Promise<ReviewListResponse> {
    const { data } = await httpClient.api.get<{
      status: string;
      data: ReviewListResponse;
    }>(`${BASE_URL}/moderation/pending`, {
      params: { page, limit },
    });
    return data.data;
  }

  /**
   * Get flagged reviews
   */
  async getFlaggedReviews(page = 1, limit = 20): Promise<ReviewListResponse> {
    const { data } = await httpClient.api.get<{
      status: string;
      data: ReviewListResponse;
    }>(`${BASE_URL}/moderation/flagged`, {
      params: { page, limit },
    });
    return data.data;
  }

  /**
   * Approve a review
   */
  async approveReview(action: ReviewModerationAction): Promise<IReview> {
    const { data } = await httpClient.api.post<{
      status: string;
      data: { review: IReview };
    }>(`${BASE_URL}/${action.reviewId}/approve`, {
      notes: action.notes,
    });
    return data.data.review;
  }

  /**
   * Reject a review
   */
  async rejectReview(action: ReviewModerationAction): Promise<IReview> {
    const { data } = await httpClient.api.post<{
      status: string;
      data: { review: IReview };
    }>(`${BASE_URL}/${action.reviewId}/reject`, {
      reason: action.reason,
    });
    return data.data.review;
  }

  /**
   * Hide a review
   */
  async hideReview(action: ReviewModerationAction): Promise<IReview> {
    const { data } = await httpClient.api.post<{
      status: string;
      data: { review: IReview };
    }>(`${BASE_URL}/${action.reviewId}/hide`, {
      reason: action.reason,
    });
    return data.data.review;
  }

  /**
   * Bulk moderate reviews
   */
  async bulkModerate(
    action: BulkModerationAction
  ): Promise<{ success: number; failed: number }> {
    const { data } = await httpClient.api.post<{
      status: string;
      data: { success: number; failed: number };
    }>(`${BASE_URL}/moderation/bulk`, action);
    return data.data;
  }

  /**
   * Resolve a flag
   */
  async resolveFlag(
    flagId: string,
    action: "resolve" | "dismiss"
  ): Promise<IReviewFlag> {
    const { data } = await httpClient.api.post<{
      status: string;
      data: { flag: IReviewFlag };
    }>(`${BASE_URL}/flags/${flagId}/resolve`, { action });
    return data.data.flag;
  }
}

// Export singleton instance
export const reviewService = new ReviewService();
