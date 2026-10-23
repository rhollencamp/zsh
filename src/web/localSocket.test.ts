import { beforeEach, describe, expect, it } from "vitest";
import type { SocketLike } from "../client/net.js";
import { Game } from "../server/game.js";
import { GameServer } from "../server/gameServer.js";
import { generateWorld } from "../server/worldGenerator.js";
import { PROTOCOL_VERSION } from "../shared/constants.js";
import { type ServerMessage, encode } from "../shared/protocol.js";
import { localSocketFactory } from "./localSocket.js";

/** Let queued microtasks (the local "network") run. */
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

let game: Game;
let socket: SocketLike;
let received: ServerMessage[];
let events: string[];

let server: GameServer;

beforeEach(() => {
  const { world, spawn } = generateWorld();
  game = new Game(world, { spawn });
  server = new GameServer(game, () => {});
});

/** Created inside each test: vitest yields between hooks and tests. */
function connect(): void {
  socket = localSocketFactory(server)("local:");
  received = [];
  events = [];
  socket.onopen = () => events.push("open");
  socket.onclose = () => events.push("close");
  socket.onmessage = (event) => received.push(JSON.parse(String(event.data)));
}

function join(name: string): void {
  socket.send(encode({ type: "join", protocol: PROTOCOL_VERSION, name }));
}

describe("localSocketFactory", () => {
  it("opens asynchronously, like a real socket", async () => {
    connect();
    expect(socket.readyState).toBe(0);
    expect(events).toEqual([]);
    await flush();
    expect(socket.readyState).toBe(1);
    expect(events).toEqual(["open"]);
  });

  it("carries messages both ways", async () => {
    connect();
    await flush();
    join("solo");
    expect(received).toEqual([]);
    await flush();
    expect(received.map((m) => m.type)).toEqual(["welcome"]);
    expect(game.playerCount).toBe(1);
  });

  it("drops messages sent before it opens", async () => {
    connect();
    join("solo");
    await flush();
    expect(received).toEqual([]);
  });

  it("disconnects the player when the client closes", async () => {
    connect();
    await flush();
    join("solo");
    await flush();
    socket.close();
    expect(socket.readyState).toBe(3);
    await flush();
    expect(game.playerCount).toBe(0);
    expect(events).toEqual(["open", "close"]);
  });

  it("closes when the server rejects", async () => {
    connect();
    await flush();
    socket.send(encode({ type: "join", protocol: -1, name: "solo" }));
    await flush();
    expect(received.map((m) => m.type)).toEqual(["rejected"]);
    expect(events).toEqual(["open", "close"]);
  });
});
