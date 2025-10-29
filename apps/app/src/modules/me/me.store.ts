"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  UserContext,
  UserMember,
  UserOrganization,
  UserProfile,
  UserRole,
} from "./me.type";

type MeState = {
  // User context data
  context: UserContext | null;
  role: UserRole | null;
  member: UserMember | null;
  organization: UserOrganization | null;
  profile: UserProfile | null;

  // Loading states
  isLoading: boolean;
  isError: boolean;

  // Actions
  setContext: (context: UserContext | null) => void;
  setRole: (role: UserRole | null) => void;
  setMember: (member: UserMember | null) => void;
  setOrganization: (organization: UserOrganization | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
  clearContext: () => void;

  // Computed values
  hasOrganization: () => boolean;
  isLandlord: () => boolean;
  isTenant: () => boolean;
  isAdmin: () => boolean;
  getRoleName: () => string | null;
};

export const useMeStore = create<MeState>()(
  persist(
    (set, get) => ({
      // Initial state
      context: null,
      role: null,
      member: null,
      organization: null,
      profile: null,
      isLoading: false,
      isError: false,

      // Actions
      setContext: (context) =>
        set({
          context,
          role: context?.role ?? null,
          member: context?.member ?? null,
          organization: context?.organization ?? null,
          profile: context?.profile ?? null,
        }),

      setRole: (role) =>
        set((state) => ({
          role,
          context: state.context ? { ...state.context, role } : null,
        })),

      setMember: (member) =>
        set((state) => ({
          member,
          context: state.context ? { ...state.context, member } : null,
        })),

      setOrganization: (organization) =>
        set((state) => ({
          organization,
          context: state.context ? { ...state.context, organization } : null,
        })),

      setProfile: (profile) =>
        set((state) => ({
          profile,
          context: state.context ? { ...state.context, profile } : null,
        })),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ isError: error }),

      clearContext: () =>
        set({
          context: null,
          role: null,
          member: null,
          organization: null,
          profile: null,
          isLoading: false,
          isError: false,
        }),

      // Computed values
      hasOrganization: () => !!get().organization,
      isLandlord: () => get().role?.name === "landlord",
      isTenant: () => get().role?.name === "tenant",
      isAdmin: () => get().role?.name === "admin",
      getRoleName: () => get().role?.name ?? null,
    }),
    {
      name: "me-store",
      partialize: (state) => ({
        context: state.context,
        role: state.role,
        member: state.member,
        organization: state.organization,
        profile: state.profile,
      }),
    }
  )
);
