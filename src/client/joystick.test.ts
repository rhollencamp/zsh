import { describe, expect, it } from "vitest";
import { Joystick } from "./joystick.js";

const options = { radius: 100, deadZone: 0.2 };

function at(dx: number, dy: number): Joystick {
  const stick = new Joystick(options);
  stick.start(500, 300);
  stick.move(500 + dx, 300 + dy);
  return stick;
}

describe("Joystick", () => {
  it("is idle until touched", () => {
    const stick = new Joystick(options);
    expect(stick.active).toBe(false);
    expect(stick.intent()).toEqual({ forward: 0, right: 0 });
  });

  it("centres wherever the touch starts", () => {
    const stick = new Joystick(options);
    stick.start(40, 700);
    expect(stick.center).toEqual({ x: 40, y: 700 });
    expect(stick.knob).toEqual({ x: 0, y: 0 });
  });

  it("pushing up the screen walks forward at full speed", () => {
    const { forward, right } = at(0, -100).intent();
    expect(forward).toBeCloseTo(1);
    expect(right).toBeCloseTo(0);
  });

  it("pushing right strafes right", () => {
    expect(at(100, 0).intent().right).toBeCloseTo(1);
  });

  it("ignores small movements inside the dead zone", () => {
    expect(at(10, -15).intent()).toEqual({ forward: 0, right: 0 });
  });

  it("ramps up smoothly from the dead zone edge", () => {
    expect(at(0, -60).intent().forward).toBeCloseTo(0.5);
  });

  it("clamps the knob to the rim and never exceeds full speed", () => {
    const stick = at(300, -400);
    expect(Math.hypot(stick.knob.x, stick.knob.y)).toBeCloseTo(100);
    const { forward, right } = stick.intent();
    expect(Math.hypot(forward, right)).toBeCloseTo(1);
    expect(forward).toBeCloseTo(0.8);
    expect(right).toBeCloseTo(0.6);
  });

  it("stops when released", () => {
    const stick = at(0, -100);
    stick.end();
    expect(stick.active).toBe(false);
    expect(stick.intent()).toEqual({ forward: 0, right: 0 });
  });

  it("ignores moves while not touched", () => {
    const stick = new Joystick(options);
    stick.move(10, 10);
    expect(stick.knob).toEqual({ x: 0, y: 0 });
  });
});
