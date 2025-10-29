// DEPRECATED: This file is replaced by conversation.queries.ts
// All message operations should go through conversation context
// Keeping this file temporarily for backward compatibility

import { conversationKeys } from "./conversation.queries";

// Re-export conversation keys as message keys for compatibility
export const messageKeys = conversationKeys;

// Re-export hooks with compatible names
export {
  useConversationMessages as useMessages,
  useDeleteMessage,
  useSendMessage as useCreateMessage,
} from "./conversation.queries";
