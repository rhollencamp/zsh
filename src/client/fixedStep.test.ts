import { describe, expect, it } from "vitest";
import { FixedStep } from "./fixedStep.js";

describe("FixedStep", () => {
  it("accumulates partial steps", () => {
    const step = new FixedStep(50);
    expect(step.advance(30)).toEqual({ steps: 0, alpha: 0.6 });
    expect(step.advance(30)).toEqual({ steps: 1, alpha: 0.2 });
  });

  it("runs several steps after a long frame", () => {
    expect(new FixedStep(50).advance(120)).toEqual({ steps: 2, alpha: 0.4 });
  });

  it("caps steps and drops the backlog after a stall", () => {
    const step = new FixedStep(50, 3);
    expect(step.advance(10_000)).toEqual({ steps: 3, alpha: 0 });
    expect(step.advance(0)).toEqual({ steps: 0, alpha: 0 });
  });

  it("ignores negative time", () => {
    expect(new FixedStep(50).advance(-100)).toEqual({ steps: 0, alpha: 0 });
  });
});
