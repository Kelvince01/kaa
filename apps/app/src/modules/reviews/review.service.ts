import { httpClient } from "@/lib/axios";
import type {
  ReviewCreateInput,
  ReviewListResponse,
  ReviewResponse,
  ReviewUpdateInput,
} from "./review.type";

// Create review
export const createReview = async (
  data: ReviewCreateInput
): Promise<ReviewResponse> => {
  const response = await httpClient.api.post("/reviews", data);
  return response.data;
};

// Get all reviews (with optional filters)
export const getReviews = async (
  params: any = {}
): Promise<ReviewListResponse> => {
  const response = await httpClient.api.get("/reviews", { params });
  return response.data;
};

// Get review by ID
export const getReview = async (id: string): Promise<ReviewResponse> => {
  const response = await httpClient.api.get(`/reviews/${id}`);
  return response.data;
};

// Update review
export const updateReview = async (
  id: string,
  data: ReviewUpdateInput
): Promise<ReviewResponse> => {
  const response = await httpClient.api.patch(`/reviews/${id}`, data);
  return response.data;
};
