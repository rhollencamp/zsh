import type { Vec3 } from "../../shared/math.js";

export interface CameraRig {
  /** Horizontal distance behind the target. */
  distance: number;
  /** Height of the camera above the target's feet. */
  height: number;
  /** Height above the target's feet the camera aims at. */
  lookHeight: number;
}

export const DEFAULT_CAMERA_RIG: CameraRig = Object.freeze({
  distance: 6,
  height: 3.5,
  lookHeight: 1.5,
});

/** Where a third-person camera sits and looks, behind `target` along `yaw`. */
export function thirdPersonCamera(
  target: Vec3,
  yaw: number,
  rig: CameraRig = DEFAULT_CAMERA_RIG,
): { position: Vec3; lookAt: Vec3 } {
  return {
    position: {
      x: target.x + Math.sin(yaw) * rig.distance,
      y: target.y + rig.height,
      z: target.z + Math.cos(yaw) * rig.distance,
    },
    lookAt: { x: target.x, y: target.y + rig.lookHeight, z: target.z },
  };
}
