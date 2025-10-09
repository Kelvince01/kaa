/**
 * Reviews System Types
 *
 * Comprehensive review and rating system for Kaa SaaS
 * Includes property reviews, user reviews, moderation, and analytics
 */

import type { Types } from "mongoose";
import type { BaseDocument } from "./base.type";
import type { PropertyReviewCategory, UserReviewCategory } from "./review.enum";

/**
 * Individual rating breakdown
 */
export type IRatingBreakdown = {
  overall: number; // 1-5 stars
  categories: {
    [key in PropertyReviewCategory | UserReviewCategory]?: number;
  };
};

export interface IReview extends BaseDocument {
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
