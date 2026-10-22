import type { SocketLike } from "../src/client/net.js";
import type { Connection, GameServer } from "../src/server/gameServer.js";

/**
 * An in-memory network between client sockets and a GameServer, with a
 * fixed one-way latency driven by a manual clock.
 */
export class FakeNetwork {
  now = 0;
  private queue: { at: number; deliver: () => void }[] = [];

  private readonly server: GameServer;
  private readonly latencyMs: number;

  constructor(server: GameServer, latencyMs: number) {
    this.server = server;
    this.latencyMs = latencyMs;
  }

  createSocket = (): SocketLike => {
    const network = this;
    let session: ReturnType<GameServer["connect"]> | null = null;
    const socket: SocketLike & { readyState: number } = {
      readyState: 0,
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      send(data) {
        network.later(() => session?.receive(data));
      },
      close() {
        socket.readyState = 3;
        network.later(() => session?.disconnect());
      },
    };
    const connection: Connection = {
      send: (data) =>
        network.later(() => socket.onmessage?.({ data } as MessageEvent)),
      close: () =>
        network.later(() => {
          socket.readyState = 3;
          socket.onclose?.({} as CloseEvent);
        }),
    };
    this.later(() => {
      session = this.server.connect(connection);
      socket.readyState = 1;
      socket.onopen?.({} as Event);
    });
    return socket;
  };

  /** Advance the clock, delivering everything that has arrived. */
  advanceTo(time: number): void {
    this.now = time;
    const due = this.queue.filter((m) => m.at <= time);
    this.queue = this.queue.filter((m) => m.at > time);
    for (const message of due) {
      message.deliver();
    }
  }

  private later(deliver: () => void): void {
    this.queue.push({ at: this.now + this.latencyMs, deliver });
  }
}
