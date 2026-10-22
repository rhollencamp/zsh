import { type Vec3, vec3 } from "./math.js";
import type { World } from "./world.js";

/**
 * What a player wants to do for one tick. `forward` and `right` are in
 * [-1, 1]; `yaw` is the heading (radians) they are relative to, where
 * yaw 0 faces -Z and positive yaw turns left (three.js convention).
 */
export interface PlayerInput {
  forward: number;
  right: number;
  yaw: number;
}

/** Position is the center of the player's feet. */
export interface PlayerState {
  position: Vec3;
  velocity: Vec3;
  onGround: boolean;
}

export const PLAYER = Object.freeze({
  halfWidth: 0.3,
  height: 1.8,
  walkSpeed: 5,
  gravity: 25,
  maxFallSpeed: 15,
});

export const IDLE_INPUT: PlayerInput = Object.freeze({
  forward: 0,
  right: 0,
  yaw: 0,
});

const EPSILON = 1e-6;

export function spawnState(position: Vec3): PlayerState {
  return { position: { ...position }, velocity: vec3(), onGround: false };
}

/** Unit-or-shorter horizontal direction the input asks to move in. */
export function wishDirection(input: PlayerInput): { x: number; z: number } {
  const sin = Math.sin(input.yaw);
  const cos = Math.cos(input.yaw);
  // forward = (-sin, -cos), right = (cos, -sin)
  let x = -sin * input.forward + cos * input.right;
  let z = -cos * input.forward - sin * input.right;
  const length = Math.hypot(x, z);
  if (length > 1) {
    x /= length;
    z /= length;
  }
  return { x, z };
}

/**
 * Advance one player by `dt` seconds. Pure and deterministic, so the
 * server (authoritative) and client (prediction) get identical results.
 */
export function stepPlayer(
  state: PlayerState,
  input: PlayerInput,
  world: World,
  dt: number,
): PlayerState {
  const wish = wishDirection(input);
  const velocity = vec3(
    wish.x * PLAYER.walkSpeed,
    Math.max(state.velocity.y - PLAYER.gravity * dt, -PLAYER.maxFallSpeed),
    wish.z * PLAYER.walkSpeed,
  );
  const position = { ...state.position };

  if (moveAxis(world, position, "x", velocity.x * dt)) {
    velocity.x = 0;
  }
  if (moveAxis(world, position, "z", velocity.z * dt)) {
    velocity.z = 0;
  }
  const falling = velocity.y < 0;
  const hitY = moveAxis(world, position, "y", velocity.y * dt);
  if (hitY) {
    velocity.y = 0;
  }

  return { position, velocity, onGround: hitY && falling };
}

type Axis = "x" | "y" | "z";

/**
 * Move `position` along one axis, then push it back out of any solid
 * blocks it ended up overlapping. Returns whether it was blocked.
 */
function moveAxis(
  world: World,
  position: Vec3,
  axis: Axis,
  delta: number,
): boolean {
  if (delta === 0) {
    return false;
  }
  position[axis] += delta;

  const minX = Math.floor(position.x - PLAYER.halfWidth + EPSILON);
  const maxX = Math.floor(position.x + PLAYER.halfWidth - EPSILON);
  const minY = Math.floor(position.y + EPSILON);
  const maxY = Math.floor(position.y + PLAYER.height - EPSILON);
  const minZ = Math.floor(position.z - PLAYER.halfWidth + EPSILON);
  const maxZ = Math.floor(position.z + PLAYER.halfWidth - EPSILON);

  let blocked = false;
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (!world.isSolid(x, y, z)) {
          continue;
        }
        blocked = true;
        const cell = { x, y, z }[axis];
        if (axis === "y") {
          position.y =
            delta < 0
              ? Math.max(position.y, cell + 1)
              : Math.min(position.y, cell - PLAYER.height);
        } else {
          position[axis] =
            delta < 0
              ? Math.max(position[axis], cell + 1 + PLAYER.halfWidth)
              : Math.min(position[axis], cell - PLAYER.halfWidth);
        }
      }
    }
  }
  return blocked;
}
