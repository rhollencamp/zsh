import { describe, expect, it } from "vitest";
import { KeyboardInput, combineIntents } from "./input.js";

describe("KeyboardInput", () => {
  it("is idle with nothing held", () => {
    expect(new KeyboardInput().intent()).toEqual({ forward: 0, right: 0 });
  });

  it("maps WASD and arrows", () => {
    const input = new KeyboardInput();
    input.keyDown("KeyW");
    input.keyDown("ArrowLeft");
    expect(input.intent()).toEqual({ forward: 1, right: -1 });
    input.keyUp("KeyW");
    input.keyDown("KeyS");
    input.keyUp("ArrowLeft");
    input.keyDown("KeyD");
    expect(input.intent()).toEqual({ forward: -1, right: 1 });
  });

  it("cancels opposite keys", () => {
    const input = new KeyboardInput();
    input.keyDown("KeyW");
    input.keyDown("KeyS");
    expect(input.intent().forward).toBe(0);
  });

  it("reports whether a key is bound", () => {
    const input = new KeyboardInput();
    expect(input.keyDown("KeyW")).toBe(true);
    expect(input.keyDown("KeyQ")).toBe(false);
  });

  it("releases everything on clear", () => {
    const input = new KeyboardInput();
    input.keyDown("KeyW");
    input.clear();
    expect(input.intent()).toEqual({ forward: 0, right: 0 });
  });
});

describe("combineIntents", () => {
  const fixed = (forward: number, right: number) => ({
    intent: () => ({ forward, right }),
  });

  it("adds sources together", () => {
    expect(combineIntents([fixed(0.5, 0), fixed(0, -0.25)]).intent()).toEqual({
      forward: 0.5,
      right: -0.25,
    });
  });

  it("clamps each axis", () => {
    expect(combineIntents([fixed(1, -1), fixed(1, -1)]).intent()).toEqual({
      forward: 1,
      right: -1,
    });
  });

  it("is idle with no sources", () => {
    expect(combineIntents([]).intent()).toEqual({ forward: 0, right: 0 });
  });
});
