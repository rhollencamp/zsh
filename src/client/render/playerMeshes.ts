import {
  BoxGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  type Object3D,
} from "three";
import { PLAYER } from "../../shared/sim.js";
import type { PlayerView } from "../clientGame.js";

const bodyGeometry = new BoxGeometry(
  PLAYER.halfWidth * 2,
  PLAYER.height,
  PLAYER.halfWidth * 2,
);
const faceGeometry = new BoxGeometry(0.3, 0.15, 0.1);
const selfMaterial = new MeshLambertMaterial({ color: 0x3b82f6 });
const otherMaterial = new MeshLambertMaterial({ color: 0x22c55e });
const faceMaterial = new MeshLambertMaterial({ color: 0xf5f5f5 });

/** Keeps one mesh per player in sync with the latest view. */
export class PlayerMeshes {
  private readonly parent: Object3D;
  private readonly selfId: number;
  private readonly meshes = new Map<number, Group>();

  constructor(parent: Object3D, selfId: number) {
    this.parent = parent;
    this.selfId = selfId;
  }

  get size(): number {
    return this.meshes.size;
  }

  get(id: number): Object3D | undefined {
    return this.meshes.get(id);
  }

  sync(players: readonly PlayerView[]): void {
    const seen = new Set<number>();
    for (const player of players) {
      seen.add(player.id);
      let mesh = this.meshes.get(player.id);
      if (mesh === undefined) {
        mesh = this.create(
          player.id === this.selfId ? selfMaterial : otherMaterial,
        );
        this.meshes.set(player.id, mesh);
        this.parent.add(mesh);
      }
      mesh.position.set(
        player.position.x,
        player.position.y,
        player.position.z,
      );
      mesh.rotation.y = player.heading;
    }
    for (const [id, mesh] of this.meshes) {
      if (!seen.has(id)) {
        this.parent.remove(mesh);
        this.meshes.delete(id);
      }
    }
  }

  /** Origin at the feet; the face marks the front (local -Z). */
  private create(material: MeshLambertMaterial): Group {
    const group = new Group();
    const body = new Mesh(bodyGeometry, material);
    body.position.y = PLAYER.height / 2;
    const face = new Mesh(faceGeometry, faceMaterial);
    face.position.set(0, PLAYER.height - 0.3, -PLAYER.halfWidth);
    group.add(body, face);
    return group;
  }
}
