import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { createServer as createHttpServer } from "node:http";
import { handleWebsocketConnection } from "./netcode.js";

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
    let template = readFileSync(
      resolve(__dirname, "../client/index.html"),
      "utf-8",
    );

    // run it through vite
    template = await vite.transformIndexHtml(url, template);

    // send response
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(template);
  });
});
server.listen(8080);

// create websocket server on the same port
const wss = new WebSocketServer({ server });
wss.on("connection", handleWebsocketConnection);
