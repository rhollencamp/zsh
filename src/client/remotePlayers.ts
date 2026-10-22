import { type Vec3, lerpVec3 } from "../shared/math.js";
import type { PlayerSnapshot } from "../shared/protocol.js";

interface Sample {
  time: number;
  position: Vec3;
}

/** Recent positions of one entity, sampled at arbitrary times. */
export class InterpolationBuffer {
  private readonly maxSamples: number;
  private readonly samples: Sample[] = [];

  constructor(maxSamples = 30) {
    this.maxSamples = maxSamples;
  }

  push(time: number, position: Vec3): void {
    this.samples.push({ time, position });
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  /** Interpolated position at `time`, clamped to the known range. */
  sample(time: number): Vec3 | null {
    const samples = this.samples;
    if (samples.length === 0) {
      return null;
    }
    if (time <= samples[0].time) {
      return samples[0].position;
    }
    for (let i = 1; i < samples.length; i++) {
      const b = samples[i];
      if (time <= b.time) {
        const a = samples[i - 1];
        return lerpVec3(
          a.position,
          b.position,
          (time - a.time) / (b.time - a.time),
        );
      }
    }
    return samples[samples.length - 1].position;
  }
}

export interface RemotePlayerView {
  id: number;
  name: string;
  position: Vec3;
  heading: number;
}

interface Remote {
  name: string;
  buffer: InterpolationBuffer;
  heading: number;
}

/**
 * Other players, shown slightly in the past so there are always two
 * snapshots to interpolate between.
 */
export class RemotePlayers {
  private readonly delayMs: number;
  private readonly remotes = new Map<number, Remote>();

  constructor(delayMs: number) {
    this.delayMs = delayMs;
  }

  apply(players: PlayerSnapshot[], time: number): void {
    const seen = new Set<number>();
    for (const player of players) {
      seen.add(player.id);
      let remote = this.remotes.get(player.id);
      if (remote === undefined) {
        remote = {
          name: player.name,
          buffer: new InterpolationBuffer(),
          heading: 0,
        };
        this.remotes.set(player.id, remote);
      }
      remote.buffer.push(time, player.state.position);
      remote.heading = headingOf(player.state.velocity, remote.heading);
    }
    for (const id of this.remotes.keys()) {
      if (!seen.has(id)) {
        this.remotes.delete(id);
      }
    }
  }

  view(time: number): RemotePlayerView[] {
    const views: RemotePlayerView[] = [];
    for (const [id, remote] of this.remotes) {
      const position = remote.buffer.sample(time - this.delayMs);
      if (position !== null) {
        views.push({
          id,
          name: remote.name,
          position,
          heading: remote.heading,
        });
      }
    }
    return views;
  }
}

/** Yaw a mover is facing, or `fallback` when standing still. */
export function headingOf(velocity: Vec3, fallback: number): number {
  if (Math.hypot(velocity.x, velocity.z) < 1e-3) {
    return fallback;
  }
  return Math.atan2(-velocity.x, -velocity.z);
}
