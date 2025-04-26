import { receiveMapData, spawn, updatePlayers } from "./engine.js";

let socket;

function connectWebSocket(playerName) {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

  console.log(`Connecting to WebSocket server at ${wsUrl}`);

  socket = new WebSocket(wsUrl);

  socket.onopen = (event) => {
    console.log("WebSocket connection opened:", event);
    // Send a message to the server upon connection
    socket.send(JSON.stringify({ cmd: "JOIN", playerName: playerName }));
  };

  socket.onmessage = (event) => {
    const json = JSON.parse(event.data.toString());
    console.log(`Message recieved: ${json}`);

    if (json.cmd === "WORLD") {
      receiveMapData(json.payload);
    } else if (json.cmd === "PLAYERS") {
      updatePlayers(json.payload);
    } else if (json.cmd === "SPAWN") {
      spawn(json.payload);
    } else {
      console.log(`Unknown command: ${json.cmd}`);
    }
  };

  socket.onclose = (event) => {
    console.log("WebSocket connection closed:", event);
    // Handle connection closing, maybe attempt to reconnect?
  };

  socket.onerror = (error) => {
    console.error("WebSocket error observed:", error);
  };
}

function sendUpdate(state) {
  socket.send(JSON.stringify({ cmd: "STATE", payload: state }));
}

export { connectWebSocket, sendUpdate };
