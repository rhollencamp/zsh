import { TICK_SECONDS } from "../shared/constants.js";
import type { Vec3 } from "../shared/math.js";
import type { PlayerSnapshot } from "../shared/protocol.js";
import {
  type PlayerInput,
  type PlayerState,
  spawnState,
  stepPlayer,
} from "../shared/sim.js";
import type { World } from "../shared/world.js";

export interface GameOptions {
  spawn: Vec3;
  /** Inputs buffered per player beyond this are dropped. */
  maxQueuedInputs?: number;
  /** Lets a player catch up after jitter without moving faster overall. */
  maxInputsPerTick?: number;
}

export type JoinResult =
  | { ok: true; playerId: number; state: PlayerState }
  | { ok: false; reason: string };

interface Player {
  id: number;
  name: string;
  state: PlayerState;
  queue: { seq: number; input: PlayerInput }[];
  lastQueuedSeq: number;
  lastAppliedSeq: number;
}

/**
 * Authoritative game state. Knows nothing about sockets or timers: callers
 * feed it inputs and call step() once per tick.
 */
export class Game {
  readonly world: World;
  private readonly spawn: Vec3;
  private readonly players = new Map<number, Player>();
  private readonly maxQueuedInputs: number;
  private readonly maxInputsPerTick: number;
  private nextPlayerId = 1;
  private tickCount = 0;

  constructor(world: World, options: GameOptions) {
    this.world = world;
    this.spawn = options.spawn;
    this.maxQueuedInputs = options.maxQueuedInputs ?? 20;
    this.maxInputsPerTick = options.maxInputsPerTick ?? 3;
  }

  get tick(): number {
    return this.tickCount;
  }

  get playerCount(): number {
    return this.players.size;
  }

  join(name: string): JoinResult {
    const lower = name.toLowerCase();
    for (const player of this.players.values()) {
      if (player.name.toLowerCase() === lower) {
        return { ok: false, reason: `The name "${name}" is already taken.` };
      }
    }
    const player: Player = {
      id: this.nextPlayerId++,
      name,
      state: spawnState(this.spawn),
      queue: [],
      lastQueuedSeq: 0,
      lastAppliedSeq: 0,
    };
    this.players.set(player.id, player);
    return { ok: true, playerId: player.id, state: player.state };
  }

  leave(playerId: number): void {
    this.players.delete(playerId);
  }

  /** Queue an input; duplicates, stale inputs and overflow are ignored. */
  queueInput(playerId: number, seq: number, input: PlayerInput): void {
    const player = this.players.get(playerId);
    if (
      player === undefined ||
      seq <= player.lastQueuedSeq ||
      player.queue.length >= this.maxQueuedInputs
    ) {
      return;
    }
    player.queue.push({ seq, input });
    player.lastQueuedSeq = seq;
  }

  step(): void {
    for (const player of this.players.values()) {
      const inputs = player.queue.splice(0, this.maxInputsPerTick);
      for (const { seq, input } of inputs) {
        player.state = stepPlayer(
          player.state,
          input,
          this.world,
          TICK_SECONDS,
        );
        player.lastAppliedSeq = seq;
      }
    }
    this.tickCount++;
  }

  snapshot(): PlayerSnapshot[] {
    return Array.from(this.players.values(), (player) => ({
      id: player.id,
      name: player.name,
      state: player.state,
      lastInputSeq: player.lastAppliedSeq,
    }));
  }
}
