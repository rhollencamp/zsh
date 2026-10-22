import { describe, expect, it } from "vitest";
import { type AtlasManifest, tileUvs } from "./atlas.js";

const atlas: AtlasManifest = {
  tileSize: 1,
  columns: 4,
  rows: 2,
  tiles: { a: [0, 0], b: [3, 1] },
};

describe("tileUvs", () => {
  it("maps row 0 to the top of the texture", () => {
    // half-texel inset: 1/8 horizontally, 1/4 vertically
    expect(tileUvs(atlas, "a")).toEqual({
      u0: 0.125,
      u1: 0.125,
      v0: 0.75,
      v1: 0.75,
    });
  });

  it("maps the last tile to the bottom right", () => {
    expect(tileUvs(atlas, "b")).toEqual({
      u0: 0.875,
      u1: 0.875,
      v0: 0.25,
      v1: 0.25,
    });
  });

  it("throws for unknown textures", () => {
    expect(() => tileUvs(atlas, "nope")).toThrow(/nope/);
  });
});
