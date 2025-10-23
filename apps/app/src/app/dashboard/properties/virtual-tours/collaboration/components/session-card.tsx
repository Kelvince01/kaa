/**
 * Session Card Component
 * Displays collaboration session information in a card format
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
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  Edit3,
  Eye,
  MessageSquare,
  MoreVertical,
  Play,
  Share2,
  StopCircle,
  Users,
  Video,
} from "lucide-react";
import type React from "react";

type SessionCardProps = {
  session: {
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
  onJoin?: (sessionId: string) => void;
  onShare?: (sessionId: string) => void;
  onEnd?: (sessionId: string) => void;
  onEdit?: (sessionId: string) => void;
  className?: string;
};

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onJoin,
  onShare,
  onEnd,
  onEdit,
  className,
}) => {
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

  const isActive = session.status === "active";
  const isScheduled = session.status === "scheduled";
  const isEnded = session.status === "ended";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-md",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-lg">
              {session.tourTitle}
            </CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(session.status)}>
                {getStatusIcon(session.status)}
                <span className="ml-1 capitalize">{session.status}</span>
              </Badge>
              <span className="text-muted-foreground text-xs">
                {isScheduled && session.scheduledFor
                  ? `Scheduled for ${formatDistanceToNow(session.scheduledFor)}`
                  : `${formatDistanceToNow(session.startedAt)} ago`}
              </span>
            </div>
          </div>
          <Button size="sm" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Participants */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {session.participants}/{session.maxParticipants} participants
            </span>
          </div>
          <div className="flex items-center gap-1">
            {session.settings.allowVideo && (
              <Video
                aria-label="Video enabled"
                className="h-3 w-3 text-green-500"
              />
            )}
            {session.settings.allowAudio && (
              <MessageSquare
                aria-label="Audio enabled"
                className="h-3 w-3 text-blue-500"
              />
            )}
            {session.settings.recordingEnabled && (
              <div
                // aria-label="Recording enabled"
                className="h-3 w-3 rounded-full bg-red-500"
              />
            )}
          </div>
        </div>

        {/* Session Features */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Screen Share</span>
            {session.settings.allowScreenShare ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-gray-400" />
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Annotations</span>
            {session.settings.allowAnnotations ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-gray-400" />
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Approval Required</span>
            {session.settings.requireApproval ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-gray-400" />
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          {isActive && (
            <Button
              className="flex-1"
              onClick={() => onJoin?.(session.id)}
              size="sm"
            >
              <Play className="mr-1 h-3 w-3" />
              Join
            </Button>
          )}
          {isScheduled && (
            <Button
              className="flex-1"
              onClick={() => onEdit?.(session.id)}
              size="sm"
              variant="outline"
            >
              <Edit3 className="mr-1 h-3 w-3" />
              Edit
            </Button>
          )}
          {!isEnded && (
            <Button
              aria-label="Copy share link"
              onClick={() => onShare?.(session.id)}
              size="sm"
              variant="outline"
            >
              <Share2 className="h-3 w-3" />
            </Button>
          )}
          {isActive && (
            <Button
              aria-label="End session"
              onClick={() => onEnd?.(session.id)}
              size="sm"
              variant="outline"
            >
              <StopCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
