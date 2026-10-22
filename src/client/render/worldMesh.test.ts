import { describe, expect, it } from "vitest";
import { Block, World } from "../../shared/world.js";
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

  it("uses the top tile only for upward faces", () => {
    const world = new World(1, 1, 1);
    world.set(0, 0, 0, Block.Grass);
    const geometry = buildWorldGeometry(world);
    const positions = geometry.getAttribute("position");
    const uvs = geometry.getAttribute("uv");
    for (let i = 0; i < positions.count; i += 4) {
      const isTop = [0, 1, 2, 3].every((j) => positions.getY(i + j) === 1);
      const minV = Math.min(...[0, 1, 2, 3].map((j) => uvs.getY(i + j)));
      expect(minV).toBe(isTop ? 0.5 : 0);
    }
  });
});
