import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import { sessionService } from "./session.service";
import type { Session } from "./session.type";

// Query keys
export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
};

// Hooks for session data fetching
export const useSessions = () => {
  return useQuery({
    queryKey: sessionKeys.lists(),
    queryFn: () => sessionService.getSessions(),
  });
};

export const useSession = (id: string) => {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: async () => {
      const { sessions } = await sessionService.getSessions();
      return sessions.find((session: Session) => session.id === id);
    },
    enabled: !!id,
  });
};

// Mutation hooks
export const useTerminateSession = () => {
  return useMutation({
    mutationFn: (sessionId: string) =>
      sessionService.terminateSession(sessionId),
    onSuccess: (_, sessionId) => {
      // Update the cache to remove the terminated session
      queryClient.setQueryData(sessionKeys.lists(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            sessions: old.data.sessions.filter(
              (s: Session) => s.id !== sessionId
            ),
          },
        };
      });

      toast.success("Session terminated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to terminate session: ${error.message}`);
    },
  });
};

export const useTerminateAllSessions = () => {
  return useMutation({
    mutationFn: () => sessionService.terminateAllSessions(),
    onSuccess: () => {
      // Update the cache to keep only the current session
      queryClient.setQueryData(sessionKeys.lists(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            sessions: old.data.sessions.filter(
              (s: Session) => s.id !== old.data.currentSessionId
            ),
          },
        };
      });

      toast.success("All other sessions have been terminated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to terminate sessions: ${error.message}`);
    },
  });
};
