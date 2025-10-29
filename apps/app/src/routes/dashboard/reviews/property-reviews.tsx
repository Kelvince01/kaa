/**
 * Property Reviews Route
 * Reviews specific to a property
 */

"use client";

import { useAuthStore } from "@/modules/auth/auth.store";
import { ReviewDashboardContainer } from "@/routes/dashboard/reviews/review-dashboard";

type PropertyReviewsProps = {
  propertyId: string;
};

export default function PropertyReviews({ propertyId }: PropertyReviewsProps) {
  const { user } = useAuthStore();

  return (
    <ReviewDashboardContainer
      currentUserId={user?.id}
      showCreateButton={true}
      showStats={true}
      targetId={propertyId}
      type="property"
    />
  );
}
