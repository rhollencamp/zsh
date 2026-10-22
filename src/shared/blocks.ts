export const Block = Object.freeze({
  Air: 0,
  Grass: 1,
  Dirt: 2,
  Stone: 3,
  Cobblestone: 4,
  Sand: 5,
  Gravel: 6,
  OakLog: 7,
  OakPlanks: 8,
  OakLeaves: 9,
  Bricks: 10,
  Bedrock: 11,
  Snow: 12,
  SnowyGrass: 13,
});

export type BlockId = number;

/** Gameplay properties of a block; how it looks lives on the client. */
export interface BlockType {
  name: string;
  /** Blocks movement. */
  solid: boolean;
  /** Completely hides the faces of neighbouring blocks. */
  opaque: boolean;
}

const solid = (name: string): BlockType => ({
  name,
  solid: true,
  opaque: true,
});

export const BLOCK_TYPES: Readonly<Record<BlockId, BlockType>> = {
  [Block.Air]: { name: "air", solid: false, opaque: false },
  [Block.Grass]: solid("grass"),
  [Block.Dirt]: solid("dirt"),
  [Block.Stone]: solid("stone"),
  [Block.Cobblestone]: solid("cobblestone"),
  [Block.Sand]: solid("sand"),
  [Block.Gravel]: solid("gravel"),
  [Block.OakLog]: solid("oak log"),
  [Block.OakPlanks]: solid("oak planks"),
  [Block.OakLeaves]: { name: "oak leaves", solid: true, opaque: false },
  [Block.Bricks]: solid("bricks"),
  [Block.Bedrock]: solid("bedrock"),
  [Block.Snow]: solid("snow"),
  [Block.SnowyGrass]: solid("snowy grass"),
};

const UNKNOWN: BlockType = solid("unknown");

export function blockType(id: BlockId): BlockType {
  return BLOCK_TYPES[id] ?? UNKNOWN;
}
