import { Conversation, Message, Property, User } from "@kaa/models";
import type {
  IConversation,
  IConversationParticipant,
  IProperty,
} from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

export const conversationController = new Elysia({
  detail: {
    tags: ["conversations"],
  },
}).group("/messages-v1", (app) =>
  app
    .use(authPlugin)

    /**
     * Create a new conversation
     */
    .post(
      "/conversations",
      async ({ body, set, user }) => {
        try {
          // Check if recipient exists
          const recipient = await User.findById(body.recipientId);
          if (!recipient) {
            set.status = 404;
            return {
              status: "error",
              message: "Recipient not found",
            };
          }

          // Check if property exists if provided
          let property: IProperty | null = null;
          if (body.propertyId) {
            property = await Property.findById(body.propertyId);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }
          }

          // Check if conversation already exists between participants
          const existingConversation = await Conversation.findOne({
            participants: { $all: [user.id, body.recipientId] },
            ...(property ? { property: property._id } : {}),
          })
            .populate({
              path: "participants",
              select: "profile.firstName profile.lastName profile.avatar",
            })
            .populate({
              path: "property",
              select: "title media location",
            })
            .populate({
              path: "lastMessage",
              select: "content sender createdAt isRead",
            });

          if (existingConversation) {
            set.status = 200;
            return {
              status: "success",
              data: existingConversation,
              message: "Conversation already exists",
            };
          }

          // Create new conversation
          const conversation = new Conversation({
            participants: [user.id, body.recipientId],
            property: property?._id || undefined,
            unreadCount: new Map([
              [body.recipientId, 0],
              [user.id, 0],
            ]),
            title: property
              ? property.title
              : `Conversation with ${recipient.profile.firstName} ${recipient.profile.lastName}`,
          });

          await conversation.save();

          // Populate participants for response
          const populatedConversation = await Conversation.findById(
            conversation._id
          )
            .populate(
              "participants",
              "profile.firstName profile.lastName profile.email profile.avatar"
            )
            .populate("property", "title address")
            .populate({
              path: "lastMessage",
              select: "content sender createdAt isRead",
            });

          // Create new message
          const message = new Message({
            conversation: conversation._id,
            sender: user.id,
            receiver: body.recipientId,
            content: body.initialMessage,
          });

          await message.save();

          // Update conversation with last message
          conversation.lastMessageId = message._id as mongoose.Types.ObjectId;

          // Update unread count for recipient
          const unreadCount =
            conversation.unreadCount || new Map<string, number>();
          unreadCount.set(
            body.recipientId.toString(),
            (unreadCount.get(body.recipientId.toString()) || 0) + 1
          );
          conversation.unreadCount = unreadCount;

          await conversation.save();

          // Format response to include other participant info
          const otherParticipant = conversation.participants.find(
            (p: any) => p._id.toString() !== user.id
          );

          const formattedConversation = {
            _id: conversation._id,
            otherParticipant,
            property: conversation.propertyId,
            lastMessage: conversation.lastMessageId,
            unreadCount: conversation.unreadCount.get(user.id as string) || 0,
            updatedAt: conversation.updatedAt,
          };

          // TODO: Send notification to recipient

          set.status = 201;
          return {
            status: "success",
            data: formattedConversation,
            message: "Conversation started successfully",
          };
        } catch (error: unknown) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to start conversation",
            error: (error as Error).message,
          };
        }
      },
      {
        body: t.Object({
          recipientId: t.String({ description: "ID of the recipient user" }),
          propertyId: t.Optional(
            t.String({ description: "Optional property ID" })
          ),
          initialMessage: t.Optional(
            t.String({ description: "Optional initial message" })
          ),
        }),
        response: {
          201: t.Object({
            status: t.Literal("success"),
            data: t.Any(),
            message: t.String(),
          }),
          200: t.Object({
            status: t.Literal("success"),
            data: t.Any(),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
            error: t.String(),
          }),
        },
        detail: {
          tags: ["conversations"],
          summary: "Create a new conversation",
          description: "Create a new conversation between users",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )

    /**
     * Get all conversations for the authenticated user
     */
    .get(
      "/conversations",
      async ({ query, set, user }) => {
        try {
          const { page = "1", limit = "20", search } = query;
          const pageNum = Number.parseInt(page, 10);
          const limitNum = Number.parseInt(limit, 10);
          const skip = (pageNum - 1) * limitNum;

          // Build query
          const filter: FilterQuery<IConversation> = {
            participants: user.id,
            isActive: true,
          };

          if (search) {
            filter.title = { $regex: search, $options: "i" };
          }

          // Get conversations with pagination
          const conversations = await Conversation.find(filter)
            .populate(
              "participants",
              "profile.firstName profile.lastName profile.email profile.avatar"
            )
            .populate("property", "title location")
            .populate("lastMessageId", "content sender createdAt isRead")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limitNum);

          // Get total count
          const total = await Conversation.countDocuments(filter);
          const totalPages = Math.ceil(total / limitNum);

          // Format conversations with other participant info
          const formattedConversations = conversations.map((conversation) => {
            const otherParticipant = (conversation.participants as any[]).find(
              (p) => p._id.toString() !== user.id
            );

            return {
              ...conversation.toObject(),
              otherParticipant,
              unreadCount: conversation.unreadCount?.get(user.id) || 0,
            };
          });

          set.status = 200;
          return {
            status: "success",
            data: formattedConversations,
            pagination: {
              total,
              pages: totalPages,
              page: pageNum,
              limit: limitNum,
              hasNextPage: pageNum < totalPages,
              hasPreviousPage: pageNum > 1,
            },
            message: "Conversations fetched successfully",
          };
        } catch (error: unknown) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch conversations",
            error: (error as Error).message,
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String({ default: "1" })),
          limit: t.Optional(t.String({ default: "20" })),
          search: t.Optional(t.String()),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Array(t.Any()),
            pagination: t.Object({
              total: t.Number(),
              pages: t.Number(),
              page: t.Number(),
              limit: t.Number(),
              hasNextPage: t.Boolean(),
              hasPreviousPage: t.Boolean(),
            }),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
            error: t.String(),
          }),
        },
        detail: {
          tags: ["conversations"],
          summary: "Get user conversations",
          description:
            "Get all conversations for the authenticated user with pagination",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )

    /**
     * Get messages for a specific conversation
     */
    .get(
      "/conversations/:conversationId",
      async ({ params, query, set, user }) => {
        try {
          const { conversationId } = params;
          const { page = "1", limit = "50" } = query;
          const pageNum = Number.parseInt(page, 10);
          const limitNum = Number.parseInt(limit, 10);
          const skip = (pageNum - 1) * limitNum;

          // Check if user is participant in conversation
          const conversation = await Conversation.findById(
            conversationId
          ).populate(
            "participants",
            "profile.firstName profile.lastName profile.avatar"
          );

          if (!conversation) {
            set.status = 404;
            return {
              status: "error",
              message: "Conversation not found",
            };
          }

          if (!conversation.isParticipant(user.id)) {
            set.status = 403;
            return {
              status: "error",
              message: "You are not a participant in this conversation",
            };
          }

          // Get messages with pagination
          const messages = await Message.find({
            conversation: conversationId,
            deleted: false,
          })
            .populate(
              "sender",
              "profile.firstName profile.lastName profile.email profile.avatar"
            )
            .populate(
              "receiver",
              "profile.firstName profile.lastName profile.avatar"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

          const total = await Message.countDocuments({
            conversation: conversationId,
            deleted: false,
          });

          const totalPages = Math.ceil(total / limitNum);

          // Find other participant
          const otherParticipant = conversation.participants.find(
            (p: IConversationParticipant) => p.userId.toString() !== user.id
          );

          // Mark conversation as read for this user
          if (conversation.unreadCount && otherParticipant) {
            conversation.unreadCount.set(user.id as string, 0);
            await conversation.save();

            // Mark all unread messages as read
            await Message.updateMany(
              {
                conversation: conversationId,
                sender: otherParticipant.userId,
                isRead: false,
              },
              {
                isRead: true,
                readAt: new Date(),
              }
            );
          }

          set.status = 200;
          return {
            status: "success",
            data: messages.reverse(), // Reverse to show oldest first
            pagination: {
              total,
              pages: totalPages,
              page: pageNum,
              limit: limitNum,
              hasNextPage: pageNum < totalPages,
              hasPreviousPage: pageNum > 1,
            },
            message: "Messages fetched successfully",
          };
        } catch (error: unknown) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch messages",
            error: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          conversationId: t.String(),
        }),
        query: t.Object({
          page: t.Optional(t.String({ default: "1" })),
          limit: t.Optional(t.String({ default: "50" })),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Array(t.Any()),
            pagination: t.Object({
              total: t.Number(),
              pages: t.Number(),
              page: t.Number(),
              limit: t.Number(),
              hasNextPage: t.Boolean(),
              hasPreviousPage: t.Boolean(),
            }),
            message: t.String(),
          }),
          403: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
            error: t.String(),
          }),
        },
        detail: {
          tags: ["conversations"],
          summary: "Get conversation messages",
          description:
            "Get messages for a specific conversation with pagination",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )

    /**
     * Send a message in a conversation
     */
    .post(
      "/conversations/:conversationId",
      async ({ params, body, set, user }) => {
        try {
          const { conversationId } = params;

          // Check if conversation exists and user is participant
          const conversation = await Conversation.findById(conversationId);
          if (!conversation) {
            set.status = 404;
            return {
              status: "error",
              message: "Conversation not found",
            };
          }

          if (!conversation.isParticipant(user.id)) {
            set.status = 403;
            return {
              status: "error",
              message: "You are not a participant in this conversation",
            };
          }

          // Create message
          const message = new Message({
            conversation: conversationId,
            sender: user.id,
            content: body.content,
            attachments: body.attachments || [],
          });

          await message.save();

          // Update conversation
          conversation.lastMessageId = message._id as mongoose.Types.ObjectId;
          conversation.updatedAt = new Date();

          // Update unread counts for other participants
          for (const participantId of conversation.participants) {
            if (participantId.toString() !== user.id) {
              const currentCount =
                conversation.unreadCount?.get(participantId.toString()) || 0;
              await conversation.updateUnreadCount(
                participantId.toString(),
                currentCount + 1
              );
            }
          }

          await conversation.save();

          // Populate message for response
          const populatedMessage = await Message.findById(message._id).populate(
            "sender",
            "profile.firstName profile.lastName profile.email profile.avatar"
          );

          set.status = 201;
          return {
            status: "success",
            data: populatedMessage,
            message: "Message sent successfully",
          };
        } catch (error: unknown) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to send message",
            error: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          conversationId: t.String(),
        }),
        body: t.Object({
          content: t.String({ minLength: 1 }),
          attachments: t.Optional(
            t.Array(
              t.Object({
                name: t.String(),
                url: t.String(),
                type: t.String(),
                size: t.Optional(t.Number()),
              })
            )
          ),
        }),
        response: {
          201: t.Object({
            status: t.Literal("success"),
            data: t.Any(),
            message: t.String(),
          }),
          403: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
            error: t.String(),
          }),
        },
        detail: {
          tags: ["conversations"],
          summary: "Send a message",
          description: "Send a message in a conversation",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )

    /**
     * Delete a message
     */
    .delete(
      "/conversations/:messageId",
      async ({ params, set, user }) => {
        try {
          const { messageId } = params;

          // Find message and check ownership
          const message =
            await Message.findById(messageId).populate("conversation");
          if (!message) {
            set.status = 404;
            return {
              status: "error",
              message: "Message not found",
            };
          }

          // Check if user is the sender or participant in conversation
          const conversation = message.conversationId as any;
          if (
            message.senderId.toString() !== user.id &&
            !conversation.isParticipant(user.id)
          ) {
            set.status = 403;
            return {
              status: "error",
              message: "You are not authorized to delete this message",
            };
          }

          // Check if message is less than 5 minutes old
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (message.createdAt < fiveMinutesAgo) {
            set.status = 400;
            return {
              status: "error",
              message:
                "Messages can only be deleted within 5 minutes of sending",
            };
          }

          // Soft delete message
          message.deleted = true;
          await message.save();

          // If this was the last message in the conversation, update the lastMessage
          const conversation2 = await Conversation.findById(
            message.conversationId
          );
          if (
            conversation2 &&
            conversation2.lastMessageId?.toString() === messageId
          ) {
            // Find the previous message that isn't deleted
            const previousMessage = await Message.findOne({
              conversation: conversation2._id,
              deleted: { $ne: true },
              _id: { $ne: messageId },
            }).sort({ createdAt: -1 });

            if (previousMessage) {
              conversation.lastMessageId = previousMessage._id;
            } else {
              conversation.lastMessage = undefined;
            }

            await conversation.save();
          }

          set.status = 200;
          return {
            status: "success",
            data: null,
            message: "Message deleted successfully",
          };
        } catch (error: unknown) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete message",
            error: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          messageId: t.String(),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Null(),
            message: t.String(),
          }),
          403: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
            error: t.String(),
          }),
        },
        detail: {
          tags: ["conversations"],
          summary: "Delete a message",
          description: "Delete a message from a conversation",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )

    /**
     * Mark conversation as read
     */
    .patch(
      "/conversations/:conversationId/read",
      async ({ params, set, user }) => {
        try {
          const { conversationId } = params;

          // Find conversation and check if user is participant
          const conversation = await Conversation.findById(conversationId);
          if (!conversation) {
            set.status = 404;
            return {
              status: "error",
              message: "Conversation not found",
            };
          }

          if (!conversation.isParticipant(user.id)) {
            set.status = 403;
            return {
              status: "error",
              message: "You are not a participant in this conversation",
            };
          }

          // Mark all unread messages as read
          await Message.updateMany(
            {
              conversation: conversationId,
              sender: { $ne: user.id },
              isRead: false,
            },
            {
              isRead: true,
              readAt: new Date(),
            }
          );

          // Reset unread count for user
          await conversation.resetUnreadCount(user.id);

          set.status = 200;
          return {
            status: "success",
            data: null,
            message: "Conversation marked as read",
          };
        } catch (error: unknown) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to mark conversation as read",
            error: (error as Error).message,
          };
        }
      },
      {
        params: t.Object({
          conversationId: t.String(),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Null(),
            message: t.String(),
          }),
          403: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
            error: t.String(),
          }),
        },
        detail: {
          tags: ["conversations"],
          summary: "Mark conversation as read",
          description: "Mark all messages in a conversation as read",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )

    /**
     * Get unread message count for the authenticated user
     */
    .get(
      "/unread-count",
      async ({ set, user }) => {
        try {
          // Find all conversations for the user
          const conversations = await Conversation.find({
            participants: user.id,
          });

          // Calculate total unread messages
          let totalUnread = 0;

          for (const conversation of conversations) {
            if (conversation.unreadCount) {
              const userUnreadCount =
                conversation.unreadCount.get(user.id) || 0;
              totalUnread += userUnreadCount;
            }
          }

          set.status = 200;
          return {
            status: "success",
            data: { unreadCount: totalUnread },
            message: "Unread message count retrieved successfully",
          };
        } catch (error: unknown) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get unread message count",
            error: (error as Error).message,
          };
        }
      },
      {
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Object({
              unreadCount: t.Number(),
            }),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
            error: t.String(),
          }),
        },
        detail: {
          tags: ["conversations"],
          summary: "Get unread message count",
          description:
            "Get total unread message count for the authenticated user",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )
);

export default conversationController;
