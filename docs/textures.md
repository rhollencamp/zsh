# Textures and blocks

How block textures get from the texture pack onto the screen, how to add
more, and what the engine can't draw yet (with notes on how to add it).

## The pipeline

```
Pixel Perfection CE (GitHub, pinned commit in source.json)
  │  npm run texture -- add <name>     copies the PNG unmodified
  ▼
assets/textures/pixel-perfection-ce/*.png   (vendored, committed)
  │  npm run atlas                      (add runs this for you)
  ▼
public/atlas.png + src/client/render/atlas.json   (generated, committed)
  │
  ▼
src/client/render/blockAppearance.ts   block id -> texture per face (+ tint)
src/client/render/worldMesh.ts         builds the world geometry from them
```

Gameplay properties of blocks (`solid`, `opaque`) live in
`src/shared/blocks.ts` because the server needs them; how blocks look is
client-only.

## Adding a block from the pack

```sh
npm run texture -- search birch         # what's available (* = already vendored)
npm run texture -- info birch_planks    # what the engine can do with it
npm run texture -- add birch_planks     # vendor it and rebuild the atlas
```

The first run fetches the pinned commit of the pack into
`node_modules/.cache/pixel-perfection-ce` (about 25 MB, via git); later runs
work offline. `add` checks every name first and adds nothing if any of
them is bad.

Then wire it up:

1. **`src/shared/blocks.ts`**: add an id to `Block` (append; ids are stored
   in saved/sent worlds, so never renumber) and an entry in `BLOCK_TYPES`.
   Use `opaque: false` if the texture has transparent pixels, otherwise
   neighbours' faces get hidden behind it.
2. **`src/client/render/blockAppearance.ts`**: map the id to textures.
   `same("name")` for one texture everywhere, or `{ top, side, bottom }`.
   Texture names are the file names without `.png`.
3. If `info` said the texture **probably needs a tint**, add a `tint` (see
   below).
4. `npm run check`. Tests fail if a block has no appearance, an appearance
   names a texture missing from the atlas, or the committed atlas is stale.

To see it in game, place it in `src/server/worldGenerator.ts`.

### Tints

Minecraft colours some textures in-engine (grass, leaves, vines, lily
pads...), so the pack ships them uncoloured in a shared beige palette.
`info` flags these. Pick a tint that multiplies the beige into the colour
you want. `GRASS_TINT` was chosen so grass tops match the green baked into
`grass_block_side.png`: per channel, the average colour of the side's top
three rows divided by the average colour of `grass_block_top.png`.
Pre-coloured variants exist for some leaves (birch, spruce, acacia, dark
oak) and need no tint.

## Licensing rules

The pack is **CC BY-SA 4.0**. Anything derived from it (including
`public/atlas.png`) is too. The code is not affected.

- Only vendor from the pinned source. Never copy textures from Minecraft
  itself or other packs; that's also the pack's own contribution rule.
- The pack lists textures it knows to be infringing in
  `content_with_issues.md`; `add` refuses those. When bumping the pinned
  commit, re-check that every vendored file is still clean.
- Keep `LICENSE.md` next to the textures, and the credits in `CREDITS.md`
  and on the join screen (`src/web/index.html`).
- Vendored PNGs are unmodified. If you ever edit one, the result is still
  CC BY-SA; say what changed in `assets/textures/pixel-perfection-ce/README.md`.
- Textures from a different source need their own folder, license file and
  credits, and `tools/atlas.ts` must load that folder too (only
  `pixel-perfection-ce` is loaded today).

## Updating the pinned pack version

Change `commit` in `assets/textures/pixel-perfection-ce/source.json`. The
next `npm run texture` refetches. To refresh already-vendored files, re-add
them (delete the PNG first), then review the visual diff and the pack's
issue list.

## What the engine can't draw yet

`npm run texture -- info` warns about all of these. Each needs engine work
before such textures look right; notes on approach:

| Kind              | Examples                                              | Today                                       | What to build                                                                                                                                                                                                                                        |
| ----------------- | ----------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Animated          | `water_still`, `lava_still`, fire, portal             | first frame only                            | `tools/atlas.ts` keeps frame 0 of each strip. Pack all frames, record frame count + `frametime` from the `.mcmeta` in `atlas.json`, and advance UVs over time (shader uniform, or rebuild a small dynamic mesh).                                     |
| Translucent       | water, ice, stained glass, slime                      | alpha treated as cut-out (`alphaTest: 0.5`) | A second mesh/material with `transparent: true, depthWrite: false`, built from translucent blocks only, drawn after opaque. Needs a `translucent` flag on the block.                                                                                 |
| Non-cube shapes   | slabs, stairs, torches, flowers, doors, fences, panes | mesher only emits unit cubes                | Add a `shape` to `BlockAppearance` (e.g. `cube`, `cross` for plants, `slab`), and have `worldMesh.ts` emit that shape's quads. Collision in `shared/sim.ts` assumes full cubes too, so a gameplay `shape` in `blocks.ts` is needed for slabs/stairs. |
| Random variants   | `dirt1`–`dirt4`, `stone1`–`stone10`                   | base texture only                           | Let a face list several textures and pick one per block with a hash of (x, y, z), so it's stable.                                                                                                                                                    |
| Overlays          | `grass_block_side_overlay`                            | one texture per face                        | Not needed for Pixel Perfection (its `grass_block_side` has the grass baked in). If wanted: a second set of overlay quads with a tint.                                                                                                               |
| Directional faces | furnace/pumpkin fronts, logs on their side            | top/side/bottom only                        | Needs block state (facing) in the world data, which needs more than one byte per block.                                                                                                                                                              |

Other limits:

- **Block ids are one byte** (`World.blocks` is a `Uint8Array`), so at most
  255 block types.
- **Tile size is fixed at 16 px**; `add` rejects anything else.
- **No mipmaps** (`renderer.ts`): with an atlas they'd blend neighbouring
  tiles at a distance. UVs are also inset by half a texel (`atlas.ts`) to
  stop edge seams. Revisit both if moving to a texture array.

## Files

| File                                               | What                                                     |
| -------------------------------------------------- | -------------------------------------------------------- |
| `assets/textures/pixel-perfection-ce/source.json`  | pinned pack source (repo, commit, paths, license)        |
| `assets/textures/pixel-perfection-ce/`             | vendored PNGs, `LICENSE.md`, provenance `README.md`      |
| `tools/texture.ts`                                 | `npm run texture` CLI (search / info / add)              |
| `tools/texturePack.ts`                             | fetching the pack, issue list, texture analysis (tested) |
| `tools/atlas.ts`, `tools/buildAtlas.ts`            | atlas packing, `npm run atlas` (tested)                  |
| `public/atlas.png`, `src/client/render/atlas.json` | generated atlas; don't edit by hand                      |
| `src/client/render/atlas.ts`                       | atlas lookups (`tileUvs`)                                |
| `src/shared/blocks.ts`                             | block ids and gameplay properties                        |
| `src/client/render/blockAppearance.ts`             | block id → textures and tints                            |
| `src/client/render/worldMesh.ts`                   | world geometry from blocks + appearances                 |
| `CREDITS.md`                                       | attribution                                              |
