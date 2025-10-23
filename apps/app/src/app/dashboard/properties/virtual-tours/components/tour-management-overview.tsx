/**
 * Tour Management Overview Component for Dashboard
 */

"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart3,
  Camera,
  Clock,
  Edit,
  Eye,
  Play,
  Plus,
  Share,
  Users,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import {
  usePopularTours,
  useServiceCapabilities,
} from "@/modules/virtual-tours";

export const TourManagementOverview: React.FC = () => {
  const { data: popularTours, isLoading } = usePopularTours(6);
  const { data: capabilities } = useServiceCapabilities();

  if (isLoading) {
    return <TourManagementOverviewSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Tours</CardTitle>
          <div className="flex gap-2">
            {capabilities?.features.mlAnalytics && (
              <Badge className="flex items-center gap-1" variant="outline">
                <BarChart3 className="h-3 w-3" />
                ML Analytics
              </Badge>
            )}
            <Link href="/dashboard/properties/virtual-tours/manage">
              <Button size="sm" variant="outline">
                View All
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {popularTours && popularTours.length > 0 ? (
          <div className="space-y-4">
            {popularTours.map((tour) => (
              <div
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                key={tour.id}
              >
                {/* Thumbnail */}
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
                  {tour.scenes[0]?.thumbnailUrl ? (
                    // biome-ignore lint/performance/noImgElement: ignore
                    // biome-ignore lint/nursery/useImageSize: ignore
                    <img
                      alt={tour.title}
                      className="h-full w-full object-cover"
                      src={tour.scenes[0].thumbnailUrl}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Tour Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="truncate font-medium">{tour.title}</h3>
                    <Badge
                      className="text-xs"
                      variant={
                        tour.status === "published"
                          ? "default"
                          : tour.status === "draft"
                            ? "outline"
                            : tour.status === "processing"
                              ? "secondary"
                              : "destructive"
                      }
                    >
                      {tour.status}
                    </Badge>
                  </div>
                  <p className="mb-2 truncate text-muted-foreground text-sm">
                    {tour.description}
                  </p>
                  <div className="flex items-center gap-4 text-muted-foreground text-xs">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{tour.analytics.totalViews} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {Math.round(tour.analytics.averageDuration / 60_000)}min
                        avg
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{tour.analytics.uniqueVisitors} unique</span>
                    </div>
                    <span>
                      Updated {formatDistanceToNow(new Date(tour.updatedAt))}{" "}
                      ago
                    </span>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className="text-center">
                  <div className="mb-1 font-medium text-sm">Performance</div>
                  <div className="w-12">
                    <Progress
                      className="h-2"
                      value={tour.analytics.completionRate * 100}
                    />
                  </div>
                  <div className="mt-1 text-muted-foreground text-xs">
                    {Math.round(tour.analytics.completionRate * 100)}%
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Link href={`/tours/${tour.id}`}>
                    <Button size="sm" variant="ghost">
                      <Play className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link
                    href={`/dashboard/properties/virtual-tours/${tour.id}/edit`}
                  >
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">No Virtual Tours Yet</h3>
            <p className="mb-4 text-muted-foreground">
              Create your first virtual tour to get started
            </p>
            <Link href="/dashboard/properties/virtual-tours/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Tour
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TourManagementOverviewSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            className="flex items-center gap-4 rounded-lg border p-4"
            key={i.toString()}
          >
            <div className="h-12 w-16 animate-pulse rounded bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="w-12 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-2 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
            </div>
            <div className="flex gap-1">
              <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default TourManagementOverview;
