import http from "node:http";
import { createServer as createViteServer } from "vite";
import { WebSocket, WebSocketServer } from "ws";
import { TICK_MS, WS_PATH } from "../shared/constants.js";
import { Game } from "../server/game.js";
import { GameServer } from "../server/gameServer.js";
import { generateWorld } from "../server/worldGenerator.js";

const port = Number(process.env.PORT ?? 8080);

const { world, spawn } = generateWorld();
const gameServer = new GameServer(new Game(world, { spawn }), console.log);
setInterval(() => gameServer.tick(), TICK_MS);

// vite serves the client (with HMR) as middleware on our http server
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "spa",
});
const httpServer = http.createServer((req, res) => vite.middlewares(req, res));

// game websocket shares the port, on its own path
const wss = new WebSocketServer({ noServer: true });
httpServer.on("upgrade", (req, socket, head) => {
  if (req.url !== WS_PATH) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    const session = gameServer.connect({
      send: (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      },
      close: () => ws.close(),
    });
    ws.on("message", (data) => session.receive(data.toString()));
    ws.on("close", () => session.disconnect());
  });
});

httpServer.listen(port, () => {
  console.log(`zsh listening on http://localhost:${port}`);
});
