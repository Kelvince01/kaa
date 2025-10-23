/**
 * Enhanced Virtual Tour Component for Property Details
 * Integrates advanced virtual tours with AI, XR, and collaboration features
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { cn } from "@kaa/ui/lib/utils";
import { Eye, Glasses, Play, Share, Users, Zap } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Property } from "@/modules/properties/property.type";

// Import advanced virtual tours module
import {
  CollaborationPanel,
  getAvailableFeatures,
  hasAllAdvancedFeatures,
  TourAnalyticsDashboard,
  TourManagementDashboard,
  useServiceCapabilities,
  useVirtualTours,
  VirtualTourViewer,
} from "@/modules/virtual-tours";

type VirtualTourProps = {
  property: Property;
  className?: string;
};

export function VirtualTour({ property, className }: VirtualTourProps) {
  const [showFullViewer, setShowFullViewer] = useState(false);
  const [activeTab, setActiveTab] = useState("viewer");

  // Queries
  const { data: tours, isLoading } = useVirtualTours(property._id);
  const { data: capabilities } = useServiceCapabilities();

  const hasTours = tours && tours.data.tours.length > 0;
  const featuredTour = hasTours
    ? tours.data.tours.find((t) => t.status === "published") ||
      tours.data.tours[0]
    : null;
  const availableFeatures = getAvailableFeatures();
  const hasAdvancedFeatures = hasAllAdvancedFeatures();

  if (isLoading) {
    return <VirtualTourSkeleton className={className} />;
  }

  if (!hasTours) {
    return (
      <div className={cn("", className)}>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold">Virtual Tour Not Available</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              No virtual tours have been created for this property yet.
            </p>
            {/* Show available tour capabilities */}
            {capabilities && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs">
                  Available tour features for this property:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {capabilities.features.aiAnalysis && (
                    <Badge variant="outline">
                      <Zap className="mr-1 h-3 w-3" />
                      AI-Powered
                    </Badge>
                  )}
                  {capabilities.features.webXR && (
                    <Badge variant="outline">
                      <Glasses className="mr-1 h-3 w-3" />
                      VR/AR Ready
                    </Badge>
                  )}
                  {capabilities.features.realTimeCollaboration && (
                    <Badge variant="outline">
                      <Users className="mr-1 h-3 w-3" />
                      Collaborative
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Virtual Tours
              <Badge variant="secondary">
                {tours?.data.tours.length || 0} tours
              </Badge>
              {hasAdvancedFeatures && (
                <Badge
                  className="border-green-500 text-green-600"
                  variant="outline"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  AI Enhanced
                </Badge>
              )}
            </CardTitle>

            <div className="flex gap-2">
              {featuredTour && (
                <>
                  <Button
                    onClick={() => setShowFullViewer(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share className="mr-1 h-4 w-4" />
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuredTour ? (
            <>
              {/* Featured Tour Preview */}
              <div className="space-y-3">
                <VirtualTourViewer
                  className="h-80"
                  enableCollaboration={
                    capabilities?.features.realTimeCollaboration
                  }
                  enableXR={capabilities?.features.webXR}
                  propertyId={property._id}
                  tourId={featuredTour.id}
                />

                {/* Tour Info */}
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <div className="text-center">
                    <p className="font-medium">
                      {featuredTour.analytics.totalViews}
                    </p>
                    <p className="text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{featuredTour.scenes.length}</p>
                    <p className="text-muted-foreground">Scenes</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">
                      {Math.round(
                        featuredTour.analytics.averageDuration / 60_000
                      )}
                      min
                    </p>
                    <p className="text-muted-foreground">Duration</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">
                      {Math.round(featuredTour.analytics.completionRate * 100)}%
                    </p>
                    <p className="text-muted-foreground">Completion</p>
                  </div>
                </div>
              </div>

              {/* Advanced Features Available */}
              {capabilities && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                  <p className="mb-2 font-medium text-blue-700 text-sm">
                    Advanced Features Available
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {capabilities.features.aiAnalysis && (
                      <Badge
                        className="border-blue-300 text-blue-600"
                        variant="outline"
                      >
                        <Zap className="mr-1 h-3 w-3" />
                        AI Analysis
                      </Badge>
                    )}
                    {capabilities.features.webXR && (
                      <Badge
                        className="border-purple-300 text-purple-600"
                        variant="outline"
                      >
                        <Glasses className="mr-1 h-3 w-3" />
                        VR/AR Experience
                      </Badge>
                    )}
                    {capabilities.features.realTimeCollaboration && (
                      <Badge
                        className="border-green-300 text-green-600"
                        variant="outline"
                      >
                        <Users className="mr-1 h-3 w-3" />
                        Live Collaboration
                      </Badge>
                    )}
                    {capabilities.features.accessibility && (
                      <Badge
                        className="border-orange-300 text-orange-600"
                        variant="outline"
                      >
                        ♿ Fully Accessible
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* All Tours List */}
              {tours.data.tours.length > 1 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">
                    All Tours ({tours.data.tours.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {tours.data.tours.slice(1).map((tour) => (
                      <Card
                        className="cursor-pointer transition-shadow hover:shadow-md"
                        key={tour.id}
                      >
                        <CardContent className="p-3">
                          <div className="mb-2 aspect-video overflow-hidden rounded bg-muted">
                            {tour.scenes[0]?.thumbnailUrl ? (
                              // biome-ignore lint/performance/noImgElement: ignore
                              <img
                                alt={tour.title}
                                className="h-full w-full object-cover"
                                height={300}
                                src={tour.scenes[0].thumbnailUrl}
                                width={300}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Play className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <h5 className="line-clamp-1 font-medium text-sm">
                            {tour.title}
                          </h5>
                          <p className="text-muted-foreground text-xs">
                            {tour.scenes.length} scenes •{" "}
                            {tour.analytics.totalViews} views
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <TourManagementDashboard propertyId={property._id} />
          )}
        </CardContent>
      </Card>

      {/* Full Tour Viewer Modal */}
      <Dialog onOpenChange={setShowFullViewer} open={showFullViewer}>
        <DialogContent className="max-h-[95vh] max-w-7xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              {featuredTour?.title}
              <div className="ml-auto flex gap-1">
                {capabilities?.features.webXR && (
                  <Badge variant="outline">
                    <Glasses className="mr-1 h-3 w-3" />
                    XR Ready
                  </Badge>
                )}
                {capabilities?.features.realTimeCollaboration && (
                  <Badge variant="outline">
                    <Users className="mr-1 h-3 w-3" />
                    Collaborative
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {featuredTour && (
            <Tabs
              className="flex-1"
              onValueChange={setActiveTab}
              value={activeTab}
            >
              <div className="px-6">
                <TabsList>
                  <TabsTrigger value="viewer">Tour Viewer</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  {capabilities?.features.realTimeCollaboration && (
                    <TabsTrigger value="collaboration">
                      Collaboration
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent className="p-6 pt-4" value="viewer">
                <VirtualTourViewer
                  autoplay={false}
                  className="h-[500px]"
                  enableCollaboration={
                    capabilities?.features.realTimeCollaboration
                  }
                  enableXR={capabilities?.features.webXR}
                  propertyId={property._id}
                  showControls={true}
                  tourId={featuredTour.id}
                />
              </TabsContent>

              <TabsContent className="p-6 pt-4" value="analytics">
                <TourAnalyticsDashboard
                  showMLInsights={capabilities?.features.mlAnalytics}
                  tour={featuredTour}
                  tourId={featuredTour.id}
                />
              </TabsContent>

              {capabilities?.features.realTimeCollaboration && (
                <TabsContent className="p-6 pt-4" value="collaboration">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <VirtualTourViewer
                        className="h-[400px]"
                        enableCollaboration={true}
                        enableXR={capabilities?.features.webXR}
                        propertyId={property._id}
                        tourId={featuredTour.id}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <CollaborationPanel
                        className="h-[400px]"
                        tourId={featuredTour.id}
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading skeleton component
const VirtualTourSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn("", className)}>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-4 gap-3 text-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="space-y-1 text-center" key={i.toString()}>
              <div className="h-4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);
