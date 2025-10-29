/**
 * User Reviews Route
 * Reviews for users (landlords/tenants)
 */

"use client";

import { useAuthStore } from "@/modules/auth/auth.store";
import { ReviewDashboardContainer } from "@/routes/dashboard/reviews/review-dashboard";

type UserReviewsProps = {
  userId: string;
  reviewType?: "user_landlord" | "user_tenant";
};

export default function UserReviews({
  userId,
  reviewType = "user_landlord",
}: UserReviewsProps) {
  const { user } = useAuthStore();

  return (
    <ReviewDashboardContainer
      currentUserId={user?.id}
      showCreateButton={false}
      showStats={true}
      targetId={userId}
      type={reviewType}
    />
  );
}
