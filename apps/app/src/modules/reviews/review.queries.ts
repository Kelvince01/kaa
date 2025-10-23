import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as reviewService from "./review.service";
import type { ReviewUpdateInput } from "./review.type";

// Get all reviews
export const useReviews = (params: any = {}) =>
  useQuery({
    queryKey: ["reviews", params],
    queryFn: () => reviewService.getReviews(params),
  });

// Get review by ID
export const useReview = (id: string) =>
  useQuery({
    queryKey: ["reviews", id],
    queryFn: () => reviewService.getReview(id),
    enabled: !!id,
  });

// Create review
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewService.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

// Update review
export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewUpdateInput }) =>
      reviewService.updateReview(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.id] });
    },
  });
};
