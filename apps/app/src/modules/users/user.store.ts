import { create } from "zustand";

type UserStore = {
  selectedUsers: string[];
  isUserModalOpen: boolean;
  setSelectedUsers: (ids: string[]) => void;
  toggleUserSelection: (id: string) => void;
  clearSelectedUsers: () => void;
  setUserModalOpen: (isOpen: boolean) => void;
  hasSelectedUsers: () => boolean;
  selectedCount: () => number;
};

export const useUserStore = create<UserStore>((set, get) => ({
  selectedUsers: [],
  isUserModalOpen: false,

  setSelectedUsers: (ids: string[]) => {
    set({ selectedUsers: ids });
  },

  toggleUserSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedUsers.includes(id);
      const newSelected = isSelected
        ? state.selectedUsers.filter((i) => i !== id)
        : [...state.selectedUsers, id];
      return { selectedUsers: newSelected };
    });
  },

  clearSelectedUsers: () => {
    set({ selectedUsers: [] });
  },

  setUserModalOpen: (isOpen: boolean) => {
    set({ isUserModalOpen: isOpen });
  },

  hasSelectedUsers: () => {
    return get().selectedUsers.length > 0;
  },

  selectedCount: () => {
    return get().selectedUsers.length;
  },
}));
