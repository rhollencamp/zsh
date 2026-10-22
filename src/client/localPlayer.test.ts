import { describe, expect, it } from "vitest";
import { TICK_SECONDS } from "../shared/constants.js";
import { type PlayerInput, spawnState, stepPlayer } from "../shared/sim.js";
import { Block, World } from "../shared/world.js";
import { LocalPlayer } from "./localPlayer.js";

const forward: PlayerInput = { forward: 1, right: 0, yaw: 0 };

function world(): World {
  const w = new World(8, 4, 16);
  for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 16; z++) {
      w.set(x, 0, z, Block.Grass);
    }
  }
  return w;
}

describe("LocalPlayer", () => {
  it("predicts movement immediately", () => {
    const start = spawnState({ x: 4.5, y: 1, z: 12.5 });
    const player = new LocalPlayer(world(), start);
    player.step(forward);
    expect(player.state.position.z).toBeLessThan(start.position.z);
  });

  it("numbers inputs sequentially", () => {
    const player = new LocalPlayer(
      world(),
      spawnState({ x: 4.5, y: 1, z: 12.5 }),
    );
    expect(player.step(forward).seq).toBe(1);
    expect(player.step(forward).seq).toBe(2);
  });

  it("is unchanged by a server that agrees with it", () => {
    const w = world();
    const start = spawnState({ x: 4.5, y: 1, z: 12.5 });
    const player = new LocalPlayer(w, start);
    for (let i = 0; i < 5; i++) {
      player.step(forward);
    }
    const predicted = player.state;

    // server has only processed the first 2 inputs
    let server = start;
    for (let i = 0; i < 2; i++) {
      server = stepPlayer(server, forward, w, TICK_SECONDS);
    }
    player.reconcile(server, 2);

    expect(player.state).toEqual(predicted);
    expect(player.pendingCount).toBe(3);
  });

  it("replays unacknowledged inputs on top of a correction", () => {
    const w = world();
    const player = new LocalPlayer(w, spawnState({ x: 4.5, y: 1, z: 12.5 }));
    for (let i = 0; i < 3; i++) {
      player.step(forward);
    }
    // the server says we're somewhere else after input 1
    const corrected = spawnState({ x: 2.5, y: 1, z: 10.5 });
    player.reconcile(corrected, 1);

    const expected = stepPlayer(
      stepPlayer(corrected, forward, w, TICK_SECONDS),
      forward,
      w,
      TICK_SECONDS,
    );
    expect(player.state).toEqual(expected);
  });

  it("interpolates its render position between ticks", () => {
    const player = new LocalPlayer(
      world(),
      spawnState({ x: 4.5, y: 1, z: 12.5 }),
    );
    player.step(forward);
    const before = player.state.position.z;
    player.step(forward);
    const after = player.state.position.z;
    expect(player.renderPosition(0.5).z).toBeCloseTo((before + after) / 2);
  });

  it("bounds the number of pending inputs", () => {
    const player = new LocalPlayer(
      world(),
      spawnState({ x: 4.5, y: 1, z: 12.5 }),
      4,
    );
    for (let i = 0; i < 10; i++) {
      player.step(forward);
    }
    expect(player.pendingCount).toBe(4);
  });
});
