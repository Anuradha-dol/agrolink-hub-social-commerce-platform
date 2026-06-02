import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:4041/ws";

export function useRealtimeNotifications(userId, onNotification) {
  const clientRef = useRef(null);
  const onNotificationRef = useRef(onNotification);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!userId) return undefined;

    let subscriptions = [];
    const handleMessage = (message) => {
      try {
        const payload = JSON.parse(message.body);
        onNotificationRef.current?.(payload);
      } catch {
        // Ignore malformed websocket payloads; polling fallback will resync.
      }
    };

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        subscriptions.forEach((subscription) => subscription.unsubscribe());
        subscriptions = [
          client.subscribe(`/topic/notifications/${userId}`, handleMessage),
          client.subscribe("/user/queue/notifications", handleMessage)
        ];
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false)
    });

    client.activate();
    clientRef.current = client;

    return () => {
      setConnected(false);
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      subscriptions = [];
      if (clientRef.current) clientRef.current.deactivate();
      clientRef.current = null;
    };
  }, [userId]);

  return { connected };
}
