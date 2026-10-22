import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, Block } from "../../shared/blocks.js";
import { ATLAS } from "./atlas.js";
import { BLOCK_APPEARANCE, MISSING_APPEARANCE } from "./blockAppearance.js";

describe("BLOCK_APPEARANCE", () => {
  const ids = Object.keys(BLOCK_TYPES)
    .map(Number)
    .filter((id) => id !== Block.Air);

  it.each(ids)("has an appearance for block %i", (id) => {
    expect(BLOCK_APPEARANCE[id]).toBeDefined();
  });

  it("only uses textures that are in the atlas", () => {
    const used = [
      ...Object.values(BLOCK_APPEARANCE),
      MISSING_APPEARANCE,
    ].flatMap((a) => [a.top.texture, a.side.texture, a.bottom.texture]);
    const missing = used.filter((name) => !(name in ATLAS.tiles));
    expect(missing).toEqual([]);
  });
});
