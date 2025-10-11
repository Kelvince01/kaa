/**
 * Review Controller
 *
 * Handles all review-related API endpoints including:
 * - CRUD operations for reviews
 * - Moderation (approve, reject, hide)
 * - Flags and responses
 * - Analytics and statistics
 * - Kenya-specific features
 */

import type {
  CreateReviewRequest,
  IReviewQuery,
  ReviewFlagReason,
  ReviewSentiment,
  ReviewStatus,
  ReviewType,
  UpdateReviewRequest,
} from "@kaa/models/types";
import { ReviewsService } from "@kaa/services";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

const reviewsService = new ReviewsService();

export const reviewController = new Elysia().group("reviews", (app) =>
  app
    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Get reviews with filtering
     * Public endpoint - returns only approved reviews
     */
    .get(
      "/",
      async ({ set, query }) => {
        try {
          const filters: IReviewQuery = {
            targetId: query.targetId,
            reviewerId: query.reviewerId,
            type: query.type as ReviewType,
            status: query.status as ReviewStatus,
            county: query.county,
            city: query.city,
            language: query.language as "en" | "sw",
            sentiment: query.sentiment as ReviewSentiment,
            verified:
              query.verified === "true"
                ? true
                : query.verified === "false"
                  ? false
                  : undefined,
            minRating: query.minRating
              ? Number.parseInt(query.minRating, 10)
              : undefined,
            maxRating: query.maxRating
              ? Number.parseInt(query.maxRating, 10)
              : undefined,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
            tags: query.tags ? query.tags.split(",") : undefined,
            search: query.search,
            page: query.page ? Number.parseInt(query.page, 10) : 1,
            limit: query.limit ? Number.parseInt(query.limit, 10) : 20,
            sortBy: query.sortBy as any,
            sortOrder: query.sortOrder as "asc" | "desc",
          };

          const result = await reviewsService.getReviews(filters);

          set.status = 200;
          return {
            status: "success",
            data: result,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        query: t.Object({
          targetId: t.Optional(t.String()),
          reviewerId: t.Optional(t.String()),
          type: t.Optional(t.String()),
          status: t.Optional(t.String()),
          county: t.Optional(t.String()),
          city: t.Optional(t.String()),
          language: t.Optional(t.String()),
          sentiment: t.Optional(t.String()),
          verified: t.Optional(t.String()),
          minRating: t.Optional(t.String()),
          maxRating: t.Optional(t.String()),
          dateFrom: t.Optional(t.String()),
          dateTo: t.Optional(t.String()),
          tags: t.Optional(t.String()),
          search: t.Optional(t.String()),
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get reviews with filtering",
          description:
            "Get a list of reviews with optional filters. Public endpoint returns only approved reviews.",
        },
      }
    )

    /**
     * Get single review by ID
     */
    .get(
      "/:id",
      async ({ set, params }) => {
        try {
          const review = await reviewsService.getReview(params.id);

          set.status = 200;
          return {
            status: "success",
            data: { review },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get review by ID",
        },
      }
    )

    /**
     * Get review statistics
     */
    .get(
      "/stats/:targetId",
      async ({ set, params, query }) => {
        try {
          const stats = await reviewsService.getReviewStats(
            params.targetId,
            query.type as ReviewType
          );

          set.status = 200;
          return {
            status: "success",
            data: { stats },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          targetId: t.String(),
        }),
        query: t.Object({
          type: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get review statistics",
        },
      }
    )

    /**
     * Get featured reviews
     */
    .get(
      "/featured/list",
      async ({ set, query }) => {
        try {
          const reviews = await reviewsService.getFeaturedReviews(
            query.type as ReviewType,
            query.limit ? Number.parseInt(query.limit, 10) : 10
          );

          set.status = 200;
          return {
            status: "success",
            data: { reviews },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        query: t.Object({
          type: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get featured reviews",
        },
      }
    )

    /**
     * Get reviews by county (Kenya-specific)
     */
    .get(
      "/county/:county",
      async ({ set, params, query }) => {
        try {
          const result = await reviewsService.getReviewsByCounty(
            params.county,
            query.page ? Number.parseInt(query.page, 10) : 1,
            query.limit ? Number.parseInt(query.limit, 10) : 20
          );

          set.status = 200;
          return {
            status: "success",
            data: result,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          county: t.String(),
        }),
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get reviews by county",
        },
      }
    )

    /**
     * Get Swahili reviews (Kenya-specific)
     */
    .get(
      "/swahili/list",
      async ({ set, query }) => {
        try {
          const result = await reviewsService.getSwahiliReviews(
            query.page ? Number.parseInt(query.page, 10) : 1,
            query.limit ? Number.parseInt(query.limit, 10) : 20
          );

          set.status = 200;
          return {
            status: "success",
            data: result,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get Swahili reviews",
        },
      }
    )

    /**
     * Get verified reviews
     */
    .get(
      "/verified/list",
      async ({ set, query }) => {
        try {
          const result = await reviewsService.getVerifiedReviews(
            query.targetId,
            query.page ? Number.parseInt(query.page, 10) : 1,
            query.limit ? Number.parseInt(query.limit, 10) : 20
          );

          set.status = 200;
          return {
            status: "success",
            data: result,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        query: t.Object({
          targetId: t.Optional(t.String()),
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get verified reviews",
        },
      }
    )

    // ==================== AUTHENTICATED ENDPOINTS ====================

    .use(authPlugin)

    /**
     * Create a new review
     */
    .post(
      "/",
      async ({ set, body, user }) => {
        try {
          const review = await reviewsService.createReview(
            body as CreateReviewRequest,
            user.id
          );

          set.status = 201;
          return {
            status: "success",
            message: "Review created successfully",
            data: { review },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        body: t.Object({
          type: t.String(),
          targetId: t.String(),
          applicationId: t.Optional(t.String()),
          title: t.String(),
          content: t.String(),
          rating: t.Object({
            overall: t.Number(),
            categories: t.Optional(t.Record(t.String(), t.Number())),
          }),
          photos: t.Optional(t.Array(t.String())),
          videos: t.Optional(t.Array(t.String())),
          tags: t.Optional(t.Array(t.String())),
          language: t.Optional(t.String()),
          reviewDate: t.Optional(t.String()),
          county: t.Optional(t.String()),
          city: t.Optional(t.String()),
          isAnonymous: t.Optional(t.Boolean()),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Create a new review",
          description:
            "Create a new review for a property, user, or agent. Requires authentication.",
        },
      }
    )

    /**
     * Update a review
     */
    .patch(
      "/:id",
      async ({ set, params, body, user }) => {
        try {
          const review = await reviewsService.updateReview(
            params.id,
            body as UpdateReviewRequest,
            user.id
          );

          set.status = 200;
          return {
            status: "success",
            message: "Review updated successfully",
            data: { review },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          title: t.Optional(t.String()),
          content: t.Optional(t.String()),
          rating: t.Optional(
            t.Object({
              overall: t.Number(),
              categories: t.Optional(t.Record(t.String(), t.Number())),
            })
          ),
          photos: t.Optional(t.Array(t.String())),
          videos: t.Optional(t.Array(t.String())),
          tags: t.Optional(t.Array(t.String())),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Update a review",
          description:
            "Update your own review. Can only be done within the edit window.",
        },
      }
    )

    /**
     * Delete a review
     */
    .delete(
      "/:id",
      async ({ set, params, user }) => {
        try {
          await reviewsService.deleteReview(params.id, user.id);

          set.status = 200;
          return {
            status: "success",
            message: "Review deleted successfully",
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Delete a review",
          description: "Delete your own review.",
        },
      }
    )

    /**
     * Mark review as helpful
     */
    .post(
      "/:id/helpful",
      async ({ set, params, user }) => {
        try {
          const review = await reviewsService.markHelpful(params.id, user.id);

          set.status = 200;
          return {
            status: "success",
            message: "Review marked as helpful",
            data: { review },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Mark review as helpful",
        },
      }
    )

    /**
     * Mark review as not helpful
     */
    .post(
      "/:id/not-helpful",
      async ({ set, params, user }) => {
        try {
          const review = await reviewsService.markNotHelpful(
            params.id,
            user.id
          );

          set.status = 200;
          return {
            status: "success",
            message: "Review marked as not helpful",
            data: { review },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Mark review as not helpful",
        },
      }
    )

    /**
     * Flag a review
     */
    .post(
      "/:id/flag",
      async ({ set, params, body, user }) => {
        try {
          const flag = await reviewsService.flagReview(
            params.id,
            user.id,
            body.reason as ReviewFlagReason,
            body.description
          );

          set.status = 201;
          return {
            status: "success",
            message: "Review flagged successfully",
            data: { flag },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          reason: t.String(),
          description: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Flag a review",
          description: "Flag a review for moderation.",
        },
      }
    )

    /**
     * Create a response to a review
     */
    .post(
      "/:id/response",
      async ({ set, params, body, user }) => {
        try {
          const response = await reviewsService.createResponse(
            params.id,
            user.id,
            body.content
          );

          set.status = 201;
          return {
            status: "success",
            message: "Response created successfully",
            data: { response },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          content: t.String(),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Respond to a review",
          description:
            "Create a response to a review. Only property owners/agents or reviewed users can respond.",
        },
      }
    )

    /**
     * Update a response
     */
    .patch(
      "/response/:responseId",
      async ({ set, params, body, user }) => {
        try {
          const response = await reviewsService.updateResponse(
            params.responseId,
            user.id,
            body.content
          );

          set.status = 200;
          return {
            status: "success",
            message: "Response updated successfully",
            data: { response },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          responseId: t.String(),
        }),
        body: t.Object({
          content: t.String(),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Update a response",
        },
      }
    )

    /**
     * Delete a response
     */
    .delete(
      "/response/:responseId",
      async ({ set, params, user }) => {
        try {
          await reviewsService.deleteResponse(params.responseId, user.id);

          set.status = 200;
          return {
            status: "success",
            message: "Response deleted successfully",
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          responseId: t.String(),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Delete a response",
        },
      }
    )

    /**
     * Get user review summary
     */
    .get(
      "/summary/user/:userId",
      async ({ set, params }) => {
        try {
          const summary = await reviewsService.getUserReviewSummary(
            params.userId
          );

          set.status = 200;
          return {
            status: "success",
            data: { summary },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get user review summary",
        },
      }
    )

    /**
     * Get property review summary
     */
    .get(
      "/summary/property/:propertyId",
      async ({ set, params }) => {
        try {
          const summary = await reviewsService.getPropertyReviewSummary(
            params.propertyId
          );

          set.status = 200;
          return {
            status: "success",
            data: { summary },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get property review summary",
        },
      }
    )

    /**
     * Get analytics
     */
    .get(
      "/analytics/data",
      async ({ set, query }) => {
        try {
          const analytics = await reviewsService.getAnalytics({
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            type: query.type as ReviewType,
            groupBy: query.groupBy as "day" | "week" | "month" | "year",
          });

          set.status = 200;
          return {
            status: "success",
            data: { analytics },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
          type: t.Optional(t.String()),
          groupBy: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews"],
          summary: "Get review analytics",
        },
      }
    )

    // ==================== MODERATION ENDPOINTS (ADMIN/MODERATOR) ====================

    .use(accessPlugin("reviews", "manage"))

    /**
     * Get pending reviews for moderation
     */
    .get(
      "/moderation/pending",
      async ({ set, query }) => {
        try {
          const result = await reviewsService.getPendingReviews(
            query.page ? Number.parseInt(query.page, 10) : 1,
            query.limit ? Number.parseInt(query.limit, 10) : 20
          );

          set.status = 200;
          return {
            status: "success",
            data: result,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews", "moderation"],
          summary: "Get pending reviews",
          description:
            "Get reviews pending moderation. Requires moderation permission.",
        },
      }
    )

    /**
     * Get flagged reviews
     */
    .get(
      "/moderation/flagged",
      async ({ set, query }) => {
        try {
          const result = await reviewsService.getFlaggedReviews(
            query.page ? Number.parseInt(query.page, 10) : 1,
            query.limit ? Number.parseInt(query.limit, 10) : 20
          );

          set.status = 200;
          return {
            status: "success",
            data: result,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews", "moderation"],
          summary: "Get flagged reviews",
        },
      }
    )

    /**
     * Approve a review
     */
    .post(
      "/:id/approve",
      async ({ set, params, body, user }) => {
        try {
          const review = await reviewsService.approveReview(
            params.id,
            user.id,
            body.notes
          );

          set.status = 200;
          return {
            status: "success",
            message: "Review approved successfully",
            data: { review },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          notes: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews", "moderation"],
          summary: "Approve a review",
        },
      }
    )

    /**
     * Reject a review
     */
    .post(
      "/:id/reject",
      async ({ set, params, body, user }) => {
        try {
          const review = await reviewsService.rejectReview(
            params.id,
            user.id,
            body.reason
          );

          set.status = 200;
          return {
            status: "success",
            message: "Review rejected successfully",
            data: { review },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          reason: t.String(),
        }),
        detail: {
          tags: ["reviews", "moderation"],
          summary: "Reject a review",
        },
      }
    )

    /**
     * Hide a review
     */
    .post(
      "/:id/hide",
      async ({ set, params, body, user }) => {
        try {
          const review = await reviewsService.hideReview(
            params.id,
            user.id,
            body.reason
          );

          set.status = 200;
          return {
            status: "success",
            message: "Review hidden successfully",
            data: { review },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          reason: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews", "moderation"],
          summary: "Hide a review",
        },
      }
    )

    /**
     * Bulk moderate reviews
     */
    .post(
      "/moderation/bulk",
      async ({ set, body, user }) => {
        try {
          const result = await reviewsService.bulkModerateReviews(
            body.reviewIds,
            body.action as "approve" | "reject" | "hide",
            user.id,
            body.reason
          );

          set.status = 200;
          return {
            status: "success",
            message: `Bulk moderation completed: ${result.success} succeeded, ${result.failed} failed`,
            data: result,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        body: t.Object({
          reviewIds: t.Array(t.String()),
          action: t.String(),
          reason: t.Optional(t.String()),
        }),
        detail: {
          tags: ["reviews", "moderation"],
          summary: "Bulk moderate reviews",
          description: "Approve, reject, or hide multiple reviews at once.",
        },
      }
    )

    /**
     * Resolve a flag
     */
    .post(
      "/flags/:flagId/resolve",
      async ({ set, params, body, user }) => {
        try {
          const flag = await reviewsService.resolveFlag(
            params.flagId,
            user.id,
            body.action as "resolve" | "dismiss"
          );

          set.status = 200;
          return {
            status: "success",
            message: "Flag resolved successfully",
            data: { flag },
          };
        } catch (error) {
          set.status = (error as any).statusCode || 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          flagId: t.String(),
        }),
        body: t.Object({
          action: t.String(),
        }),
        detail: {
          tags: ["reviews", "moderation"],
          summary: "Resolve a flag",
        },
      }
    )

    /**
     * Analyze sentiment (batch)
     */
    .post(
      "/analytics/sentiment",
      async ({ set, body }) => {
        try {
          const results = await reviewsService.analyzeSentiment(body.reviewIds);

          set.status = 200;
          return {
            status: "success",
            data: { results },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: (error as Error).message,
          };
        }
      },
      {
        body: t.Object({
          reviewIds: t.Array(t.String()),
        }),
        detail: {
          tags: ["reviews", "analytics"],
          summary: "Analyze sentiment",
          description: "Analyze sentiment for multiple reviews.",
        },
      }
    )
);
