import { controls } from "./gfx";
import { init as initGfx } from "./gfx";
import { sendUpdate } from "./netcode.js";
import { Modal } from "bootstrap";
import type { PlayerData } from "../lib/types.js";
import type { Vector3 } from "three";

let thisPlayerName: string;
let players: Map<string, PlayerData> = new Map();
let world: number[][][] | undefined;

const EngineState = Object.freeze({
  DISCONNECTED: 0,
  CONNECTING: 1,
  GOGOGO: 2,
});

type EngineStateType = (typeof EngineState)[keyof typeof EngineState];
let engineState: EngineStateType = EngineState.DISCONNECTED;

function receiveMapData(mapData: number[][][]): void {
  if (engineState !== EngineState.DISCONNECTED) {
    throw new Error("Cannot receive map data in the current engine state.");
  }
  world = mapData;
}

function spawn(playerName: string, position: Vector3): void {
  console.log(`Spawning ${playerName} at position ${position}`);

  thisPlayerName = playerName;
  engineState = EngineState.GOGOGO;
  initGfx();

  controls.object.position.set(position.x, position.y, position.z);
  controls.lock();

  const welcomeModal = document.getElementById("welcomeModal");
  if (welcomeModal) {
    const modalInstance = Modal.getInstance(welcomeModal);
    if (modalInstance) {
      modalInstance.hide();
    }
  }

  setInterval(() => {
    sendUpdate(controls.object.position);
  }, 100);
}

function updatePlayers(playerData: Map<string, PlayerData>): void {
  const missingPlayers: Set<string> = new Set(players.keys());

  playerData.forEach((data, name) => {
    if (!players.has(name)) {
      players.set(name, data);
    } else {
      players.set(name, data);
    }
    missingPlayers.delete(name);
  });

  for (const name of missingPlayers) {
    players.delete(name);
  }
}

export { players, receiveMapData, spawn, updatePlayers, world };
