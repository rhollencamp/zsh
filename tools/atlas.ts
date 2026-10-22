import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { PNG } from "pngjs";
import type { AtlasManifest } from "../src/client/render/atlas.js";

const ROOT = join(import.meta.dirname, "..");
export const TEXTURE_DIR = join(ROOT, "assets/textures/pixel-perfection-ce");
export const ATLAS_PNG = join(ROOT, "public/atlas.png");
export const ATLAS_JSON = join(ROOT, "src/client/render/atlas.json");

export interface Texture {
  name: string;
  image: PNG;
}

/**
 * Pack square textures into one power-of-two atlas. Taller images
 * (animation strips) contribute their first frame. Output only depends
 * on the input, so the result can be committed and checked for drift.
 */
export function buildAtlas(textures: readonly Texture[]): {
  image: PNG;
  manifest: AtlasManifest;
} {
  if (textures.length === 0) {
    throw new Error("no textures to pack");
  }
  const sorted = [...textures].sort((a, b) => a.name.localeCompare(b.name));
  const tileSize = sorted[0].image.width;
  for (const { name, image } of sorted) {
    if (image.width !== tileSize || image.height % tileSize !== 0) {
      throw new Error(
        `${name} is ${image.width}x${image.height}; expected ${tileSize} wide frames`,
      );
    }
  }

  const columns = nextPowerOfTwo(Math.ceil(Math.sqrt(sorted.length)));
  const rows = nextPowerOfTwo(Math.ceil(sorted.length / columns));
  const atlas = new PNG({ width: columns * tileSize, height: rows * tileSize });
  atlas.data.fill(0);

  const tiles: AtlasManifest["tiles"] = {};
  sorted.forEach(({ name, image }, i) => {
    const column = i % columns;
    const row = Math.floor(i / columns);
    PNG.bitblt(
      image,
      atlas,
      0,
      0,
      tileSize,
      tileSize,
      column * tileSize,
      row * tileSize,
    );
    tiles[name] = [column, row];
  });

  return { image: atlas, manifest: { tileSize, columns, rows, tiles } };
}

function nextPowerOfTwo(n: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(1, n)));
}

export function loadTextures(dir: string): Texture[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".png"))
    .map((file) => ({
      name: basename(file, ".png"),
      image: PNG.sync.read(readFileSync(join(dir, file))),
    }));
}
