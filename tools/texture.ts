import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { TEXTURE_DIR, writeAtlas } from "./atlas.js";
import {
  ensureCheckout,
  inspectPackTexture,
  planAdd,
  readSource,
  searchPack,
  vendoredNames,
} from "./texturePack.js";

const USAGE = `usage:
  npm run texture -- search <text>      list pack textures whose name contains <text>
  npm run texture -- add <name>...      vendor textures and rebuild the atlas
  npm run texture -- info <name>...     show what the engine can do with a texture

See docs/textures.md.`;

const TILE_SIZE = 16;

function main(argv: string[]): number {
  const [command, ...args] = argv;
  if (command === undefined || args.length === 0) {
    console.error(USAGE);
    return 1;
  }
  const source = readSource();
  const checkout = ensureCheckout(source);
  const blockDir = join(checkout, source.blockDir);
  const vendored = vendoredNames();

  switch (command) {
    case "search": {
      const matches = args.flatMap((query) => searchPack(blockDir, query));
      for (const name of new Set(matches)) {
        console.log(`${vendored.has(name) ? "*" : " "} ${name}`);
      }
      console.log(`\n${matches.length} match(es); * = already vendored`);
      return 0;
    }
    case "info": {
      for (const name of args) {
        const report = inspectPackTexture(blockDir, name, TILE_SIZE);
        if (report === null) {
          console.log(`${name}: not in the pack`);
          continue;
        }
        const lines = [...report.problems, ...report.notes];
        console.log(
          `${name}: ${lines.length > 0 ? lines.join("; ") : "plain cube texture, nothing special"}`,
        );
      }
      return 0;
    }
    case "add": {
      const plan = planAdd(args, {
        checkoutDir: checkout,
        source,
        vendored,
        tileSize: TILE_SIZE,
      });
      for (const name of plan.alreadyVendored) {
        console.log(`${name}: already vendored, skipping`);
      }
      if (plan.errors.length > 0) {
        for (const error of plan.errors) console.error(`error: ${error}`);
        console.error("\nnothing was added");
        return 1;
      }
      for (const { name, from, report } of plan.add) {
        copyFileSync(from, join(TEXTURE_DIR, `${name}.png`));
        console.log(`added ${name}`);
        for (const note of report.notes) console.log(`  note: ${note}`);
      }
      if (plan.add.length > 0) {
        const manifest = writeAtlas();
        console.log(
          `\nrebuilt atlas: ${Object.keys(manifest.tiles).length} textures. Next:` +
            `\n  1. add the block to src/shared/blocks.ts` +
            `\n  2. give it an appearance in src/client/render/blockAppearance.ts` +
            `\n  3. npm run check`,
        );
      }
      return 0;
    }
    default:
      console.error(USAGE);
      return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
