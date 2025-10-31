/**
 * Message Store
 *
 * Zustand store for message state management
 * Handles real-time updates, local state, and UI state
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  ConversationResponse,
  MessageResponse,
  ParticipantRole,
  SocketMessagePayload,
  TypingIndicatorPayload,
  UserPresencePayload,
} from "./message.type";
import { SocketEvent } from "./message.type";

type MessageStoreState = {
  // Current conversation
  currentConversationId: string | null;

  // Conversations cache
  conversations: Map<string, ConversationResponse>;

  // Messages cache (conversationId -> messages)
  messages: Map<string, MessageResponse[]>;

  // Typing indicators (conversationId -> userId[])
  typingUsers: Map<
    string,
    Array<{ userId: string; userName: string; timestamp: number }>
  >;

  // Online users
  onlineUsers: Set<string>;

  // User presence data
  userPresence: Map<string, { isOnline: boolean; lastSeen?: string }>;

  // WebSocket connection status
  isWebSocketConnected: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Unread counts
  unreadCounts: Map<string, number>;
  totalUnreadCount: number;
};

type MessageStoreActions = {
  // Conversation actions
  setCurrentConversation: (conversationId: string | null) => void;
  addConversation: (conversation: ConversationResponse) => void;
  updateConversation: (
    conversationId: string,
    updates: Partial<ConversationResponse>
  ) => void;
  removeConversation: (conversationId: string) => void;

  // Message actions
  addMessage: (conversationId: string, message: MessageResponse) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<MessageResponse>
  ) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  setMessages: (conversationId: string, messages: MessageResponse[]) => void;

  // Typing indicators
  addTypingUser: (
    conversationId: string,
    userId: string,
    userName: string
  ) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  clearTypingUsers: (conversationId: string) => void;

  // Presence actions
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  updateUserPresence: (
    userId: string,
    presence: { isOnline: boolean; lastSeen?: string }
  ) => void;

  // WebSocket actions
  setWebSocketConnected: (connected: boolean) => void;

  // Unread count actions
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnreadCount: (conversationId: string) => void;
  decrementUnreadCount: (conversationId: string) => void;
  updateTotalUnreadCount: () => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Real-time event handlers
  handleSocketMessage: (event: SocketEvent, payload: any) => void;

  // Utility actions
  reset: () => void;
  getConversation: (conversationId: string) => ConversationResponse | undefined;
  getMessages: (conversationId: string) => MessageResponse[];
  getTypingUsers: (
    conversationId: string
  ) => Array<{ userId: string; userName: string; timestamp: number }>;
  isUserOnline: (userId: string) => boolean;
};

type MessageStore = MessageStoreState & MessageStoreActions;

const initialState: MessageStoreState = {
  currentConversationId: null,
  conversations: new Map(),
  messages: new Map(),
  typingUsers: new Map(),
  onlineUsers: new Set(),
  userPresence: new Map(),
  isWebSocketConnected: false,
  isLoading: false,
  error: null,
  unreadCounts: new Map(),
  totalUnreadCount: 0,
};

export const useMessageStore = create<MessageStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Conversation actions
    setCurrentConversation: (conversationId) => {
      set({ currentConversationId: conversationId });
    },

    addConversation: (conversation) => {
      set((state) => {
        const newConversations = new Map(state.conversations);
        newConversations.set(conversation.conversation._id || "", conversation);
        return { conversations: newConversations };
      });
    },

    updateConversation: (conversationId, updates) => {
      set((state) => {
        const newConversations = new Map(state.conversations);
        const existing = newConversations.get(conversationId);
        if (existing) {
          newConversations.set(conversationId, { ...existing, ...updates });
        }
        return { conversations: newConversations };
      });
    },

    removeConversation: (conversationId) => {
      set((state) => {
        const newConversations = new Map(state.conversations);
        const newMessages = new Map(state.messages);
        const newTypingUsers = new Map(state.typingUsers);
        const newUnreadCounts = new Map(state.unreadCounts);

        newConversations.delete(conversationId);
        newMessages.delete(conversationId);
        newTypingUsers.delete(conversationId);
        newUnreadCounts.delete(conversationId);

        return {
          conversations: newConversations,
          messages: newMessages,
          typingUsers: newTypingUsers,
          unreadCounts: newUnreadCounts,
        };
      });
      get().updateTotalUnreadCount();
    },

    // Message actions
    addMessage: (conversationId, message) => {
      set((state) => {
        const newMessages = new Map(state.messages);
        const conversationMessages = newMessages.get(conversationId) || [];
        newMessages.set(conversationId, [...conversationMessages, message]);
        return { messages: newMessages };
      });
    },

    updateMessage: (conversationId, messageId, updates) => {
      set((state) => {
        const newMessages = new Map(state.messages);
        const conversationMessages = newMessages.get(conversationId) || [];
        const messageIndex = conversationMessages.findIndex(
          (msg) => msg.message._id === messageId
        );

        if (messageIndex !== -1) {
          const updatedMessages = [...conversationMessages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            ...updates,
          } as MessageResponse;
          newMessages.set(conversationId, updatedMessages);
        }

        return { messages: newMessages };
      });
    },

    removeMessage: (conversationId, messageId) => {
      set((state) => {
        const newMessages = new Map(state.messages);
        const conversationMessages = newMessages.get(conversationId) || [];
        const filteredMessages = conversationMessages.filter(
          (msg) => msg.message._id !== messageId
        );
        newMessages.set(conversationId, filteredMessages);
        return { messages: newMessages };
      });
    },

    setMessages: (conversationId, messages) => {
      set((state) => {
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, messages);
        return { messages: newMessages };
      });
    },

    // Typing indicators
    addTypingUser: (conversationId, userId, userName) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        const conversationTyping = newTypingUsers.get(conversationId) || [];
        const existingIndex = conversationTyping.findIndex(
          (user) => user.userId === userId
        );

        if (existingIndex === -1) {
          newTypingUsers.set(conversationId, [
            ...conversationTyping,
            { userId, userName, timestamp: Date.now() },
          ]);
        }

        return { typingUsers: newTypingUsers };
      });
    },

    removeTypingUser: (conversationId, userId) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        const conversationTyping = newTypingUsers.get(conversationId) || [];
        const filtered = conversationTyping.filter(
          (user) => user.userId !== userId
        );
        newTypingUsers.set(conversationId, filtered);
        return { typingUsers: newTypingUsers };
      });
    },

    clearTypingUsers: (conversationId) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        newTypingUsers.set(conversationId, []);
        return { typingUsers: newTypingUsers };
      });
    },

    // Presence actions
    setUserOnline: (userId) => {
      set((state) => {
        const newOnlineUsers = new Set(state.onlineUsers);
        const newUserPresence = new Map(state.userPresence);

        newOnlineUsers.add(userId);
        newUserPresence.set(userId, { isOnline: true });

        return {
          onlineUsers: newOnlineUsers,
          userPresence: newUserPresence,
        };
      });
    },

    setUserOffline: (userId) => {
      set((state) => {
        const newOnlineUsers = new Set(state.onlineUsers);
        const newUserPresence = new Map(state.userPresence);

        newOnlineUsers.delete(userId);
        newUserPresence.set(userId, {
          isOnline: false,
          lastSeen: new Date().toISOString(),
        });

        return {
          onlineUsers: newOnlineUsers,
          userPresence: newUserPresence,
        };
      });
    },

    updateUserPresence: (userId, presence) => {
      set((state) => {
        const newUserPresence = new Map(state.userPresence);
        newUserPresence.set(userId, presence);
        return { userPresence: newUserPresence };
      });
    },

    // WebSocket actions
    setWebSocketConnected: (connected) => {
      set({ isWebSocketConnected: connected });
    },

    // Unread count actions
    setUnreadCount: (conversationId, count) => {
      set((state) => {
        const newUnreadCounts = new Map(state.unreadCounts);
        newUnreadCounts.set(conversationId, count);
        return { unreadCounts: newUnreadCounts };
      });
      get().updateTotalUnreadCount();
    },

    incrementUnreadCount: (conversationId) => {
      set((state) => {
        const newUnreadCounts = new Map(state.unreadCounts);
        const current = newUnreadCounts.get(conversationId) || 0;
        newUnreadCounts.set(conversationId, current + 1);
        return { unreadCounts: newUnreadCounts };
      });
      get().updateTotalUnreadCount();
    },

    decrementUnreadCount: (conversationId) => {
      set((state) => {
        const newUnreadCounts = new Map(state.unreadCounts);
        const current = newUnreadCounts.get(conversationId) || 0;
        newUnreadCounts.set(conversationId, Math.max(0, current - 1));
        return { unreadCounts: newUnreadCounts };
      });
      get().updateTotalUnreadCount();
    },

    updateTotalUnreadCount: () => {
      const { unreadCounts } = get();
      const total = Array.from(unreadCounts.values()).reduce(
        (sum, count) => sum + count,
        0
      );
      set({ totalUnreadCount: total });
    },

    // UI state actions
    setLoading: (loading) => {
      set({ isLoading: loading });
    },

    setError: (error) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },

    // Real-time event handlers
    handleSocketMessage: (event, payload) => {
      const actions = get();

      switch (event) {
        case SocketEvent.MESSAGE_SENT: {
          const messagePayload = payload as SocketMessagePayload;
          actions.addMessage(messagePayload.conversationId, {
            message: messagePayload.message,
            sender: messagePayload.sender as {
              _id: string;
              firstName: string;
              lastName: string;
              avatar?: string;
              role: ParticipantRole;
            },
            conversation: {
              _id: messagePayload.conversationId,
              title: "",
              type: "direct" as any,
            },
            isDelivered: true,
            isRead: false,
            canEdit: true,
            canDelete: true,
          });
          break;
        }

        case SocketEvent.TYPING_START: {
          const typingPayload = payload as TypingIndicatorPayload;
          actions.addTypingUser(
            typingPayload.conversationId,
            typingPayload.userId,
            typingPayload.userName
          );
          break;
        }

        case SocketEvent.TYPING_STOP: {
          const stopTypingPayload = payload as TypingIndicatorPayload;
          actions.removeTypingUser(
            stopTypingPayload.conversationId,
            stopTypingPayload.userId
          );
          break;
        }

        case SocketEvent.USER_ONLINE: {
          const onlinePayload = payload as UserPresencePayload;
          actions.setUserOnline(onlinePayload.userId);
          break;
        }

        case SocketEvent.USER_OFFLINE: {
          const offlinePayload = payload as UserPresencePayload;
          actions.setUserOffline(offlinePayload.userId);
          break;
        }

        default:
          break;
      }
    },

    // Utility actions
    reset: () => {
      set(initialState);
    },

    getConversation: (conversationId) =>
      get().conversations.get(conversationId),

    getMessages: (conversationId) => get().messages.get(conversationId) || [],

    getTypingUsers: (conversationId) =>
      get().typingUsers.get(conversationId) || [],

    isUserOnline: (userId) => get().onlineUsers.has(userId),
  }))
);

// Selectors for common use cases
export const useCurrentConversation = () =>
  useMessageStore((state) => state.currentConversationId);

export const useConversationMessages = (conversationId: string) =>
  useMessageStore((state) => state.getMessages(conversationId));

export const useTypingUsers = (conversationId: string) =>
  useMessageStore((state) => state.getTypingUsers(conversationId));

export const useUnreadCount = (conversationId?: string) =>
  useMessageStore((state) =>
    conversationId
      ? state.unreadCounts.get(conversationId) || 0
      : state.totalUnreadCount
  );

export const useWebSocketStatus = () =>
  useMessageStore((state) => state.isWebSocketConnected);

export const useOnlineUsers = () =>
  useMessageStore((state) => Array.from(state.onlineUsers));

export const useIsUserOnline = (userId: string) =>
  useMessageStore((state) => state.isUserOnline(userId));
