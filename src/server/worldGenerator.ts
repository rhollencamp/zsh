import type { Vec3 } from "../shared/math.js";
import { Block, World } from "../shared/world.js";

export interface GeneratedWorld {
  world: World;
  spawn: Vec3;
}

/** A small flat test world with a few obstacles to walk into. */
export function generateWorld(
  sizeX = 32,
  sizeY = 16,
  sizeZ = 32,
): GeneratedWorld {
  const world = new World(sizeX, sizeY, sizeZ);
  for (let x = 0; x < sizeX; x++) {
    for (let z = 0; z < sizeZ; z++) {
      world.set(x, 0, z, Block.Grass);
    }
  }

  // a wall
  for (let x = 4; x < 12; x++) {
    world.set(x, 1, 4, Block.Grass);
    world.set(x, 2, 4, Block.Grass);
  }
  // a pillar
  for (let y = 1; y < 5; y++) {
    world.set(20, y, 10, Block.Grass);
  }
  // a single low block
  world.set(12, 1, 20, Block.Grass);

  return {
    world,
    spawn: {
      x: Math.floor(sizeX / 2) + 0.5,
      y: 1,
      z: Math.floor(sizeZ / 2) + 0.5,
    },
  };
}
