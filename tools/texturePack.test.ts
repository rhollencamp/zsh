import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  type PackSource,
  analyzeTexture,
  looksNonCube,
  parseIssueList,
  planAdd,
  readSource,
  searchPack,
} from "./texturePack.js";

/** A size x height image filled with one RGBA colour. */
function image(rgba: number[], size = 16, height = size): PNG {
  const png = new PNG({ width: size, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data.set(rgba, i);
  }
  return png;
}

const BEIGE = [141, 131, 113, 255]; // grass_block_top's average colour
const STONE = [128, 124, 120, 255];
const opts = { tileSize: 16, animated: false };

describe("parseIssueList", () => {
  it("collects the paths from the pack's issue table", () => {
    const markdown = [
      "|Texture Path               |Type of Infringement   |Replacement |",
      "|---                        |:---:                  |:---:       |",
      "|`entity/banner/globe.png`  |Original MC content    |yes/yes     |",
      "|`block/bad.png`            |Original MC content    |no/no       |",
    ].join("\n");
    expect(parseIssueList(markdown)).toEqual(
      new Set(["entity/banner/globe.png", "block/bad.png"]),
    );
  });
});

describe("analyzeTexture", () => {
  it("has nothing to say about a plain texture", () => {
    expect(analyzeTexture(image(STONE), opts)).toEqual({
      problems: [],
      notes: [],
    });
  });

  it("rejects the wrong size", () => {
    expect(analyzeTexture(image(STONE, 32), opts).problems).toHaveLength(1);
  });

  it("notices animation strips", () => {
    const { notes } = analyzeTexture(image(STONE, 16, 64), opts);
    expect(notes.join()).toMatch(/4 frames/);
  });

  it("notices cut-out and translucent pixels", () => {
    const cutout = image(STONE);
    cutout.data[3] = 0;
    expect(analyzeTexture(cutout, opts).notes.join()).toMatch(/opaque: false/);
    const translucent = image(STONE);
    translucent.data[3] = 128;
    expect(analyzeTexture(translucent, opts).notes.join()).toMatch(
      /partly transparent/,
    );
  });

  it("flags the pack's uncoloured palette as needing a tint", () => {
    expect(analyzeTexture(image(BEIGE), opts).notes.join()).toMatch(/tint/);
    expect(analyzeTexture(image(STONE), opts).notes).toEqual([]);
  });
});

describe("looksNonCube", () => {
  it.each([
    "torch",
    "oak_door_top",
    "poppy",
    "stone_slab_top",
    "grass",
    "oak_sapling",
  ])("%s is probably not a cube", (name) =>
    expect(looksNonCube(name)).toBe(true),
  );

  it.each([
    "stone",
    "oak_log",
    "grass_block_side",
    "red_mushroom_block",
    "birch_planks",
  ])("%s is a cube", (name) => expect(looksNonCube(name)).toBe(false));
});

describe("planAdd", () => {
  const source: PackSource = {
    name: "test pack",
    repository: "https://example.invalid/pack",
    commit: "0".repeat(40),
    blockDir: "textures/block",
    issueList: "issues.md",
    license: "CC0",
  };
  let checkoutDir: string;

  beforeEach(() => {
    checkoutDir = mkdtempSync(join(tmpdir(), "pack-"));
    const blockDir = join(checkoutDir, source.blockDir);
    mkdirSync(blockDir, { recursive: true });
    const write = (name: string, png: PNG) =>
      writeFileSync(join(blockDir, `${name}.png`), PNG.sync.write(png));
    write("stone", image(STONE));
    write("bad", image(STONE));
    write("huge", image(STONE, 32));
    write("water_still", image(STONE, 16, 32));
    writeFileSync(join(blockDir, "water_still.png.mcmeta"), "{}");
    writeFileSync(
      join(checkoutDir, source.issueList),
      "|`block/bad.png` |x |x |\n",
    );
  });

  const plan = (names: string[], vendored: string[] = []) =>
    planAdd(names, {
      checkoutDir,
      source,
      vendored: new Set(vendored),
      tileSize: 16,
    });

  it("plans to add a good texture", () => {
    const result = plan(["stone.png"]);
    expect(result.errors).toEqual([]);
    expect(result.add.map((t) => t.name)).toEqual(["stone"]);
  });

  it("skips textures already vendored", () => {
    expect(plan(["stone"], ["stone"])).toMatchObject({
      add: [],
      alreadyVendored: ["stone"],
    });
  });

  it("refuses textures on the pack's issue list", () => {
    expect(plan(["bad"]).errors.join()).toMatch(/infringing/);
  });

  it("refuses unknown names and suggests similar ones", () => {
    expect(plan(["stone_bricks"]).errors.join()).toMatch(
      /not in the pack.*similar: stone/,
    );
  });

  it("refuses textures the atlas can't hold", () => {
    expect(plan(["huge"]).errors.join()).toMatch(/16px wide/);
  });

  it("reports animation from the .mcmeta file", () => {
    expect(plan(["water_still"]).add[0].report.notes.join()).toMatch(
      /animated/,
    );
  });

  it("fails the whole batch if one name is bad", () => {
    const result = plan(["stone", "nope"]);
    expect(result.errors).toHaveLength(1);
  });

  it("searches by substring", () => {
    expect(searchPack(join(checkoutDir, source.blockDir), "ST")).toEqual([
      "stone",
      "water_still",
    ]);
  });
});

describe("source.json", () => {
  it("pins an exact commit", () => {
    expect(readSource().commit).toMatch(/^[0-9a-f]{40}$/);
  });
});
