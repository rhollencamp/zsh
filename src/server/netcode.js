import { addPlayer, updatePlayer, world } from "./engine.js";

const playerNameToWebSocket = {};
const webSocketToPlayerName = {};

function handleWebsocketConnection(ws) {
  console.log("Client connected");

  ws.on("message", (message) => {
    const json = JSON.parse(message);
    if (json.cmd === "JOIN") {
      const playerData = addPlayer(json.playerName);
      if (playerData) {
        ws.send(JSON.stringify({ cmd: "WORLD", payload: world }));
        ws.send(
          JSON.stringify({
            cmd: "SPAWN",
            payload: playerData[json.playerName].position,
          }),
        );
        ws.send(JSON.stringify({ cmd: "PLAYERS", payload: playerData }));
        playerNameToWebSocket[json.playerName] = ws;
        webSocketToPlayerName[ws] = json.playerName;
      } else {
        console.error(`Player with name ${json.playerName} rejected.`);
      }
    } else if (json.cmd === "STATE") {
      updatePlayer(webSocketToPlayerName[ws], json.payload);
    } else {
      console.log(`Received message => ${message}`);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
}

function broadcast(playerData) {
  for (const ws of Object.values(playerNameToWebSocket)) {
    ws.send(JSON.stringify({ cmd: "PLAYERS", payload: playerData }));
  }
}

export { broadcast, handleWebsocketConnection };
