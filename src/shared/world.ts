import { Block, type BlockId, blockType } from "./blocks.js";

/** Plain-data form of a World, as sent over the wire. */
export interface WorldData {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  blocks: number[];
}

/**
 * A fixed-size voxel grid. Block (x, y, z) occupies the unit cube
 * [x, x+1) × [y, y+1) × [z, z+1); y is up.
 */
export class World {
  readonly sizeX: number;
  readonly sizeY: number;
  readonly sizeZ: number;
  readonly blocks: Uint8Array;

  constructor(
    sizeX: number,
    sizeY: number,
    sizeZ: number,
    blocks?: ArrayLike<number>,
  ) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    const volume = sizeX * sizeY * sizeZ;
    if (blocks !== undefined && blocks.length !== volume) {
      throw new Error(
        `expected ${volume} blocks for ${sizeX}x${sizeY}x${sizeZ}, got ${blocks.length}`,
      );
    }
    this.blocks = new Uint8Array(volume);
    if (blocks !== undefined) {
      this.blocks.set(blocks);
    }
  }

  static fromData(data: WorldData): World {
    return new World(data.sizeX, data.sizeY, data.sizeZ, data.blocks);
  }

  toData(): WorldData {
    return {
      sizeX: this.sizeX,
      sizeY: this.sizeY,
      sizeZ: this.sizeZ,
      blocks: Array.from(this.blocks),
    };
  }

  inBounds(x: number, y: number, z: number): boolean {
    return (
      x >= 0 &&
      y >= 0 &&
      z >= 0 &&
      x < this.sizeX &&
      y < this.sizeY &&
      z < this.sizeZ
    );
  }

  /** Block at a cell; anything outside the world reads as air. */
  get(x: number, y: number, z: number): BlockId {
    return this.inBounds(x, y, z)
      ? this.blocks[this.index(x, y, z)]
      : Block.Air;
  }

  set(x: number, y: number, z: number, block: BlockId): void {
    if (!this.inBounds(x, y, z)) {
      throw new RangeError(`(${x}, ${y}, ${z}) is outside the world`);
    }
    this.blocks[this.index(x, y, z)] = block;
  }

  /**
   * Whether a cell blocks movement. The world is closed off on the sides
   * and bottom by invisible walls, and open above.
   */
  isSolid(x: number, y: number, z: number): boolean {
    if (y >= this.sizeY) {
      return false;
    }
    if (!this.inBounds(x, y, z)) {
      return true;
    }
    return blockType(this.blocks[this.index(x, y, z)]).solid;
  }

  private index(x: number, y: number, z: number): number {
    return (y * this.sizeZ + z) * this.sizeX + x;
  }
}
