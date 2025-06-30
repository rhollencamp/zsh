import { addPlayer, updatePlayer, world } from "./engine.js";

let wss;

function handleWebsocketConnection(ws) {
  console.log("Client connected");


  wss = this; // todo hack hack hack
  let playerName;

  ws.on("message", (message) => {
    const json = JSON.parse(message);
    // todo switch out the message handler based on joining vs joined state
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
        playerName = json.playerName;
      } else {
        console.error(`Player with name ${json.playerName} rejected.`);
      }
    } else if (json.cmd === "STATE") {
      updatePlayer(playerName, json.payload);
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

function broadcast(playerData) {
  if (wss) {
    for (const ws of wss.clients) {
      ws.send(JSON.stringify({ cmd: "PLAYERS", payload: playerData }));
    }
  }
}

export { broadcast, handleWebsocketConnection };
