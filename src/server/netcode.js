import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log("received: %s", message);
    // Echo message back to client
    ws.send(`Server received: ${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.send("Welcome to the WebSocket server!");
});

function onUpgrade(request, socket, head) {
  if (request.url === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    // For requests not targeting /ws, destroy the socket
    console.log(`Rejecting upgrade request for path: ${request.url}`);
    socket.destroy();
  }
}

export { onUpgrade };
