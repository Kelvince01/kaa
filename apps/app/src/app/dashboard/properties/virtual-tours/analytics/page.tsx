/**
 * Virtual Tours Analytics Page
 */

import { Button } from "@kaa/ui/components/button";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { TourAnalyticsDashboard } from "@/modules/virtual-tours";

export const metadata: Metadata = {
  title: "Virtual Tours Analytics | Dashboard",
  description:
    "Comprehensive analytics and ML insights for your virtual tours.",
};

export default function VirtualToursAnalyticsPage() {
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
          <h1 className="font-bold text-2xl">Virtual Tours Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and AI-powered insights for your virtual
            tours
          </p>
        </div>
      </div>

      <TourAnalyticsDashboard tourId={"tourId"} />
    </Shell>
  );
}
