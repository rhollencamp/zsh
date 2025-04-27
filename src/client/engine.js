import { controls } from "./gfx";
import { init as initGfx } from "./gfx";
import { sendUpdate } from "./netcode.js";
import { Modal } from "bootstrap";

let players = {};
let world;

const EngineState = Object.freeze({
  DISCONNECTED: 0,
  CONNECTING: 1,
  GOGOGO: 2,
});
let engineState = EngineState.DISCONNECTED;

function receiveMapData(mapData) {
  if (engineState !== EngineState.DISCONNECTED) {
    throw new Error("Cannot receive map data in the current engine state.");
  }
  world = mapData;
}

function spawn(position) {
  console.log(`Spawning player at position ${position}`);
  engineState = EngineState.GOGOGO;
  initGfx();
  controls.lock();
  Modal.getInstance(document.getElementById("welcomeModal")).hide();

  setInterval(() => {
    sendUpdate(controls.object.position);
  }, 100);
}

function updatePlayers(playerData) {
  players = playerData;
}

export { players, receiveMapData, spawn, updatePlayers, world };
