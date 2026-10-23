import { describe, expect, it } from "vitest";
import { Block } from "./blocks.js";
import { World } from "./world.js";

describe("World", () => {
  it("stores blocks by coordinate", () => {
    const world = new World(4, 3, 2);
    world.set(3, 2, 1, Block.Grass);
    expect(world.get(3, 2, 1)).toBe(Block.Grass);
    expect(world.get(0, 0, 0)).toBe(Block.Air);
  });

  it("reads outside the world as air", () => {
    const world = new World(2, 2, 2);
    expect(world.get(-1, 0, 0)).toBe(Block.Air);
    expect(world.get(0, 5, 0)).toBe(Block.Air);
  });

  it("refuses to write outside the world", () => {
    expect(() => new World(2, 2, 2).set(2, 0, 0, Block.Grass)).toThrow(
      RangeError,
    );
  });

  it("is walled in on the sides and bottom but open above", () => {
    const world = new World(2, 2, 2);
    expect(world.isSolid(0, 0, 0)).toBe(false);
    expect(world.isSolid(-1, 0, 0)).toBe(true);
    expect(world.isSolid(0, 0, 2)).toBe(true);
    expect(world.isSolid(0, -1, 0)).toBe(true);
    expect(world.isSolid(0, 2, 0)).toBe(false);
    expect(world.isSolid(-1, 2, 0)).toBe(false);
  });

  it("round-trips through plain data", () => {
    const world = new World(3, 2, 1);
    world.set(1, 1, 0, Block.Grass);
    const copy = World.fromData(JSON.parse(JSON.stringify(world.toData())));
    expect(copy.get(1, 1, 0)).toBe(Block.Grass);
    expect(Array.from(copy.blocks)).toEqual(Array.from(world.blocks));
  });

  it("rejects block data of the wrong size", () => {
    expect(() => new World(2, 2, 2, [0, 0, 0])).toThrow();
  });
});
