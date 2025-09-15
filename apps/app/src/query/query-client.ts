"use client";

import {
  MutationCache,
  onlineManager,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { onError } from "@/query/on-error";
import { useAlertStore } from "@/shared/stores/alert.store";

const onSuccess = () => {
  // Clear down alerts
  useAlertStore.getState().setDownAlert(null);
};

const queryClientConfig = { onError, onSuccess };

/**
 * Handle online status
 */
function handleOnlineStatus() {
  onlineManager.setOnline(navigator.onLine);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", handleOnlineStatus);
  window.addEventListener("offline", handleOnlineStatus);
}
handleOnlineStatus();

/**
 * Our queryClient instance
 *
 * @link https://tanstack.com/query/latest/docs/reference/QueryClient
 */
export const queryClient = new QueryClient({
  mutationCache: new MutationCache(queryClientConfig),
  queryCache: new QueryCache(queryClientConfig),
  defaultOptions: {
    queries: {
      // networkMode: 'offlineFirst',
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes

      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
