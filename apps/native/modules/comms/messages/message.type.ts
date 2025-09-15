import type { Property } from "$/modules/properties/property.type";
import type { User } from "$/modules/users/user.type";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: "text" | "image" | "property";
  propertyId?: string;
};

export type Conversation = {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  propertyId?: string;
  property?: Property;
};
