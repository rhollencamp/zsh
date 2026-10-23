import { writeAtlas } from "./atlas.js";

const manifest = writeAtlas();
console.log(
  `packed ${Object.keys(manifest.tiles).length} textures into a ` +
    `${manifest.columns}x${manifest.rows} grid of ${manifest.tileSize}px tiles`,
);
