import { readFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";

const __dirname = dirname(fileURLToPath(import.meta.url));

// create custom vite server in middleware mode
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});

// create nodejs server
const server = createHttpServer((req, res) => {
  // use vite middleware
  vite.middlewares(req, res, async () => {
    const url = req.url;

    // TODO check path and 404 if not /

    // read index.html
    let template = readFileSync(resolve(__dirname, "index.html"), "utf-8");

    // run it through vite
    template = await vite.transformIndexHtml(url, template);

    // send response
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(template);
  });
});

// Create WebSocket server instance
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

// Handle HTTP server upgrade requests for WebSockets
server.on("upgrade", (request, socket, head) => {
  if (request.url === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    // For requests not targeting /ws, destroy the socket
    console.log(`Rejecting upgrade request for path: ${request.url}`);
    socket.destroy();
  }
});

// Start the server
server.listen(8080, () => {
  console.log("HTTP server listening on port 8080");
  console.log("WebSocket server ready on path /ws");
});
