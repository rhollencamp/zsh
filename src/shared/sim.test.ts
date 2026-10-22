import { describe, expect, it } from "vitest";
import { TICK_SECONDS } from "./constants.js";
import {
  IDLE_INPUT,
  PLAYER,
  type PlayerInput,
  type PlayerState,
  spawnState,
  stepPlayer,
  wishDirection,
} from "./sim.js";
import { Block, World } from "./world.js";

function flatWorld(): World {
  const world = new World(10, 6, 10);
  for (let x = 0; x < 10; x++) {
    for (let z = 0; z < 10; z++) {
      world.set(x, 0, z, Block.Grass);
    }
  }
  return world;
}

function run(
  state: PlayerState,
  input: PlayerInput,
  world: World,
  ticks: number,
): PlayerState {
  for (let i = 0; i < ticks; i++) {
    state = stepPlayer(state, input, world, TICK_SECONDS);
  }
  return state;
}

const forward: PlayerInput = { forward: 1, right: 0, yaw: 0 };

describe("wishDirection", () => {
  it("moves forward along -Z at yaw 0", () => {
    const dir = wishDirection(forward);
    expect(dir.x).toBeCloseTo(0);
    expect(dir.z).toBeCloseTo(-1);
  });

  it("strafes right along +X at yaw 0", () => {
    const dir = wishDirection({ forward: 0, right: 1, yaw: 0 });
    expect(dir.x).toBeCloseTo(1);
    expect(dir.z).toBeCloseTo(0);
  });

  it("rotates with yaw", () => {
    const dir = wishDirection({ forward: 1, right: 0, yaw: Math.PI / 2 });
    expect(dir.x).toBeCloseTo(-1);
    expect(dir.z).toBeCloseTo(0);
  });

  it("does not let diagonals go faster", () => {
    const dir = wishDirection({ forward: 1, right: 1, yaw: 0 });
    expect(Math.hypot(dir.x, dir.z)).toBeCloseTo(1);
  });
});

describe("stepPlayer", () => {
  it("falls and lands on the ground", () => {
    const state = run(
      spawnState({ x: 5.5, y: 3, z: 5.5 }),
      IDLE_INPUT,
      flatWorld(),
      40,
    );
    expect(state.position.y).toBe(1);
    expect(state.velocity.y).toBe(0);
    expect(state.onGround).toBe(true);
  });

  it("stays put on the ground when idle", () => {
    const world = flatWorld();
    const landed = run(
      spawnState({ x: 5.5, y: 1, z: 5.5 }),
      IDLE_INPUT,
      world,
      1,
    );
    expect(run(landed, IDLE_INPUT, world, 20)).toEqual(landed);
  });

  it("walks at walk speed", () => {
    const start = run(
      spawnState({ x: 5.5, y: 1, z: 8.5 }),
      IDLE_INPUT,
      flatWorld(),
      1,
    );
    const end = run(start, forward, flatWorld(), 10);
    expect(start.position.z - end.position.z).toBeCloseTo(
      PLAYER.walkSpeed * 10 * TICK_SECONDS,
    );
    expect(end.position.y).toBe(1);
  });

  it("is stopped by a wall", () => {
    const world = flatWorld();
    world.set(5, 1, 3, Block.Grass);
    const end = run(spawnState({ x: 5.5, y: 1, z: 8.5 }), forward, world, 40);
    expect(end.position.z).toBeCloseTo(4 + PLAYER.halfWidth);
    expect(end.position.x).toBeCloseTo(5.5);
  });

  it("slides along a wall when moving diagonally into it", () => {
    const world = flatWorld();
    for (let x = 0; x < 10; x++) {
      world.set(x, 1, 3, Block.Grass);
    }
    const start = spawnState({ x: 2.5, y: 1, z: 5.5 });
    const end = run(start, { forward: 1, right: 1, yaw: 0 }, world, 20);
    expect(end.position.z).toBeCloseTo(4 + PLAYER.halfWidth);
    expect(end.position.x).toBeGreaterThan(start.position.x + 1);
  });

  it("cannot leave the world", () => {
    const end = run(
      spawnState({ x: 5.5, y: 1, z: 5.5 }),
      forward,
      flatWorld(),
      100,
    );
    expect(end.position.z).toBeCloseTo(PLAYER.halfWidth);
  });

  it("does not mutate its input state", () => {
    const state = spawnState({ x: 5.5, y: 3, z: 5.5 });
    const copy = JSON.parse(JSON.stringify(state));
    stepPlayer(state, forward, flatWorld(), TICK_SECONDS);
    expect(state).toEqual(copy);
  });
});
