import { WebSocket } from "ws";
import { addPlayer, updatePlayer, world } from "./engine.js";
import type { PlayerData } from "../lib/types.js";
import { serializeVector3, serializePlayerData } from "../lib/types.js";

interface WebSocketServerType {
  clients: Set<WebSocket>;
}

let wss: WebSocketServerType | undefined;

function handleWebsocketConnection(
  this: WebSocketServerType,
  ws: WebSocket,
): void {
  console.log("Client connected");

  wss = this; // todo hack hack hack
  let playerName: string | undefined;

  ws.on("message", (message: Buffer) => {
    const json = JSON.parse(message.toString());
    // todo switch out the message handler based on joining vs joined state
    if (json.cmd === "JOIN") {
      const playerData = addPlayer(json.playerName);
      if (playerData) {
        ws.send(JSON.stringify({ cmd: "WORLD", payload: world }));
        const player = playerData.get(json.playerName);
        ws.send(
          JSON.stringify({
            cmd: "SPAWN",
            payload: player?.position
              ? serializeVector3(player.position)
              : null,
          }),
        );
        const serializedPlayers = Array.from(playerData.entries()).map(
          ([name, data]) => [name, serializePlayerData(data)],
        );
        ws.send(
          JSON.stringify({
            cmd: "PLAYERS",
            payload: Object.fromEntries(serializedPlayers),
          }),
        );
        playerName = json.playerName;
      } else {
        console.error(`Player with name ${json.playerName} rejected.`);
      }
    } else if (json.cmd === "STATE") {
      updatePlayer(playerName as string, json.payload);
    } else {
      console.log(`Received message => ${message}`);
    }
  });

  ws.on("close", () => {
    if (playerName) {
      console.info(`websocket close -- player ${playerName} disconnected.`);
      updatePlayer(playerName, "DISCONNECT");
    } else {
      console.error("websocket close -- unknown player");
    }
  });
}

function broadcast(playerData: Map<string, PlayerData>): void {
  if (wss) {
    const serializedPlayers = Array.from(playerData.entries()).map(
      ([name, data]) => [name, serializePlayerData(data)],
    );
    const payload = Object.fromEntries(serializedPlayers);
    for (const ws of wss.clients) {
      ws.send(
        JSON.stringify({
          cmd: "PLAYERS",
          payload,
        }),
      );
    }
  }
}

export { broadcast, handleWebsocketConnection };
