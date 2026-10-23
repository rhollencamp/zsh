import type { SocketFactory, SocketLike } from "../client/net.js";
import type { Connection, GameServer, Session } from "../server/gameServer.js";

const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 3;

/** Runs a callback later; how the "network" delivers. */
export type Deliver = (callback: () => void) => void;

/**
 * Sockets that talk to a GameServer in the same page by direct calls.
 * Everything is delivered asynchronously (a microtask by default), like a
 * real socket, so neither side ever re-enters the other mid-call. The
 * messages are still encoded, so online and offline run the same code.
 */
export function localSocketFactory(
  server: GameServer,
  deliver: Deliver = queueMicrotask,
): SocketFactory {
  return () => {
    let session: Session | null = null;

    const socket: SocketLike & { readyState: number } = {
      readyState: CONNECTING,
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      send(data) {
        if (socket.readyState === OPEN) {
          deliver(() => session?.receive(data));
        }
      },
      close() {
        if (socket.readyState === CLOSED) {
          return;
        }
        socket.readyState = CLOSED;
        deliver(() => {
          session?.disconnect();
          session = null;
          socket.onclose?.({} as CloseEvent);
        });
      },
    };

    const connection: Connection = {
      send(data) {
        deliver(() => {
          if (socket.readyState === OPEN) {
            socket.onmessage?.({ data } as MessageEvent);
          }
        });
      },
      close() {
        deliver(() => {
          if (socket.readyState !== CLOSED) {
            socket.readyState = CLOSED;
            session?.disconnect();
            session = null;
            socket.onclose?.({} as CloseEvent);
          }
        });
      },
    };

    deliver(() => {
      if (socket.readyState === CONNECTING) {
        session = server.connect(connection);
        socket.readyState = OPEN;
        socket.onopen?.({} as Event);
      }
    });
    return socket;
  };
}
