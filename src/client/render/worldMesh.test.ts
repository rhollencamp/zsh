import { describe, expect, it } from "vitest";
import { Block } from "../../shared/blocks.js";
import { World } from "../../shared/world.js";
import { ATLAS, tileUvs } from "./atlas.js";
import { buildWorldGeometry } from "./worldMesh.js";

function faceCount(world: World): number {
  return buildWorldGeometry(world).getIndex()!.count / 6;
}

describe("buildWorldGeometry", () => {
  it("is empty for an empty world", () => {
    expect(faceCount(new World(2, 2, 2))).toBe(0);
  });

  it("draws all six faces of a lone block", () => {
    const world = new World(3, 3, 3);
    world.set(1, 1, 1, Block.Grass);
    expect(faceCount(world)).toBe(6);
  });

  it("skips faces between neighbouring blocks", () => {
    const world = new World(3, 3, 3);
    world.set(0, 0, 0, Block.Grass);
    world.set(1, 0, 0, Block.Grass);
    expect(faceCount(world)).toBe(10);
  });

  it("places blocks on [x, x+1)", () => {
    const world = new World(3, 3, 3);
    world.set(2, 1, 0, Block.Grass);
    const geometry = buildWorldGeometry(world);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.toArray()).toEqual([2, 1, 0]);
    expect(geometry.boundingBox!.max.toArray()).toEqual([3, 2, 1]);
  });

  it("textures each face from the block's appearance", () => {
    const world = new World(1, 1, 1);
    world.set(0, 0, 0, Block.Grass);
    const geometry = buildWorldGeometry(world);
    const positions = geometry.getAttribute("position");
    const uvs = geometry.getAttribute("uv");
    const top = tileUvs(ATLAS, "grass_block_top");
    const side = tileUvs(ATLAS, "grass_block_side");
    for (let i = 0; i < positions.count; i += 4) {
      const corners = [0, 1, 2, 3];
      const isTop = corners.every((j) => positions.getY(i + j) === 1);
      const isBottom = corners.every((j) => positions.getY(i + j) === 0);
      if (isBottom) continue;
      const rect = isTop ? top : side;
      for (const j of corners) {
        expect(uvs.getX(i + j)).toBeGreaterThanOrEqual(rect.u0 - 1e-6);
        expect(uvs.getX(i + j)).toBeLessThanOrEqual(rect.u1 + 1e-6);
        expect(uvs.getY(i + j)).toBeGreaterThanOrEqual(rect.v0 - 1e-6);
        expect(uvs.getY(i + j)).toBeLessThanOrEqual(rect.v1 + 1e-6);
      }
    }
  });

  it("tints only the faces that ask for it", () => {
    const world = new World(1, 1, 1);
    world.set(0, 0, 0, Block.Grass);
    const geometry = buildWorldGeometry(world);
    const positions = geometry.getAttribute("position");
    const colors = geometry.getAttribute("color");
    for (let i = 0; i < positions.count; i++) {
      const isTop =
        positions.getY(i) === 1 && colors.getX(i) !== colors.getY(i);
      const grey =
        colors.getX(i) === colors.getY(i) && colors.getY(i) === colors.getZ(i);
      // the top is tinted green, side and bottom faces are only shaded
      expect(isTop || grey).toBe(true);
    }
  });

  it("draws faces behind see-through blocks", () => {
    const world = new World(3, 3, 3);
    world.set(0, 0, 0, Block.Stone);
    world.set(1, 0, 0, Block.OakLeaves);
    // the stone keeps its face toward the leaves (6 + 5, not 5 + 5)
    expect(faceCount(world)).toBe(11);
  });
});
