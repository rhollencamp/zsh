import type { Vector3 } from "three";
import type { PlayerData } from "../lib/types.js";
import { deserializeVector3 } from "../lib/types.js";
import { receiveMapData, spawn, updatePlayers } from "./engine.js";

interface WebSocketMessage {
  cmd: string;
  playerName?: string;
  payload?: unknown;
}

export class Netcode {
  private socket: WebSocket | null = null;
  private playerName: string | null = null;

  connect(playerName: string): void {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    console.log(`Connecting to WebSocket server at ${wsUrl}`);

    this.playerName = playerName;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = (event: Event) => {
      console.log("WebSocket connection opened:", event);
      if (this.socket) {
        this.socket.send(
          JSON.stringify({ cmd: "JOIN", playerName: playerName }),
        );
      }
    };

    this.socket.onmessage = (event: MessageEvent) => {
      this.handleMessage(event);
    };

    this.socket.onclose = (event: CloseEvent) => {
      console.log("WebSocket connection closed:", event);
      this.socket = null;
    };

    this.socket.onerror = (error: Event) => {
      console.error("WebSocket error observed:", error);
    };
  }

  private handleMessage(event: MessageEvent): void {
    const json = JSON.parse(event.data.toString()) as WebSocketMessage;

    if (json.cmd === "WORLD") {
      receiveMapData(json.payload as number[][][]);
    } else if (json.cmd === "PLAYERS") {
      const serializedPlayers = json.payload as Record<string, any>;
      const players = new Map<string, PlayerData>();
      for (const [name, data] of Object.entries(serializedPlayers)) {
        if (name !== this.playerName) {
          players.set(name, {
            name: data.name,
            position: deserializeVector3(data.position),
          });
        }
      }
      updatePlayers(players);
    } else if (json.cmd === "SPAWN") {
      spawn(this.playerName as string, deserializeVector3(json.payload));
    } else {
      console.log(`Unknown command: ${json.cmd}`);
    }
  }

  sendUpdate(state: Vector3): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ cmd: "STATE", payload: state }));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}
/**
 * legacy singleton export; TODO instantiate and dependancy inject
 */
const instance: Netcode = new Netcode();
export function connectWebSocket(playerName: string): void {
  instance.connect(playerName);
}
export function sendUpdate(state: Vector3): void {
  instance.sendUpdate(state);
}
