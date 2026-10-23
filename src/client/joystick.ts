import type { MoveIntent } from "./input.js";

export interface JoystickOptions {
  /** How far (px) the thumb must move from where it landed for full speed. */
  radius: number;
  /** Fraction of the radius that counts as no input, so a resting thumb is still. */
  deadZone: number;
}

export const DEFAULT_JOYSTICK: JoystickOptions = Object.freeze({
  radius: 60,
  deadZone: 0.15,
});

/**
 * A floating virtual thumbstick: its centre is wherever the touch starts.
 * Screen coordinates in, analog move intent out (partial tilt walks
 * slower). No DOM, so it's tested directly.
 */
export class Joystick {
  private readonly options: JoystickOptions;
  private origin: { x: number; y: number } | null = null;
  private offset = { x: 0, y: 0 };

  constructor(options: JoystickOptions = DEFAULT_JOYSTICK) {
    this.options = options;
  }

  get active(): boolean {
    return this.origin !== null;
  }

  /** Where the stick is centred, or null when not touched. */
  get center(): { x: number; y: number } | null {
    return this.origin;
  }

  /** Knob position relative to the centre, clamped to the radius. */
  get knob(): { x: number; y: number } {
    return { ...this.offset };
  }

  start(x: number, y: number): void {
    this.origin = { x, y };
    this.offset = { x: 0, y: 0 };
  }

  move(x: number, y: number): void {
    if (this.origin === null) {
      return;
    }
    let dx = x - this.origin.x;
    let dy = y - this.origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance > this.options.radius) {
      dx *= this.options.radius / distance;
      dy *= this.options.radius / distance;
    }
    this.offset = { x: dx, y: dy };
  }

  end(): void {
    this.origin = null;
    this.offset = { x: 0, y: 0 };
  }

  intent(): MoveIntent {
    const { radius, deadZone } = this.options;
    const distance = Math.hypot(this.offset.x, this.offset.y) / radius;
    if (distance <= deadZone) {
      return { forward: 0, right: 0 };
    }
    // rescale so output ramps from 0 at the dead zone edge to 1 at the rim
    const scale = (distance - deadZone) / (1 - deadZone) / distance / radius;
    return {
      forward: -this.offset.y * scale, // screen y points down
      right: this.offset.x * scale,
    };
  }
}
