"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "../auth/auth.store";
import type { User } from "../users/user.type";
import { meService } from "./me.service";
import { useMeStore } from "./me.store";

// Get current user hook
export const useCurrentUser = () => {
  const { user, setUser, setLoading } = useAuthStore();
  const { setContext, setLoading: setMeLoading, setError } = useMeStore();

  const { data, error, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: meService.fetchUserContext,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Update loading states
  useEffect(() => {
    setLoading(isLoading);
    setMeLoading(isLoading);
  }, [isLoading, setLoading, setMeLoading]);

  // Update user in auth store
  useEffect(() => {
    if (data?.user) {
      setUser(data.user as User);
    }
  }, [data?.user, setUser]);

  // Update context in me store
  useEffect(() => {
    if (data?.context) {
      setContext(data.context);
    }
  }, [data?.context, setContext]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setError(true);
      if ((error as any).response?.status === 401) {
        useAuthStore.getState().logout();
      }
    }
  }, [error, setError]);
};

/**
 * Hook to get user context (role, member, organization, profile)
 * This provides unified access to all user-related data
 */
export const useUserContext = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    setContext,
    setLoading: setMeLoading,
    setError: setMeError,
  } = useMeStore();

  const query = useQuery({
    queryKey: ["user-context", user?.id],
    queryFn: meService.fetchUserContext,
    enabled: !!user && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    select: (data) => ({
      user: data.user,
      context: data.context ?? null,
    }),
  });

  // Sync query data with store
  useEffect(() => {
    setMeLoading(query.isLoading);
  }, [query.isLoading, setMeLoading]);

  useEffect(() => {
    if (query.data?.context) {
      setContext(query.data.context);
    }
  }, [query.data?.context, setContext]);

  useEffect(() => {
    if (query.isError) {
      setMeError(true);
    } else {
      setMeError(false);
    }
  }, [query.isError, setMeError]);

  return {
    ...query,
    user: query.data?.user,
    context: query.data?.context ?? null,
    role: query.data?.context?.role ?? null,
    member: query.data?.context?.member ?? null,
    organization: query.data?.context?.organization ?? null,
    profile: query.data?.context?.profile ?? null,

    // Helper methods
    hasOrganization: !!query.data?.context?.organization,
    isLandlord: query.data?.context?.role?.name === "landlord",
    isTenant: query.data?.context?.role?.name === "tenant",
    isAdmin: query.data?.context?.role?.name === "admin",
  };
};

/**
 * Hook specifically for organization data
 */
export const useOrganization = () => {
  const { organization, member, hasOrganization } = useUserContext();

  return {
    organization,
    member,
    hasOrganization,
    organizationName: organization?.name,
    organizationLogo: organization?.logo,
    plan: member?.plan ?? "basic",
  };
};

/**
 * Hook specifically for role checking
 */
export const useUserRole = () => {
  const { role, isLandlord, isTenant, isAdmin } = useUserContext();

  return {
    role,
    roleName: role?.name ?? null,
    isPrimary: role?.isPrimary ?? false,
    isLandlord,
    isTenant,
    isAdmin,
    hasRole: (roleName: string) => role?.name === roleName,
    hasAnyRole: (roleNames: string[]) =>
      role?.name ? roleNames.includes(role.name) : false,
  };
};

/**
 * Hook to access me store data directly (without React Query)
 * Useful when you need the persisted data without triggering a fetch
 */
export const useMeStoreData = () => {
  const store = useMeStore();

  return {
    context: store.context,
    role: store.role,
    member: store.member,
    organization: store.organization,
    profile: store.profile,
    isLoading: store.isLoading,
    isError: store.isError,

    // Helper methods from store
    hasOrganization: store.hasOrganization(),
    isLandlord: store.isLandlord(),
    isTenant: store.isTenant(),
    isAdmin: store.isAdmin(),
    roleName: store.getRoleName(),

    // Store actions
    setContext: store.setContext,
    setRole: store.setRole,
    setMember: store.setMember,
    setOrganization: store.setOrganization,
    setProfile: store.setProfile,
    clearContext: store.clearContext,
  };
};
