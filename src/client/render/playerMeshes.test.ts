import { Group } from "three";
import { describe, expect, it } from "vitest";
import { PlayerMeshes } from "./playerMeshes.js";

function view(id: number, x: number, heading = 0) {
  return { id, name: `p${id}`, position: { x, y: 1, z: 0 }, heading };
}

describe("PlayerMeshes", () => {
  it("adds, moves and removes meshes", () => {
    const parent = new Group();
    const meshes = new PlayerMeshes(parent, 1);

    meshes.sync([view(1, 0), view(2, 5, 1)]);
    expect(parent.children).toHaveLength(2);
    expect(meshes.get(2)?.position.x).toBe(5);
    expect(meshes.get(2)?.rotation.y).toBe(1);

    const mesh = meshes.get(2);
    meshes.sync([view(1, 0), view(2, 7)]);
    expect(meshes.get(2)).toBe(mesh);
    expect(mesh?.position.x).toBe(7);

    meshes.sync([view(1, 0)]);
    expect(parent.children).toHaveLength(1);
    expect(meshes.get(2)).toBeUndefined();
  });
});
