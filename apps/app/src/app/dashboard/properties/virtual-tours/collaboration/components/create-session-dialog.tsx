/**
 * Create Session Dialog Component
 * Modal for creating new collaboration sessions
 */

"use client";

import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { VirtualTour } from "@/modules/virtual-tours/virtual-tour.type";

type CreateSessionDialogProps = {
  tours: VirtualTour[];
  onCreate: (sessionData: {
    tourId: string;
    title: string;
    maxParticipants: number;
    scheduledFor?: Date;
    allowVideo: boolean;
    allowAudio: boolean;
    allowScreenShare: boolean;
    allowAnnotations: boolean;
    recordingEnabled: boolean;
    requireApproval: boolean;
  }) => void;
  children?: React.ReactNode;
};

export const CreateSessionDialog: React.FC<CreateSessionDialogProps> = ({
  tours,
  onCreate,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [sessionData, setSessionData] = useState({
    tourId: "",
    title: "",
    maxParticipants: 10,
    scheduledFor: undefined as Date | undefined,
    allowVideo: true,
    allowAudio: true,
    allowScreenShare: true,
    allowAnnotations: true,
    recordingEnabled: false,
    requireApproval: false,
  });

  const handleSubmit = () => {
    if (!sessionData.tourId) return;

    onCreate(sessionData);
    setOpen(false);
    setSessionData({
      tourId: "",
      title: "",
      maxParticipants: 10,
      scheduledFor: undefined,
      allowVideo: true,
      allowAudio: true,
      allowScreenShare: true,
      allowAnnotations: true,
      recordingEnabled: false,
      requireApproval: false,
    });
  };

  const selectedTour = tours.find((tour) => tour.id === sessionData.tourId);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Collaboration Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Tour Selection */}
          <div className="space-y-2">
            <Label htmlFor="tour-select">Select Tour</Label>
            <Select
              onValueChange={(value) => {
                const tour = tours.find((t) => t.id === value);
                setSessionData((prev) => ({
                  ...prev,
                  tourId: value,
                  title: tour?.title || "",
                }));
              }}
              value={sessionData.tourId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a tour..." />
              </SelectTrigger>
              <SelectContent>
                {tours.map((tour) => (
                  <SelectItem key={tour.id} value={tour.id}>
                    <div className="flex flex-col">
                      <span>{tour.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {tour.type} • {tour.status}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTour && (
              <p className="text-muted-foreground text-sm">
                {selectedTour.description}
              </p>
            )}
          </div>

          {/* Session Title */}
          <div className="space-y-2">
            <Label htmlFor="session-title">Session Title</Label>
            <Input
              id="session-title"
              onChange={(e) =>
                setSessionData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter session title..."
              value={sessionData.title}
            />
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <Label htmlFor="max-participants">Maximum Participants</Label>
            <Input
              id="max-participants"
              max="50"
              min="1"
              onChange={(e) =>
                setSessionData((prev) => ({
                  ...prev,
                  maxParticipants: Number.parseInt(e.target.value, 10) || 10,
                }))
              }
              type="number"
              value={sessionData.maxParticipants}
            />
          </div>

          {/* Schedule (Optional) */}
          <div className="space-y-2">
            <Label>Schedule Session (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !sessionData.scheduledFor && "text-muted-foreground"
                  )}
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionData.scheduledFor ? (
                    format(sessionData.scheduledFor, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  disabled={(date) => date < new Date()}
                  initialFocus
                  mode="single"
                  onSelect={(date) =>
                    setSessionData((prev) => ({ ...prev, scheduledFor: date }))
                  }
                  selected={sessionData.scheduledFor}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Session Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Session Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  checked={sessionData.allowVideo}
                  className="rounded border-gray-300"
                  id="allow-video"
                  onChange={(e) =>
                    setSessionData((prev) => ({
                      ...prev,
                      allowVideo: e.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <Label className="text-sm" htmlFor="allow-video">
                  Allow Video
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  checked={sessionData.allowAudio}
                  className="rounded border-gray-300"
                  id="allow-audio"
                  onChange={(e) =>
                    setSessionData((prev) => ({
                      ...prev,
                      allowAudio: e.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <Label className="text-sm" htmlFor="allow-audio">
                  Allow Audio
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  checked={sessionData.allowScreenShare}
                  className="rounded border-gray-300"
                  id="allow-screen-share"
                  onChange={(e) =>
                    setSessionData((prev) => ({
                      ...prev,
                      allowScreenShare: e.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <Label className="text-sm" htmlFor="allow-screen-share">
                  Screen Share
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  checked={sessionData.allowAnnotations}
                  className="rounded border-gray-300"
                  id="allow-annotations"
                  onChange={(e) =>
                    setSessionData((prev) => ({
                      ...prev,
                      allowAnnotations: e.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <Label className="text-sm" htmlFor="allow-annotations">
                  Annotations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  checked={sessionData.recordingEnabled}
                  className="rounded border-gray-300"
                  id="recording-enabled"
                  onChange={(e) =>
                    setSessionData((prev) => ({
                      ...prev,
                      recordingEnabled: e.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <Label className="text-sm" htmlFor="recording-enabled">
                  Recording
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  checked={sessionData.requireApproval}
                  className="rounded border-gray-300"
                  id="require-approval"
                  onChange={(e) =>
                    setSessionData((prev) => ({
                      ...prev,
                      requireApproval: e.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <Label className="text-sm" htmlFor="require-approval">
                  Require Approval
                </Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={!sessionData.tourId} onClick={handleSubmit}>
              Create Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSessionDialog;
