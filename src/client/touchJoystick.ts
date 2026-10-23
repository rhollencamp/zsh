import type { MoveIntent } from "./input.js";
import { Joystick } from "./joystick.js";

/**
 * The on-screen thumbstick: a touch zone over the left half of the screen
 * (the right half is kept free for camera look later) that shows a base
 * and knob wherever the thumb lands. DOM shell around Joystick.
 */
export class TouchJoystick {
  private readonly joystick: Joystick;
  private readonly zone: HTMLElement;
  private readonly base: HTMLElement;
  private readonly knob: HTMLElement;
  private pointerId: number | null = null;

  constructor(parent: HTMLElement, joystick = new Joystick()) {
    this.joystick = joystick;
    const doc = parent.ownerDocument;
    this.zone = doc.createElement("div");
    this.zone.className = "joystick-zone";
    this.base = doc.createElement("div");
    this.base.className = "joystick-base";
    this.knob = doc.createElement("div");
    this.knob.className = "joystick-knob";
    this.base.append(this.knob);
    this.zone.append(this.base);
    parent.append(this.zone);

    this.zone.addEventListener("pointerdown", (e) => this.onDown(e));
    this.zone.addEventListener("pointermove", (e) => this.onMove(e));
    this.zone.addEventListener("pointerup", (e) => this.onUp(e));
    this.zone.addEventListener("pointercancel", (e) => this.onUp(e));
    // a lost capture (e.g. the browser took over the gesture) is a release
    this.zone.addEventListener("lostpointercapture", (e) => this.onUp(e));
    this.render();
  }

  intent(): MoveIntent {
    return this.joystick.intent();
  }

  private onDown(event: PointerEvent): void {
    // mouse will drive the camera later; the stick is for touch and pens
    if (event.pointerType === "mouse" || this.pointerId !== null) {
      return;
    }
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.zone.setPointerCapture(event.pointerId);
    this.joystick.start(event.clientX, event.clientY);
    this.render();
  }

  private onMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    event.preventDefault();
    this.joystick.move(event.clientX, event.clientY);
    this.render();
  }

  private onUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    this.pointerId = null;
    this.joystick.end();
    this.render();
  }

  private render(): void {
    const center = this.joystick.center;
    this.base.classList.toggle("active", center !== null);
    if (center !== null) {
      const zone = this.zone.getBoundingClientRect();
      this.base.style.left = `${center.x - zone.left}px`;
      this.base.style.top = `${center.y - zone.top}px`;
    } else {
      // resting position, only shown on touch screens (see style.css)
      this.base.style.left = "";
      this.base.style.top = "";
    }
    const { x, y } = this.joystick.knob;
    this.knob.style.transform = `translate(${x}px, ${y}px)`;
  }
}
