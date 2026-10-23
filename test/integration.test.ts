import { beforeEach, describe, expect, it } from "vitest";
import { App, type AppRenderer, type AppUi } from "../src/client/app.js";
import type { GameView } from "../src/client/clientGame.js";
import type { MoveIntent } from "../src/client/input.js";
import { Game } from "../src/server/game.js";
import { GameServer } from "../src/server/gameServer.js";
import { generateWorld } from "../src/server/worldGenerator.js";
import { TICK_MS } from "../src/shared/constants.js";
import { FakeNetwork } from "./fakeNetwork.js";

const FRAME_MS = 1000 / 60;
const LATENCY_MS = 80;

class Client {
  intent: MoveIntent = { forward: 0, right: 0 };
  view: GameView | null = null;
  error: string | null = null;
  readonly app: App;

  constructor(network: FakeNetwork) {
    const renderer: AppRenderer = {
      setWorld: () => {},
      render: (view) => (this.view = view),
    };
    const ui: AppUi = {
      setConnecting: () => {},
      showError: (message) => (this.error = message),
      hide: () => {},
    };
    this.app = new App({
      renderer,
      ui,
      input: { intent: () => this.intent },
      now: () => network.now,
    });
  }
}

let game: Game;
let network: FakeNetwork;
let server: GameServer;
let clients: Client[];
let time: number;
let nextTick: number;

beforeEach(() => {
  const { world, spawn } = generateWorld();
  game = new Game(world, { spawn });
  server = new GameServer(game, () => {});
  network = new FakeNetwork(server, LATENCY_MS);
  clients = [];
  time = 0;
  nextTick = TICK_MS;
});

function addClient(name: string): Client {
  const client = new Client(network);
  clients.push(client);
  client.app.play(name, { createSocket: network.createSocket, url: "test:" });
  return client;
}

/** Run the whole system (network, server ticks, client frames) for a while. */
function run(ms: number): void {
  const end = time + ms;
  while (time < end) {
    time += FRAME_MS;
    while (nextTick <= time) {
      network.advanceTo(nextTick);
      server.tick();
      nextTick += TICK_MS;
    }
    network.advanceTo(time);
    for (const client of clients) {
      client.app.frame(time);
    }
  }
}

function serverPosition(name: string) {
  return game.snapshot().find((p) => p.name === name)!.state.position;
}

describe("client and server together", () => {
  it("joins and lands on the ground", () => {
    const alice = addClient("alice");
    run(1000);
    expect(alice.app.inGame).toBe(true);
    expect(serverPosition("alice").y).toBe(1);
    expect(alice.view!.self.position.y).toBe(1);
  });

  it("moves immediately on the client despite latency", () => {
    const alice = addClient("alice");
    run(1000);
    const start = alice.view!.self.position.z;

    alice.intent = { forward: 1, right: 0 };
    run(100);
    // the client has moved; the server has not heard about it yet
    expect(alice.view!.self.position.z).toBeLessThan(start - 0.2);
    expect(serverPosition("alice").z).toBeCloseTo(start);
  });

  it("ends up exactly where the server says once inputs are acknowledged", () => {
    const alice = addClient("alice");
    run(1000);
    alice.intent = { forward: 1, right: 0.5 };
    run(1500);
    alice.intent = { forward: 0, right: 0 };
    run(1000);
    expect(alice.view!.self.position).toEqual(serverPosition("alice"));
  });

  it("shows other players where the server has them", () => {
    const alice = addClient("alice");
    const bob = addClient("bob");
    run(1000);
    alice.intent = { forward: 0, right: 1 };
    run(500);
    alice.intent = { forward: 0, right: 0 };
    run(1000);
    const seen = bob.view!.others.find((p) => p.name === "alice");
    expect(seen?.position).toEqual(serverPosition("alice"));
  });

  it("tells the second player with a taken name why", () => {
    addClient("alice");
    const imposter = addClient("ALICE");
    run(1000);
    expect(imposter.app.inGame).toBe(false);
    expect(imposter.error).toMatch(/taken/);
    expect(game.playerCount).toBe(1);
  });

  it("removes a player who leaves from everyone else's view", () => {
    const alice = addClient("alice");
    const bob = addClient("bob");
    run(1000);
    expect(bob.view!.others).toHaveLength(1);
    clients = [bob];
    alice.app.leave();
    run(1000);
    expect(game.playerCount).toBe(1);
    expect(bob.view!.others).toHaveLength(0);
  });
});
