import mongoose, { type Model, Schema } from "mongoose";
import type { IConversation } from "./types/conversation.type";

/**
 * Conversation schema definition
 */
const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    // Additional fields from original model
    title: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure participants are unique and create index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

/**
 * Method to update unread count for a user
 * @param userId - ID of the user to update count for
 * @param count - New unread count
 * @returns Promise with updated conversation
 */
conversationSchema.methods.updateUnreadCount = function (
  userId: string,
  count: number
): Promise<IConversation> {
  if (!this.unreadCount) {
    this.unreadCount = new Map<string, number>();
  }
  this.unreadCount.set(userId.toString(), count);
  return this.save();
};

/**
 * Method to reset unread count for a user
 * @param userId - ID of the user to reset count for
 * @returns Promise with updated conversation
 */
conversationSchema.methods.resetUnreadCount = function (
  userId: string
): Promise<IConversation> {
  if (!this.unreadCount) {
    this.unreadCount = new Map<string, number>();
  }
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

/**
 * Method to check if a user is a participant in the conversation
 * @param userId - ID of the user to check
 * @returns Boolean indicating if user is a participant
 */
conversationSchema.methods.isParticipant = function (userId: string): boolean {
  return this.participants.some(
    (participant: mongoose.Types.ObjectId) =>
      participant.toString() === userId.toString()
  );
};

// Create and export the Conversation model
const Conversation: Model<IConversation> = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);

export { Conversation };
