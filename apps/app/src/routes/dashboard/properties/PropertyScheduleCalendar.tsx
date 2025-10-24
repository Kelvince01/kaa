import type React from "react";
import { useState } from "react";
import {
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

export const PropertyScheduleCalendar: React.FC<
  PropertyScheduleCalendarProps
> = ({ propertyId, userId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

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

  const handleCreateSchedule = (scheduleData: any) => {
    createSchedule(
      {
        ...scheduleData,
        property: propertyId,
        startDate: new Date(scheduleData.startDate).toISOString(),
        endDate: new Date(scheduleData.endDate).toISOString(),
      },
      {
        onSuccess: () => {
          setShowCreateForm(false);
          refetch();
        },
      }
    );
  };

  const handleUpdateSchedule = (scheduleId: string, updates: any) => {
    updateSchedule(
      {
        id: scheduleId,
        ...updates,
        startDate: updates.startDate
          ? new Date(updates.startDate).toISOString()
          : undefined,
        endDate: updates.endDate
          ? new Date(updates.endDate).toISOString()
          : undefined,
      },
      {
        onSuccess: () => {
          setEditingSchedule(null);
          refetch();
        },
      }
    );
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    // biome-ignore lint/suspicious/noAlert: ignore
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteSchedule(scheduleId, {
        onSuccess: () => {
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

    const days: any[] = [];

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
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
        <span className="ml-2">Loading schedule...</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="font-medium text-gray-900 text-lg leading-6">
              Property Schedule
            </h3>
            <div className="flex items-center space-x-2">
              <button
                className="rounded-full p-1 hover:bg-gray-100"
                onClick={() =>
                  setSelectedDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth() - 1,
                      1
                    )
                  )
                }
                type="button"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M15 19l-7-7 7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
              <h4 className="font-medium text-gray-900 text-lg">
                {monthNames[selectedDate.getMonth()]}{" "}
                {selectedDate.getFullYear()}
              </h4>
              <button
                className="rounded-full p-1 hover:bg-gray-100"
                onClick={() =>
                  setSelectedDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth() + 1,
                      1
                    )
                  )
                }
                type="button"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 5l7 7-7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </button>
            </div>
          </div>
          <button
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-blue-700"
            onClick={() => setShowCreateForm(true)}
            type="button"
          >
            Add Schedule
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-4 grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              className="p-2 text-center font-medium text-gray-500 text-sm"
              key={day}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              className={`min-h-[100px] border border-gray-200 p-1 ${
                day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
              }`}
              key={index.toString()}
            >
              {day && (
                <>
                  <div className="mb-1 font-medium text-gray-900 text-sm">
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {getSchedulesForDate(day)
                      .slice(0, 2)
                      .map((schedule) => (
                        <div
                          className={`cursor-pointer truncate rounded p-1 text-xs ${
                            schedule.type === "maintenance"
                              ? "bg-yellow-100 text-yellow-800"
                              : schedule.type === "inspection"
                                ? "bg-blue-100 text-blue-800"
                                : schedule.type === "viewing"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                          key={schedule._id}
                          onClick={() => setEditingSchedule(schedule)}
                          title={schedule.title}
                        >
                          {schedule.title}
                        </div>
                      ))}
                    {getSchedulesForDate(day).length > 2 && (
                      <div className="p-1 text-gray-500 text-xs">
                        +{getSchedulesForDate(day).length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* User's Schedule Summary */}
        <div className="mt-6 border-t pt-6">
          <h4 className="mb-3 font-medium text-gray-900 text-sm">
            Your Upcoming Schedules
          </h4>
          <div className="space-y-2">
            {userSchedules.slice(0, 3).map((schedule) => (
              <div
                className="flex items-center justify-between rounded bg-gray-50 p-2"
                key={schedule._id}
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {schedule.title}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(schedule.startDate).toLocaleDateString()} at{" "}
                    {new Date(schedule.startDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 font-medium text-xs ${
                    schedule.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : schedule.status === "in_progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {schedule.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Schedule Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <h3 className="mb-4 font-medium text-gray-900 text-lg">
              Create New Schedule
            </h3>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateSchedule({
                  title: formData.get("title"),
                  description: formData.get("description"),
                  type: formData.get("type"),
                  startDate: formData.get("startDate"),
                  endDate: formData.get("endDate"),
                  priority: formData.get("priority"),
                });
              }}
            >
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="title"
                >
                  Title
                </label>
                <input
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="title"
                  required
                  type="text"
                />
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="type"
                >
                  Type
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="type"
                  required
                >
                  <option value="">Select type</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="viewing">Property Showing</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="start-date"
                >
                  Start Date & Time
                </label>
                <input
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="startDate"
                  required
                  type="datetime-local"
                />
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="end-date"
                >
                  End Date & Time
                </label>
                <input
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="endDate"
                  required
                  type="datetime-local"
                />
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="description"
                  rows={3}
                />
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="priority"
                >
                  Priority
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  name="priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
                  onClick={() => setShowCreateForm(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={creating}
                  type="submit"
                >
                  {creating ? "Creating..." : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-900 text-lg">
                Edit Schedule
              </h3>
              <button
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                disabled={deleting}
                onClick={() => handleDeleteSchedule(editingSchedule._id)}
                type="button"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateSchedule(editingSchedule._id, {
                  title: formData.get("title"),
                  description: formData.get("description"),
                  status: formData.get("status"),
                  startDate: formData.get("startDate"),
                  endDate: formData.get("endDate"),
                });
              }}
            >
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="title"
                >
                  Title
                </label>
                <input
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue={editingSchedule.title}
                  name="title"
                  required
                  type="text"
                />
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="status"
                >
                  Status
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue={editingSchedule.status}
                  name="status"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="start-date"
                >
                  Start Date & Time
                </label>
                <input
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue={new Date(editingSchedule.startDate)
                    .toISOString()
                    .slice(0, 16)}
                  name="startDate"
                  required
                  type="datetime-local"
                />
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="end-date"
                >
                  End Date & Time
                </label>
                <input
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue={new Date(editingSchedule.endDate)
                    .toISOString()
                    .slice(0, 16)}
                  name="endDate"
                  required
                  type="datetime-local"
                />
              </div>
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue={editingSchedule.description}
                  name="description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
                  onClick={() => setEditingSchedule(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={updating}
                  type="submit"
                >
                  {updating ? "Updating..." : "Update Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
