import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { PNG } from "pngjs";
import {
  ATLAS_JSON,
  ATLAS_PNG,
  TEXTURE_DIR,
  buildAtlas,
  loadTextures,
} from "./atlas.js";

const { image, manifest } = buildAtlas(loadTextures(TEXTURE_DIR));
mkdirSync(dirname(ATLAS_PNG), { recursive: true });
writeFileSync(ATLAS_PNG, PNG.sync.write(image));
writeFileSync(ATLAS_JSON, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `packed ${Object.keys(manifest.tiles).length} textures into ${image.width}x${image.height}`,
);
