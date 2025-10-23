/**
 * Individual Virtual Tour Management Page
 */

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Accessibility,
  ArrowLeft,
  Edit,
  Eye,
  Glasses,
  Settings,
  Share,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";
import {
  CollaborationPanel,
  TourAnalyticsDashboard,
  VirtualTourViewer,
} from "@/modules/virtual-tours";

export const metadata: Metadata = {
  title: "Virtual Tour Details | Dashboard",
  description: "Manage and view virtual tour details with advanced features.",
};

type TourDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; propertyId?: string }>;
};

export default async function TourDetailPage(props: TourDetailPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const defaultTab = searchParams.tab || "viewer";

  return (
    <Shell className="gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/properties/virtual-tours">
            <Button size="sm" variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tours
            </Button>
          </Link>

          <div>
            <h1 className="font-bold text-2xl">Virtual Tour Details</h1>
            <p className="text-muted-foreground">
              Manage your virtual tour with advanced AI and collaboration
              features
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/tours/${params.id}`} target="_blank">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </Link>
          <Link href={`/dashboard/properties/virtual-tours/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Feature Status Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="mx-auto mb-2 h-8 w-8 text-blue-500" />
            <h3 className="font-medium text-sm">AI Features</h3>
            <Badge className="mt-1 text-xs" variant="default">
              Active
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Glasses className="mx-auto mb-2 h-8 w-8 text-purple-500" />
            <h3 className="font-medium text-sm">XR Ready</h3>
            <Badge className="mt-1 text-xs" variant="secondary">
              Available
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <h3 className="font-medium text-sm">Collaboration</h3>
            <Badge className="mt-1 text-xs" variant="default">
              Ready
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Accessibility className="mx-auto mb-2 h-8 w-8 text-orange-500" />
            <h3 className="font-medium text-sm">Accessible</h3>
            <Badge className="mt-1 text-xs" variant="default">
              WCAG AAA
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs className="space-y-4" value={defaultTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="viewer">Viewer</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Tour Viewer Tab */}
        <TabsContent value="viewer">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <VirtualTourViewer
                className="h-[600px]"
                enableCollaboration={true}
                enableXR={true}
                propertyId={searchParams.propertyId}
                showControls={true}
                tourId={params.id}
              />
            </div>

            <div className="space-y-4 lg:col-span-1">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Views Today</span>
                    <span className="font-medium">234</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Active Viewers
                    </span>
                    <span className="font-medium text-green-600">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Session</span>
                    <span className="font-medium">3.2min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium">76%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Smart Connections
                  </Button>
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Start Live Session
                  </Button>
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                  >
                    <Glasses className="mr-2 h-4 w-4" />
                    Enable XR Mode
                  </Button>
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="outline"
                  >
                    <Share className="mr-2 h-4 w-4" />
                    Get Embed Code
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <TourAnalyticsDashboard showMLInsights={true} tourId={params.id} />
        </TabsContent>

        {/* Collaboration Tab */}
        <TabsContent value="collaboration">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Collaboration Sessions</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Manage real-time collaboration and live streaming
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="py-12 text-center">
                    <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h3 className="mb-2 font-semibold text-lg">
                      No Active Sessions
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      Start a collaboration session to work with others in
                      real-time
                    </p>
                    <Button>
                      <Users className="mr-2 h-4 w-4" />
                      Start Collaboration Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <CollaborationPanel
                className="h-[500px]"
                isHost={true}
                tourId={params.id}
              />
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tour Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Tour settings management will be displayed here
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Advanced Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">AI Content Generation</p>
                      <p className="text-muted-foreground text-sm">
                        Automatically generate descriptions and hotspots
                      </p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">WebXR Support</p>
                      <p className="text-muted-foreground text-sm">
                        VR and AR compatibility
                      </p>
                    </div>
                    <Badge variant="default">Ready</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Real-time Collaboration</p>
                      <p className="text-muted-foreground text-sm">
                        Live editing and streaming
                      </p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Edge Computing</p>
                      <p className="text-muted-foreground text-sm">
                        Optimized global delivery
                      </p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Shell>
  );
}
