import { create } from "zustand";
import type { FeatureFlag, SystemHealth } from "./admin.type";

type AdminStore = {
  // User Management State
  selectedUsers: string[];
  isUserModalOpen: boolean;
  isImpersonating: boolean;
  impersonatedUser?: {
    id: string;
    name: string;
    email: string;
  };

  // System State
  systemHealth?: SystemHealth;
  lastHealthCheck?: Date;

  // Feature Flags Cache
  featureFlags: FeatureFlag[];

  // UI State
  activeTab: "stats" | "users" | "config" | "features" | "health" | "audit";
  sidebarCollapsed: boolean;

  // Actions
  setSelectedUsers: (ids: string[]) => void;
  toggleUserSelection: (id: string) => void;
  clearSelectedUsers: () => void;
  setUserModalOpen: (isOpen: boolean) => void;
  hasSelectedUsers: () => boolean;
  selectedCount: () => number;

  // Impersonation
  startImpersonation: (user: {
    id: string;
    name: string;
    email: string;
  }) => void;
  stopImpersonation: () => void;

  // System Health
  setSystemHealth: (health: SystemHealth) => void;
  updateLastHealthCheck: () => void;

  // Feature Flags
  setFeatureFlags: (flags: FeatureFlag[]) => void;
  updateFeatureFlag: (id: string, updates: Partial<FeatureFlag>) => void;

  // UI Actions
  setActiveTab: (
    tab: "stats" | "users" | "config" | "features" | "health" | "audit"
  ) => void;
  toggleSidebar: () => void;
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial State
  selectedUsers: [],
  isUserModalOpen: false,
  isImpersonating: false,
  featureFlags: [],
  activeTab: "stats",
  sidebarCollapsed: false,

  // User Management Actions
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

  hasSelectedUsers: () => get().selectedUsers.length > 0,

  selectedCount: () => get().selectedUsers.length,

  // Impersonation Actions
  startImpersonation: (user) => {
    set({
      isImpersonating: true,
      impersonatedUser: user,
    });
  },

  stopImpersonation: () => {
    set({
      isImpersonating: false,
      impersonatedUser: undefined,
    });
  },

  // System Health Actions
  setSystemHealth: (health) => {
    set({ systemHealth: health });
  },

  updateLastHealthCheck: () => {
    set({ lastHealthCheck: new Date() });
  },

  // Feature Flags Actions
  setFeatureFlags: (flags) => {
    set({ featureFlags: flags });
  },

  updateFeatureFlag: (id, updates) => {
    set((state) => ({
      featureFlags: state.featureFlags.map((flag) =>
        flag.id === id ? { ...flag, ...updates } : flag
      ),
    }));
  },

  // UI Actions
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },
}));
