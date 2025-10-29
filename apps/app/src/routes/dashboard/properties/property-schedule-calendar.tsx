"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { Textarea } from "@kaa/ui/components/textarea";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  type SchedulePriority,
  type ScheduleStatus,
  type ScheduleType,
  useCreateSchedule,
  useDeleteSchedule,
  useSchedules,
  useSchedulesByUser,
  useUpdateSchedule,
} from "@/modules/properties/scheduling";

type PropertyScheduleCalendarProps = {
  propertyId: string;
  userId: string;
};

type ScheduleFormData = {
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  priority: string;
  status?: string;
};

export const PropertyScheduleCalendar: React.FC<
  PropertyScheduleCalendarProps
> = ({ propertyId, userId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: "",
    description: "",
    type: "",
    startDate: "",
    endDate: "",
    priority: "medium",
  });

  const startDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  );
  const endDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  );

  const {
    data: schedulesData,
    isLoading,
    error,
    refetch,
  } = useSchedules({
    property: propertyId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const { data: userSchedulesData } = useSchedulesByUser(userId);

  const { mutate: createSchedule, isPending: creating } = useCreateSchedule();
  const { mutate: updateSchedule, isPending: updating } = useUpdateSchedule();
  const { mutate: deleteSchedule, isPending: deleting } = useDeleteSchedule();

  const schedules = schedulesData?.data?.schedules || [];
  const userSchedules = userSchedulesData?.data?.schedules || [];

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    createSchedule(
      {
        ...formData,
        type: formData.type as ScheduleType,
        priority: formData.priority as SchedulePriority,
        property: propertyId,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      },
      {
        onSuccess: () => {
          setShowCreateForm(false);
          setFormData({
            title: "",
            description: "",
            type: "",
            startDate: "",
            endDate: "",
            priority: "medium",
          });
          refetch();
        },
      }
    );
  };

  const handleUpdateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    updateSchedule(
      {
        id: editingSchedule._id,
        data: {
          ...formData,
          type: formData.type as ScheduleType,
          priority: formData.priority as SchedulePriority,
          status: formData.status as ScheduleStatus,
          startDate: formData.startDate
            ? new Date(formData.startDate).toISOString()
            : undefined,
          endDate: formData.endDate
            ? new Date(formData.endDate).toISOString()
            : undefined,
        },
      },
      {
        onSuccess: () => {
          setEditingSchedule(null);
          setFormData({
            title: "",
            description: "",
            type: "",
            startDate: "",
            endDate: "",
            priority: "medium",
          });
          refetch();
        },
      }
    );
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    // biome-ignore lint/suspicious/noAlert: user confirmation needed
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteSchedule(scheduleId, {
        onSuccess: () => {
          setEditingSchedule(null);
          refetch();
        },
      });
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getSchedulesForDate = (date: Date) =>
    schedules?.filter((schedule) => {
      const scheduleDate = new Date(schedule.startDate);
      return (
        scheduleDate.getDate() === date.getDate() &&
        scheduleDate.getMonth() === date.getMonth() &&
        scheduleDate.getFullYear() === date.getFullYear()
      );
    });

  const openEditDialog = (schedule: any) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      description: schedule.description || "",
      type: schedule.type,
      startDate: new Date(schedule.startDate).toISOString().slice(0, 16),
      endDate: new Date(schedule.endDate).toISOString().slice(0, 16),
      priority: schedule.priority || "medium",
      status: schedule.status,
    });
  };

  const days = getDaysInMonth(selectedDate);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load schedule. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">
            Property Schedule
          </h2>
          <p className="text-muted-foreground">
            Manage appointments, maintenance, and viewings
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  setSelectedDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth() - 1,
                      1
                    )
                  )
                }
                size="icon"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() =>
                  setSelectedDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth() + 1,
                      1
                    )
                  )
                }
                size="icon"
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="mb-2 grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                className="p-2 text-center font-medium text-muted-foreground text-sm"
                key={day}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => (
              <div
                className={`min-h-[100px] rounded-lg border p-2 ${
                  day ? "bg-card hover:bg-accent/50" : "bg-muted/20"
                }`}
                key={day ? day.toISOString() : `empty-${index}`}
              >
                {day && (
                  <>
                    <div className="mb-1 font-medium text-sm">
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {getSchedulesForDate(day)
                        .slice(0, 2)
                        .map((schedule) => (
                          <button
                            className={`w-full cursor-pointer truncate rounded p-1 text-left text-xs transition-colors ${
                              schedule.type === "maintenance"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : schedule.type === "inspection"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                  : schedule.type === "viewing"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                            key={schedule._id}
                            onClick={() => openEditDialog(schedule)}
                            title={schedule.title}
                            type="button"
                          >
                            {schedule.title}
                          </button>
                        ))}
                      {getSchedulesForDate(day).length > 2 && (
                        <div className="p-1 text-muted-foreground text-xs">
                          +{getSchedulesForDate(day).length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User's Upcoming Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Your Upcoming Schedules</CardTitle>
          <CardDescription>Quick view of your scheduled items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userSchedules.slice(0, 5).map((schedule) => (
              <div
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                key={schedule._id}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{schedule.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(schedule.startDate).toLocaleDateString()} at{" "}
                    {new Date(schedule.startDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge
                  variant={
                    schedule.status === "confirmed"
                      ? "default"
                      : schedule.status === "in_progress"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {schedule.status}
                </Badge>
              </div>
            ))}
            {userSchedules.length === 0 && (
              <p className="py-8 text-center text-muted-foreground text-sm">
                No upcoming schedules
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Schedule Dialog */}
      <Dialog onOpenChange={setShowCreateForm} open={showCreateForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Add a new schedule item for this property
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSchedule}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  value={formData.title}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                  value={formData.type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="viewing">Property Showing</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input
                    id="startDate"
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                    type="datetime-local"
                    value={formData.startDate}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                    type="datetime-local"
                    value={formData.endDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  value={formData.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                  value={formData.priority}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowCreateForm(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={creating} type="submit">
                {creating ? "Creating..." : "Create Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog
        onOpenChange={() => setEditingSchedule(null)}
        open={!!editingSchedule}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update schedule details or delete this item
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSchedule}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  value={formData.title}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                  value={formData.status}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date & Time</Label>
                  <Input
                    id="edit-startDate"
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                    type="datetime-local"
                    value={formData.startDate}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date & Time</Label>
                  <Input
                    id="edit-endDate"
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                    type="datetime-local"
                    value={formData.endDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  value={formData.description}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                disabled={deleting}
                onClick={() =>
                  editingSchedule && handleDeleteSchedule(editingSchedule._id)
                }
                type="button"
                variant="destructive"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
              <div className="flex-1" />
              <Button
                onClick={() => setEditingSchedule(null)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={updating} type="submit">
                {updating ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
