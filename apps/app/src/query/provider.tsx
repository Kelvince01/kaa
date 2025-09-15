"use client";

import { QueryClientProvider as BaseQueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useEffect } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { persister } from "@/query/persister";
import { queryClient } from "@/query/query-client";
import { useUIStore } from "@/shared/stores/ui.store";

const GC_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const QueryClientProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuthStore();
  const { offlineAccess } = useUIStore();

  useEffect(() => {
    // Exit early if offline access is disabled or no stored user is available
    if (!(offlineAccess && user)) return;

    let isCancelled = false;

    return () => {
      isCancelled = true;
    };
  }, [offlineAccess, user]);

  if (!offlineAccess)
    return (
      <BaseQueryClientProvider client={queryClient}>
        {children}
      </BaseQueryClientProvider>
    );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      onSuccess={() => {
        // resume mutations after initial restore from localStorage was successful
        queryClient
          .resumePausedMutations()
          .then(() => queryClient.invalidateQueries());
      }}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
