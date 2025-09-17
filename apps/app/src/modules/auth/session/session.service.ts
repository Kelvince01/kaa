import { httpClient } from "@/lib/axios";
import type { Session } from "./session.type";

export const sessionService = {
  async getSessions(): Promise<{
    sessions: Session[];
    currentSessionId: string;
  }> {
    const response = await httpClient.api.get("/auth/sessions");
    return response.data;
  },

  async terminateSession(sessionId: string): Promise<{ message: string }> {
    const response = await httpClient.api.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  async terminateAllSessions(): Promise<{ count: number }> {
    const response = await httpClient.api.delete("/auth/sessions");
    return response.data;
  },
};
