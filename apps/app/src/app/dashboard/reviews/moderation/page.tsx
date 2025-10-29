import { Skeleton } from "@kaa/ui/components/skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ModerationPanel } from "@/modules/reviews/components/moderation-panel";

export const metadata: Metadata = {
  title: "Review Moderation | Dashboard",
  description: "Moderate and manage review submissions",
};

function ModerationLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            className="space-y-3 rounded-lg border p-6"
            key={`skeleton-${i.toString()}`}
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ModerationPage() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl text-gray-900">
            Review Moderation
          </h1>
          <p className="text-muted-foreground text-sm">
            Review and moderate user submissions
          </p>
        </div>
      </div>

      <Suspense fallback={<ModerationLoadingSkeleton />}>
        <ModerationPanel />
      </Suspense>
    </div>
  );
}
