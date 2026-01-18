import { Vector3 } from "three";

export interface PlayerData {
  name: string;
  position: Vector3;
}

export function serializeVector3(v: Vector3): any {
  return { x: v.x, y: v.y, z: v.z };
}

export function deserializeVector3(v: any): Vector3 {
  return new Vector3(v.x, v.y, v.z);
}

export function serializePlayerData(p: PlayerData): any {
  return {
    name: p.name,
    position: serializeVector3(p.position),
  };
}
