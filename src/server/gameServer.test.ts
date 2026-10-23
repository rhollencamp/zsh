import { beforeEach, describe, expect, it } from "vitest";
import { PROTOCOL_VERSION } from "../shared/constants.js";
import {
  type ClientMessage,
  type ServerMessage,
  encode,
} from "../shared/protocol.js";
import { Game } from "./game.js";
import { type Connection, GameServer, type Session } from "./gameServer.js";
import { generateWorld } from "./worldGenerator.js";

class FakeConnection implements Connection {
  sent: ServerMessage[] = [];
  closed = false;
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
  close(): void {
    this.closed = true;
  }
  last(): ServerMessage | undefined {
    return this.sent.at(-1);
  }
}

let game: Game;
let server: GameServer;

beforeEach(() => {
  const { world, spawn } = generateWorld();
  game = new Game(world, { spawn });
  server = new GameServer(game, () => {});
});

function connect(): [FakeConnection, Session] {
  const connection = new FakeConnection();
  return [connection, server.connect(connection)];
}

function send(session: Session, message: ClientMessage): void {
  session.receive(encode(message));
}

function join(session: Session, name: string): void {
  send(session, { type: "join", protocol: PROTOCOL_VERSION, name });
}

describe("GameServer", () => {
  it("welcomes a player with the world and their state", () => {
    const [connection, session] = connect();
    join(session, "alice");
    const welcome = connection.last();
    expect(welcome?.type).toBe("welcome");
    if (welcome?.type === "welcome") {
      expect(welcome.world.blocks).toHaveLength(game.world.blocks.length);
      expect(welcome.state.position).toBeDefined();
    }
    expect(game.playerCount).toBe(1);
  });

  it("rejects and closes on a protocol mismatch", () => {
    const [connection, session] = connect();
    send(session, {
      type: "join",
      protocol: PROTOCOL_VERSION + 1,
      name: "alice",
    });
    expect(connection.last()?.type).toBe("rejected");
    expect(connection.closed).toBe(true);
    expect(game.playerCount).toBe(0);
  });

  it("rejects a duplicate name", () => {
    join(connect()[1], "alice");
    const [connection, session] = connect();
    join(session, "alice");
    expect(connection.last()).toMatchObject({ type: "rejected" });
  });

  it("ignores a second join on the same connection", () => {
    const [connection, session] = connect();
    join(session, "alice");
    join(session, "bob");
    expect(connection.sent).toHaveLength(1);
    expect(game.playerCount).toBe(1);
  });

  it("ignores input and garbage before joining", () => {
    const [connection, session] = connect();
    send(session, {
      type: "input",
      seq: 1,
      input: { forward: 1, right: 0, yaw: 0 },
    });
    session.receive("garbage");
    server.tick();
    expect(connection.sent).toHaveLength(0);
  });

  it("broadcasts snapshots to joined players only", () => {
    const [a, sessionA] = connect();
    const [b] = connect();
    join(sessionA, "alice");
    server.tick();
    expect(a.last()).toMatchObject({ type: "snapshot", tick: 1 });
    expect(b.sent).toHaveLength(0);
  });

  it("applies inputs on tick", () => {
    const [connection, session] = connect();
    join(session, "alice");
    send(session, {
      type: "input",
      seq: 1,
      input: { forward: 1, right: 0, yaw: 0 },
    });
    server.tick();
    const snapshot = connection.last();
    expect(
      snapshot?.type === "snapshot" && snapshot.players[0].lastInputSeq,
    ).toBe(1);
  });

  it("removes the player on disconnect", () => {
    const [, session] = connect();
    join(session, "alice");
    session.disconnect();
    expect(game.playerCount).toBe(0);
  });
});
