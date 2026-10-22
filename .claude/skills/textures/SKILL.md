---
name: textures
description: Add or change block textures and block types in zsh (Pixel Perfection texture pack, texture atlas, block appearance, tints). Use when asked to add a block, add/replace a texture, use something from the texture pack, or when a texture renders wrong.
---

# Block textures

Read `docs/textures.md` first; it is the reference for the pipeline, the
licensing rules and the engine's current limits.

## Adding blocks from the pack

1. `npm run texture -- search <text>` to find texture names.
2. `npm run texture -- info <names...>` and read the notes:
   - "probably needs a tint": add a `tint` in `blockAppearance.ts`.
   - "transparent pixels": use `opaque: false` in `blocks.ts`.
   - "animated", "partly transparent", "non-cube shape": the engine
     can't draw this properly yet. Tell the user and point at the matching
     row of the table in `docs/textures.md` rather than adding it silently.
3. `npm run texture -- add <names...>` vendors the PNGs and rebuilds the
   atlas. It refuses names on the pack's own infringement list.
4. Append ids in `src/shared/blocks.ts` (never renumber existing ids) and
   map them in `src/client/render/blockAppearance.ts`.
5. `npm run check` must pass. Optionally place the block in
   `src/server/worldGenerator.ts` and look at it with `npm run dev`.

## Rules

- Never copy textures from Minecraft or any source other than the pinned
  pack in `assets/textures/pixel-perfection-ce/source.json`. A different
  source needs its own license file and credits; ask the user first.
- Don't edit vendored PNGs, `public/atlas.png` or `atlas.json` by hand; use
  the scripts.
- Keep `CREDITS.md` and the join-screen credit line accurate.
