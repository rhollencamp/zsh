import { TICK_SECONDS } from "../shared/constants.js";
import { type Vec3, lerpVec3 } from "../shared/math.js";
import {
  type PlayerInput,
  type PlayerState,
  stepPlayer,
} from "../shared/sim.js";
import type { World } from "../shared/world.js";

interface PendingInput {
  seq: number;
  input: PlayerInput;
}

/**
 * Client-side prediction for the player we control: apply inputs locally
 * right away, then rewind and replay whenever the server reports where it
 * actually put us.
 */
export class LocalPlayer {
  private readonly world: World;
  private readonly maxPending: number;
  private pending: PendingInput[] = [];
  private nextSeq = 1;
  private previous: PlayerState;
  private current: PlayerState;

  constructor(world: World, state: PlayerState, maxPending = 100) {
    this.world = world;
    this.maxPending = maxPending;
    this.previous = state;
    this.current = state;
  }

  get state(): PlayerState {
    return this.current;
  }

  get pendingCount(): number {
    return this.pending.length;
  }

  /** Predict one tick; returns the input to send to the server. */
  step(input: PlayerInput): PendingInput {
    const pending = { seq: this.nextSeq++, input };
    this.pending.push(pending);
    if (this.pending.length > this.maxPending) {
      this.pending.shift();
    }
    this.previous = this.current;
    this.current = stepPlayer(this.current, input, this.world, TICK_SECONDS);
    return pending;
  }

  reconcile(server: PlayerState, lastInputSeq: number): void {
    this.pending = this.pending.filter((p) => p.seq > lastInputSeq);
    let state = server;
    for (const { input } of this.pending) {
      state = stepPlayer(state, input, this.world, TICK_SECONDS);
    }
    this.current = state;
  }

  /** Position between the last two ticks, `alpha` of the way along. */
  renderPosition(alpha: number): Vec3 {
    return lerpVec3(this.previous.position, this.current.position, alpha);
  }
}
