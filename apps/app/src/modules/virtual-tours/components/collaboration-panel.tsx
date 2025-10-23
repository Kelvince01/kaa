/**
 * Collaboration Panel Component
 * Handles real-time collaboration features for virtual tours
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
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
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Separator } from "@kaa/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import { cn } from "@kaa/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Crown,
  Edit3,
  Eye,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  // Record,
  StopCircle,
  UserPlus,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { CollaborationClient } from "@/lib/collaboration";
import { useVirtualTourStore } from "../virtual-tour.store";
import type {
  ChatMessage,
  LiveAnnotation,
  Participant,
} from "../virtual-tour.type";

type CollaborationPanelProps = {
  tourId: string;
  isHost?: boolean;
  className?: string;
  onAnnotationAdd?: (annotation: LiveAnnotation) => void;
};

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  tourId,
  isHost = false,
  className,
  onAnnotationAdd,
}) => {
  const [chatInput, setChatInput] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const listenersSetupRef = useRef(false);

  // Store state - use selective subscriptions to prevent unnecessary re-renders
  const collaborationSession = useVirtualTourStore(
    useShallow((state) => state.collaborationSession)
  );
  const isCollaborating = useVirtualTourStore(
    useShallow((state) => state.isCollaborating)
  );
  const participants = useVirtualTourStore(
    useShallow((state) => state.participants)
  );
  const chatMessages = useVirtualTourStore(
    useShallow((state) => state.chatMessages)
  );
  const liveAnnotations = useVirtualTourStore(
    useShallow((state) => state.liveAnnotations)
  );
  const addChatMessage = useVirtualTourStore(
    useShallow((state) => state.addChatMessage)
  );
  const addLiveAnnotation = useVirtualTourStore(
    useShallow((state) => state.addLiveAnnotation)
  );
  const setIsCollaborating = useVirtualTourStore(
    useShallow((state) => state.setIsCollaborating)
  );
  const setParticipants = useVirtualTourStore(
    useShallow((state) => state.setParticipants)
  );

  // Memoize event handlers to prevent unnecessary re-renders
  const handleParticipantJoined = useCallback(
    (participant: Participant) => {
      // @ts-expect-error
      setParticipants((prevParticipants: Participant[]) => {
        // Check if participant already exists to avoid duplicates
        const exists = prevParticipants.some(
          (p: Participant) => p.id === participant.id
        );
        if (exists) return prevParticipants;

        const updatedParticipants = [...prevParticipants, participant];

        // Add system message
        addChatMessage({
          id: `system-${Date.now()}`,
          userId: "system",
          message: `${participant.userId} joined the session`,
          timestamp: new Date(),
          type: "system",
        });

        return updatedParticipants;
      });
    },
    [setParticipants, addChatMessage]
  );

  const handleParticipantLeft = useCallback(
    (participant: Participant) => {
      // @ts-expect-error
      setParticipants((prevParticipants: Participant[]) => {
        // Check if participant exists before removal
        const exists = prevParticipants.some(
          (p: Participant) => p.id === participant.id
        );
        if (!exists) {
          return prevParticipants;
        }

        const updatedParticipants = prevParticipants.filter(
          (p: Participant) => p.id !== participant.id
        );

        // Add system message only if participant was present
        addChatMessage({
          id: `system-${Date.now()}`,
          userId: "system",
          message: `${participant.userId} left the session`,
          timestamp: new Date(),
          type: "system",
        });

        return updatedParticipants;
      });
    },
    [setParticipants, addChatMessage]
  );

  const handleChatMessage = useCallback(
    (message: ChatMessage) => {
      addChatMessage(message);
    },
    [addChatMessage]
  );

  const handleAnnotationAdded = useCallback(
    (annotation: LiveAnnotation) => {
      addLiveAnnotation(annotation);
      onAnnotationAdd?.(annotation);
    },
    [addLiveAnnotation, onAnnotationAdd]
  );

  const handleRemoteStream = useCallback(
    (data: { participantId: string; stream: MediaStream }) => {
      // Handle remote video stream
      console.log("Remote stream received:", data);
    },
    []
  );

  // Initialize collaboration client event listeners
  useEffect(() => {
    if (
      !(isCollaborating && CollaborationClient) ||
      listenersSetupRef.current
    ) {
      return;
    }

    console.log("Setting up collaboration event listeners");

    // Mark listeners as setup
    listenersSetupRef.current = true;

    // Add event listeners
    CollaborationClient.on("participant-joined", handleParticipantJoined);
    CollaborationClient.on("participant-left", handleParticipantLeft);
    CollaborationClient.on("chat-message", handleChatMessage);
    CollaborationClient.on("annotation-added", handleAnnotationAdded);
    CollaborationClient.on("remote-stream", handleRemoteStream);

    // Cleanup
    return () => {
      console.log("Cleaning up collaboration event listeners");
      listenersSetupRef.current = false;
      CollaborationClient.off("participant-joined", handleParticipantJoined);
      CollaborationClient.off("participant-left", handleParticipantLeft);
      CollaborationClient.off("chat-message", handleChatMessage);
      CollaborationClient.off("annotation-added", handleAnnotationAdded);
      CollaborationClient.off("remote-stream", handleRemoteStream);
    };
  }, [
    isCollaborating,
    handleParticipantJoined,
    handleParticipantLeft,
    handleChatMessage,
    handleAnnotationAdded,
    handleRemoteStream,
  ]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, []);

  const handleSendMessage = () => {
    if (!(chatInput.trim() && isCollaborating)) return;

    CollaborationClient.sendChatMessage(chatInput);
    setChatInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      // Stop video
      setIsVideoEnabled(false);
    } else {
      // Start video for all participants
      const participants = CollaborationClient.getParticipants();
      for (const participant of participants) {
        await CollaborationClient.startVideoCall(participant.id);
      }
      setIsVideoEnabled(true);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "host":
        return <Crown className="h-3 w-3" />;
      case "editor":
        return <Edit3 className="h-3 w-3" />;
      case "viewer":
        return <Eye className="h-3 w-3" />;
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

  if (!isCollaborating) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold">Real-time Collaboration</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            Start a collaboration session to work together on this tour
          </p>
          <Button className="w-full" onClick={() => setIsCollaborating(true)}>
            <Users className="mr-2 h-4 w-4" />
            Start Collaboration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={cn("flex h-full flex-col", className)}>
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Collaboration
              <Badge className="ml-2" variant="outline">
                {participants.length} participants
              </Badge>
            </CardTitle>

            <div className="flex items-center gap-1">
              {/* Recording Indicator */}
              {isRecording && (
                <Badge className="animate-pulse" variant="destructive">
                  <Video className="mr-1 h-3 w-3" />
                  REC
                </Badge>
              )}

              {/* Video Controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={cn(
                      isVideoEnabled
                        ? "bg-blue-500 text-white"
                        : "text-muted-foreground"
                    )}
                    onClick={toggleVideo}
                    size="sm"
                    variant="ghost"
                  >
                    {isVideoEnabled ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <VideoOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isVideoEnabled ? "Turn off video" : "Turn on video"}
                </TooltipContent>
              </Tooltip>

              {/* Audio Controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={cn(
                      isAudioEnabled
                        ? "bg-green-500 text-white"
                        : "text-muted-foreground"
                    )}
                    onClick={toggleAudio}
                    size="sm"
                    variant="ghost"
                  >
                    {isAudioEnabled ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <MicOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
                </TooltipContent>
              </Tooltip>

              {/* Recording Controls (Host only) */}
              {isHost && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className={cn(
                        isRecording
                          ? "bg-red-500 text-white"
                          : "text-muted-foreground"
                      )}
                      onClick={toggleRecording}
                      size="sm"
                      variant="ghost"
                    >
                      {isRecording ? (
                        <StopCircle className="h-4 w-4" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? "Stop recording" : "Start recording"}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Invite Participants (Host only) */}
              {isHost && (
                <Dialog
                  onOpenChange={setShowInviteDialog}
                  open={showInviteDialog}
                >
                  <DialogTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Invite participants</TooltipContent>
                    </Tooltip>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Participants</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label
                          className="font-medium text-sm"
                          htmlFor="share-link"
                        >
                          Share Link
                        </label>
                        <div className="mt-1 flex gap-2">
                          <Input
                            className="flex-1"
                            readOnly
                            value={`${window.location.origin}/tours/${tourId}/collaborate`}
                          />
                          <Button
                            onClick={() => {
                              navigator.clipboard
                                .writeText(
                                  `${window.location.origin}/tours/$ {tourId}/collaborate`
                                )
                                .then((_) => null);
                            }}
                            size="sm"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Participants List */}
        <div className="px-4 pb-3">
          <h4 className="mb-2 font-medium text-sm">Participants</h4>
          <div className="space-y-2">
            {participants.map((participant: Participant) => (
              <div
                className="flex items-center gap-3 rounded-lg bg-muted/30 p-2"
                key={participant.id}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`/api/users/${participant.userId}/avatar`}
                  />
                  <AvatarFallback className="text-xs">
                    {participant.userId.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {participant.userId}
                  </p>
                  <div className="flex items-center gap-1">
                    <Badge
                      className="text-xs"
                      variant={getRoleBadgeVariant(participant.role)}
                    >
                      {getRoleIcon(participant.role)}
                      <span className="ml-1 capitalize">
                        {participant.role}
                      </span>
                    </Badge>
                  </div>
                </div>

                {/* Participant Status */}
                <div className="flex items-center gap-1">
                  {isAudioEnabled && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                  {isVideoEnabled && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Chat Section */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 py-3">
            <h4 className="flex items-center gap-2 font-medium text-sm">
              <MessageSquare className="h-4 w-4" />
              Chat
            </h4>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 px-4" ref={chatScrollRef}>
            <div className="space-y-3 pb-4">
              {chatMessages.map((message: ChatMessage) => (
                <div
                  className={cn(
                    "flex gap-2",
                    message.type === "system" && "justify-center"
                  )}
                  key={message.id}
                >
                  {message.type !== "system" && (
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-xs">
                        {message.userId.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
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
                            {formatDistanceToNow(new Date(message.timestamp))}{" "}
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

              {/* Live Annotations */}
              {liveAnnotations.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h5 className="font-medium text-muted-foreground text-xs">
                      Live Annotations
                    </h5>
                    {liveAnnotations
                      .slice(-3)
                      .map((annotation: LiveAnnotation) => (
                        <div
                          className="rounded-lg border border-yellow-200 bg-yellow-50 p-2"
                          key={annotation.id}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-yellow-500" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs">
                                {annotation.userId}
                              </p>
                              <p className="text-sm">{annotation.content}</p>
                              <p className="text-muted-foreground text-xs">
                                Scene: {annotation.sceneId} •{" "}
                                {formatDistanceToNow(
                                  new Date(annotation.timestamp)
                                )}{" "}
                                ago
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                className="flex-1"
                disabled={!isCollaborating}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                value={chatInput}
              />
              <Button
                disabled={!(chatInput.trim() && isCollaborating)}
                onClick={handleSendMessage}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Collaboration Controls */}
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-muted-foreground text-xs">Live</span>
              </div>

              {/* Connection Status */}
              <Badge className="text-xs" variant="outline">
                {CollaborationClient.getConnectionHealth().status}
              </Badge>
            </div>

            {/* Leave Session */}
            <Button
              className="text-red-600 hover:bg-red-50"
              onClick={() => {
                CollaborationClient.leaveSession();
                setIsCollaborating(false);
              }}
              size="sm"
              variant="ghost"
            >
              <PhoneOff className="mr-1 h-4 w-4" />
              Leave
            </Button>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default CollaborationPanel;
