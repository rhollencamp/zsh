import { describe, expect, it } from "vitest";
import { thirdPersonCamera } from "./camera.js";

const rig = { distance: 6, height: 3, lookHeight: 1.5 };
const target = { x: 10, y: 1, z: 10 };

describe("thirdPersonCamera", () => {
  it("sits behind the target, which at yaw 0 is +Z", () => {
    const { position, lookAt } = thirdPersonCamera(target, 0, rig);
    expect(position.x).toBeCloseTo(10);
    expect(position.y).toBeCloseTo(4);
    expect(position.z).toBeCloseTo(16);
    expect(lookAt).toEqual({ x: 10, y: 2.5, z: 10 });
  });

  it("orbits with yaw", () => {
    const { position } = thirdPersonCamera(target, Math.PI / 2, rig);
    expect(position.x).toBeCloseTo(16);
    expect(position.z).toBeCloseTo(10);
  });
});
