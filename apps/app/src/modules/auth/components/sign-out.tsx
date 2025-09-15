"use client";

import { useRouter, useSearchParams } from "next/navigation";
// import { useAuthStore } from "@/stores/auth.store";
// import { useDraftStore } from "@/stores/draft";
// import { useNavigationStore } from "@/stores/navigation";
// import { useUIStore } from "@/stores/ui";
// import { queryClient } from "@/trpc/query-client";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toaster } from "@/components/common/toaster";
import { queryClient } from "@/query/query-client";
import { useAlertStore } from "@/shared/stores/alert.store";
import { useAuthStore } from "../auth.store";

export const flushStoresAndCache = (removeAccount?: boolean) => {
  queryClient.clear();
  useAuthStore.setState({ user: null });
  // useUserStore.setState({ user: null as unknown as MeUser });
  // useSyncStore.setState({ syncData: {} });
  // useDraftStore.getState().clearForms();
  // useNavigationStore.getState().clearNavigationStore();
  // useUIStore.getState().setImpersonating(false);

  if (!removeAccount) {
    return;
  }
  useAlertStore.getState().clearAlertStore();
  // useUIStore.getState().clearUIStore();
};

// Sign out user and clear all stores and query cache
export const SignOut = () => {
  const { logout } = useAuthStore();
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const force = searchParams.get("force");

  const signOutTriggeredRef = useRef(false);

  useEffect(() => {
    if (signOutTriggeredRef.current) {
      return;
    }

    signOutTriggeredRef.current = true;

    const performSignOut = () => {
      try {
        logout();
        flushStoresAndCache(!!force);
        toaster(t("common.success.signed_out"), "success");
        router.push("/about");
      } catch (_error) {
        toaster(t("common.error.signed_out_failed"), "error");
      }
    };

    performSignOut();
  }, [force, t, logout, router.push]);

  return null;
};
