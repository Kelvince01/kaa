import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { ProcessedConversation } from "./conversation.type";

type MessageStore = {
  // Conversation state
  conversations: ProcessedConversation[];
  currentConversation: ProcessedConversation | null;
  conversationLoading: boolean;
  unreadCount: number;

  // Message selection state
  selectedMessages: string[];
  isMessageModalOpen: boolean;
  isComposingMessage: boolean;
  typingUsers: Record<string, { userId: string; userName: string }[]>;

  // Conversation methods
  setConversations: (conversations: ProcessedConversation[]) => void;
  setCurrentConversation: (conversation: ProcessedConversation | null) => void;
  updateConversationUnread: (conversationId: string, count: number) => void;
  setUnreadCount: (count: number) => void;
  setConversationLoading: (loading: boolean) => void;

  // Selection methods
  setSelectedMessages: (ids: string[]) => void;
  toggleMessageSelection: (id: string) => void;
  clearSelectedMessages: () => void;
  hasSelectedMessages: () => boolean;
  selectedCount: () => number;

  // Modal methods
  setMessageModalOpen: (isOpen: boolean) => void;

  // Composing methods
  setComposingMessage: (isComposing: boolean) => void;

  // Typing indicator methods
  setUserTyping: (
    conversationId: string,
    userId: string,
    userName: string
  ) => void;
  removeUserTyping: (conversationId: string, userId: string) => void;
  clearTypingUsers: (conversationId: string) => void;
  getTypingUsers: (
    conversationId: string
  ) => { userId: string; userName: string }[];
};

export const useMessageStore = create<MessageStore>((set, get) => ({
  // Conversation state
  conversations: [],
  currentConversation: null,
  conversationLoading: false,
  unreadCount: 0,

  // Message state
  selectedMessages: [],
  isMessageModalOpen: false,
  isComposingMessage: false,
  typingUsers: {},

  // Conversation methods
  setConversations: (conversations: ProcessedConversation[]) => {
    set({ conversations });
  },

  setCurrentConversation: (conversation: ProcessedConversation | null) => {
    set({ currentConversation: conversation });
  },

  updateConversationUnread: (conversationId: string, count: number) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv._id === conversationId
          ? {
              ...conv,
              unreadCount: { ...conv.unreadCount, [conversationId]: count },
            }
          : conv
      ),
    }));
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },

  setConversationLoading: (loading: boolean) => {
    set({ conversationLoading: loading });
  },

  // Selection methods
  setSelectedMessages: (ids: string[]) => {
    set({ selectedMessages: ids });
  },

  toggleMessageSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedMessages.includes(id);
      const newSelected = isSelected
        ? state.selectedMessages.filter((i) => i !== id)
        : [...state.selectedMessages, id];
      return { selectedMessages: newSelected };
    });
  },

  clearSelectedMessages: () => {
    set({ selectedMessages: [] });
  },

  hasSelectedMessages: () => get().selectedMessages.length > 0,

  selectedCount: () => get().selectedMessages.length,

  // Modal methods
  setMessageModalOpen: (isOpen: boolean) => {
    set({ isMessageModalOpen: isOpen });
  },

  // Composing methods
  setComposingMessage: (isComposing: boolean) => {
    set({ isComposingMessage: isComposing });
  },

  // Typing indicator methods
  setUserTyping: (conversationId: string, userId: string, userName: string) => {
    set((state) => {
      const currentTyping = state.typingUsers[conversationId] || [];
      const userExists = currentTyping.some((user) => user.userId === userId);

      if (!userExists) {
        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: [...currentTyping, { userId, userName }],
          },
        };
      }
      return state;
    });
  },

  removeUserTyping: (conversationId: string, userId: string) => {
    set((state) => {
      const currentTyping = state.typingUsers[conversationId] || [];
      const filteredTyping = currentTyping.filter(
        (user) => user.userId !== userId
      );

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: filteredTyping,
        },
      };
    });
  },

  clearTypingUsers: (conversationId: string) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: [],
      },
    }));
  },

  getTypingUsers: (conversationId: string) =>
    get().typingUsers[conversationId] || [],
}));

export const useCurrentMessageStore = () =>
  useMessageStore(
    useShallow((state) => ({
      currentConversation: state.currentConversation,
      setCurrentConversation: state.setCurrentConversation,
      conversations: state.conversations,
      setConversations: state.setConversations,
    }))
  );
