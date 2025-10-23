/**
 * Collaboration Session Detail Page
 * Detailed view and management of a specific collaboration session
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
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { cn } from "@kaa/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Clock,
  Crown,
  Edit3,
  Eye,
  MessageSquare,
  Mic,
  MicOff,
  RefreshCw,
  ScreenShare,
  ScreenShareOff,
  Share2,
  StopCircle,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Wifi,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { useVirtualTour } from "@/modules/virtual-tours/virtual-tour.queries";
import { endCollaborationSession } from "@/modules/virtual-tours/virtual-tour.service";
import { useVirtualTourState } from "@/modules/virtual-tours/virtual-tour.store";
import type {
  ChatMessage,
  Participant,
} from "@/modules/virtual-tours/virtual-tour.type";

// export const metadata: Metadata = {
// 	title: "Collaboration Session | Virtual Tours",
// 	description: "Manage and participate in virtual tour collaboration session",
// };

interface SessionParticipant extends Participant {
  name: string;
  email: string;
  avatar?: string;
  lastSeen: Date;
  isOnline: boolean;
  permissions: {
    canEdit: boolean;
    canAddScenes: boolean;
    canAddHotspots: boolean;
    canModifySettings: boolean;
    canManageParticipants: boolean;
  };
}

export default function CollaborationSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [sessionData, setSessionData] = useState<any>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer");
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Store state
  const {
    currentTour,
    collaborationSession,
    isCollaborating,
    setCurrentTour,
    startCollaboration,
    endCollaboration,
  } = useVirtualTourState();

  // Queries
  const { data: tourData, isLoading: tourLoading } = useVirtualTour(
    sessionData?.tourId || ""
  );

  // Load session data
  // biome-ignore lint/correctness/useExhaustiveDependencies: we need to reload the session data when the sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  // Mock session data (in real app, this would come from API)
  const loadSessionData = () => {
    // Simulate API call
    const mockSession = {
      id: sessionId,
      tourId: "tour-1",
      hostId: "user-1",
      title: "Luxury Apartment Collaboration",
      status: "active",
      startedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      maxParticipants: 10,
      settings: {
        allowVideo: true,
        allowAudio: true,
        allowScreenShare: true,
        allowAnnotations: true,
        recordingEnabled: true,
        requireApproval: false,
      },
    };

    const mockParticipants: SessionParticipant[] = [
      {
        id: "participant-1",
        userId: "user-1",
        role: "host",
        joinedAt: new Date(Date.now() - 45 * 60 * 1000),
        isActive: true,
        name: "John Doe",
        email: "john@example.com",
        avatar: "/avatars/john.jpg",
        lastSeen: new Date(),
        isOnline: true,
        permissions: {
          canEdit: true,
          canAddScenes: true,
          canAddHotspots: true,
          canModifySettings: true,
          canManageParticipants: true,
        },
      },
      {
        id: "participant-2",
        userId: "user-2",
        role: "editor",
        joinedAt: new Date(Date.now() - 30 * 60 * 1000),
        isActive: true,
        name: "Jane Smith",
        email: "jane@example.com",
        avatar: "/avatars/jane.jpg",
        lastSeen: new Date(Date.now() - 2 * 60 * 1000),
        isOnline: true,
        permissions: {
          canEdit: true,
          canAddScenes: true,
          canAddHotspots: true,
          canModifySettings: false,
          canManageParticipants: false,
        },
      },
      {
        id: "participant-3",
        userId: "user-3",
        role: "viewer",
        joinedAt: new Date(Date.now() - 15 * 60 * 1000),
        isActive: true,
        name: "Bob Wilson",
        email: "bob@example.com",
        avatar: "/avatars/bob.jpg",
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        isOnline: false,
        permissions: {
          canEdit: false,
          canAddScenes: false,
          canAddHotspots: false,
          canModifySettings: false,
          canManageParticipants: false,
        },
      },
    ];

    const mockChatMessages: ChatMessage[] = [
      {
        id: "msg-1",
        userId: "user-1",
        message: "Welcome everyone to this collaboration session!",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        type: "text",
      },
      {
        id: "msg-2",
        userId: "user-2",
        message: "Thanks for inviting me. This tour looks amazing!",
        timestamp: new Date(Date.now() - 40 * 60 * 1000),
        type: "text",
      },
      {
        id: "msg-3",
        userId: "system",
        message: "Bob Wilson joined the session",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: "system",
      },
      {
        id: "msg-4",
        userId: "user-3",
        message: "Hello everyone! Excited to see this property.",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: "text",
      },
    ];

    setSessionData(mockSession);
    setParticipants(mockParticipants);
    setChatMessages(mockChatMessages);

    // Set current tour if not already set
    if (tourData && !currentTour) {
      setCurrentTour(tourData);
    }
  };

  const handleInviteParticipant = () => {
    if (inviteEmail && inviteRole) {
      // Simulate API call
      const newParticipant: SessionParticipant = {
        id: `participant-${Date.now()}`,
        userId: `user-${Date.now()}`,
        role: inviteRole,
        joinedAt: new Date(),
        isActive: false,
        name: inviteEmail.split("@")[0] || "",
        email: inviteEmail,
        lastSeen: new Date(),
        isOnline: false,
        permissions: {
          canEdit: inviteRole === "editor",
          canAddScenes: inviteRole === "editor",
          canAddHotspots: inviteRole === "editor",
          canModifySettings: false,
          canManageParticipants: false,
        },
      };

      setParticipants((prev) => [...prev, newParticipant]);
      setInviteEmail("");
      setInviteRole("viewer");
      setShowInviteDialog(false);
    }
  };

  const handleEndSession = async () => {
    try {
      await endCollaborationSession(sessionId);
      endCollaboration();
      router.push("/dashboard/properties/virtual-tours/collaboration");
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "host":
        return <Crown className="h-4 w-4" />;
      case "editor":
        return <Edit3 className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "host":
        return "default";
      case "editor":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  const onlineParticipants = participants.filter((p) => p.isOnline);
  const activeParticipants = participants.filter((p) => p.isActive);

  if (!sessionData) {
    return (
      <Shell>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading session...</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell className="gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            className="flex items-center gap-2"
            onClick={() => router.back()}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="font-bold text-3xl">{sessionData.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant={
                  sessionData.status === "active" ? "default" : "secondary"
                }
              >
                <Activity className="mr-1 h-3 w-3" />
                {sessionData.status}
              </Badge>
              <span className="text-muted-foreground text-sm">
                Started {formatDistanceToNow(sessionData.startedAt)} ago
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowInviteDialog(true)} variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={handleEndSession} variant="destructive">
            <StopCircle className="mr-2 h-4 w-4" />
            End Session
          </Button>
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Total Participants
                </p>
                <p className="font-bold text-2xl">{participants.length}</p>
                <p className="mt-1 flex items-center gap-1 text-green-600 text-xs">
                  <Users className="h-3 w-3" />
                  {onlineParticipants.length} online
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
                <p className="text-muted-foreground text-sm">Active Now</p>
                <p className="font-bold text-2xl">
                  {activeParticipants.length}
                </p>
                <p className="mt-1 flex items-center gap-1 text-green-600 text-xs">
                  <Activity className="h-3 w-3" />
                  Live participants
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
                <p className="text-muted-foreground text-sm">Duration</p>
                <p className="font-bold text-2xl">
                  {Math.floor(
                    (Date.now() - sessionData.startedAt.getTime()) / (1000 * 60)
                  )}
                  m
                </p>
                <p className="mt-1 flex items-center gap-1 text-blue-600 text-xs">
                  <Clock className="h-3 w-3" />
                  Session time
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Messages</p>
                <p className="font-bold text-2xl">{chatMessages.length}</p>
                <p className="mt-1 flex items-center gap-1 text-orange-600 text-xs">
                  <MessageSquare className="h-3 w-3" />
                  Chat activity
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Tour Viewer */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Tour Viewer
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <Badge className="animate-pulse" variant="destructive">
                      <Video className="mr-1 h-3 w-3" />
                      REC
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Wifi className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-full">
              {currentTour ? (
                <div className="flex h-full items-center justify-center rounded-lg bg-muted/30">
                  <div className="text-center">
                    <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 font-semibold">{currentTour.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      Tour viewer would be embedded here
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg bg-muted/30">
                  <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 font-semibold">No Tour Selected</h3>
                    <p className="text-muted-foreground text-sm">
                      Please select a tour to view
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Collaboration Panel */}
        <div className="space-y-6">
          {/* Media Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Media Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleToggleVideo}
                  size="sm"
                  variant={isVideoEnabled ? "default" : "outline"}
                >
                  {isVideoEnabled ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <VideoOff className="h-4 w-4" />
                  )}
                  <span className="ml-2">Video</span>
                </Button>
                <Button
                  onClick={handleToggleMute}
                  size="sm"
                  variant={isMuted ? "outline" : "default"}
                >
                  {isMuted ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  <span className="ml-2">Audio</span>
                </Button>
                <Button
                  onClick={handleToggleScreenShare}
                  size="sm"
                  variant={isScreenSharing ? "default" : "outline"}
                >
                  {isScreenSharing ? (
                    <ScreenShareOff className="h-4 w-4" />
                  ) : (
                    <ScreenShare className="h-4 w-4" />
                  )}
                  <span className="ml-2">Share</span>
                </Button>
                <Button
                  onClick={handleToggleRecording}
                  size="sm"
                  variant={isRecording ? "destructive" : "outline"}
                >
                  <Video className="h-4 w-4" />
                  <span className="ml-2">Record</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      className="flex items-center gap-3 rounded-lg bg-muted/30 p-3"
                      key={participant.id}
                    >
                      <div className="relative">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <span className="font-medium text-xs">
                            {participant.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        {participant.isOnline && (
                          <div className="-bottom-1 -right-1 absolute h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-sm">
                            {participant.name}
                          </p>
                          {getRoleIcon(participant.role)}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {participant.email}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {participant.isOnline
                            ? "Online"
                            : `Last seen ${formatDistanceToNow(participant.lastSeen)} ago`}
                        </p>
                      </div>

                      <Badge
                        className="text-xs"
                        variant={getRoleBadgeVariant(participant.role)}
                      >
                        {participant.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="mb-4 h-48">
                <div className="space-y-3">
                  {chatMessages.map((message) => (
                    <div
                      className={cn(
                        "flex gap-2",
                        message.type === "system" && "justify-center"
                      )}
                      key={message.id}
                    >
                      {message.type !== "system" && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                          <span className="font-medium text-xs">
                            {message.userId.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div
                        className={cn(
                          "min-w-0 flex-1",
                          message.type === "system" && "text-center"
                        )}
                      >
                        {message.type === "system" ? (
                          <p className="text-muted-foreground text-xs italic">
                            {message.message}
                          </p>
                        ) : (
                          <>
                            <div className="mb-1 flex items-center gap-2">
                              <p className="font-medium text-xs">
                                {message.userId}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatDistanceToNow(
                                  new Date(message.timestamp)
                                )}{" "}
                                ago
                              </p>
                            </div>
                            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                              {message.message}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input className="flex-1" placeholder="Type a message..." />
                <Button size="sm">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog onOpenChange={setShowInviteDialog} open={showInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Participant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="participant@example.com"
                type="email"
                value={inviteEmail}
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select
                onValueChange={(value: "viewer" | "editor") =>
                  setInviteRole(value)
                }
                value={inviteRole}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    Viewer - Can view and comment
                  </SelectItem>
                  <SelectItem value="editor">
                    Editor - Can edit and collaborate
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowInviteDialog(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={!inviteEmail} onClick={handleInviteParticipant}>
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
