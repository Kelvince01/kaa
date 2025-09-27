import mongoose, { type Model, Schema } from "mongoose";
import type { IMessage } from "./types/message.type";

/**
 * Message schema definition
 */
const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Optional references
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
      },
    ],
    // Additional fields from original model
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    originalAttachments: [
      {
        url: String,
        key: String, // S3 key
        filename: String,
        contentType: String,
      },
    ],
    readAt: Date,
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
messageSchema.index({ conversation: 1, createdAt: -1 });

/**
 * Method to mark message as read
 * @returns Promise with updated message
 */
messageSchema.methods.markAsRead = function (): Promise<IMessage> {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

/**
 * Method to check if message has attachments
 * @returns Boolean indicating if message has attachments
 */
messageSchema.methods.hasAttachments = function (): boolean {
  return Boolean(
    (this.attachments && this.attachments.length > 0) ||
      (this.originalAttachments && this.originalAttachments.length > 0)
  );
};

// Create and export the Message model
const Message: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  messageSchema
);

export { Message };
