import { useEffect, useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";

export function useFlashMessages() {
  const flash = useState<string | null>(null);
  let socket: WebSocket | null = null;
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    socket = new WebSocket(
      `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/flash`
    );

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "flash") {
          flash.push(data.message);
          setTimeout(() => {
            flash.push(null);
          }, 5000);
        }
      } catch (e) {
        console.warn("Invalid flash message:", event.data);
      }
    };
  }, [user, flash.push, socket]);

  useEffect(() => {
    socket?.close();
  }, [socket]);

  return { flash };
}
