import { BufferGeometry, Float32BufferAttribute } from "three";
import { Block, blockType } from "../../shared/blocks.js";
import type { World } from "../../shared/world.js";
import { ATLAS, type AtlasManifest, tileUvs } from "./atlas.js";
import {
  BLOCK_APPEARANCE,
  type BlockAppearance,
  MISSING_APPEARANCE,
} from "./blockAppearance.js";

type Corner = readonly [number, number, number];

interface Face {
  /** Neighbour offset; the face is hidden when that cell is opaque. */
  normal: Corner;
  /** Bottom-left, bottom-right, top-right, top-left seen from outside. */
  corners: readonly [Corner, Corner, Corner, Corner];
  kind: keyof BlockAppearance;
  /** Baked directional shading, so the world needs no lights. */
  shade: number;
}

const FACES: readonly Face[] = [
  {
    normal: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    kind: "top",
    shade: 1,
  },
  {
    normal: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    kind: "bottom",
    shade: 0.5,
  },
  {
    normal: [1, 0, 0],
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
    kind: "side",
    shade: 0.8,
  },
  {
    normal: [-1, 0, 0],
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    kind: "side",
    shade: 0.8,
  },
  {
    normal: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    kind: "side",
    shade: 0.65,
  },
  {
    normal: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    kind: "side",
    shade: 0.65,
  },
];

/**
 * One geometry for the whole world, containing only faces not hidden by
 * an opaque neighbour. Each block occupies [x, x+1) etc., matching the
 * simulation.
 */
export function buildWorldGeometry(
  world: World,
  atlas: AtlasManifest = ATLAS,
): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y < world.sizeY; y++) {
    for (let z = 0; z < world.sizeZ; z++) {
      for (let x = 0; x < world.sizeX; x++) {
        const block = world.get(x, y, z);
        if (block === Block.Air) {
          continue;
        }
        const appearance = BLOCK_APPEARANCE[block] ?? MISSING_APPEARANCE;
        for (const face of FACES) {
          const [nx, ny, nz] = face.normal;
          if (blockType(world.get(x + nx, y + ny, z + nz)).opaque) {
            continue;
          }
          const { texture, tint = 0xffffff } = appearance[face.kind];
          const { u0, v0, u1, v1 } = tileUvs(atlas, texture);
          const r = (((tint >> 16) & 0xff) / 255) * face.shade;
          const g = (((tint >> 8) & 0xff) / 255) * face.shade;
          const b = ((tint & 0xff) / 255) * face.shade;
          const base = positions.length / 3;
          face.corners.forEach(([cx, cy, cz], i) => {
            positions.push(x + cx, y + cy, z + cz);
            uvs.push(i === 1 || i === 2 ? u1 : u0, i < 2 ? v0 : v1);
            colors.push(r, g, b);
          });
          indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
