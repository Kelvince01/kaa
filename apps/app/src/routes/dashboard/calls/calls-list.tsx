"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar, Clock, Info, Users, Video } from "lucide-react";
import Link from "next/link";
import type { IVideoCall } from "@/modules/comms/video-calling";
import {
  formatCallDuration,
  getCallStatusColor,
} from "@/modules/comms/video-calling";

type CallsListProps = {
  calls: IVideoCall[];
  emptyMessage?: string;
  showJoinButton?: boolean;
  showDetailsButton?: boolean;
};

export const CallsList = ({
  calls,
  emptyMessage = "No calls found",
  showJoinButton = false,
  showDetailsButton = false,
}: CallsListProps) => {
  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Video className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <div
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
          key={call._id}
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{call.title}</h3>
              <Badge
                className={getCallStatusColor(call.status)}
                variant="outline"
              >
                {call.status}
              </Badge>
            </div>

            {call.description && (
              <p className="text-muted-foreground text-sm">
                {call.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              {call.scheduledAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(call.scheduledAt).toLocaleDateString()}
                </div>
              )}

              {call.startedAt && call.endedAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatCallDuration(
                    new Date(call.endedAt).getTime() -
                      new Date(call.startedAt).getTime()
                  )}
                </div>
              )}

              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {call.participants.length} participant
                {call.participants.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showJoinButton && call.status === "connected" && (
              <Link href={`/dashboard/calls/${call._id}`}>
                <Button>
                  <Video className="mr-2 h-4 w-4" />
                  Join
                </Button>
              </Link>
            )}

            {showDetailsButton && (
              <Link href={`/dashboard/calls/${call._id}/details`}>
                <Button variant="outline">
                  <Info className="mr-2 h-4 w-4" />
                  Details
                </Button>
              </Link>
            )}

            {!(showJoinButton || showDetailsButton) && (
              <Link href={`/dashboard/calls/${call._id}`}>
                <Button variant="outline">View</Button>
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
