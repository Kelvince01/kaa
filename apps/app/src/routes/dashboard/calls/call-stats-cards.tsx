"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Calendar, Clock, Video, VideoOff } from "lucide-react";
import type { IVideoCall } from "@/modules/comms/video-calling";
import { formatCallDuration } from "@/modules/comms/video-calling";

type CallStatsCardsProps = {
  calls: IVideoCall[];
};

export const CallStatsCards = ({ calls }: CallStatsCardsProps) => {
  const totalCalls = calls.length;
  const activeCalls = calls.filter(
    (call) => call.status === "connected"
  ).length;
  const scheduledCalls = calls.filter(
    (call) => call.scheduledAt && new Date(call.scheduledAt) > new Date()
  ).length;

  const totalDuration = calls.reduce((acc, call) => {
    if (call.startedAt && call.endedAt) {
      return (
        acc +
        (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime())
      );
    }
    return acc;
  }, 0);

  const stats = [
    {
      title: "Total Calls",
      value: totalCalls,
      icon: Video,
      description: "All time",
    },
    {
      title: "Active Now",
      value: activeCalls,
      icon: VideoOff,
      description: "Currently in progress",
    },
    {
      title: "Scheduled",
      value: scheduledCalls,
      icon: Calendar,
      description: "Upcoming calls",
    },
    {
      title: "Total Duration",
      value: formatCallDuration(totalDuration),
      icon: Clock,
      description: "All calls combined",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stat.value}</div>
            <p className="text-muted-foreground text-xs">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
