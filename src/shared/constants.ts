/** Bumped whenever the wire format changes incompatibly. */
export const PROTOCOL_VERSION = 1;

/** Server simulation rate. Clients send one input per tick. */
export const TICK_RATE = 20;
export const TICK_SECONDS = 1 / TICK_RATE;
export const TICK_MS = 1000 / TICK_RATE;

export const WS_PATH = "/ws";

export const MAX_NAME_LENGTH = 24;
