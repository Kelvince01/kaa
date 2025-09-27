import { useEffect, useState } from "react";

const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
const RECONNECT_DELAY = 5000;

export function useWebSocket() {
  const messages = useState<string[]>([]);
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;

  function connect() {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("✅ WS connected");
    };

    socket.onmessage = (event) => {
      if (event.data === "ping") {
        socket?.send("pong");
        return;
      }

      messages.push(event.data);
    };

    socket.onclose = () => {
      console.warn("⚠️ WS disconnected. Reconnecting...");
      reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY);
    };

    socket.onerror = (err) => {
      console.error("❌ WS error:", err);
      socket?.close();
    };
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: by author
  useEffect(() => {
    connect();
  }, []);

  useEffect(() => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  }, [reconnectTimer, socket]);

  function send(msg: string) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ message: msg }));
    }
  }

  return { messages, send };
}
