import { broadcast } from "./netcode.js";
import { generateWorld } from "./worldGenerator.js";

const players = {};
const world = generateWorld(100, 100, 100);
let lastBroadcast = 0;

function addPlayer(playerName) {
  if (players[playerName] !== undefined) {
    console.error(`Player with name ${playerName} already exists.`);
    return false;
  } else {
    players[playerName] = {
      name: playerName,
      position: { x: 0, y: 2, z: 0 },
    };
    console.log(`Player ${playerName} joined.`);
    return players;
  }
}

function updatePlayer(playerName, position) {
  players[playerName].position = position;
}

setInterval(() => {
  const newTime = Date.now();
  if (newTime - lastBroadcast > 200) {
    lastBroadcast = newTime;
    broadcast(players);
  }
}, 20);

export { addPlayer, updatePlayer, world };
