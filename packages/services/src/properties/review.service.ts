/**
 * Reviews Service
 *
 * Comprehensive service for managing reviews, moderation, analytics and Kenya-specific features
 */

import {
  Booking,
  Property,
  PropertyReviewSummary,
  Review,
  ReviewAnalytics,
  ReviewFlag,
  ReviewResponse,
  User,
  UserReviewSummary,
} from "@kaa/models";
import {
  type CreateReviewRequest,
  type IPropertyReviewSummary,
  type IReview,
  type IReviewAnalytics,
  type IReviewFlag,
  type IReviewQuery,
  type IReviewResponse,
  type IReviewStatsResponse,
  type ISentimentAnalysisResult,
  type IUserReviewSummary,
  KENYA_REVIEW_CONSTANTS,
  type ReviewAnalyticsQuery,
  type ReviewFlagReason,
  type ReviewListResponse,
  ReviewSentiment,
  ReviewStatus,
  ReviewType,
  type UpdateReviewRequest,
} from "@kaa/models/types";
import {
  AppError as BaseError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@kaa/utils";
import type { FilterQuery, PipelineStage } from "mongoose";
import { notificationService } from "../comms/notification.service";

// ==================== REVIEW SERVICE CLASS ====================

export class ReviewsService {
  // ==================== CORE REVIEW OPERATIONS ====================

  /**
   * Create a new review
   */
  async createReview(
    data: CreateReviewRequest,
    reviewerId: string
  ): Promise<IReview> {
    try {
      // Validation checks
      await this.validateReviewCreation(data, reviewerId);

      // Check for duplicate reviews
      const existingReview = await this.checkDuplicateReview(
        reviewerId,
        data.targetId,
        data.applicationId
      );

      if (existingReview) {
        throw new ValidationError("You have already reviewed this target");
      }

      // Create review with Kenya-specific enhancements
      const shouldAutoApprove = await this.shouldAutoApprove(reviewerId);
      const reviewData = {
        ...data,
        reviewerId,
        status: shouldAutoApprove
          ? ReviewStatus.APPROVED
          : ReviewStatus.PENDING,
        verified: await this.isVerifiedUser(reviewerId),
        reviewDate: new Date(),
        county: data.county || (await this.detectUserCounty(reviewerId)),
        city: data.city || (await this.detectUserCity(reviewerId)),
      };

      const review = new Review(reviewData);
      await review.save();

      // Update summary statistics asynchronously
      this.updateSummaryStats(review).catch(console.error);

      // Send notifications
      this.sendReviewNotifications(review).catch(console.error);

      return review.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to create review",
        ${(error as Error).message}`
      );
    }
  }

  /**
   * Update an existing review
   */
  async updateReview(
    reviewId: string,
    data: UpdateReviewRequest,
    userId: string
  ): Promise<IReview> {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new NotFoundError("Review not found");
      }

      // Check permissions
      if (review.reviewerId !== userId) {
        throw new ForbiddenError("Cannot update another user's review");
      }

      // Only allow updates if not moderated or within edit window
      if (review.status !== ReviewStatus.PENDING) {
        const editWindow =
          KENYA_REVIEW_CONSTANTS.EDIT_WINDOW_HOURS * 60 * 60 * 1000;
        const timeSinceCreation = Date.now() - review.createdAt.getTime();

        if (timeSinceCreation > editWindow) {
          throw new ForbiddenError("Review can no longer be edited");
        }
      }

      // Update fields
      Object.assign(review, data);
      review.status = ReviewStatus.PENDING; // Re-require moderation after edit

      await review.save();

      // Update summary statistics
      this.updateSummaryStats(review).catch(console.error);

      return review.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to update review",
        ${(error as Error).message}`
      );
    }
  }

  /**
   * Get review by ID
   */
  async getReview(reviewId: string, userId?: string): Promise<IReview> {
    try {
      const query = Review.findById(reviewId)
        .populate("reviewerId", "firstName lastName avatar verified")
        .populate("responseId");

      // Apply visibility rules
      if (!userId) {
        query.where({ status: ReviewStatus.APPROVED });
      }

      const review = await query.exec();
      if (!review) {
        throw new NotFoundError("Review not found");
      }

      return review.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to get review", ${(error as Error).message}`
      );
    }
  }

  /**
   * Get reviews with filtering and pagination
   */
  async getReviews(query: IReviewQuery): Promise<ReviewListResponse> {
    try {
      const {
        targetId,
        reviewerId,
        type,
        status,
        county,
        city,
        language,
        sentiment,
        verified,
        minRating,
        maxRating,
        dateFrom,
        dateTo,
        tags,
        search,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      // Build filter
      const filter: FilterQuery<IReview> = {};

      if (targetId) filter.targetId = targetId;
      if (reviewerId) filter.reviewerId = reviewerId;
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (county) filter.county = county;
      if (city) filter.city = new RegExp(city, "i");
      if (language) filter.language = language;
      if (sentiment) filter.sentiment = sentiment;
      if (verified !== undefined) filter.verified = verified;
      if (minRating)
        filter["rating.overall"] = {
          ...filter["rating.overall"],
          $gte: minRating,
        };
      if (maxRating)
        filter["rating.overall"] = {
          ...filter["rating.overall"],
          $lte: maxRating,
        };
      if (dateFrom)
        filter.reviewDate = { ...filter.reviewDate, $gte: new Date(dateFrom) };
      if (dateTo)
        filter.reviewDate = { ...filter.reviewDate, $lte: new Date(dateTo) };
      if (tags?.length) filter.tags = { $in: tags };

      // Text search
      if (search) {
        filter.$text = { $search: search };
      }

      // Calculate skip and sort
      const skip = (page - 1) * limit;
      const sort: Record<string, 1 | -1> = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute queries
      const [reviews, totalCount] = await Promise.all([
        Review.find(filter)
          .populate("reviewerId", "firstName lastName avatar verified")
          .populate("responseId")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        Review.countDocuments(filter),
      ]);

      return {
        reviews: reviews.map((r) => r.toObject()) as any,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new ValidationError(
        `"Failed to get reviews", ${(error as Error).message}`
      );
    }
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new NotFoundError("Review not found");
      }

      // Check permissions
      if (review.reviewerId !== userId) {
        throw new ForbiddenError("Cannot delete another user's review");
      }

      await Review.findByIdAndDelete(reviewId);

      // Clean up related data
      await ReviewResponse.findOneAndDelete({ reviewId });
      await ReviewFlag.deleteMany({ reviewId });

      // Update summary statistics
      this.updateSummaryStatsAfterDeletion(review).catch(console.error);
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to delete review", ${(error as Error).message}`
      );
    }
  }

  // ==================== MODERATION OPERATIONS ====================

  /**
   * Approve review
   */
  async approveReview(
    reviewId: string,
    moderatorId: string,
    notes?: string
  ): Promise<IReview> {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new NotFoundError("Review not found");
      }

      await review.approve(moderatorId, notes);

      // Update summary statistics
      this.updateSummaryStats(review).catch(console.error);

      // Send approval notification
      this.sendModerationNotification(review, "approved").catch(console.error);

      return review.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to approve review", ${(error as Error).message}`
      );
    }
  }

  /**
   * Reject review
   */
  async rejectReview(
    reviewId: string,
    moderatorId: string,
    reason: string
  ): Promise<IReview> {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new NotFoundError("Review not found");
      }

      await review.reject(moderatorId, reason);

      // Send rejection notification
      this.sendModerationNotification(review, "rejected", reason).catch(
        console.error
      );

      return review.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to reject review", ${(error as Error).message}`
      );
    }
  }

  /**
   * Hide review
   */
  async hideReview(
    reviewId: string,
    moderatorId: string,
    reason?: string
  ): Promise<IReview> {
    try {
      const review = await Review.findByIdAndUpdate(
        reviewId,
        {
          status: ReviewStatus.HIDDEN,
          moderatorId,
          moderatorNotes: reason,
          moderatedAt: new Date(),
        },
        { new: true }
      );

      if (!review) {
        throw new NotFoundError("Review not found");
      }

      return review.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to hide review", ${(error as Error).message}`
      );
    }
  }

  /**
   * Get reviews pending moderation
   */
  async getPendingReviews(page = 1, limit = 20): Promise<ReviewListResponse> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, totalCount] = await Promise.all([
        Review.find({ status: ReviewStatus.PENDING })
          .populate("reviewerId", "firstName lastName avatar verified")
          .sort({ createdAt: 1 }) // Oldest first for moderation
          .skip(skip)
          .limit(limit)
          .exec(),
        Review.countDocuments({ status: ReviewStatus.PENDING }),
      ]);

      return {
        reviews: reviews.map((r) => r.toObject()) as any,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          //   hasNextPage: page < Math.ceil(totalCount / limit),
          //   hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new ValidationError(
        `"Failed to get pending reviews", ${(error as Error).message}`
      );
    }
  }

  /**
   * Bulk moderate reviews
   */
  async bulkModerateReviews(
    reviewIds: string[],
    action: "approve" | "reject" | "hide",
    moderatorId: string,
    reason?: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const reviewId of reviewIds) {
      try {
        switch (action) {
          case "approve":
            await this.approveReview(reviewId, moderatorId, reason);
            break;
          case "reject":
            await this.rejectReview(
              reviewId,
              moderatorId,
              reason || "Bulk rejection"
            );
            break;
          case "hide":
            await this.hideReview(reviewId, moderatorId, reason);
            break;
          default:
            break;
        }
        success++;
      } catch (error) {
        failed++;
        console.error(`Failed to moderate review ${reviewId}:`, error);
      }
    }

    return { success, failed };
  }

  // ==================== REVIEW FLAGS ====================

  /**
   * Flag a review
   */
  async flagReview(
    reviewId: string,
    flaggerId: string,
    reason: ReviewFlagReason,
    description?: string
  ): Promise<IReviewFlag> {
    try {
      // Check if already flagged by this user
      const existingFlag = await ReviewFlag.findOne({ reviewId, flaggerId });
      if (existingFlag) {
        throw new ValidationError("You have already flagged this review");
      }

      const flag = new ReviewFlag({
        reviewId,
        flaggerId,
        reason,
        description,
      });

      await flag.save();

      // Update review flag count
      const review = await Review.findById(reviewId);
      if (review) {
        await review.addFlag();
      }

      return flag.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to flag review:", ${(error as Error).message}`
      );
    }
  }

  /**
   * Get flagged reviews for moderation
   */
  async getFlaggedReviews(
    page = 1,
    limit = 20
  ): Promise<{
    flags: IReviewFlag[];
    pagination: any;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [flags, totalCount] = await Promise.all([
        ReviewFlag.find({ status: "pending" })
          .populate("reviewId")
          .populate("flaggerId", "firstName lastName")
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        ReviewFlag.countDocuments({ status: "pending" }),
      ]);

      return {
        flags: flags.map((f) => f.toObject()),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new ValidationError(`
        "Failed to get flagged reviews",
        ${(error as Error).message}
      `);
    }
  }

  /**
   * Resolve review flag
   */
  async resolveFlag(
    flagId: string,
    moderatorId: string,
    action: "resolve" | "dismiss"
  ): Promise<IReviewFlag> {
    try {
      const flag = await ReviewFlag.findById(flagId);
      if (!flag) {
        throw new NotFoundError("Flag not found");
      }

      flag.status = action === "resolve" ? "resolved" : "dismissed";
      flag.resolvedBy = moderatorId;
      flag.resolvedAt = new Date();

      await flag.save();

      return flag.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to resolve flag", ${(error as Error).message}`
      );
    }
  }

  // ==================== REVIEW RESPONSES ====================

  /**
   * Create review response
   */
  async createResponse(
    reviewId: string,
    responderId: string,
    content: string
  ): Promise<IReviewResponse> {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new NotFoundError("Review not found");
      }

      // Check if already has response
      const existingResponse = await ReviewResponse.findOne({ reviewId });
      if (existingResponse) {
        throw new ValidationError("Review already has a response");
      }

      // Validate responder permissions (target user or property owner)
      await this.validateResponsePermissions(review, responderId);

      const response = new ReviewResponse({
        reviewId,
        responderId,
        content,
      });

      await response.save();

      // Update review with response ID
      review.responseId = response._id.toString();
      await review.save();

      // Update response rate stats
      this.updateResponseRateStats(review.targetId, review.type).catch(
        console.error
      );

      return response.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to create response", ${(error as Error).message}`
      );
    }
  }

  /**
   * Update review response
   */
  async updateResponse(
    responseId: string,
    responderId: string,
    content: string
  ): Promise<IReviewResponse> {
    try {
      const response = await ReviewResponse.findById(responseId);
      if (!response) {
        throw new NotFoundError("Response not found");
      }

      if (response.responderId !== responderId) {
        throw new ForbiddenError("Cannot update another user's response");
      }

      response.content = content;
      await response.save();

      return response.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to update response", ${(error as Error).message}`
      );
    }
  }

  /**
   * Delete review response
   */
  async deleteResponse(responseId: string, responderId: string): Promise<void> {
    try {
      const response = await ReviewResponse.findById(responseId);
      if (!response) {
        throw new NotFoundError("Response not found");
      }

      if (response.responderId !== responderId) {
        throw new ForbiddenError("Cannot delete another user's response");
      }

      // Remove response reference from review
      await Review.findOneAndUpdate(
        { responseId },
        { $unset: { responseId: 1 } }
      );

      await ReviewResponse.findByIdAndDelete(responseId);
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `"Failed to delete response", ${(error as Error).message}`
      );
    }
  }

  // ==================== REVIEW ENGAGEMENT ====================

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string, userId: string): Promise<IReview> {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new NotFoundError("Review not found");
      }

      // Check if user already voted (stored in review data)
      const votes = (review.data as any)?.helpfulVotes || [];
      if (votes.includes(userId)) {
        throw new ValidationError(
          "You have already marked this review as helpful"
        );
      }

      await review.markAsHelpful();

      // Track the vote
      if (!review.data) review.data = {};
      (review.data as any).helpfulVotes = [...votes, userId];
      await review.save();

      return review.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `Failed to mark review as helpful: ${(error as Error).message}`
      );
    }
  }

  /**
   * Mark review as not helpful
   */
  async markNotHelpful(reviewId: string, userId: string): Promise<IReview> {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new NotFoundError("Review not found");
      }

      // Check if user already voted
      const votes = (review.data as any)?.notHelpfulVotes || [];
      if (votes.includes(userId)) {
        throw new ValidationError(
          "You have already marked this review as not helpful"
        );
      }

      await review.markAsNotHelpful();

      // Track the vote
      if (!review.data) review.data = {};
      (review.data as any).notHelpfulVotes = [...votes, userId];
      await review.save();

      return review.toObject();
    } catch (error) {
      if (error instanceof BaseError) throw error;
      throw new ValidationError(
        `Failed to mark review as not helpful: ${(error as Error).message}`
      );
    }
  }

  // ==================== ANALYTICS & STATISTICS ====================

  /**
   * Get review statistics
   */
  async getReviewStats(
    targetId?: string,
    type?: ReviewType
  ): Promise<IReviewStatsResponse> {
    try {
      const pipeline: PipelineStage[] = [];

      // Match stage
      const matchStage: any = { status: ReviewStatus.APPROVED };
      if (targetId) matchStage.targetId = targetId;
      if (type) matchStage.type = type;
      pipeline.push({ $match: matchStage });

      // Group and calculate stats
      pipeline.push({
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating.overall" },
          ratingDistribution: {
            $push: "$rating.overall",
          },
          sentimentDistribution: {
            $push: "$sentiment",
          },
          languageDistribution: {
            $push: "$language",
          },
          verifiedCount: {
            $sum: { $cond: ["$verified", 1, 0] },
          },
          responseCount: {
            $sum: { $cond: [{ $ne: ["$responseId", null] }, 1, 0] },
          },
        },
      });

      const [result] = await Review.aggregate(pipeline);

      if (!result) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
          sentimentDistribution: {
            positive: 0,
            negative: 0,
            neutral: 0,
            mixed: 0,
          },
          languageDistribution: { en: 0, sw: 0 },
          verificationRate: 0,
          responseRate: 0,
        };
      }

      // Process distributions
      const ratingDist = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      for (const rating of result.ratingDistribution) {
        (ratingDist as any)[(rating as number).toString()] =
          ((ratingDist as any)[rating.toString()] || 0) + 1;
      }
      const sentimentDist = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
      for (const sentiment of result.sentimentDistribution) {
        if (sentiment)
          (sentimentDist as any)[sentiment] =
            ((sentimentDist as any)[sentiment] || 0) + 1;
      }
      const languageDist = { en: 0, sw: 0 };
      for (const lang of result.languageDistribution) {
        (languageDist as any)[lang] = ((languageDist as any)[lang] || 0) + 1;
      }

      return {
        totalReviews: result.totalReviews,
        averageRating: Math.round(result.averageRating * 100) / 100,
        ratingDistribution: ratingDist,
        sentimentDistribution: sentimentDist,
        languageDistribution: languageDist,
        verificationRate:
          result.totalReviews > 0
            ? Math.round((result.verifiedCount / result.totalReviews) * 100) /
              100
            : 0,
        responseRate:
          result.totalReviews > 0
            ? Math.round((result.responseCount / result.totalReviews) * 100) /
              100
            : 0,
      };
    } catch (error) {
      throw new ValidationError(
        `"Failed to get review stats", ${(error as Error).message}`
      );
    }
  }

  /**
   * Get user review summary
   */
  async getUserReviewSummary(userId: string): Promise<IUserReviewSummary> {
    try {
      let summary = await UserReviewSummary.findOne({ userId });
      if (!summary) {
        summary = await this.generateUserReviewSummary(userId);
      }
      return summary?.toObject() as IUserReviewSummary;
    } catch (error) {
      throw new ValidationError(
        `"Failed to get user review summary",
        ${(error as Error).message}`
      );
    }
  }

  /**
   * Get property review summary
   */
  async getPropertyReviewSummary(
    propertyId: string
  ): Promise<IPropertyReviewSummary> {
    try {
      let summary = await PropertyReviewSummary.findOne({ propertyId });
      if (!summary) {
        summary = await this.generatePropertyReviewSummary(propertyId);
      }
      return summary?.toObject() as IPropertyReviewSummary;
    } catch (error) {
      throw new ValidationError(
        `"Failed to get property review summary",
        ${(error as Error).message}`
      );
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(query: ReviewAnalyticsQuery): Promise<IReviewAnalytics[]> {
    try {
      const { startDate, endDate, type, groupBy = "day" } = query;

      const filter: FilterQuery<IReviewAnalytics> = {};
      if (startDate)
        filter.date = { ...filter.date, $gte: new Date(startDate) };
      if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
      if (type) filter.type = type;

      const analytics = await ReviewAnalytics.find(filter)
        .sort({ date: 1 })
        .exec();

      return analytics.map((a) => a.toObject());
    } catch (error) {
      throw new ValidationError(
        `"Failed to get analytics", ${(error as Error).message}`
      );
    }
  }

  // ==================== KENYA-SPECIFIC FEATURES ====================

  /**
   * Get reviews by county
   */
  async getReviewsByCounty(
    county: string,
    page = 1,
    limit = 20
  ): Promise<ReviewListResponse> {
    try {
      return await this.getReviews({
        county,
        status: ReviewStatus.APPROVED,
        page,
        limit,
        sortBy: "rating.overall",
        sortOrder: "desc",
      });
    } catch (error) {
      throw new ValidationError(
        `"Failed to get reviews by county",
        ${(error as Error).message}`
      );
    }
  }

  /**
   * Get Swahili reviews
   */
  async getSwahiliReviews(page = 1, limit = 20): Promise<ReviewListResponse> {
    try {
      return await this.getReviews({
        language: "sw",
        status: ReviewStatus.APPROVED,
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    } catch (error) {
      throw new ValidationError(
        `"Failed to get Swahili reviews", ${(error as Error).message}`
      );
    }
  }

  /**
   * Get verified reviews only
   */
  async getVerifiedReviews(
    targetId?: string,
    page = 1,
    limit = 20
  ): Promise<ReviewListResponse> {
    try {
      return await this.getReviews({
        targetId,
        verified: true,
        status: ReviewStatus.APPROVED,
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    } catch (error) {
      throw new ValidationError(
        `"Failed to get verified reviews",
        ${(error as Error).message}`
      );
    }
  }

  /**
   * Get featured reviews
   */
  async getFeaturedReviews(type?: ReviewType, limit = 10): Promise<IReview[]> {
    try {
      const filter: FilterQuery<IReview> = {
        status: ReviewStatus.APPROVED,
        isFeatured: true,
      };

      if (type) filter.type = type;

      const reviews = await Review.find(filter)
        .populate("reviewerId", "firstName lastName avatar verified")
        .populate("responseId")
        .sort({ "rating.overall": -1, createdAt: -1 })
        .limit(limit)
        .exec();

      return reviews.map((r) => r.toObject());
    } catch (error) {
      throw new ValidationError(
        `"Failed to get featured reviews",
        ${(error as Error).message}`
      );
    }
  }

  /**
   * Analyze sentiment of reviews
   * Uses hybrid approach combining rule-based and keyword analysis
   */
  async analyzeSentiment(
    reviewIds: string[]
  ): Promise<ISentimentAnalysisResult[]> {
    try {
      const { sentimentAnalyzer } = await import(
        "./sentiment-analyzer.service"
      );
      const reviews = await Review.find({ _id: { $in: reviewIds } });

      const results: ISentimentAnalysisResult[] = [];

      for (const review of reviews) {
        // Use hybrid analysis for best accuracy
        const analysis = await sentimentAnalyzer.analyzeHybrid(
          `${review.title} ${review.content}`,
          review.rating.overall,
          review.language
        );

        results.push({
          reviewId: review._id.toString(),
          sentiment: analysis.sentiment,
          score: analysis.score,
          confidence: analysis.confidence,
        });

        // Update review with new sentiment if different
        if (
          review.sentiment !== analysis.sentiment ||
          review.sentimentScore !== analysis.score
        ) {
          review.sentiment = analysis.sentiment;
          review.sentimentScore = analysis.score;
          await review.save();
        }
      }

      return results;
    } catch (error) {
      throw new ValidationError(
        `Failed to analyze sentiment: ${(error as Error).message}`
      );
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Validate review creation
   */
  private async validateReviewCreation(
    data: CreateReviewRequest,
    reviewerId: string
  ): Promise<void> {
    // Check if reviewer exists
    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      throw new NotFoundError("Reviewer not found");
    }

    // Check if target exists based on type
    switch (data.type) {
      case ReviewType.PROPERTY: {
        const property = await Property.findById(data.targetId);
        if (!property) {
          throw new NotFoundError("Property not found");
        }
        // Cannot review own property
        if (property.landlord.toString() === reviewerId) {
          throw new ValidationError("Cannot review your own property");
        }
        break;
      }
      case ReviewType.USER_LANDLORD:
      case ReviewType.USER_TENANT:
      case ReviewType.AGENT: {
        const targetUser = await User.findById(data.targetId);
        if (!targetUser) {
          throw new NotFoundError("User not found");
        }
        // Cannot review self
        if (data.targetId === reviewerId) {
          throw new ValidationError("Cannot review yourself");
        }
        break;
      }
      default:
        break;
    }

    // Check if reviewer has permission to review this target
    if (data.applicationId) {
      const booking = await Booking.findById(data.applicationId);
      if (!booking) {
        throw new NotFoundError("Booking/Application not found");
      }

      // Verify reviewer was involved in the booking
      const isInvolved =
        booking.tenant.toString() === reviewerId ||
        booking.landlord?.toString() === reviewerId;

      if (!isInvolved) {
        throw new ForbiddenError(
          "You are not authorized to review this booking"
        );
      }
    }

    // Business hours check for Kenya
    if (KENYA_REVIEW_CONSTANTS.BUSINESS_HOURS.ENFORCE_BUSINESS_HOURS) {
      const now = new Date();
      const hour = now.getHours();
      const { START, END } = KENYA_REVIEW_CONSTANTS.BUSINESS_HOURS;

      if (hour < START || hour > END) {
        throw new ValidationError(
          `Reviews can only be submitted during business hours (${START}:00 - ${END}:00 EAT)`
        );
      }
    }
  }

  /**
   * Check for duplicate reviews
   */
  private async checkDuplicateReview(
    reviewerId: string,
    targetId: string,
    applicationId?: string
  ): Promise<IReview | null> {
    const filter: FilterQuery<IReview> = { reviewerId, targetId };
    if (applicationId) {
      filter.applicationId = applicationId;
    }

    return await Review.findOne(filter);
  }

  /**
   * Check if review should be auto-approved
   */
  private async shouldAutoApprove(reviewerId: string): Promise<boolean> {
    const user = await User.findById(reviewerId);
    if (!user) return false;

    // Auto-approve if user is verified and has good review history
    const isVerified = !!user.verification?.emailVerifiedAt;

    // Check user's review credibility
    const userSummary = await UserReviewSummary.findOne({ userId: reviewerId });
    const hasGoodCredibility = userSummary
      ? userSummary.credibilityScore >= 70
      : false;
    const hasLowFlags = userSummary
      ? userSummary.verificationStatus.flaggedReviews < 3
      : true;

    return isVerified && hasGoodCredibility && hasLowFlags;
  }

  /**
   * Check if user is verified
   */
  private async isVerifiedUser(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) return false;

    // Check if email, phone, or identity is verified
    return !!(
      user.verification?.emailVerifiedAt ||
      user.verification?.phoneVerifiedAt ||
      user.verification?.identityVerifiedAt
    );
  }

  /**
   * Detect user county
   */
  private async detectUserCounty(userId: string): Promise<string | undefined> {
    const user = await User.findById(userId);
    if (!user?.addresses || user.addresses.length === 0) return;

    // Find primary address or use first address
    const primaryAddress =
      user.addresses.find((addr) => addr.isPrimary) || user.addresses[0];
    return primaryAddress?.county;
  }

  /**
   * Detect user city
   */
  private async detectUserCity(userId: string): Promise<string | undefined> {
    const user = await User.findById(userId);
    if (!user?.addresses || user.addresses.length === 0) return;

    // Find primary address or use first address
    const primaryAddress =
      user.addresses.find((addr) => addr.isPrimary) || user.addresses[0];
    return primaryAddress?.town;
  }

  /**
   * Validate response permissions
   */
  private async validateResponsePermissions(
    review: IReview,
    responderId: string
  ): Promise<void> {
    switch (review.type) {
      case ReviewType.PROPERTY: {
        // Only property owner or agent can respond
        const property = await Property.findById(review.targetId);
        if (!property) {
          throw new NotFoundError("Property not found");
        }

        const isOwner = property.landlord.toString() === responderId;
        const isAgent = property.agent?.toString() === responderId;

        if (!(isOwner || isAgent)) {
          throw new ForbiddenError(
            "Only property owner or agent can respond to this review"
          );
        }
        break;
      }
      case ReviewType.USER_LANDLORD:
      case ReviewType.USER_TENANT:
      case ReviewType.AGENT: {
        // Only the reviewed user can respond
        if (review.targetId !== responderId) {
          throw new ForbiddenError(
            "Only the reviewed user can respond to this review"
          );
        }
        break;
      }
      default:
        throw new ValidationError("Invalid review type");
    }
  }

  /**
   * Update summary statistics
   */
  private async updateSummaryStats(review: IReview): Promise<void> {
    // Update user summary
    this.updateUserReviewSummary(review.reviewerId);
    this.updateUserReviewSummary(review.targetId);

    // Update property summary if property review
    if (review.type === ReviewType.PROPERTY) {
      await this.updatePropertyReviewSummary(review.targetId);
    }

    // Update daily analytics
    this.updateDailyAnalytics(review);
  }

  /**
   * Update summary stats after deletion
   */
  private async updateSummaryStatsAfterDeletion(
    review: IReview
  ): Promise<void> {
    // Update user summaries
    await this.updateUserReviewSummary(review.reviewerId);
    await this.updateUserReviewSummary(review.targetId);

    // Update property summary if property review
    if (review.type === ReviewType.PROPERTY) {
      await this.updatePropertyReviewSummary(review.targetId);
    }
  }

  /**
   * Update response rate statistics
   */
  private async updateResponseRateStats(
    targetId: string,
    type: ReviewType
  ): Promise<void> {
    if (type === ReviewType.PROPERTY) {
      const summary = await PropertyReviewSummary.findOne({
        propertyId: targetId,
      });
      if (summary) {
        const totalReviews = await Review.countDocuments({
          targetId,
          type: ReviewType.PROPERTY,
          status: ReviewStatus.APPROVED,
        });

        const reviewsWithResponse = await Review.countDocuments({
          targetId,
          type: ReviewType.PROPERTY,
          status: ReviewStatus.APPROVED,
          responseId: { $exists: true, $ne: null },
        });

        summary.responseRate =
          totalReviews > 0 ? reviewsWithResponse / totalReviews : 0;
        await summary.save();
      }
    }
  }

  /**
   * Generate user review summary
   */
  private async generateUserReviewSummary(userId: string): Promise<any> {
    // Calculate reviews written by user
    const reviewsAsReviewer = await Review.find({
      reviewerId: userId,
      status: ReviewStatus.APPROVED,
    });
    const reviewsByType: Record<string, number> = {};
    let totalRatingGiven = 0;

    for (const review of reviewsAsReviewer) {
      reviewsByType[review.type] = (reviewsByType[review.type] || 0) + 1;
      totalRatingGiven += review.rating.overall;
    }

    // Calculate reviews about user
    const reviewsAboutUser = await Review.find({
      targetId: userId,
      status: ReviewStatus.APPROVED,
    })
      .limit(10)
      .sort({ createdAt: -1 });

    const ratingDist: Record<number, number> = {};
    let totalRatingReceived = 0;

    for (const review of reviewsAboutUser) {
      const rating = Math.floor(review.rating.overall);
      ratingDist[rating] = (ratingDist[rating] || 0) + 1;
      totalRatingReceived += review.rating.overall;
    }

    const totalReviewsAbout = await Review.countDocuments({
      targetId: userId,
      status: ReviewStatus.APPROVED,
    });

    const reviewsWithResponse = await Review.countDocuments({
      targetId: userId,
      status: ReviewStatus.APPROVED,
      responseId: { $exists: true, $ne: null },
    });

    // Calculate credibility score
    const verifiedReviews = reviewsAsReviewer.filter((r) => r.verified).length;
    const flaggedReviews = await Review.countDocuments({
      reviewerId: userId,
      flagCount: { $gt: 0 },
    });

    const credibilityScore = Math.min(
      100,
      Math.max(
        0,
        50 + // Base score
          verifiedReviews * 5 - // +5 per verified review
          flaggedReviews * 10 + // -10 per flagged review
          reviewsAsReviewer.length * 2 // +2 per review written
      )
    );

    const summary = new UserReviewSummary({
      userId,
      asReviewer: {
        totalReviews: reviewsAsReviewer.length,
        averageRatingGiven:
          reviewsAsReviewer.length > 0
            ? totalRatingGiven / reviewsAsReviewer.length
            : 0,
        reviewsByType,
      },
      asReviewed: {
        totalReviews: totalReviewsAbout,
        averageRating:
          totalReviewsAbout > 0
            ? totalRatingReceived / reviewsAboutUser.length
            : 0,
        ratingDistribution: ratingDist,
        recentReviews: reviewsAboutUser.map((r) => r._id.toString()),
        responseRate:
          totalReviewsAbout > 0 ? reviewsWithResponse / totalReviewsAbout : 0,
      },
      credibilityScore,
      verificationStatus: {
        isVerified: await this.isVerifiedUser(userId),
        verifiedReviews,
        flaggedReviews,
      },
    });

    await summary.save();
    return summary;
  }

  /**
   * Generate property review summary
   */
  private async generatePropertyReviewSummary(
    propertyId: string
  ): Promise<any> {
    const reviews = await Review.find({
      targetId: propertyId,
      type: ReviewType.PROPERTY,
      status: ReviewStatus.APPROVED,
    });

    const ratingDist: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    };
    let totalRating = 0;
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    let verifiedCount = 0;

    for (const review of reviews) {
      const rating = Math.floor(review.rating.overall).toString();
      ratingDist[rating] = (ratingDist[rating] || 0) + 1;
      totalRating += review.rating.overall;

      if (review.sentiment) {
        if (review.sentiment === ReviewSentiment.POSITIVE)
          sentimentCounts.positive++;
        else if (review.sentiment === ReviewSentiment.NEGATIVE)
          sentimentCounts.negative++;
        else sentimentCounts.neutral++;
      }

      if (review.verified) verifiedCount++;
    }

    const recentReviews = reviews.slice(0, 10).map((r) => r._id.toString());

    const reviewsWithResponse = reviews.filter((r) => r.responseId).length;
    const totalResponseTime =
      await this.calculateAverageResponseTime(propertyId);

    const summary = new PropertyReviewSummary({
      propertyId,
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
      ratingDistribution: ratingDist,
      recentReviews,
      monthlyTrend: [],
      responseRate:
        reviews.length > 0 ? reviewsWithResponse / reviews.length : 0,
      averageResponseTime: totalResponseTime,
      verifiedReviewsPercentage:
        reviews.length > 0 ? (verifiedCount / reviews.length) * 100 : 0,
      sentimentSummary: sentimentCounts,
    });

    await summary.save();
    return summary;
  }

  /**
   * Update user review summary
   */
  private async updateUserReviewSummary(userId: string): Promise<void> {
    const existing = await UserReviewSummary.findOne({ userId });
    if (existing) {
      await UserReviewSummary.deleteOne({ userId });
    }
    await this.generateUserReviewSummary(userId);
  }

  /**
   * Update property review summary
   */
  private async updatePropertyReviewSummary(propertyId: string): Promise<void> {
    const existing = await PropertyReviewSummary.findOne({ propertyId });
    if (existing) {
      await PropertyReviewSummary.deleteOne({ propertyId });
    }
    await this.generatePropertyReviewSummary(propertyId);
  }

  /**
   * Calculate average response time for a property
   */
  private async calculateAverageResponseTime(
    propertyId: string
  ): Promise<number> {
    const reviewsWithResponses = await Review.find({
      targetId: propertyId,
      type: ReviewType.PROPERTY,
      status: ReviewStatus.APPROVED,
      responseId: { $exists: true, $ne: null },
    }).populate("responseId");

    if (reviewsWithResponses.length === 0) return 0;

    let totalHours = 0;
    for (const review of reviewsWithResponses) {
      const response = review.responseId as any;
      if (response?.createdAt) {
        const timeDiff =
          response.createdAt.getTime() - review.createdAt.getTime();
        totalHours += timeDiff / (1000 * 60 * 60); // Convert to hours
      }
    }

    return totalHours / reviewsWithResponses.length;
  }

  /**
   * Update daily analytics
   */
  private async updateDailyAnalytics(review: IReview): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await ReviewAnalytics.findOne({
      date: today,
      type: review.type,
    });

    if (!analytics) {
      analytics = new ReviewAnalytics({
        date: today,
        type: review.type,
        totalReviews: 0,
        approvedReviews: 0,
        rejectedReviews: 0,
        pendingReviews: 0,
        flaggedReviews: 0,
        ratingDistribution: new Map([
          ["1", 0],
          ["2", 0],
          ["3", 0],
          ["4", 0],
          ["5", 0],
        ]),
        averageRating: 0,
        sentimentDistribution: {
          positive: 0,
          negative: 0,
          neutral: 0,
          mixed: 0,
        },
        responseRate: 0,
        averageResponseTime: 0,
      });
    }

    // Update counts
    analytics.totalReviews += 1;
    if (review.status === ReviewStatus.APPROVED) analytics.approvedReviews += 1;
    else if (review.status === ReviewStatus.REJECTED)
      analytics.rejectedReviews += 1;
    else if (review.status === ReviewStatus.PENDING)
      analytics.pendingReviews += 1;
    if (review.flagCount > 0) analytics.flaggedReviews += 1;

    // Update rating distribution
    const rating = Math.floor(review.rating.overall);
    const ratingDist = analytics.ratingDistribution as any;

    if (ratingDist instanceof Map) {
      // Handle Map type
      const ratingKey = rating.toString();
      const currentCount = ratingDist.get(ratingKey) || 0;
      ratingDist.set(ratingKey, currentCount + 1);

      // Recalculate average rating
      let totalRating = 0;
      let totalCount = 0;
      for (const [key, count] of ratingDist.entries()) {
        totalRating += Number.parseInt(key, 10) * count;
        totalCount += count;
      }
      analytics.averageRating = totalCount > 0 ? totalRating / totalCount : 0;
    } else {
      // Handle object type
      ratingDist[rating] = (ratingDist[rating] || 0) + 1;

      // Recalculate average rating
      let totalRating = 0;
      let totalCount = 0;
      for (const [key, count] of Object.entries(ratingDist)) {
        totalRating += Number.parseInt(key, 10) * (count as number);
        totalCount += count as number;
      }
      analytics.averageRating = totalCount > 0 ? totalRating / totalCount : 0;
    }

    // Update sentiment distribution
    if (review.sentiment) {
      (analytics.sentimentDistribution as any)[review.sentiment] += 1;
    }

    await analytics.save();
  }

  /**
   * Send review notifications
   */
  private async sendReviewNotifications(review: IReview): Promise<void> {
    try {
      let targetUserId: string | undefined;
      let notificationTitle = "";
      let notificationMessage = "";

      switch (review.type) {
        case ReviewType.PROPERTY: {
          const property = await Property.findById(review.targetId);
          if (property) {
            targetUserId = property.landlord.toString();
            notificationTitle = "New Property Review";
            notificationMessage = `Your property has received a new ${review.rating.overall}-star review`;
          }
          break;
        }
        case ReviewType.USER_LANDLORD:
        case ReviewType.USER_TENANT:
        case ReviewType.AGENT: {
          targetUserId = review.targetId;
          notificationTitle = "New Review";
          notificationMessage = `You have received a new ${review.rating.overall}-star review`;
          break;
        }
        default:
          break;
      }

      if (targetUserId) {
        const reviewer = await User.findById(review.reviewerId);
        const reviewerName = reviewer
          ? `${reviewer.profile.firstName} ${reviewer.profile.lastName}`
          : "Someone";

        await notificationService.sendNotification(targetUserId, {
          type: "info",
          title: notificationTitle,
          message: `${reviewerName}: ${notificationMessage}`,
          channels: ["in_app", "email"],
          data: {
            reviewId: review._id,
            reviewType: review.type,
            rating: review.rating.overall,
          },
        });
      }
    } catch (error) {
      console.error("Failed to send review notification:", error);
    }
  }

  /**
   * Send moderation notifications
   */
  private async sendModerationNotification(
    review: IReview,
    action: string,
    reason?: string
  ): Promise<void> {
    try {
      let title = "";
      let message = "";

      switch (action) {
        case "approved":
          title = "Review Approved";
          message =
            "Your review has been approved and is now visible to others";
          break;
        case "rejected":
          title = "Review Rejected";
          message = `Your review has been rejected${reason ? `: ${reason}` : ""}`;
          break;
        case "flagged":
          title = "Review Flagged";
          message = "Your review has been flagged for moderation";
          break;
        case "hidden":
          title = "Review Hidden";
          message = `Your review has been hidden${reason ? `: ${reason}` : ""}`;
          break;
        default:
          return;
      }

      await notificationService.sendNotification(review.reviewerId, {
        type: action === "approved" ? "success" : "warning",
        title,
        message,
        channels: ["in_app", "email"],
        data: {
          reviewId: review._id,
          action,
          reason,
        },
      });
    } catch (error) {
      console.error("Failed to send moderation notification:", error);
    }
  }
}

// Export singleton instance
export const reviewsService = new ReviewsService();
