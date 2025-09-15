import { config } from "@kaa/config";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
  // UI State
  sidebarOpen: boolean;
  theme: "light" | "dark";
  language: "en" | "sw";

  // User preferences
  currency: "KES" | "USD";
  notifications: boolean;

  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (language: "en" | "sw") => void;
  setCurrency: (currency: "KES" | "USD") => void;
  setNotifications: (enabled: boolean) => void;

  // Initialize
  initialize: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: false,
      theme: "light",
      language: "en",
      currency: "KES",
      notifications: true,

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof window !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
      },

      setLanguage: (language) => set({ language }),

      setCurrency: (currency) => set({ currency }),

      setNotifications: (enabled) => set({ notifications: enabled }),

      initialize: () => {
        // Apply theme on initialization
        const { theme } = get();
        if (typeof window !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
      },
    }),
    {
      name: `${config.slug}-app-store`,
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        notifications: state.notifications,
      }),
    }
  )
);
