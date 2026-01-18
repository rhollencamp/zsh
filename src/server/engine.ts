import { Vector3 } from "three";
import type { PlayerData } from "../lib/types.js";
import { broadcast } from "./netcode.js";
import { generateWorld } from "./worldGenerator.js";

const players: Map<string, PlayerData> = new Map();
const world = generateWorld(100, 100, 100);
let lastBroadcast = 0;

function addPlayer(playerName: string): Map<string, PlayerData> | false {
  if (players.get(playerName) !== undefined) {
    console.error(`Player with name ${playerName} already exists.`);
    return false;
  } else {
    const newPlayer: PlayerData = {
      name: playerName,
      position: new Vector3(0, 2, 0),
    };
    players.set(playerName, newPlayer);
    console.log(`Player ${playerName} joined.`);
    return players;
  }
}

function updatePlayer(playerName: string, payload: Vector3 | string): void {
  if (payload === "DISCONNECT") {
    // TODO we need to persist player state between sessions
    players.delete(playerName);
  } else {
    const player = players.get(playerName);
    if (player === undefined) {
      console.error(`updating players -- player ${playerName} not found.`);
    } else {
      player.position = payload as Vector3;
    }
  }
}

setInterval(() => {
  const newTime = Date.now();
  if (newTime - lastBroadcast > 200) {
    lastBroadcast = newTime;
    broadcast(players);
  }
}, 20);

export { addPlayer, updatePlayer, world };
