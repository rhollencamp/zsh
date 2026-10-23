import type { SocketFactory } from "../src/client/net.js";
import type { GameServer } from "../src/server/gameServer.js";
import { localSocketFactory } from "../src/web/localSocket.js";

/**
 * The in-page socket from the standalone build, but with a fixed one-way
 * latency driven by a manual clock instead of microtasks.
 */
export class FakeNetwork {
  now = 0;
  readonly createSocket: SocketFactory;
  private readonly latencyMs: number;
  private queue: { at: number; deliver: () => void }[] = [];

  constructor(server: GameServer, latencyMs: number) {
    this.latencyMs = latencyMs;
    this.createSocket = localSocketFactory(server, (deliver) =>
      this.queue.push({ at: this.now + this.latencyMs, deliver }),
    );
  }

  /** Advance the clock, delivering everything that has arrived. */
  advanceTo(time: number): void {
    this.now = time;
    while (true) {
      const due = this.queue.filter((m) => m.at <= time);
      if (due.length === 0) {
        return;
      }
      this.queue = this.queue.filter((m) => m.at > time);
      for (const message of due) {
        message.deliver();
      }
    }
  }
}
