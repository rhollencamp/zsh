import { receiveMapData } from "./engine.js";

let socket;

function connectWebSocket() {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

  console.log(`Connecting to WebSocket server at ${wsUrl}`);

  socket = new WebSocket(wsUrl);

  socket.onopen = (event) => {
    console.log("WebSocket connection opened:", event);
    // Send a message to the server upon connection
    socket.send("JOIN");
  };

  socket.onmessage = (event) => {
    let i;
    for (i = 0; i < event.data.length; i++) {
      if (event.data[i] === " ") {
        break;
      }
    }
    const messageType = event.data.slice(0, i);
    const messageData = event.data.slice(i + 1);

    console.log(`Message type => ${messageType}`);

    if (messageType === "WORLD") {
      const world = JSON.parse(messageData);
      receiveMapData(world);
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

export { connectWebSocket };
