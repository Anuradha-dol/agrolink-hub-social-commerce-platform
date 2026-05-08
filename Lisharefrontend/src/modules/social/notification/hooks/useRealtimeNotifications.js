import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:4041/ws";

export function useRealtimeNotifications(userId, onNotification) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            onNotification?.(payload);
          } catch {
            // ignore parse issues
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false)
    });

    client.activate();
    clientRef.current = client;

    return () => {
      setConnected(false);
      if (clientRef.current) clientRef.current.deactivate();
      clientRef.current = null;
    };
  }, [userId, onNotification]);

  return { connected };
}
