import { generateWorld } from "./worldGenerator.js";

const players = {};
const world = generateWorld(100, 100, 100);

function addPlayer(playerName) {
  if (players[playerName] !== undefined) {
    console.error(`Player with name ${playerName} already exists.`);
    return false;
  } else {
    players[playerName] = {
      name: playerName,
      position: { x: 0, y: 0, z: 0 },
    };
    console.log(`Player ${playerName} joined.`);
    return players[playerName];
  }
}

export { addPlayer, world };
