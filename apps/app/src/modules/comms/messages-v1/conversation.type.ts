// Conversation types matching API MVP structure

// Basic conversation interface
export type Conversation = {
  _id: string;
  participants: string[];
  messages?: string[];
  lastMessage?:
    | string
    | {
        _id: string;
        content: string;
        sender: string;
        createdAt: string;
        isRead: boolean;
      };
  property?:
    | string
    | {
        _id: string;
        title: string;
        media?: any[];
        location?: any;
      };
  unreadCount?: Map<string, number> | Record<string, number>;
  title?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

// Processed conversation with participant details
export interface ProcessedConversation extends Conversation {
  otherParticipant?: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    avatar?: string;
  };
}

// Conversation list response
export type ConversationListResponse = {
  status: "success" | "error";
  data: ProcessedConversation[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string;
};

// Single conversation response
export type ConversationResponse = {
  status: "success" | "error";
  data: ProcessedConversation;
  message: string;
  error?: string;
};

// Conversation filter options
export type ConversationFilter = {
  page?: number;
  limit?: number;
  search?: string;
};

// Unread count response
export type UnreadCountResponse = {
  status: "success" | "error";
  data: {
    unreadCount: number;
  };
  message: string;
};
