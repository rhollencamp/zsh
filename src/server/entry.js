import { readFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { onUpgrade } from "./netcode.js";

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

// Handle HTTP server upgrade requests for WebSockets
server.on("upgrade", onUpgrade);

// Start the server
server.listen(8080, () => {
  console.log("HTTP server listening on port 8080");
  console.log("WebSocket server ready on path /ws");
});
