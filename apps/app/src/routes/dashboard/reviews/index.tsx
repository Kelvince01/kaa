/**
 * Reviews Dashboard Route
 * Main reviews management interface
 */

"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { ModerationPanel } from "@/modules/reviews/components/moderation-panel";
import { ReviewDashboardContainer } from "@/routes/dashboard/reviews/review-dashboard";

export default function ReviewsDashboard() {
  const { user } = useAuthStore();
  const [activeView, setActiveView] = useState<"all" | "moderation">("all");

  // Check if user has moderation permissions
  const hasModerationPermissions =
    user?.role === "admin" || user?.role === "moderator";

  return (
    <div className="space-y-6">
      <Tabs onValueChange={(v) => setActiveView(v as any)} value={activeView}>
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          {hasModerationPermissions && (
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
          )}
        </TabsList>

        <TabsContent className="mt-6" value="all">
          <ReviewDashboardContainer
            currentUserId={user?.id}
            showCreateButton={true}
            showStats={true}
            targetId=""
            type="property"
          />
        </TabsContent>

        {hasModerationPermissions && (
          <TabsContent className="mt-6" value="moderation">
            <ModerationPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
