import { supportService } from "@kaa/services";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

export const supportController = new Elysia({
  detail: {
    tags: ["support"],
  },
}).group("support", (app) =>
  app
    .use(authPlugin)
    .post(
      "/tickets",
      async ({ set, body, user }) => {
        try {
          const ticket = await supportService.createTicket({
            ...body,
            memberId: user.memberId as string,
            userId: user.id,
          });

          set.status = 201;
          return {
            status: "success",
            ticket: {
              _id: (ticket._id as mongoose.Types.ObjectId).toString(),
              subject: ticket.subject,
              description: ticket.description,
              priority: ticket.priority,
              category: ticket.category,
              attachments: ticket.attachments,
              // createdAt: ticket.createdAt,
              // updatedAt: ticket.updatedAt,
              // number: ticket.ticketNumber,
              // status: ticket.status,
              // assignedTo: ticket.assignedTo,
              // assignedToId: ticket.assignedToId,
              // assignedToName: ticket.assignedToName,
              // assignedToEmail: ticket.assignedToEmail,
            },
            message: "Support ticket created successfully",
          };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Failed to create ticket" };
        }
      },
      {
        body: t.Object({
          subject: t.String({ minLength: 1 }),
          description: t.String({ minLength: 1 }),
          priority: t.Union([
            t.Literal("low"),
            t.Literal("medium"),
            t.Literal("high"),
            t.Literal("urgent"),
          ]),
          category: t.Union([
            t.Literal("technical"),
            t.Literal("billing"),
            t.Literal("feature_request"),
            t.Literal("bug_report"),
            t.Literal("general"),
          ]),
          attachments: t.Optional(
            t.Array(
              t.Object({
                filename: t.String(),
                url: t.String(),
                size: t.Number(),
              })
            )
          ),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            ticket: t.Object({
              _id: t.String(),
              subject: t.String(),
              description: t.String(),
              priority: t.String(),
              category: t.String(),
              attachments: t.Array(
                t.Object({
                  filename: t.String(),
                  url: t.String(),
                  size: t.Number(),
                })
              ),
            }),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["support"],
          summary: "Create a new ticket",
          description: "Create a new ticket",
        },
      }
    )
    .post(
      "/tickets/:id/messages",
      async ({ set, body, user, params }) => {
        try {
          const { id } = params;
          const { content, isInternal = false } = body;
          await supportService.addMessageToTicket(
            id,
            user.id,
            content,
            isInternal
          );

          set.status = 200;
          return { status: "success", message: "Message added to ticket" };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Failed to add message" };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          content: t.String({ minLength: 1 }),
          isInternal: t.Boolean(),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["support"],
          summary: "Add a message to a ticket",
          description: "Add a message to a ticket",
        },
      }
    )
    .put(
      "/tickets/:id/status",
      async ({ set, body, params, user }) => {
        try {
          const { id } = params;
          const { status } = body;
          await supportService.updateTicketStatus(id, status, user.id);

          set.status = 200;
          return { status: "success", message: "Ticket status updated" };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: "Failed to update ticket status" };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          status: t.Enum({
            open: "open",
            in_progress: "in_progress",
            waiting_for_customer: "waiting_for_customer",
            resolved: "resolved",
            closed: "closed",
          }),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["support"],
          summary: "Update ticket status",
        },
      }
    )
    .get(
      "/knowledge-base/search",
      async ({ set, body, user }) => {
        try {
          const { q } = body;
          const results = await supportService.searchKnowledgeBase(
            q,
            user.memberId
          );

          set.status = 200;
          return {
            status: "success",
            results: results.map((result) => ({
              _id: (result._id as mongoose.Types.ObjectId).toString(),
              title: result.title,
              content: result.content,
            })),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to search knowledge base",
          };
        }
      },
      {
        body: t.Object({
          q: t.String(),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            results: t.Array(
              t.Object({
                _id: t.String(),
                title: t.String(),
                content: t.String(),
              })
            ),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["support"],
          summary: "Search the knowledge base",
          description: "Search the knowledge base",
        },
      }
    )
    .get(
      "/customer-health/dashboard",
      async ({ set }) => {
        // ADMIN
        try {
          const dashboard = await supportService.getCustomerHealthDashboard();

          set.status = 200;
          return { status: "success", dashboard };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch customer health dashboard",
          };
        }
      },
      {
        detail: {
          tags: ["support"],
          summary: "Get the customer health dashboard",
          description: "Get the customer health dashboard",
        },
      }
    )
    .post(
      "/customer-health/calculate",
      async ({ set, user }) => {
        // ADMIN
        try {
          await supportService.calculateCustomerHealth(user.memberId as string);

          set.status = 200;
          return { status: "success", message: "Customer health calculated" };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to calculate customer health",
          };
        }
      },
      {
        detail: {
          tags: ["support"],
          summary: "Calculate the customer health",
          description: "Calculate the customer health",
        },
      }
    )
);
