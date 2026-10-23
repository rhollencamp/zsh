import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Module boundaries, enforced:
 *   shared  -> shared only, no packages          (runs everywhere)
 *   server  -> shared only, no packages          (runs in node and the browser)
 *   client  -> shared + packages                 (browser game client)
 *   node    -> server, shared + packages         (node host: http, ws)
 *   web     -> client, server, shared + packages (the page; can run server in it)
 */
const SRC = join(import.meta.dirname, "../src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return path.endsWith(".ts") && !path.endsWith(".test.ts") ? [path] : [];
  });
}

function imports(file: string): string[] {
  const source = readFileSync(file, "utf-8");
  return [
    ...source.matchAll(
      /^\s*(?:import|export)\b[^'"]*?from\s+["']([^"']+)["']/gm,
    ),
  ].map((m) => m[1]);
}

function resolveArea(file: string, specifier: string): string {
  if (!specifier.startsWith(".")) return `package:${specifier}`;
  return relative(SRC, join(file, "..", specifier)).split(/[\\/]/)[0];
}

const RULES: Record<string, (target: string) => boolean> = {
  shared: (target) => target === "shared",
  server: (target) => target === "server" || target === "shared",
  client: (target) =>
    target === "client" || target === "shared" || isPackage(target),
  node: (target) =>
    ["node", "server", "shared"].includes(target) || isPackage(target),
  web: (target) => target !== "node",
};

function isPackage(target: string): boolean {
  return target.startsWith("package:");
}

it("has a rule for every area", () => {
  const areas = readdirSync(SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  expect(areas.sort()).toEqual(Object.keys(RULES).sort());
});

describe("module boundaries", () => {
  for (const [area, allowed] of Object.entries(RULES)) {
    it(`${area} only imports what it may`, () => {
      const violations = sourceFiles(join(SRC, area)).flatMap((file) =>
        imports(file)
          .map(
            (specifier) => [specifier, resolveArea(file, specifier)] as const,
          )
          .filter(([, target]) => !allowed(target))
          .map(([specifier]) => `${relative(SRC, file)} imports ${specifier}`),
      );
      expect(violations).toEqual([]);
    });
  }
});
