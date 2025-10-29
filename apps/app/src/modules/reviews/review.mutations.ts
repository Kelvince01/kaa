/**
 * Review Mutations
 * React Query hooks for mutating review data
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reviewKeys } from "./review.queries";
import { reviewService } from "./review.service";
import type {
  BulkModerationAction,
  FlagReviewFormData,
  ReviewFormData,
  ReviewModerationAction,
  ReviewResponseFormData,
} from "./review.type";

/**
 * Create a new review
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewFormData) => reviewService.createReview(data),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.stats(review.targetId),
      });
      toast.success("Review created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create review");
    },
  });
};

/**
 * Update a review
 */
export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReviewFormData> }) =>
      reviewService.updateReview(id, data),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(review._id),
      });
      toast.success("Review updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update review");
    },
  });
};

/**
 * Delete a review
 */
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reviewService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      toast.success("Review deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete review");
    },
  });
};

/**
 * Mark review as helpful
 */
export const useMarkHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reviewService.markHelpful(id),
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(review._id),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      toast.success("Marked as helpful");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark as helpful");
    },
  });
};

/**
 * Mark review as not helpful
 */
export const useMarkNotHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reviewService.markNotHelpful(id),
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(review._id),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      toast.success("Marked as not helpful");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark as not helpful");
    },
  });
};

/**
 * Flag a review
 */
export const useFlagReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FlagReviewFormData) => reviewService.flagReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      toast.success("Review flagged for moderation");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to flag review");
    },
  });
};

/**
 * Create a review response
 */
export const useCreateResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewResponseFormData) =>
      reviewService.createResponse(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(response.reviewId),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      toast.success("Response posted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post response");
    },
  });
};

/**
 * Update a review response
 */
export const useUpdateResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      content,
    }: {
      reviewId: string;
      content: string;
    }) => reviewService.updateResponse(reviewId, content),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(response.reviewId),
      });
      toast.success("Response updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update response");
    },
  });
};

/**
 * Delete a review response
 */
export const useDeleteResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => reviewService.deleteResponse(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      toast.success("Response deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete response");
    },
  });
};

// ==================== MODERATION MUTATIONS ====================

/**
 * Approve a review
 */
export const useApproveReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: ReviewModerationAction) =>
      reviewService.approveReview(action),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.pending() });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(review._id),
      });
      toast.success("Review approved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve review");
    },
  });
};

/**
 * Reject a review
 */
export const useRejectReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: ReviewModerationAction) =>
      reviewService.rejectReview(action),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.pending() });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(review._id),
      });
      toast.success("Review rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject review");
    },
  });
};

/**
 * Hide a review
 */
export const useHideReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: ReviewModerationAction) =>
      reviewService.hideReview(action),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(review._id),
      });
      toast.success("Review hidden");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to hide review");
    },
  });
};

/**
 * Bulk moderate reviews
 */
export const useBulkModerate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: BulkModerationAction) =>
      reviewService.bulkModerate(action),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.pending() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      toast.success(
        `Moderation complete: ${result.success} succeeded, ${result.failed} failed`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to bulk moderate");
    },
  });
};

/**
 * Resolve a flag
 */
export const useResolveFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      flagId,
      action,
    }: {
      flagId: string;
      action: "resolve" | "dismiss";
    }) => reviewService.resolveFlag(flagId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.flagged() });
      toast.success("Flag resolved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resolve flag");
    },
  });
};
