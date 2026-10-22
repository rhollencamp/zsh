import {
  type ClientMessage,
  type ServerMessage,
  encode,
  parseServerMessage,
} from "../shared/protocol.js";

/** The slice of the browser WebSocket the client needs; easy to fake. */
export interface SocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
}

export type SocketFactory = (url: string) => SocketLike;

export interface NetcodeHandlers {
  onOpen(): void;
  onMessage(message: ServerMessage): void;
  onClose(): void;
}

const OPEN = 1;

export function socketUrl(
  location: { protocol: string; host: string },
  path: string,
): string {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}${path}`;
}

/** Typed messages over a socket; knows nothing about game rules. */
export class Netcode {
  private readonly createSocket: SocketFactory;
  private readonly handlers: NetcodeHandlers;
  private socket: SocketLike | null = null;

  constructor(createSocket: SocketFactory, handlers: NetcodeHandlers) {
    this.createSocket = createSocket;
    this.handlers = handlers;
  }

  connect(url: string): void {
    this.disconnect();
    const socket = this.createSocket(url);
    socket.onopen = () => this.handlers.onOpen();
    socket.onmessage = (event) => {
      const message = parseServerMessage(String(event.data));
      if (message !== null) {
        this.handlers.onMessage(message);
      }
    };
    socket.onclose = () => {
      if (this.socket === socket) {
        this.socket = null;
        this.handlers.onClose();
      }
    };
    socket.onerror = (event) => console.error("websocket error", event);
    this.socket = socket;
  }

  send(message: ClientMessage): void {
    if (this.socket !== null && this.socket.readyState === OPEN) {
      this.socket.send(encode(message));
    }
  }

  /** Close without reporting onClose; that is for unexpected drops. */
  disconnect(): void {
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }
}
