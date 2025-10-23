/**
 * Edit Virtual Tour Page
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
import { ArrowLeft, Camera, Eye, MapPin, Save, Users, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { CollaborationPanel, VirtualTourViewer } from "@/modules/virtual-tours";
import { TourEditor } from "../components/tour-editor";

export const metadata: Metadata = {
  title: "Edit Virtual Tour | Dashboard",
  description:
    "Edit virtual tour with AI-powered features and real-time collaboration.",
};

type EditTourPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ propertyId?: string }>;
};

export default async function EditTourPage(props: EditTourPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  return (
    <Shell className="gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/properties/virtual-tours/${params.id}`}>
            <Button size="sm" variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tour
            </Button>
          </Link>

          <div>
            <h1 className="font-bold text-2xl">Edit Virtual Tour</h1>
            <p className="text-muted-foreground">
              Modify scenes, hotspots, and settings with AI assistance
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
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* AI Assistant Panel */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
            <Zap className="h-5 w-5" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button
              className="flex h-auto flex-col items-center gap-2 p-4"
              variant="outline"
            >
              <Camera className="h-6 w-6 text-blue-600" />
              <div className="text-center">
                <p className="font-medium text-sm">Analyze Scenes</p>
                <p className="text-muted-foreground text-xs">
                  AI scene analysis and enhancement
                </p>
              </div>
            </Button>

            <Button
              className="flex h-auto flex-col items-center gap-2 p-4"
              variant="outline"
            >
              <MapPin className="h-6 w-6 text-green-600" />
              <div className="text-center">
                <p className="font-medium text-sm">Smart Hotspots</p>
                <p className="text-muted-foreground text-xs">
                  Intelligent hotspot suggestions
                </p>
              </div>
            </Button>

            <Button
              className="flex h-auto flex-col items-center gap-2 p-4"
              variant="outline"
            >
              <Zap className="h-6 w-6 text-purple-600" />
              <div className="text-center">
                <p className="font-medium text-sm">Auto-Connect</p>
                <p className="text-muted-foreground text-xs">
                  Generate scene connections
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Editor */}
      <Tabs className="space-y-4" defaultValue="editor">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor">
          <TourEditor propertyId={searchParams.propertyId} tourId={params.id} />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <VirtualTourViewer
            className="h-[700px]"
            enableCollaboration={true}
            enableXR={true}
            propertyId={searchParams.propertyId}
            showControls={true}
            tourId={params.id}
          />
        </TabsContent>

        {/* Collaboration Tab */}
        <TabsContent value="collaboration">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Live Collaboration Editor</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Edit the tour collaboratively with real-time sync
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-100">
                    <div className="text-center">
                      <Users className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">
                        Collaborative editing interface will be rendered here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <CollaborationPanel
                className="h-[600px]"
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
                <CardTitle>Tour Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Tour configuration settings will be displayed here
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">AI Enhancement</p>
                      <p className="text-muted-foreground text-sm">
                        Automatically enhance tour content
                      </p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Edge Optimization</p>
                      <p className="text-muted-foreground text-sm">
                        Global content delivery optimization
                      </p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Accessibility Compliance</p>
                      <p className="text-muted-foreground text-sm">
                        WCAG 2.1 AAA compliance features
                      </p>
                    </div>
                    <Badge variant="default">WCAG AAA</Badge>
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
