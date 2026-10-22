/**
 * Turns variable frame times into a whole number of fixed simulation
 * steps, plus how far we are into the next one (for interpolation).
 */
export class FixedStep {
  readonly stepMs: number;
  private readonly maxSteps: number;
  private accumulated = 0;

  constructor(stepMs: number, maxSteps = 5) {
    this.stepMs = stepMs;
    this.maxSteps = maxSteps;
  }

  advance(elapsedMs: number): { steps: number; alpha: number } {
    this.accumulated += Math.max(0, elapsedMs);
    let steps = Math.floor(this.accumulated / this.stepMs);
    this.accumulated -= steps * this.stepMs;
    if (steps > this.maxSteps) {
      // too far behind (e.g. a backgrounded tab): skip ahead, don't spiral
      steps = this.maxSteps;
      this.accumulated = 0;
    }
    return { steps, alpha: this.accumulated / this.stepMs };
  }
}
