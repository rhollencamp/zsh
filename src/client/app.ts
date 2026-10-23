import { PROTOCOL_VERSION, TICK_MS } from "../shared/constants.js";
import type { ServerMessage } from "../shared/protocol.js";
import type { World } from "../shared/world.js";
import { ClientGame, type GameView } from "./clientGame.js";
import { FixedStep } from "./fixedStep.js";
import type { MoveIntent } from "./input.js";
import { Netcode, type SocketFactory } from "./net.js";

export interface AppRenderer {
  setWorld(world: World, selfId: number): void;
  render(view: GameView): void;
}

export interface AppUi {
  setConnecting(): void;
  showError(message: string): void;
  hide(): void;
}

/** How to reach a game server: over the network, or in this page. */
export interface Transport {
  createSocket: SocketFactory;
  url: string;
}

export interface AppDeps {
  renderer: AppRenderer;
  ui: AppUi;
  input: { intent(): MoveIntent };
  now: () => number;
}

/**
 * Wires networking, input, simulation and rendering together. Every
 * outside dependency is injected, so the whole flow runs under test.
 */
export class App {
  private readonly deps: AppDeps;
  private net: Netcode | null = null;
  private readonly fixedStep = new FixedStep(TICK_MS);
  private game: ClientGame | null = null;
  private name = "";
  private lastFrame: number | null = null;

  constructor(deps: AppDeps) {
    this.deps = deps;
  }

  get inGame(): boolean {
    return this.game !== null;
  }

  play(name: string, transport: Transport): void {
    this.leave();
    this.name = name;
    this.deps.ui.setConnecting();
    const net = new Netcode(transport.createSocket, {
      onOpen: () =>
        net.send({ type: "join", protocol: PROTOCOL_VERSION, name: this.name }),
      onMessage: (message) => this.onMessage(message),
      onClose: () => this.onClose(),
    });
    this.net = net;
    net.connect(transport.url);
  }

  /** Leave the game on purpose; unlike a dropped connection, shows no error. */
  leave(): void {
    this.net?.disconnect();
    this.net = null;
    this.game = null;
  }

  /** Call once per animation frame. */
  frame(now: number): void {
    const game = this.game;
    if (game === null) {
      return;
    }
    const elapsed = this.lastFrame === null ? 0 : now - this.lastFrame;
    this.lastFrame = now;
    const { steps, alpha } = this.fixedStep.advance(elapsed);
    for (let i = 0; i < steps; i++) {
      this.net?.send(game.fixedUpdate(this.deps.input.intent()));
    }
    this.deps.renderer.render(game.view(now, alpha));
  }

  private onMessage(message: ServerMessage): void {
    switch (message.type) {
      case "welcome":
        this.game = new ClientGame(message, this.name);
        this.lastFrame = null;
        this.deps.renderer.setWorld(this.game.world, this.game.playerId);
        this.deps.ui.hide();
        break;
      case "rejected":
        this.leave();
        this.deps.ui.showError(message.reason);
        break;
      case "snapshot":
        this.game?.onSnapshot(message.players, this.deps.now());
        break;
    }
  }

  private onClose(): void {
    const wasInGame = this.game !== null;
    this.net = null;
    this.game = null;
    this.deps.ui.showError(
      wasInGame
        ? "Disconnected from the server."
        : "Could not connect to the server.",
    );
  }
}
