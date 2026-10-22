import { Block } from "../shared/blocks.js";
import type { Vec3 } from "../shared/math.js";
import { World } from "../shared/world.js";

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

  // patches of ground
  fill(world, [22, 0, 20], [27, 0, 26], Block.Sand);
  fill(world, [14, 0, 0], [15, 0, 13], Block.Gravel);
  fill(world, [2, 0, 26], [5, 0, 29], Block.SnowyGrass);

  // a wall
  fill(world, [4, 1, 4], [11, 2, 4], Block.Bricks);
  // a pillar
  fill(world, [20, 1, 10], [20, 4, 10], Block.Cobblestone);
  // a few single blocks
  world.set(12, 1, 20, Block.OakPlanks);
  world.set(24, 1, 23, Block.Stone);
  world.set(3, 1, 27, Block.Snow);

  tree(world, 8, 1, 22);

  return {
    world,
    spawn: {
      x: Math.floor(sizeX / 2) + 0.5,
      y: 1,
      z: Math.floor(sizeZ / 2) + 0.5,
    },
  };
}

type Cell = [number, number, number];

/** Set every cell in the inclusive box from `a` to `b`. */
function fill(world: World, a: Cell, b: Cell, block: number): void {
  for (let x = a[0]; x <= b[0]; x++) {
    for (let y = a[1]; y <= b[1]; y++) {
      for (let z = a[2]; z <= b[2]; z++) {
        world.set(x, y, z, block);
      }
    }
  }
}

function tree(world: World, x: number, y: number, z: number): void {
  fill(world, [x - 2, y + 3, z - 2], [x + 2, y + 4, z + 2], Block.OakLeaves);
  fill(world, [x - 1, y + 5, z - 1], [x + 1, y + 5, z + 1], Block.OakLeaves);
  fill(world, [x, y, z], [x, y + 4, z], Block.OakLog);
}
