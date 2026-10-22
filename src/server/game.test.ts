import { describe, expect, it } from "vitest";
import { IDLE_INPUT, type PlayerInput } from "../shared/sim.js";
import { Game } from "./game.js";
import { generateWorld } from "./worldGenerator.js";

const forward: PlayerInput = { forward: 1, right: 0, yaw: 0 };

function newGame(options = {}): Game {
  const { world, spawn } = generateWorld();
  return new Game(world, { spawn, ...options });
}

function joinOk(game: Game, name: string): number {
  const result = game.join(name);
  if (!result.ok) {
    throw new Error(result.reason);
  }
  return result.playerId;
}

function player(game: Game, id: number) {
  const found = game.snapshot().find((p) => p.id === id);
  if (found === undefined) {
    throw new Error(`no player ${id}`);
  }
  return found;
}

describe("Game", () => {
  it("gives each player a distinct id", () => {
    const game = newGame();
    expect(joinOk(game, "a")).not.toBe(joinOk(game, "b"));
    expect(game.playerCount).toBe(2);
  });

  it("rejects a name already in use, ignoring case", () => {
    const game = newGame();
    joinOk(game, "Alice");
    expect(game.join("alice").ok).toBe(false);
  });

  it("frees the name when a player leaves", () => {
    const game = newGame();
    game.leave(joinOk(game, "alice"));
    expect(game.join("alice").ok).toBe(true);
  });

  it("only moves players when they send input", () => {
    const game = newGame();
    const id = joinOk(game, "a");
    const before = player(game, id).state.position;
    game.step();
    expect(player(game, id).state.position).toEqual(before);

    game.queueInput(id, 1, forward);
    game.step();
    expect(player(game, id).state.position.z).toBeLessThan(before.z);
    expect(player(game, id).lastInputSeq).toBe(1);
  });

  it("ignores duplicate and out-of-order inputs", () => {
    const game = newGame();
    const id = joinOk(game, "a");
    game.queueInput(id, 2, IDLE_INPUT);
    game.queueInput(id, 2, forward);
    game.queueInput(id, 1, forward);
    game.step();
    expect(player(game, id).lastInputSeq).toBe(2);
    expect(Math.abs(player(game, id).state.velocity.z)).toBe(0);
  });

  it("applies a limited number of inputs per tick", () => {
    const game = newGame({ maxInputsPerTick: 2 });
    const id = joinOk(game, "a");
    for (let seq = 1; seq <= 5; seq++) {
      game.queueInput(id, seq, forward);
    }
    game.step();
    expect(player(game, id).lastInputSeq).toBe(2);
    game.step();
    expect(player(game, id).lastInputSeq).toBe(4);
  });

  it("drops inputs once the queue is full", () => {
    const game = newGame({ maxQueuedInputs: 2, maxInputsPerTick: 10 });
    const id = joinOk(game, "a");
    for (let seq = 1; seq <= 5; seq++) {
      game.queueInput(id, seq, forward);
    }
    game.step();
    expect(player(game, id).lastInputSeq).toBe(2);
  });

  it("counts ticks", () => {
    const game = newGame();
    game.step();
    game.step();
    expect(game.tick).toBe(2);
  });
});
