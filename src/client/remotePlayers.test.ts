import { describe, expect, it } from "vitest";
import type { PlayerSnapshot } from "../shared/protocol.js";
import {
  InterpolationBuffer,
  RemotePlayers,
  headingOf,
} from "./remotePlayers.js";

function snapshot(id: number, x: number, vx = 0): PlayerSnapshot {
  return {
    id,
    name: `p${id}`,
    state: {
      position: { x, y: 1, z: 0 },
      velocity: { x: vx, y: 0, z: 0 },
      onGround: true,
    },
    lastInputSeq: 0,
  };
}

describe("InterpolationBuffer", () => {
  it("is empty until it has samples", () => {
    expect(new InterpolationBuffer().sample(0)).toBeNull();
  });

  it("interpolates between samples and clamps outside them", () => {
    const buffer = new InterpolationBuffer();
    buffer.push(100, { x: 0, y: 0, z: 0 });
    buffer.push(200, { x: 10, y: 0, z: 0 });
    expect(buffer.sample(50)?.x).toBe(0);
    expect(buffer.sample(150)?.x).toBe(5);
    expect(buffer.sample(500)?.x).toBe(10);
  });

  it("forgets old samples", () => {
    const buffer = new InterpolationBuffer(2);
    buffer.push(0, { x: 0, y: 0, z: 0 });
    buffer.push(1, { x: 1, y: 0, z: 0 });
    buffer.push(2, { x: 2, y: 0, z: 0 });
    expect(buffer.sample(0)?.x).toBe(1);
  });
});

describe("RemotePlayers", () => {
  it("shows players delayed by the interpolation delay", () => {
    const remotes = new RemotePlayers(100);
    remotes.apply([snapshot(1, 0)], 1000);
    remotes.apply([snapshot(1, 10)], 1100);
    expect(remotes.view(1150)[0].position.x).toBe(5);
  });

  it("drops players missing from a snapshot", () => {
    const remotes = new RemotePlayers(100);
    remotes.apply([snapshot(1, 0), snapshot(2, 0)], 0);
    remotes.apply([snapshot(2, 0)], 50);
    expect(remotes.view(50).map((p) => p.id)).toEqual([2]);
  });

  it("faces the direction of travel", () => {
    const remotes = new RemotePlayers(0);
    remotes.apply([snapshot(1, 0, 5)], 0);
    expect(remotes.view(0)[0].heading).toBeCloseTo(-Math.PI / 2);
  });
});

describe("headingOf", () => {
  it("keeps the fallback when not moving", () => {
    expect(headingOf({ x: 0, y: -3, z: 0 }, 1.25)).toBe(1.25);
  });

  it("is 0 when moving along -Z", () => {
    expect(headingOf({ x: 0, y: 0, z: -5 }, 1)).toBeCloseTo(0);
  });
});
