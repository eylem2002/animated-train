import { useState, useEffect, useCallback, useRef } from "react";

interface CollaboratorInfo {
  id: string;
  name: string;
  avatar: string | null;
  color: string;
  cursor: { x: number; y: number } | null;
}

interface UseCollaborationOptions {
  boardId: number;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  enabled?: boolean;
}

interface AssetUpdate {
  assetId: number;
  changes: Record<string, any>;
}

type MessageHandler = (type: string, payload: any) => void;

export function useCollaboration({
  boardId,
  userId,
  userName,
  userAvatar,
  enabled = true,
}: UseCollaborationOptions) {
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [connected, setConnected] = useState(false);
  const [myColor, setMyColor] = useState<string>("#7c3aed");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlersRef = useRef<MessageHandler[]>([]);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const shouldConnect = enabled && boardId > 0 && userId !== "anonymous" && !!userId;

  const connect = useCallback(() => {
    if (!shouldConnect) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/collaborate`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setConnected(true);
      ws.send(JSON.stringify({
        type: "join",
        boardId,
        payload: {
          userId,
          name: userName,
          avatar: userAvatar || null,
        }
      }));

      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case "presence":
            setCollaborators(message.payload.collaborators || []);
            if (message.payload.yourColor) {
              setMyColor(message.payload.yourColor);
            }
            break;
          case "cursor_move":
            setCollaborators((prev) =>
              prev.map((c) =>
                c.id === message.payload.userId
                  ? { ...c, cursor: message.payload.cursor }
                  : c
              )
            );
            break;
          default:
            messageHandlersRef.current.forEach((handler) => {
              handler(message.type, message.payload);
            });
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (shouldConnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [boardId, userId, userName, userAvatar, shouldConnect]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: "leave" }));
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [connect]);

  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "cursor_move",
        payload: { cursor: { x, y } }
      }));
    }
  }, []);

  const sendAssetUpdate = useCallback((update: AssetUpdate) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "asset_update",
        payload: update
      }));
    }
  }, []);

  const sendAssetCreate = useCallback((asset: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "asset_create",
        payload: asset
      }));
    }
  }, []);

  const sendAssetDelete = useCallback((assetId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "asset_delete",
        payload: { assetId }
      }));
    }
  }, []);

  const onMessage = useCallback((handler: MessageHandler) => {
    messageHandlersRef.current.push(handler);
    return () => {
      messageHandlersRef.current = messageHandlersRef.current.filter(
        (h) => h !== handler
      );
    };
  }, []);

  const otherCollaborators = collaborators.filter((c) => c.id !== userId);

  return {
    collaborators: otherCollaborators,
    allCollaborators: collaborators,
    connected,
    myColor,
    sendCursorPosition,
    sendAssetUpdate,
    sendAssetCreate,
    sendAssetDelete,
    onMessage,
  };
}
