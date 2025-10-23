/**
 * Virtual Tours Collaboration Hub
 * Centralized management for collaboration sessions and real-time features
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  Settings,
  StopCircle,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
// import type { Metadata } from "next";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { CollaborationPanel } from "@/modules/virtual-tours/components/collaboration-panel";
import { useVirtualTours } from "@/modules/virtual-tours/virtual-tour.queries";
import { createCollaborationSession } from "@/modules/virtual-tours/virtual-tour.service";
import {
  useVirtualTourActions,
  useVirtualTourStore,
} from "@/modules/virtual-tours/virtual-tour.store";
import { CreateSessionDialog } from "./components/create-session-dialog";
// import type {
// 	VirtualTour,
// 	CollaborationSession,
// } from "@/modules/virtual-tours/virtual-tour.type";
import { SessionCard } from "./components/session-card";

// export const metadata: Metadata = {
// 	title: "Collaboration Hub | Virtual Tours",
// 	description: "Manage real-time collaboration sessions for virtual tours",
// };

type CollaborationSessionData = {
  id: string;
  tourId: string;
  tourTitle: string;
  hostId: string;
  participants: number;
  maxParticipants: number;
  status: "active" | "scheduled" | "ended";
  startedAt: Date;
  scheduledFor?: Date;
  settings: {
    allowVideo: boolean;
    allowAudio: boolean;
    allowScreenShare: boolean;
    allowAnnotations: boolean;
    recordingEnabled: boolean;
    requireApproval: boolean;
  };
};

export default function CollaborationHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTour, setSelectedTour] = useState<string>("");
  // Removed local state for create dialog - now handled by CreateSessionDialog component

  // Store state
  const {
    tours,
    collaborationSession,
    isCollaborating,
    participants,
    chatMessages,
    liveAnnotations,
    setCurrentTour,
    // startCollaboration,
    // endCollaboration,
  } = useVirtualTourStore.getState();

  const startCollaboration = useVirtualTourActions().startCollaboration;
  const endCollaboration = useVirtualTourActions().endCollaboration;

  // Queries
  const { data: toursData, isLoading: toursLoading } = useVirtualTours(
    "propertyId",
    {}
  );

  // Mock collaboration sessions data (in real app, this would come from API)
  const [collaborationSessions, setCollaborationSessions] = useState<
    CollaborationSessionData[]
  >([
    {
      id: "session-1",
      tourId: "tour-1",
      tourTitle: "Luxury Apartment Tour",
      hostId: "user-1",
      participants: 3,
      maxParticipants: 10,
      status: "active",
      startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      settings: {
        allowVideo: true,
        allowAudio: true,
        allowScreenShare: true,
        allowAnnotations: true,
        recordingEnabled: true,
        requireApproval: false,
      },
    },
    {
      id: "session-2",
      tourId: "tour-2",
      tourTitle: "Commercial Office Space",
      hostId: "user-1",
      participants: 0,
      maxParticipants: 5,
      status: "scheduled",
      startedAt: new Date(),
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      settings: {
        allowVideo: false,
        allowAudio: true,
        allowScreenShare: false,
        allowAnnotations: true,
        recordingEnabled: false,
        requireApproval: true,
      },
    },
  ]);

  const filteredTours = tours.filter((tour) =>
    tour.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSessions = collaborationSessions.filter(
    (session) => session.status === "active"
  );
  const scheduledSessions = collaborationSessions.filter(
    (session) => session.status === "scheduled"
  );
  const endedSessions = collaborationSessions.filter(
    (session) => session.status === "ended"
  );

  const handleCreateSession = async (sessionData: any) => {
    try {
      const session = await createCollaborationSession(sessionData.tourId);
      const newSession: CollaborationSessionData = {
        id: session.id,
        tourId: sessionData.tourId,
        tourTitle:
          tours.find((t) => t.id === sessionData.tourId)?.title ||
          "Unknown Tour",
        hostId: "current-user",
        participants: 1,
        maxParticipants: sessionData.maxParticipants,
        status: sessionData.scheduledFor ? "scheduled" : "active",
        startedAt: new Date(),
        scheduledFor: sessionData.scheduledFor,
        settings: {
          allowVideo: sessionData.allowVideo,
          allowAudio: sessionData.allowAudio,
          allowScreenShare: sessionData.allowScreenShare,
          allowAnnotations: sessionData.allowAnnotations,
          recordingEnabled: sessionData.recordingEnabled,
          requireApproval: sessionData.requireApproval,
        },
      };

      setCollaborationSessions((prev) => [newSession, ...prev]);
    } catch (error) {
      console.error("Failed to create collaboration session:", error);
    }
  };

  const handleJoinSession = (sessionId: string) => {
    const session = collaborationSessions.find((s) => s.id === sessionId);
    if (session) {
      const tour = tours.find((t) => t.id === session.tourId);
      if (tour) {
        setCurrentTour(tour);
        startCollaboration({
          id: sessionId,
          tourId: session.tourId,
          hostId: session.hostId,
          participants: [],
          isConnected: false,
          role: "host",
        });
      }
    }
  };

  const handleEndSession = (sessionId: string) => {
    setCollaborationSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, status: "ended" as const }
          : session
      )
    );
    endCollaboration();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Activity className="h-4 w-4 text-green-500" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "ended":
        return <StopCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Status functions moved to SessionCard component
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "scheduled":
        return "secondary";
      case "ended":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Shell className="gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Collaboration Hub</h1>
          <p className="text-muted-foreground">
            Manage real-time collaboration sessions for your virtual tours
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <CreateSessionDialog onCreate={handleCreateSession} tours={tours} />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Sessions</p>
                <p className="font-bold text-2xl">{activeSessions.length}</p>
                <p className="mt-1 flex items-center gap-1 text-green-600 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  {activeSessions.length > 0 ? "Live now" : "None active"}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Total Participants
                </p>
                <p className="font-bold text-2xl">
                  {activeSessions.reduce(
                    (sum, session) => sum + session.participants,
                    0
                  )}
                </p>
                <p className="mt-1 flex items-center gap-1 text-blue-600 text-xs">
                  <Users className="h-3 w-3" />
                  Across all sessions
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Scheduled Sessions
                </p>
                <p className="font-bold text-2xl">{scheduledSessions.length}</p>
                <p className="mt-1 flex items-center gap-1 text-purple-600 text-xs">
                  <Calendar className="h-3 w-3" />
                  Upcoming
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Sessions</p>
                <p className="font-bold text-2xl">
                  {collaborationSessions.length}
                </p>
                <p className="mt-1 flex items-center gap-1 text-orange-600 text-xs">
                  <Zap className="h-3 w-3" />
                  This month
                </p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs className="space-y-4" defaultValue="active">
        <TabsList>
          <TabsTrigger className="flex items-center gap-2" value="active">
            <Activity className="h-4 w-4" />
            Active ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="scheduled">
            <Clock className="h-4 w-4" />
            Scheduled ({scheduledSessions.length})
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="history">
            <StopCircle className="h-4 w-4" />
            History ({endedSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="active">
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No Active Sessions</h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  Start a new collaboration session to begin working with others
                </p>
                <CreateSessionDialog
                  onCreate={handleCreateSession}
                  tours={tours}
                >
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Session
                  </Button>
                </CreateSessionDialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  onEnd={handleEndSession}
                  onJoin={handleJoinSession}
                  onShare={(sessionId) => {
                    const session = activeSessions.find(
                      (s) => s.id === sessionId
                    );
                    if (session) {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/tours/${session.tourId}/collaborate?session=${sessionId}`
                      );
                    }
                  }}
                  session={session}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="scheduled">
          {scheduledSessions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No Scheduled Sessions</h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  Schedule collaboration sessions for future dates
                </p>
                <CreateSessionDialog
                  onCreate={handleCreateSession}
                  tours={tours}
                >
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Session
                  </Button>
                </CreateSessionDialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scheduledSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  onEdit={(sessionId) => {
                    // Handle edit functionality
                    console.log("Edit session:", sessionId);
                  }}
                  onShare={(sessionId) => {
                    const session = scheduledSessions.find(
                      (s) => s.id === sessionId
                    );
                    if (session) {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/tours/${session.tourId}/collaborate?session=${sessionId}`
                      );
                    }
                  }}
                  session={session}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="history">
          {endedSessions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <StopCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No Session History</h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  Completed collaboration sessions will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {endedSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{session.tourTitle}</h4>
                          <p className="text-muted-foreground text-sm">
                            Ended {formatDistanceToNow(session.startedAt)} ago
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(session.status)}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1 capitalize">
                            {session.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                          {session.participants} participants
                        </span>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Live Collaboration Panel */}
      {isCollaborating && collaborationSession && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Live Collaboration Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CollaborationPanel
              className="h-96"
              isHost={true}
              tourId={collaborationSession.tourId}
            />
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}
