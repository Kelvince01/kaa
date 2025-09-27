import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

/**
 * Conversation document interface
 */
export interface IConversation extends BaseDocument {
  participants: mongoose.Types.ObjectId[];
  messages: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  property?: mongoose.Types.ObjectId;
  unreadCount: Map<string, number>;
  title?: string; // Added title property to match schema definition
  isActive?: boolean; // Added isActive to match schema definition
  updateUnreadCount(userId: string, count: number): Promise<IConversation>;
  resetUnreadCount(userId: string): Promise<IConversation>;
  isParticipant(userId: string): boolean;
}

/**
 * Processed conversation with additional fields for client
 */
export interface IProcessedConversation extends IConversation {
  otherParticipant?: Record<string, unknown>;
}
