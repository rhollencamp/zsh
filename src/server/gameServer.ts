import { PROTOCOL_VERSION } from "../shared/constants.js";
import {
  type ServerMessage,
  encode,
  parseClientMessage,
} from "../shared/protocol.js";
import type { Game } from "./game.js";

/** The slice of a socket the server needs; easy to fake in tests. */
export interface Connection {
  send(data: string): void;
  close(): void;
}

export interface Session {
  receive(raw: string): void;
  disconnect(): void;
}

type Log = (message: string) => void;

/**
 * Connects transport-level connections to the Game: decodes messages,
 * tracks which connection is which player, and broadcasts snapshots.
 */
export class GameServer {
  private readonly game: Game;
  private readonly log: Log;
  private readonly players = new Map<Connection, number>();

  constructor(game: Game, log: Log = console.log) {
    this.game = game;
    this.log = log;
  }

  connect(connection: Connection): Session {
    return {
      receive: (raw) => this.receive(connection, raw),
      disconnect: () => this.disconnect(connection),
    };
  }

  /** Advance the game one tick and send everyone the result. */
  tick(): void {
    this.game.step();
    const message: ServerMessage = {
      type: "snapshot",
      tick: this.game.tick,
      players: this.game.snapshot(),
    };
    const data = encode(message);
    for (const connection of this.players.keys()) {
      connection.send(data);
    }
  }

  private receive(connection: Connection, raw: string): void {
    const message = parseClientMessage(raw);
    if (message === null) {
      return;
    }
    const playerId = this.players.get(connection);

    if (message.type === "join") {
      if (playerId !== undefined) {
        return;
      }
      if (message.protocol !== PROTOCOL_VERSION) {
        this.reject(connection, "Your client is out of date; please reload.");
        return;
      }
      const result = this.game.join(message.name);
      if (!result.ok) {
        this.reject(connection, result.reason);
        return;
      }
      this.players.set(connection, result.playerId);
      this.log(`${message.name} joined as player ${result.playerId}`);
      this.send(connection, {
        type: "welcome",
        playerId: result.playerId,
        tick: this.game.tick,
        world: this.game.world.toData(),
        state: result.state,
      });
    } else if (message.type === "input" && playerId !== undefined) {
      this.game.queueInput(playerId, message.seq, message.input);
    }
  }

  private disconnect(connection: Connection): void {
    const playerId = this.players.get(connection);
    if (playerId !== undefined) {
      this.players.delete(connection);
      this.game.leave(playerId);
      this.log(`player ${playerId} left`);
    }
  }

  private reject(connection: Connection, reason: string): void {
    this.send(connection, { type: "rejected", reason });
    connection.close();
  }

  private send(connection: Connection, message: ServerMessage): void {
    connection.send(encode(message));
  }
}
