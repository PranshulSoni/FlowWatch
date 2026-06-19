import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import type { Server } from "http";

export type { WebSocket };

export interface FlowwatchWebSocket {
  server: WebSocketServer;
  broadcast(data: string | Buffer): void;
  close(): Promise<void>;
}

export function createWebSocketServer(httpServer: Server, path = "/ws"): FlowwatchWebSocket {
  const wss = new WebSocketServer({ server: httpServer, path });

  function broadcast(data: string | Buffer): void {
    for (const client of wss.clients) {
      if (client.readyState === 1 /* WebSocket.OPEN */) {
        client.send(data);
      }
    }
  }

  function close(): Promise<void> {
    return new Promise((resolve, reject) =>
      wss.close((err) => (err ? reject(err) : resolve()))
    );
  }

  return { server: wss, broadcast, close };
}
