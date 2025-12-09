import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { log } from "./index";

interface CollaboratorInfo {
  id: string;
  name: string;
  avatar: string | null;
  color: string;
  cursor: { x: number; y: number } | null;
  lastSeen: number;
}

interface BoardRoom {
  boardId: number;
  collaborators: Map<string, { ws: WebSocket; info: CollaboratorInfo }>;
}

type MessageType =
  | "join"
  | "leave"
  | "cursor_move"
  | "asset_update"
  | "asset_create"
  | "asset_delete"
  | "presence"
  | "ping"
  | "pong";

interface WSMessage {
  type: MessageType;
  boardId?: number;
  payload?: any;
}

const COLLABORATOR_COLORS = [
  "#7c3aed", "#ec4899", "#f59e0b", "#10b981", 
  "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"
];

class CollaborationServer {
  private wss: WebSocketServer;
  private rooms: Map<number, BoardRoom> = new Map();
  private wsUserMap: Map<WebSocket, { boardId: number; userId: string }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws/collaborate" });
    
    this.wss.on("connection", (ws: WebSocket) => {
      log("New WebSocket connection", "ws");
      
      ws.on("message", (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.handleDisconnect(ws);
      });
    });

    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000);
  }

  private handleMessage(ws: WebSocket, message: WSMessage) {
    switch (message.type) {
      case "join":
        this.handleJoin(ws, message);
        break;
      case "leave":
        this.handleLeave(ws);
        break;
      case "cursor_move":
        this.handleCursorMove(ws, message);
        break;
      case "asset_update":
      case "asset_create":
      case "asset_delete":
        this.broadcastToRoom(ws, message);
        break;
      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;
    }
  }

  private handleJoin(ws: WebSocket, message: WSMessage) {
    const { boardId, payload } = message;
    if (!boardId || !payload?.userId) return;

    let room = this.rooms.get(boardId);
    if (!room) {
      room = { boardId, collaborators: new Map() };
      this.rooms.set(boardId, room);
    }

    const colorIndex = room.collaborators.size % COLLABORATOR_COLORS.length;
    const collaboratorInfo: CollaboratorInfo = {
      id: payload.userId,
      name: payload.name || "Anonymous",
      avatar: payload.avatar || null,
      color: COLLABORATOR_COLORS[colorIndex],
      cursor: null,
      lastSeen: Date.now(),
    };

    room.collaborators.set(payload.userId, { ws, info: collaboratorInfo });
    this.wsUserMap.set(ws, { boardId, userId: payload.userId });

    const presence = this.getRoomPresence(boardId);
    this.broadcastPresence(boardId);

    ws.send(JSON.stringify({ 
      type: "presence", 
      payload: { 
        collaborators: presence,
        yourColor: collaboratorInfo.color 
      } 
    }));

    log(`User ${payload.name} joined board ${boardId}`, "ws");
  }

  private handleLeave(ws: WebSocket) {
    this.handleDisconnect(ws);
  }

  private handleDisconnect(ws: WebSocket) {
    const userInfo = this.wsUserMap.get(ws);
    if (!userInfo) return;

    const { boardId, userId } = userInfo;
    const room = this.rooms.get(boardId);
    
    if (room) {
      const collaborator = room.collaborators.get(userId);
      if (collaborator) {
        log(`User ${collaborator.info.name} left board ${boardId}`, "ws");
      }
      room.collaborators.delete(userId);
      
      if (room.collaborators.size === 0) {
        this.rooms.delete(boardId);
      } else {
        this.broadcastPresence(boardId);
      }
    }

    this.wsUserMap.delete(ws);
  }

  private handleCursorMove(ws: WebSocket, message: WSMessage) {
    const userInfo = this.wsUserMap.get(ws);
    if (!userInfo) return;

    const { boardId, userId } = userInfo;
    const room = this.rooms.get(boardId);
    if (!room) return;

    const collaborator = room.collaborators.get(userId);
    if (collaborator) {
      collaborator.info.cursor = message.payload?.cursor || null;
      collaborator.info.lastSeen = Date.now();
    }

    room.collaborators.forEach((collab, id) => {
      if (id !== userId && collab.ws.readyState === WebSocket.OPEN) {
        collab.ws.send(JSON.stringify({
          type: "cursor_move",
          payload: {
            userId,
            cursor: message.payload?.cursor,
            color: collaborator?.info.color
          }
        }));
      }
    });
  }

  private broadcastToRoom(ws: WebSocket, message: WSMessage) {
    const userInfo = this.wsUserMap.get(ws);
    if (!userInfo) return;

    const { boardId, userId } = userInfo;
    const room = this.rooms.get(boardId);
    if (!room) return;

    room.collaborators.forEach((collab, id) => {
      if (id !== userId && collab.ws.readyState === WebSocket.OPEN) {
        collab.ws.send(JSON.stringify({
          ...message,
          payload: { ...message.payload, byUserId: userId }
        }));
      }
    });
  }

  private broadcastPresence(boardId: number) {
    const room = this.rooms.get(boardId);
    if (!room) return;

    const presence = this.getRoomPresence(boardId);
    const message = JSON.stringify({ type: "presence", payload: { collaborators: presence } });

    room.collaborators.forEach((collab) => {
      if (collab.ws.readyState === WebSocket.OPEN) {
        collab.ws.send(message);
      }
    });
  }

  private getRoomPresence(boardId: number): CollaboratorInfo[] {
    const room = this.rooms.get(boardId);
    if (!room) return [];

    return Array.from(room.collaborators.values()).map((c) => c.info);
  }

  private cleanupStaleConnections() {
    const staleThreshold = 60000;
    const now = Date.now();

    this.rooms.forEach((room, boardId) => {
      room.collaborators.forEach((collab, userId) => {
        if (now - collab.info.lastSeen > staleThreshold) {
          collab.ws.close();
          room.collaborators.delete(userId);
        }
      });

      if (room.collaborators.size === 0) {
        this.rooms.delete(boardId);
      }
    });
  }

  public close() {
    clearInterval(this.cleanupInterval);
    this.wss.close();
  }
}

export function setupCollaboration(server: Server): CollaborationServer {
  return new CollaborationServer(server);
}
