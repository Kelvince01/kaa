"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Calendar, Clock, Phone, Plus, Video } from "lucide-react";
import Link from "next/link";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useActiveCalls, useUserCalls } from "@/modules/comms/video-calling";
import { CallStatsCards } from "./call-stats-cards";
import { CallsList } from "./calls-list";

export default function CallsDashboard() {
  const { user } = useAuthStore();
  const { data: activeCalls, isLoading: isLoadingActive } = useActiveCalls();
  const { data: userCalls, isLoading: isLoadingUser } = useUserCalls(
    user?.id || "",
    !!user?.id
  );
  const { messages } = useWebSocket();

  const isLoading = isLoadingActive || isLoadingUser;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Video Calls</h1>
          <p className="text-muted-foreground">
            Manage your video calls, property tours, and meetings
          </p>
          {messages[0]}
        </div>
        <Link href="/dashboard/calls/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Call
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <CallStatsCards calls={userCalls?.data?.calls || []} />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <Link href="/dashboard/calls/new?type=property_tour">
            <CardHeader>
              <Video className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Property Tour</CardTitle>
              <CardDescription>
                Schedule a virtual property viewing
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <Link href="/dashboard/calls/new?type=tenant_meeting">
            <CardHeader>
              <Phone className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Tenant Meeting</CardTitle>
              <CardDescription>Meet with tenants or applicants</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <Link href="/dashboard/calls/recordings">
            <CardHeader>
              <Calendar className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>View Recordings</CardTitle>
              <CardDescription>Access past call recordings</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Calls Tabs */}
      <Tabs className="space-y-4" defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            <Clock className="mr-2 h-4 w-4" />
            Active Calls
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="mr-2 h-4 w-4" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="history">
            <Video className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Calls</CardTitle>
              <CardDescription>
                Join ongoing calls or see who's currently in a call
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2" />
                </div>
              ) : (
                <CallsList
                  calls={activeCalls?.data.calls || []}
                  emptyMessage="No active calls at the moment"
                  showJoinButton
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Calls</CardTitle>
              <CardDescription>
                Upcoming calls and property tours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2" />
                </div>
              ) : (
                <CallsList
                  calls={
                    userCalls?.data?.calls.filter(
                      (call) =>
                        call.scheduledAt &&
                        new Date(call.scheduledAt) > new Date()
                    ) || []
                  }
                  emptyMessage="No scheduled calls"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="history">
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>View past calls and recordings</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2" />
                </div>
              ) : (
                <CallsList
                  calls={
                    userCalls?.data?.calls.filter(
                      (call) => call.status === "ended"
                    ) || []
                  }
                  emptyMessage="No call history"
                  showDetailsButton
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
