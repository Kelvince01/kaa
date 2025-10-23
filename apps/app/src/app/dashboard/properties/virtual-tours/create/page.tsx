"use client";

/**
 * Create Virtual Tour Page
 */

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { ArrowLeft, Wand2, Zap } from "lucide-react";
import Link from "next/link";
// import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import { CreateTourForm } from "@/modules/virtual-tours";

// export const metadata: Metadata = {
// 	title: "Create Virtual Tour | Dashboard",
// 	description: "Create a new virtual tour with AI-powered features and advanced capabilities.",
// };

type CreateTourPageProps = {
  searchParams: { propertyId?: string };
};

export default function CreateTourPage(props: CreateTourPageProps) {
  const { propertyId } = props.searchParams;

  return (
    <Shell className="gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/properties/virtual-tours">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tours
          </Button>
        </Link>

        <div>
          <h1 className="font-bold text-2xl">Create Virtual Tour</h1>
          <p className="text-muted-foreground">
            Create an immersive virtual tour with AI-powered features
          </p>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
              <Wand2 className="h-5 w-5" />
              AI-Powered Creation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-blue-600 text-sm">
              • Smart content generation from images
            </p>
            <p className="text-blue-600 text-sm">
              • Intelligent hotspot placement suggestions
            </p>
            <p className="text-blue-600 text-sm">
              • Auto-generated scene connections
            </p>
            <p className="text-blue-600 text-sm">
              • Voice narration in English and Swahili
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
              <Zap className="h-5 w-5" />
              Advanced Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-purple-600 text-sm">
              • WebXR support for VR/AR experiences
            </p>
            <p className="text-purple-600 text-sm">
              • Real-time collaboration and co-editing
            </p>
            <p className="text-purple-600 text-sm">
              • Edge computing for optimal performance
            </p>
            <p className="text-purple-600 text-sm">
              • Full accessibility and mobile PWA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Tour Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Configuration</CardTitle>
          <p className="text-muted-foreground text-sm">
            Configure your virtual tour with AI assistance and advanced features
          </p>
        </CardHeader>
        <CardContent>
          <CreateTourForm
            onCancel={() => {
              window.history.back();
            }}
            onSuccess={(tour) => {
              // Redirect to tour editor or viewer
              window.location.href = `/dashboard/properties/virtual-tours/${tour.id}/edit`;
            }}
            propertyId={propertyId || ""}
          />
        </CardContent>
      </Card>
    </Shell>
  );
}
