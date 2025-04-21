import { world } from "./gameState.js";

function handleWebsocketConnection(ws) {
  console.log("Client connected");

  ws.on("message", (message) => {
    if (message.toString() === "JOIN") {
      // send world data
      ws.send("WORLD " + JSON.stringify(world));
    } else {
      console.log(`Received message => ${message}`);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
}

export { handleWebsocketConnection };
