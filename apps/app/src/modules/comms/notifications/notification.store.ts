import { create } from "zustand";

type NotificationStore = {
  // Local state for UI interactions
  selectedNotifications: string[];
  isNotificationCenterOpen: boolean;
  isNotificationPopupOpen: boolean;

  // Actions for UI state management
  setSelectedNotifications: (notificationIds: string[]) => void;
  toggleNotificationSelection: (notificationId: string) => void;
  clearSelectedNotifications: () => void;
  setNotificationCenterOpen: (isOpen: boolean) => void;
  setNotificationPopupOpen: (isOpen: boolean) => void;

  // Computed getters
  hasSelectedNotifications: () => boolean;
  selectedCount: () => number;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Local state
  selectedNotifications: [],
  isNotificationCenterOpen: false,
  isNotificationPopupOpen: false,

  // Actions
  setSelectedNotifications: (notificationIds: string[]) => {
    set({ selectedNotifications: notificationIds });
  },

  toggleNotificationSelection: (notificationId: string) => {
    set((state) => {
      const isSelected = state.selectedNotifications.includes(notificationId);
      const newSelected = isSelected
        ? state.selectedNotifications.filter((id) => id !== notificationId)
        : [...state.selectedNotifications, notificationId];
      return { selectedNotifications: newSelected };
    });
  },

  clearSelectedNotifications: () => {
    set({ selectedNotifications: [] });
  },

  setNotificationCenterOpen: (isOpen: boolean) => {
    set({ isNotificationCenterOpen: isOpen });
  },

  setNotificationPopupOpen: (isOpen: boolean) => {
    set({ isNotificationPopupOpen: isOpen });
  },

  // Computed getters
  hasSelectedNotifications: () => get().selectedNotifications.length > 0,

  selectedCount: () => get().selectedNotifications.length,
}));
