import { Skeleton } from "@kaa/ui/components/skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import ReviewsDashboard from "@/routes/dashboard/reviews";

export const metadata: Metadata = {
  title: "Reviews | Dashboard",
  description: "Manage property and user reviews",
};

function ReviewsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="space-y-3 rounded-lg border p-6"
            key={`skeleton-${i.toString()}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl text-gray-900">Reviews</h1>
          <p className="text-muted-foreground text-sm">
            Manage property and user reviews
          </p>
        </div>
      </div>

      <Suspense fallback={<ReviewsLoadingSkeleton />}>
        <ReviewsDashboard />
      </Suspense>
    </div>
  );
}
