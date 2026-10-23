import type { Transport } from "../client/app.js";
import { TICK_MS } from "../shared/constants.js";
import { Game } from "../server/game.js";
import { GameServer } from "../server/gameServer.js";
import { generateWorld } from "../server/worldGenerator.js";
import { localSocketFactory } from "./localSocket.js";

/** A game server running in this page, for playing without a server. */
export class LocalServer {
  readonly server: GameServer;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(log: (message: string) => void = () => {}) {
    const { world, spawn } = generateWorld();
    this.server = new GameServer(new Game(world, { spawn }), log);
  }

  /** Start ticking (idempotent) and return a transport to connect with. */
  start(): Transport {
    this.timer ??= setInterval(() => this.server.tick(), TICK_MS);
    return { createSocket: localSocketFactory(this.server), url: "local:" };
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
