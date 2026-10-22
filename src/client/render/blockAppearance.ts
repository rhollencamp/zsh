import { Block, type BlockId } from "../../shared/blocks.js";

export interface FaceTexture {
  /** Name in the atlas, i.e. the source file name without .png. */
  texture: string;
  /** Multiplied into the texture; for textures shipped uncoloured. */
  tint?: number;
}

export interface BlockAppearance {
  top: FaceTexture;
  side: FaceTexture;
  bottom: FaceTexture;
}

/** Grass tops and leaves come grey; these match the green baked into grass_block_side. */
const GRASS_TINT = 0x78dc7d;
const LEAVES_TINT = 0x5fb35f;

function same(texture: string, tint?: number): BlockAppearance {
  const face = { texture, tint };
  return { top: face, side: face, bottom: face };
}

export const BLOCK_APPEARANCE: Readonly<Record<BlockId, BlockAppearance>> = {
  [Block.Grass]: {
    top: { texture: "grass_block_top", tint: GRASS_TINT },
    side: { texture: "grass_block_side" },
    bottom: { texture: "dirt" },
  },
  [Block.Dirt]: same("dirt"),
  [Block.Stone]: same("stone"),
  [Block.Cobblestone]: same("cobblestone"),
  [Block.Sand]: same("sand"),
  [Block.Gravel]: same("gravel"),
  [Block.OakLog]: {
    top: { texture: "oak_log_top" },
    side: { texture: "oak_log" },
    bottom: { texture: "oak_log_top" },
  },
  [Block.OakPlanks]: same("oak_planks"),
  [Block.OakLeaves]: same("oak_leaves", LEAVES_TINT),
  [Block.Bricks]: same("bricks"),
  [Block.Bedrock]: same("bedrock"),
  [Block.Snow]: same("snow"),
  [Block.SnowyGrass]: {
    top: { texture: "snow" },
    side: { texture: "grass_block_snow" },
    bottom: { texture: "dirt" },
  },
};

/** Shown for block ids with no appearance, so they're obvious. */
export const MISSING_APPEARANCE: BlockAppearance = same("bricks", 0xff00ff);
