/**
 * Virtual Tours Dashboard Page
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
  BarChart3,
  Box,
  Camera,
  Eye,
  Glasses,
  Navigation,
  Plus,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { TourManagementOverview } from "./components/tour-management-overview";

export const metadata: Metadata = {
  title: "Virtual Tours | Dashboard",
  description:
    "Manage and create immersive virtual property tours with AI-powered features.",
};

export default function VirtualToursPage() {
  return (
    <Shell className="gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Virtual Tours</h1>
          <p className="text-muted-foreground">
            Create and manage immersive virtual property tours with AI-powered
            features
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/dashboard/properties/virtual-tours/analytics">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/dashboard/properties/virtual-tours/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tour
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Tours</p>
                <p className="font-bold text-2xl">24</p>
                <p className="mt-1 flex items-center gap-1 text-green-600 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  +3 this week
                </p>
              </div>
              <Camera className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Views</p>
                <p className="font-bold text-2xl">12.5K</p>
                <p className="mt-1 flex items-center gap-1 text-green-600 text-xs">
                  <Eye className="h-3 w-3" />
                  +850 this week
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Viewers</p>
                <p className="font-bold text-2xl">47</p>
                <p className="mt-1 flex items-center gap-1 text-blue-600 text-xs">
                  <Users className="h-3 w-3" />
                  Live now
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Conversion Rate</p>
                <p className="font-bold text-2xl">8.4%</p>
                <p className="mt-1 flex items-center gap-1 text-green-600 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  +1.2% vs last month
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              AI-Powered Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Smart Content Generation</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Intelligent Hotspot Suggestions</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">ML Analytics & Insights</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Voice Narration</span>
              <Badge variant="secondary">Available</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Glasses className="h-5 w-5" />
              Immersive Experiences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Virtual Reality (VR)</span>
              <Badge variant="default">Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Augmented Reality (AR)</span>
              <Badge variant="default">Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Hand Tracking</span>
              <Badge variant="secondary">Available</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Spatial Audio</span>
              <Badge variant="default">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Collaboration & Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time Co-editing</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Live Streaming</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Video Conferencing</span>
              <Badge variant="secondary">Available</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Social Sharing</span>
              <Badge variant="default">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tour Types */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Types Available</CardTitle>
          <p className="text-muted-foreground text-sm">
            Choose from various tour formats to showcase your properties
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-7">
            {[
              {
                icon: <Camera className="h-6 w-6" />,
                name: "Photo 360°",
                count: 18,
              },
              {
                icon: <Video className="h-6 w-6" />,
                name: "Video 360°",
                count: 6,
              },
              { icon: <Box className="h-6 w-6" />, name: "3D Model", count: 3 },
              {
                icon: <Glasses className="h-6 w-6" />,
                name: "VR Tour",
                count: 2,
              },
              {
                icon: <div className="text-lg">📱</div>,
                name: "AR Tour",
                count: 1,
              },
              {
                icon: <Navigation className="h-6 w-6" />,
                name: "Interactive",
                count: 8,
              },
              {
                icon: <div className="text-lg">🚁</div>,
                name: "Drone",
                count: 4,
              },
            ].map((type) => (
              <div
                className="cursor-pointer rounded-lg border p-4 text-center transition-colors hover:bg-muted/50"
                key={type.name}
              >
                <div className="mb-2 flex justify-center text-blue-500">
                  {type.icon}
                </div>
                <p className="font-medium text-sm">{type.name}</p>
                <p className="text-muted-foreground text-xs">
                  {type.count} tours
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tour Management Overview */}
      <TourManagementOverview />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <Link href="/dashboard/properties/virtual-tours/create">
            <CardContent className="p-6 text-center">
              <Plus className="mx-auto mb-4 h-12 w-12 text-blue-500" />
              <h3 className="mb-2 font-semibold">Create New Tour</h3>
              <p className="text-muted-foreground text-sm">
                Use AI to create immersive virtual tours
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <Link href="/dashboard/properties/virtual-tours/analytics">
            <CardContent className="p-6 text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h3 className="mb-2 font-semibold">Analytics Dashboard</h3>
              <p className="text-muted-foreground text-sm">
                View detailed analytics and ML insights
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <Link href="/dashboard/properties/virtual-tours/collaboration">
            <CardContent className="p-6 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-purple-500" />
              <h3 className="mb-2 font-semibold">Collaboration Hub</h3>
              <p className="text-muted-foreground text-sm">
                Manage live collaboration sessions
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </Shell>
  );
}
