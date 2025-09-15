import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "../users/user.type";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Mock login - replace with actual API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log("email", password.length);

          const mockUser: User = {
            id: "1",
            name: "John Doe",
            email,
            phone: "+254712345678",
            avatar:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
            isVerified: true,
            userType: "tenant",
            createdAt: new Date().toISOString(),
          };

          set({ user: mockUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData: Partial<User>) => {
        set({ isLoading: true });
        try {
          // Mock registration - replace with actual API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const newUser: User = {
            id: Date.now().toString(),
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            avatar: userData.avatar,
            isVerified: false,
            userType: userData.userType || "tenant",
            createdAt: new Date().toISOString(),
          };

          set({ user: newUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
