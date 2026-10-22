import { MAX_NAME_LENGTH } from "./constants.js";
import { isFiniteNumber } from "./math.js";
import type { PlayerInput, PlayerState } from "./sim.js";
import type { WorldData } from "./world.js";

export interface PlayerSnapshot {
  id: number;
  name: string;
  state: PlayerState;
  /** Last input sequence number the server has applied for this player. */
  lastInputSeq: number;
}

export type ClientMessage =
  | { type: "join"; protocol: number; name: string }
  | { type: "input"; seq: number; input: PlayerInput };

export type ServerMessage =
  | {
      type: "welcome";
      playerId: number;
      tick: number;
      world: WorldData;
      state: PlayerState;
    }
  | { type: "rejected"; reason: string }
  | { type: "snapshot"; tick: number; players: PlayerSnapshot[] };

export function encode(message: ClientMessage | ServerMessage): string {
  return JSON.stringify(message);
}

/**
 * Parse a message from a client. Clients are untrusted, so this validates
 * every field and returns null for anything malformed.
 */
export function parseClientMessage(raw: string): ClientMessage | null {
  const json = parseJson(raw);
  if (!isRecord(json)) {
    return null;
  }
  switch (json.type) {
    case "join": {
      if (!Number.isInteger(json.protocol) || typeof json.name !== "string") {
        return null;
      }
      const name = json.name.trim();
      if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
        return null;
      }
      return { type: "join", protocol: json.protocol as number, name };
    }
    case "input": {
      const input = json.input;
      if (
        !Number.isSafeInteger(json.seq) ||
        !isRecord(input) ||
        !isFiniteNumber(input.forward) ||
        !isFiniteNumber(input.right) ||
        !isFiniteNumber(input.yaw)
      ) {
        return null;
      }
      return {
        type: "input",
        seq: json.seq as number,
        input: {
          forward: clamp(input.forward, -1, 1),
          right: clamp(input.right, -1, 1),
          yaw: input.yaw,
        },
      };
    }
    default:
      return null;
  }
}

/**
 * Parse a message from the server. The server is trusted, so this only
 * checks the message type.
 */
export function parseServerMessage(raw: string): ServerMessage | null {
  const json = parseJson(raw);
  if (!isRecord(json)) {
    return null;
  }
  switch (json.type) {
    case "welcome":
    case "rejected":
    case "snapshot":
      return json as unknown as ServerMessage;
    default:
      return null;
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
