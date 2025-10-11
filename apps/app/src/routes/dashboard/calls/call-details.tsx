"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Play,
  Trash2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatCallDuration,
  getCallStatusColor,
  useCall,
  useCallRecordings,
  useDeleteRecording,
} from "@/modules/comms/video-calling";

type CallDetailsProps = {
  callId: string;
};

export default function CallDetails({ callId }: CallDetailsProps) {
  const router = useRouter();
  const { data: call, isLoading: isLoadingCall } = useCall(callId);
  const { data: recordings, isLoading: isLoadingRecordings } =
    useCallRecordings(callId);
  const { mutateAsync: deleteRecording } = useDeleteRecording();

  const handleDeleteRecording = async (recordingId: string) => {
    // biome-ignore lint/suspicious/noAlert: ignore
    if (confirm("Are you sure you want to delete this recording?")) {
      await deleteRecording(recordingId);
    }
  };

  if (isLoadingCall) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-primary border-t-2 border-b-2" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Video className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 font-semibold text-2xl">Call Not Found</h2>
        <p className="mb-4 text-muted-foreground">
          This call doesn't exist or you don't have access to it
        </p>
        <Link href="/dashboard/calls">
          <Button>Back to Calls</Button>
        </Link>
      </div>
    );
  }

  const duration =
    call.data.startedAt && call.data.endedAt
      ? new Date(call.data.endedAt).getTime() -
        new Date(call.data.startedAt).getTime()
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/calls">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-3xl tracking-tight">
              {call.data.title}
            </h1>
            <Badge
              className={getCallStatusColor(call.data.status)}
              variant="outline"
            >
              {call.data.status}
            </Badge>
          </div>
          {call.data.description && (
            <p className="text-muted-foreground">{call.data.description}</p>
          )}
        </div>
        {call.data.status === "connected" && (
          <Link href={`/dashboard/calls/${callId}`}>
            <Button size="lg">
              <Video className="mr-2 h-5 w-5" />
              Join Call
            </Button>
          </Link>
        )}
      </div>

      {/* Call Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Type</span>
              <span className="font-medium capitalize">
                {call.data.type.replace("_", " ")}
              </span>
            </div>

            {call.data.scheduledAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Scheduled</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {new Date(call.data.scheduledAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {duration > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Duration</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    {formatCallDuration(duration)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Max Participants
              </span>
              <span className="font-medium">{call.data.maxParticipants}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Recording</span>
              <Badge variant={call.data.isRecorded ? "default" : "secondary"}>
                {call.data.isRecorded ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              {call.data.participants.length} participant
              {call.data.participants.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {call.data.participants.map((participant) => (
                <div
                  className="flex items-center justify-between"
                  key={participant.id}
                >
                  <div className="flex items-center gap-3">
                    {participant.avatar ? (
                      // biome-ignore lint/nursery/useImageSize: ignore
                      // biome-ignore lint/performance/noImgElement: ignore
                      <img
                        alt={participant.displayName}
                        className="h-8 w-8 rounded-full"
                        src={participant.avatar}
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {participant.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {participant.displayName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {participant.role}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{participant.connectionState}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recordings */}
      <Card>
        <CardHeader>
          <CardTitle>Recordings</CardTitle>
          <CardDescription>
            {isLoadingRecordings
              ? "Loading recordings..."
              : `${recordings?.recordings?.length || 0} recording${
                  recordings?.recordings?.length !== 1 ? "s" : ""
                }`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecordings ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2" />
            </div>
          ) : recordings?.recordings?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Video className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No recordings available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recordings?.recordings?.map((recording) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={recording.id}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">
                        Recording {recording.id.slice(0, 8)}
                      </h4>
                      <Badge variant="outline">{recording.status}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-muted-foreground text-sm">
                      <span>
                        {/* stratedAt */}
                        {new Date(recording.createdAt).toLocaleString()}
                      </span>
                      {recording.duration && (
                        <span>
                          {formatCallDuration(recording.duration * 1000)}
                        </span>
                      )}
                      {recording.fileSize && (
                        <span>
                          {(recording.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {recording.streamUrl && (
                      <>
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={recording.streamUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Play
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <a download href={recording.downloadUrl}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => handleDeleteRecording(recording.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
