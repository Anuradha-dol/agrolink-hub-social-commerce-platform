import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8081/ws";

export function useChatSocket(conversationId, onMessage, onTyping, onPresence) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 3000,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false)
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) clientRef.current.deactivate();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connected) return;

    const subs = [];

    if (conversationId) {
      subs.push(client.subscribe(`/topic/chat/conversations/${conversationId}`, (message) => {
        try {
          onMessage?.(JSON.parse(message.body));
        } catch {
          // ignore invalid payload
        }
      }));

      subs.push(client.subscribe(`/topic/chat/conversations/${conversationId}/typing`, (message) => {
        try {
          onTyping?.(JSON.parse(message.body));
        } catch {
          // ignore invalid payload
        }
      }));
    }

    if (onPresence) {
      subs.push(client.subscribe(`/topic/presence`, (message) => {
        try {
          onPresence?.(JSON.parse(message.body));
        } catch {
          // ignore invalid payload
        }
      }));
    }

    return () => {
      subs.forEach(s => s.unsubscribe());
    };
  }, [connected, conversationId, onMessage, onTyping, onPresence]);

  const sendRealtimeMessage = (payload) => {
    const client = clientRef.current;
    if (!client || !connected || !conversationId) return;
    client.publish({
      destination: `/app/chat/send/${conversationId}`,
      body: JSON.stringify(payload)
    });
  };

  const sendTyping = (typing) => {
    const client = clientRef.current;
    if (!client || !connected || !conversationId) return;
    client.publish({
      destination: `/app/chat/typing/${conversationId}`,
      body: JSON.stringify({ conversationId, typing: !!typing })
    });
  };

  return {
    connected,
    sendRealtimeMessage,
    sendTyping
  };
}
