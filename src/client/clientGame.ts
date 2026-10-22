import { TICK_MS } from "../shared/constants.js";
import type { Vec3 } from "../shared/math.js";
import type {
  ClientMessage,
  PlayerSnapshot,
  ServerMessage,
} from "../shared/protocol.js";
import { World } from "../shared/world.js";
import type { MoveIntent } from "./input.js";
import { LocalPlayer } from "./localPlayer.js";
import {
  type RemotePlayerView,
  RemotePlayers,
  headingOf,
} from "./remotePlayers.js";

export interface PlayerView {
  id: number;
  name: string;
  position: Vec3;
  heading: number;
}

/** Everything the renderer needs for one frame. */
export interface GameView {
  cameraYaw: number;
  self: PlayerView;
  others: RemotePlayerView[];
}

type Welcome = Extract<ServerMessage, { type: "welcome" }>;

/** Render other players this far behind the newest snapshot. */
export const INTERPOLATION_DELAY_MS = TICK_MS * 2;

/** Client-side game state once we've joined. No DOM, sockets or WebGL. */
export class ClientGame {
  readonly world: World;
  readonly playerId: number;
  readonly name: string;
  /** Camera heading; WASD is relative to it. Fixed until mouse look exists. */
  cameraYaw = 0;
  private readonly local: LocalPlayer;
  private readonly remotes = new RemotePlayers(INTERPOLATION_DELAY_MS);
  private heading = 0;

  constructor(welcome: Welcome, name: string) {
    this.name = name;
    this.world = World.fromData(welcome.world);
    this.playerId = welcome.playerId;
    this.local = new LocalPlayer(this.world, welcome.state);
  }

  /** Run one fixed tick of local prediction; returns the message to send. */
  fixedUpdate(intent: MoveIntent): ClientMessage {
    const { seq, input } = this.local.step({ ...intent, yaw: this.cameraYaw });
    this.heading = headingOf(this.local.state.velocity, this.heading);
    return { type: "input", seq, input };
  }

  onSnapshot(players: PlayerSnapshot[], time: number): void {
    const others: PlayerSnapshot[] = [];
    for (const player of players) {
      if (player.id === this.playerId) {
        this.local.reconcile(player.state, player.lastInputSeq);
      } else {
        others.push(player);
      }
    }
    this.remotes.apply(others, time);
  }

  view(time: number, alpha: number): GameView {
    return {
      cameraYaw: this.cameraYaw,
      self: {
        id: this.playerId,
        name: this.name,
        position: this.local.renderPosition(alpha),
        heading: this.heading,
      },
      others: this.remotes.view(time),
    };
  }
}
