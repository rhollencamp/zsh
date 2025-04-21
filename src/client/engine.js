import { init, controls } from "./entry.js";
import { Modal } from "bootstrap";

let world;

const EngineState = Object.freeze({
  DISCONNECTED: 0,
  CONNECTING: 1,
  GOGOGO: 2,
});
let engineState = EngineState.DISCONNECTED;

function receiveMapData(mapData) {
  world = mapData;
  engineState = EngineState.GOGOGO;
  init();
  controls.lock();
  Modal.getInstance(document.getElementById("welcomeModal")).hide();
}

export { world, receiveMapData };
