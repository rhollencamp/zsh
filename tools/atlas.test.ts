import { readFileSync } from "node:fs";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import {
  ATLAS_JSON,
  ATLAS_PNG,
  TEXTURE_DIR,
  buildAtlas,
  loadTextures,
} from "./atlas.js";

function solid(name: string, size: number, height = size, value = 255) {
  const image = new PNG({ width: size, height });
  image.data.fill(value);
  return { name, image };
}

describe("buildAtlas", () => {
  it("packs into a power-of-two grid, sorted by name", () => {
    const { image, manifest } = buildAtlas([
      solid("c", 4),
      solid("a", 4),
      solid("b", 4),
    ]);
    expect(manifest).toEqual({
      tileSize: 4,
      columns: 2,
      rows: 2,
      tiles: { a: [0, 0], b: [1, 0], c: [0, 1] },
    });
    expect([image.width, image.height]).toEqual([8, 8]);
  });

  it("uses the first frame of animation strips", () => {
    const { manifest } = buildAtlas([solid("water", 4, 16)]);
    expect(manifest.tileSize).toBe(4);
  });

  it("rejects mismatched sizes", () => {
    expect(() => buildAtlas([solid("a", 4), solid("b", 8)])).toThrow(
      /b is 8x8/,
    );
  });

  it("copies pixels into place and leaves the rest transparent", () => {
    const { image } = buildAtlas([
      solid("a", 1),
      solid("b", 1, 1, 7),
      solid("c", 1, 1, 9),
    ]);
    // 2x2 grid: a b / c (empty)
    expect(Array.from(image.data)).toEqual([
      255, 255, 255, 255, 7, 7, 7, 7, 9, 9, 9, 9, 0, 0, 0, 0,
    ]);
  });
});

describe("committed atlas", () => {
  it("is up to date with assets/textures (run `npm run atlas`)", () => {
    const { image, manifest } = buildAtlas(loadTextures(TEXTURE_DIR));
    expect(JSON.parse(readFileSync(ATLAS_JSON, "utf-8"))).toEqual(manifest);
    const committed = PNG.sync.read(readFileSync(ATLAS_PNG));
    expect([committed.width, committed.height]).toEqual([
      image.width,
      image.height,
    ]);
    expect(Buffer.compare(committed.data, image.data)).toBe(0);
  });
});
