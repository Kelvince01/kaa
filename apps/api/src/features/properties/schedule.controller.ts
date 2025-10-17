import { Schedule } from "@kaa/models";
import {
  type ISchedule,
  RecurrenceFrequency,
  ScheduleStatus,
  ScheduleType,
} from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type { FilterQuery } from "mongoose";
import mongoose from "mongoose";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

export const scheduleController = new Elysia().group("schedules", (app) =>
  app
    .use(accessPlugin("schedule", "create"))
    .post(
      "/",
      async ({ body, set, user }) => {
        try {
          const { startDate, endDate } = body;

          // Check for conflicts if participants are specified
          if (body.participants && body.participants.length > 0) {
            const participantIds = body.participants
              .map((p) => p.user || p.contractor)
              .filter(Boolean);

            const query: FilterQuery<ISchedule> = {
              $or: [
                { startDate: { $lt: endDate }, endDate: { $gt: startDate } },
              ],
              $and: [
                {
                  $or: [
                    { "participants.user": { $in: participantIds } },
                    { "participants.contractor": { $in: participantIds } },
                    { organizer: { $in: participantIds } },
                  ],
                },
              ],
              status: {
                $nin: [ScheduleStatus.CANCELLED, ScheduleStatus.COMPLETED],
              },
            };

            const conflicts = await Schedule.find(query);

            if (conflicts.length > 0) {
              set.status = 409;
              return {
                status: "error",
                message: "Schedule conflicts detected",
                data: { conflicts },
              };
            }
          }

          const schedule = new Schedule({
            ...body,
            organizer: user.id,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
          });

          await schedule.save();

          // Populate related fields
          await schedule.populate([
            { path: "organizer", select: "firstName lastName email" },
            { path: "participants.user", select: "firstName lastName email" },
            { path: "participants.contractor", select: "name company email" },
            { path: "property", select: "title address" },
            { path: "workOrder", select: "workOrderNumber title" },
          ]);

          return {
            status: "success",
            message: "Schedule created successfully",
            data: schedule,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create schedule",
          };
        }
      },
      {
        body: t.Object({
          title: t.String(),
          description: t.Optional(t.String()),
          type: t.Enum(ScheduleType),
          startDate: t.String(),
          endDate: t.String(),
          allDay: t.Optional(t.Boolean()),
          timezone: t.Optional(t.String()),
          property: t.Optional(t.String()),
          unit: t.Optional(t.String()),
          location: t.Optional(t.String()),
          workOrder: t.Optional(t.String()),
          maintenanceRequest: t.Optional(t.String()),
          participants: t.Optional(
            t.Array(
              t.Object({
                user: t.Optional(t.String()),
                contractor: t.Optional(t.String()),
                email: t.Optional(t.String()),
                name: t.Optional(t.String()),
                role: t.String(),
              })
            )
          ),
          isRecurring: t.Optional(t.Boolean()),
          recurrence: t.Optional(
            t.Object({
              frequency: t.Enum(RecurrenceFrequency),
              interval: t.Number(),
              daysOfWeek: t.Optional(t.Array(t.Number())),
              dayOfMonth: t.Optional(t.Number()),
              endDate: t.Optional(t.String()),
              maxOccurrences: t.Optional(t.Number()),
            })
          ),
          reminders: t.Optional(
            t.Array(
              t.Object({
                type: t.String(),
                minutesBefore: t.Number(),
              })
            )
          ),
          priority: t.Optional(t.String()),
          tags: t.Optional(t.Array(t.String())),
          notes: t.Optional(t.String()),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Create a new schedule",
        },
      }
    )
    .use(accessPlugin("schedule", "read"))
    .get(
      "/",
      async ({ query, user }) => {
        try {
          const {
            startDate,
            endDate,
            type,
            status,
            property,
            contractor,
            mySchedules,
            page = 1,
            limit = 50,
          } = query;

          let schedules: any;

          if (mySchedules === "true") {
            // Get schedules for the current user
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const query: FilterQuery<ISchedule> = {
              $or: [{ organizer: user.id }, { "participants.user": user.id }],
            };

            if (startDate && endDate) {
              query.$and = [
                {
                  $or: [
                    { startDate: { $gte: startDate, $lte: endDate } },
                    { endDate: { $gte: startDate, $lte: endDate } },
                    {
                      startDate: { $lte: startDate },
                      endDate: { $gte: endDate },
                    },
                  ],
                },
              ];
            }

            schedules = await Schedule.find(query).sort({ startDate: 1 });
          } else if (contractor) {
            // Get schedules for a specific contractor
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const query: FilterQuery<ISchedule> = {
              "participants.contractor": contractor,
            };

            if (startDate && endDate) {
              query.$and = [
                {
                  $or: [
                    { startDate: { $gte: startDate, $lte: endDate } },
                    { endDate: { $gte: startDate, $lte: endDate } },
                    {
                      startDate: { $lte: startDate },
                      endDate: { $gte: endDate },
                    },
                  ],
                },
              ];
            }

            schedules = await Schedule.find(query).sort({ startDate: 1 });
          } else {
            // General query with filters
            const filter: FilterQuery<ISchedule> = {};

            if (startDate && endDate) {
              filter.$or = [
                {
                  startDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                  },
                },
                {
                  endDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                  },
                },
                {
                  startDate: { $lte: new Date(startDate) },
                  endDate: { $gte: new Date(endDate) },
                },
              ];
            }

            if (type) filter.type = type;
            if (status) filter.status = status;
            if (property) filter.property = property;

            const skip = (Number(page) - 1) * Number(limit);

            schedules = await Schedule.find(filter)
              .sort({ startDate: 1 })
              .skip(skip)
              .limit(Number(limit));
          }

          // Populate related fields
          await Schedule.populate(schedules, [
            { path: "organizer", select: "firstName lastName email" },
            { path: "participants.user", select: "firstName lastName email" },
            { path: "participants.contractor", select: "name company email" },
            { path: "property", select: "title address" },
            { path: "workOrder", select: "workOrderNumber title" },
          ]);

          return {
            status: "success",
            message: "Schedules fetched successfully",
            data: schedules,
          };
        } catch (error) {
          return {
            status: "error",
            message: "Failed to fetch schedules",
          };
        }
      },
      {
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
          type: t.Optional(t.Enum(ScheduleType)),
          status: t.Optional(t.Enum(ScheduleStatus)),
          property: t.Optional(t.String()),
          contractor: t.Optional(t.String()),
          mySchedules: t.Optional(t.String()),
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Get schedules with filtering",
        },
      }
    )
    .get(
      "/conflicts",
      async ({ query, set }) => {
        try {
          const { startDate, endDate, participants } = query;

          if (!(startDate && endDate && participants)) {
            set.status = 400;
            return {
              status: "error",
              message:
                "Missing required parameters: startDate, endDate, participants",
            };
          }

          const participantIds = participants.split(",");

          const filter: FilterQuery<ISchedule> = {
            $or: [{ startDate: { $lt: endDate }, endDate: { $gt: startDate } }],
            $and: [
              {
                $or: [
                  { "participants.user": { $in: participantIds } },
                  { "participants.contractor": { $in: participantIds } },
                  { organizer: { $in: participantIds } },
                ],
              },
            ],
            status: {
              $nin: [ScheduleStatus.CANCELLED, ScheduleStatus.COMPLETED],
            },
          };

          const conflicts = await Schedule.find(filter);

          return {
            status: "success",
            message: "Conflicts checked successfully",
            data: { hasConflicts: conflicts.length > 0, conflicts },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to check conflicts",
          };
        }
      },
      {
        query: t.Object({
          startDate: t.String(),
          endDate: t.String(),
          participants: t.String(), // Comma-separated IDs
        }),
        detail: {
          tags: ["schedules"],
          summary: "Check for schedule conflicts",
        },
      }
    )
    .get(
      "/:id",
      async ({ params, set, user }) => {
        try {
          const schedule = await Schedule.findById(params.id)
            .populate("organizer", "firstName lastName email")
            .populate("participants.user", "firstName lastName email")
            .populate("participants.contractor", "name company email")
            .populate("property", "title address")
            .populate("unit", "unitNumber type")
            .populate("workOrder", "workOrderNumber title")
            .populate("maintenanceRequest", "title description");

          if (!schedule) {
            set.status = 404;
            return {
              status: "error",
              message: "Schedule not found",
            };
          }

          const isParticipant = schedule.participants.some(
            (p: any) =>
              p.user?.toString() === user.id ||
              schedule.organizer.toString() === user.id
          );

          // Check if user has access to this schedule
          if (!isParticipant) {
            set.status = 403;
            return {
              status: "error",
              message: "Access denied",
            };
          }

          return {
            status: "success",
            message: "Schedule fetched successfully",
            data: schedule,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch schedule",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Get schedule by ID",
        },
      }
    )
    .use(accessPlugin("schedule", "update"))
    .put(
      "/:id",
      async ({ params, body, set, user }) => {
        try {
          const schedule = await Schedule.findById(params.id);

          if (!schedule) {
            set.status = 404;
            return {
              status: "error",
              message: "Schedule not found",
            };
          }

          // Check if user is organizer
          if (schedule.organizer.toString() !== user.id) {
            set.status = 403;
            return {
              status: "error",
              message: "Only organizer can update schedule",
            };
          }

          // Check for conflicts if updating time or participants
          if (body.startDate || body.endDate || body.participants) {
            const startDate = body.startDate
              ? new Date(body.startDate)
              : schedule.startDate;
            const endDate = body.endDate
              ? new Date(body.endDate)
              : schedule.endDate;
            const participants = body.participants || schedule.participants;

            const excludeId = (
              schedule._id as mongoose.Types.ObjectId
            ).toString();

            const participantIds = participants
              .map((p: any) => p.user || p.contractor)
              .filter(Boolean);

            const query: FilterQuery<ISchedule> = {
              $or: [
                { startDate: { $lt: endDate }, endDate: { $gt: startDate } },
              ],
              $and: [
                {
                  $or: [
                    { "participants.user": { $in: participantIds } },
                    { "participants.contractor": { $in: participantIds } },
                    { organizer: { $in: participantIds } },
                  ],
                },
              ],
              status: {
                $nin: [ScheduleStatus.CANCELLED, ScheduleStatus.COMPLETED],
              },
            };

            if (excludeId) {
              query._id = { $ne: excludeId };
            }

            const conflicts = await Schedule.find(query);

            if (conflicts.length > 0) {
              set.status = 409;
              return {
                status: "error",
                message: "Schedule conflicts detected",
                data: { conflicts },
              };
            }
          }

          // Update schedule
          Object.assign(schedule, body);
          if (body.startDate) schedule.startDate = new Date(body.startDate);
          if (body.endDate) schedule.endDate = new Date(body.endDate);

          await schedule.save();

          return {
            status: "success",
            message: "Schedule updated successfully",
            data: schedule,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update schedule",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          title: t.Optional(t.String()),
          description: t.Optional(t.String()),
          status: t.Optional(t.Enum(ScheduleStatus)),
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
          location: t.Optional(t.String()),
          participants: t.Optional(
            t.Array(
              t.Object({
                user: t.Optional(t.String()),
                contractor: t.Optional(t.String()),
                email: t.Optional(t.String()),
                name: t.Optional(t.String()),
                role: t.String(),
                status: t.Optional(t.String()),
              })
            )
          ),
          priority: t.Optional(t.String()),
          tags: t.Optional(t.Array(t.String())),
          notes: t.Optional(t.String()),
          completionNotes: t.Optional(t.String()),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Update schedule",
        },
      }
    )
    .post(
      "/:id/respond",
      async ({ params, body, set, user }) => {
        try {
          const schedule = await Schedule.findById(params.id);

          if (!schedule) {
            set.status = 404;
            return {
              status: "error",
              message: "Schedule not found",
            };
          }

          // Find participant
          const participant = schedule.participants.find(
            (p) => p.user?.toString() === user.id
          );

          if (!participant) {
            set.status = 403;
            return {
              status: "error",
              message: "You are not a participant in this schedule",
            };
          }

          // Update participant status
          participant.status = body.status as any;
          await schedule.save();

          return {
            status: "success",
            message: "Response recorded successfully",
            data: schedule,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to record response",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          status: t.String(), // accepted, declined, tentative
        }),
        detail: {
          tags: ["schedules"],
          summary: "Respond to schedule invitation",
        },
      }
    )
    .use(accessPlugin("schedule", "delete"))
    .delete(
      "/:id",
      async ({ params, set, user }) => {
        try {
          const schedule = await Schedule.findById(params.id);

          if (!schedule) {
            set.status = 404;
            return {
              status: "error",
              message: "Schedule not found",
            };
          }

          // Check if user is organizer
          if (schedule.organizer.toString() !== user.id) {
            set.status = 403;
            return {
              status: "error",
              message: "Only organizer can delete schedule",
            };
          }

          await schedule.deleteOne();

          return {
            status: "success",
            message: "Schedule deleted successfully",
            data: null,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete schedule",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Delete schedule",
        },
      }
    )

    .get(
      "/calendar-events/property/:propertyId",
      async ({ params }) => {
        try {
          const schedules = await Schedule.find({
            property: params.propertyId,
          }).populate([
            { path: "organizer", select: "firstName lastName email" },
            { path: "participants.user", select: "firstName lastName email" },
            { path: "participants.contractor", select: "name company email" },
          ]);

          return {
            status: "success",
            message: "Calendar events fetched successfully",
            data: schedules,
          };
        } catch (error) {
          return {
            status: "error",
            message: "Failed to fetch calendar events",
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Fetch calendar events for a property",
        },
      }
    )

    .post(
      "/availability/check",
      async ({ body }) => {
        try {
          const { userId, startDate, endDate } = body;
          const conflicts = await Schedule.find({
            $or: [{ "participants.user": userId }, { organizer: userId }],
            startDate: { $lt: new Date(endDate) },
            endDate: { $gt: new Date(startDate) },
            status: {
              $nin: [ScheduleStatus.CANCELLED, ScheduleStatus.COMPLETED],
            },
          });

          return {
            status: "success",
            message: "Availability checked successfully",
            data: { available: conflicts.length === 0, conflicts },
          };
        } catch (error) {
          return {
            status: "error",
            message: "Failed to check availability",
          };
        }
      },
      {
        body: t.Object({
          userId: t.String(),
          startDate: t.String(),
          endDate: t.String(),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Fetch user schedules",
        },
      }
    )

    .get(
      "/user/:userId",
      async ({ params }) => {
        try {
          const schedules = await Schedule.find({
            $or: [
              { "participants.user": params.userId },
              { organizer: params.userId },
            ],
          }).populate([
            { path: "organizer", select: "firstName lastName email" },
            { path: "participants.user", select: "firstName lastName email" },
            { path: "property", select: "title address" },
          ]);

          return {
            status: "success",
            message: "User schedules fetched successfully",
            data: schedules,
          };
        } catch (error) {
          return {
            status: "error",
            message: "Failed to fetch user schedules",
          };
        }
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Fetch user schedules",
        },
      }
    )

    .get(
      "/:id/participants",
      async ({ params }) => {
        try {
          const schedule = await Schedule.findById(params.id).populate([
            { path: "participants.user", select: "firstName lastName email" },
            { path: "participants.contractor", select: "name company email" },
          ]);

          if (!schedule) {
            return {
              status: "error",
              message: "Schedule not found",
            };
          }

          return {
            status: "success",
            message: "Participants fetched successfully",
            data: schedule.participants,
          };
        } catch (error) {
          return {
            status: "error",
            message: "Failed to fetch participants",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Fetch participants for a schedule",
        },
      }
    )

    .post(
      "/:id/participants",
      async ({ params, body }) => {
        try {
          const schedule = await Schedule.findById(params.id);
          if (!schedule) {
            return {
              status: "error",
              message: "Schedule not found",
            };
          }

          schedule.participants.push({
            user: new mongoose.Types.ObjectId(body.user),
            contractor: new mongoose.Types.ObjectId(body.contractor),
            email: body.email,
            name: body.name,
            role: body.role,
            status: body.status,
            notified: body.notified,
          });
          await schedule.save();

          return {
            status: "success",
            message: "Participant added successfully",
            data: schedule,
          };
        } catch (error) {
          return {
            status: "error",
            message: "Failed to add participant",
          };
        }
      },
      {
        body: t.Object({
          user: t.String(),
          contractor: t.String(),
          email: t.String(),
          name: t.String(),
          role: t.Enum({
            contractor: "contractor",
            organizer: "organizer",
            attendee: "attendee",
            tenant: "tenant",
            landlord: "landlord",
          }),
          status: t.Enum({
            pending: "pending",
            accepted: "accepted",
            declined: "declined",
            tentative: "tentative",
          }),
          notified: t.Boolean(),
        }),
        detail: {
          tags: ["schedules"],
          summary: "Add participant to schedule",
        },
      }
    )
);
