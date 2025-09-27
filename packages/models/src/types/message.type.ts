import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

/**
 * Attachment type
 */
type IAttachment = {
  url: string;
  key?: string; // S3 key
  filename: string;
  contentType: string;
  size: number;
};

/**
 * Message document interface
 */
export interface IMessage extends BaseDocument {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  isRead: boolean;
  property?: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  conversation?: mongoose.Types.ObjectId;
  attachments?: IAttachment[];
  originalAttachments?: IAttachment[];
  readAt?: Date;
  deleted?: boolean;
  markAsRead(): Promise<IMessage>;
  hasAttachments(): boolean;
}
