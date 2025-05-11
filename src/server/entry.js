import connect from "connect";
import http from "node:http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { handleWebsocketConnection } from "./netcode.js";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// create custom vite server in middleware mode
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});

// http server
const app = connect();
app.use(vite.middlewares);
app.use(async (req, res) => {
  if (req.url !== "/") {
    res.writeHead(404);
    res.end();
    return;
  }

  // read index.html
  let template = readFileSync(
    resolve(__dirname, "../client/index.html"),
    "utf-8",
  );

  // run it through vite
  template = await vite.transformIndexHtml(req.url, template);

  // send response
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(template);
});
const server = http.createServer(app);
server.listen(8080);

// create websocket server on the same port
const wss = new WebSocketServer({ server });
wss.on("connection", handleWebsocketConnection);
