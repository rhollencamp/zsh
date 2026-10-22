import { BufferGeometry, Float32BufferAttribute } from "three";
import { Block, type World } from "../../shared/world.js";

type Corner = readonly [number, number, number];

interface Face {
  /** Neighbour offset; the face is hidden when that cell is solid. */
  normal: Corner;
  /** Bottom-left, bottom-right, top-right, top-left seen from outside. */
  corners: readonly [Corner, Corner, Corner, Corner];
  tile: "top" | "side";
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
    tile: "top",
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
    tile: "side",
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
    tile: "side",
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
    tile: "side",
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
    tile: "side",
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
    tile: "side",
    shade: 0.65,
  },
];

/** atlas.png is two square tiles stacked: grass top over grass side. */
const TILE_V: Record<Face["tile"], readonly [number, number]> = {
  top: [0.5, 1],
  side: [0, 0.5],
};

/**
 * One geometry for the whole world, containing only faces that border
 * air. Each block occupies [x, x+1) etc., matching the simulation.
 */
export function buildWorldGeometry(world: World): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y < world.sizeY; y++) {
    for (let z = 0; z < world.sizeZ; z++) {
      for (let x = 0; x < world.sizeX; x++) {
        if (world.get(x, y, z) === Block.Air) {
          continue;
        }
        for (const face of FACES) {
          const [nx, ny, nz] = face.normal;
          if (world.get(x + nx, y + ny, z + nz) !== Block.Air) {
            continue;
          }
          const base = positions.length / 3;
          const [v0, v1] = TILE_V[face.tile];
          face.corners.forEach(([cx, cy, cz], i) => {
            positions.push(x + cx, y + cy, z + cz);
            uvs.push(i === 1 || i === 2 ? 1 : 0, i < 2 ? v0 : v1);
            colors.push(face.shade, face.shade, face.shade);
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
