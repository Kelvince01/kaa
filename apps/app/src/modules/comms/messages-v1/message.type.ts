// Message attachment (matches API MVP structure)
export type MessageAttachment = {
  url: string;
  key?: string; // S3 key
  filename: string;
  contentType: string;
  size: number;
  name?: string;
  type?: string;
};

// Message interface (matches API MVP structure)
export type Message = {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  isRead: boolean;
  property?: string;
  booking?: string;
  conversation?: string;
  attachments?: MessageAttachment[];
  originalAttachments?: MessageAttachment[];
  readAt?: string;
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;

  // Additional fields for frontend display
  senderInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  receiverInfo?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
};

// Create message input (matches API structure)
export type CreateMessageInput = {
  content: string;
  attachments?: MessageAttachment[];
};

// Create conversation input (matches API structure)
export type CreateConversationInput = {
  recipientId: string;
  propertyId?: string;
  initialMessage?: string;
};

// Message filter options
export type MessageFilter = {
  conversationId?: string;
  senderId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  hasAttachments?: boolean;
  isDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// Message list response
export type MessageListResponse = {
  items: Message[];
  pagination: {
    pages: number;
    total: number;
    page: number;
    limit: number;
  };
  status: "success" | "error";
  message?: string;
};

// Message response
export type MessageResponse = {
  data: Message;
  status: "success" | "error";
  message?: string;
};
