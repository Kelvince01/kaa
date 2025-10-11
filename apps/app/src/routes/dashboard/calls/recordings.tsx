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
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  ArrowLeft,
  Calendar,
  Download,
  Play,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  formatCallDuration,
  type ICallRecording,
  useDeleteRecording,
  useUserRecordings,
} from "@/modules/comms/video-calling";

export default function Recordings() {
  const { data: recordingsData, isLoading } = useUserRecordings();
  const { mutateAsync: deleteRecording } = useDeleteRecording();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const allRecordings = recordingsData?.recordings || [];

  // Filter recordings
  const filteredRecordings = allRecordings.filter(
    (recording: ICallRecording) => {
      const matchesSearch =
        recording.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recording.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Note: ICallRecording doesn't have callType, so we can't filter by type
      // unless we fetch the call data separately or the backend includes it
      const matchesType = filterType === "all";

      return matchesSearch && matchesType;
    }
  );

  const handleDeleteRecording = async (recordingId: string) => {
    // biome-ignore lint/suspicious/noAlert: ingore
    if (confirm("Are you sure you want to delete this recording?")) {
      await deleteRecording(recordingId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/calls">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Call Recordings</h1>
          <p className="text-muted-foreground">
            View and manage all your call recordings
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter your recordings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recordings..."
                value={searchQuery}
              />
            </div>
            <Select onValueChange={setFilterType} value={filterType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="property_tour">Property Tours</SelectItem>
                <SelectItem value="tenant_meeting">Tenant Meetings</SelectItem>
                <SelectItem value="maintenance_call">
                  Maintenance Calls
                </SelectItem>
                <SelectItem value="general">General Calls</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recordings List */}
      <Card>
        <CardHeader>
          <CardTitle>Recordings</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading recordings..."
              : `${filteredRecordings.length} recording${
                  filteredRecordings.length !== 1 ? "s" : ""
                } found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-primary border-t-2 border-b-2" />
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">
                No Recordings Found
              </h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your filters"
                  : "Start recording your calls to see them here"}
              </p>
              <Link href="/dashboard/calls/new">
                <Button>
                  <Video className="mr-2 h-4 w-4" />
                  Create Call
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecordings.map((recording) => (
                <div
                  className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-accent md:flex-row md:items-center md:justify-between"
                  key={recording.id}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{recording.filename}</h3>
                      <Badge variant="outline">{recording.status}</Badge>
                      <Badge className="capitalize" variant="secondary">
                        {recording.quality}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(recording.createdAt).toLocaleDateString()}
                      </div>

                      {recording.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          {formatCallDuration(recording.duration * 1000)}
                        </div>
                      )}

                      {recording.fileSize > 0 && (
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
