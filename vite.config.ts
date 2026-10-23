import { resolve } from "node:path";
import { defineConfig } from "vite";

/**
 * Serves src/web. `--mode standalone` builds a static site that runs the
 * game server in the page (no node server needed), with relative URLs so
 * it can be hosted from any path.
 */
export default defineConfig(({ mode }) => ({
  root: resolve(import.meta.dirname, "src/web"),
  publicDir: resolve(import.meta.dirname, "public"),
  base: mode === "standalone" ? "./" : "/",
  build: {
    outDir: resolve(
      import.meta.dirname,
      mode === "standalone" ? "dist/standalone" : "dist/web",
    ),
    emptyOutDir: true,
    // three.js alone is ~500 kB minified
    chunkSizeWarningLimit: 700,
  },
}));
