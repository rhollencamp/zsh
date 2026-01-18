import type { Vector3 } from "three";
import type { PlayerData } from "../lib/types.js";
import { deserializeVector3 } from "../lib/types.js";
import { receiveMapData, spawn, updatePlayers } from "./engine.js";

interface WebSocketMessage {
  cmd: string;
  playerName?: string;
  payload?: unknown;
}

let socket: WebSocket;

function connectWebSocket(playerName: string): void {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

  console.log(`Connecting to WebSocket server at ${wsUrl}`);

  socket = new WebSocket(wsUrl);

  socket.onopen = (event: Event) => {
    console.log("WebSocket connection opened:", event);
    // Send a message to the server upon connection
    socket.send(JSON.stringify({ cmd: "JOIN", playerName: playerName }));
  };

  socket.onmessage = (event: MessageEvent) => {
    const json = JSON.parse(event.data.toString()) as WebSocketMessage;

    if (json.cmd === "WORLD") {
      receiveMapData(json.payload as number[][][]);
    } else if (json.cmd === "PLAYERS") {
      const serializedPlayers = json.payload as Record<string, any>;
      const players = new Map<string, PlayerData>();
      for (const [name, data] of Object.entries(serializedPlayers)) {
        if (name !== playerName) {
          players.set(name, {
            name: data.name,
            position: deserializeVector3(data.position),
          });
        }
      }
      updatePlayers(players);
    } else if (json.cmd === "SPAWN") {
      spawn(playerName, deserializeVector3(json.payload));
    } else {
      console.log(`Unknown command: ${json.cmd}`);
    }
  };

  socket.onclose = (event: CloseEvent) => {
    console.log("WebSocket connection closed:", event);
    // Handle connection closing, maybe attempt to reconnect?
  };

  socket.onerror = (error: Event) => {
    console.error("WebSocket error observed:", error);
  };
}

function sendUpdate(state: Vector3): void {
  socket.send(JSON.stringify({ cmd: "STATE", payload: state }));
}

export { connectWebSocket, sendUpdate };
