import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../client/app.js";
import type { GameView } from "../client/clientGame.js";
import { TICK_MS } from "../shared/constants.js";
import { LocalServer } from "./localServer.js";

async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

describe("playing offline", () => {
  let local: LocalServer;
  let view: GameView | null;
  let intent = { forward: 0, right: 0 };
  let app: App;
  let time = 0;

  beforeEach(() => {
    // fake only the tick timer; the local socket still uses real microtasks
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    local = new LocalServer();
    view = null;
    time = 0;
    app = new App({
      renderer: { setWorld: () => {}, render: (v) => (view = v) },
      ui: { setConnecting: () => {}, showError: () => {}, hide: () => {} },
      input: { intent: () => intent },
      now: () => time,
    });
  });

  afterEach(() => {
    local.stop();
    vi.useRealTimers();
  });

  /** Advance the page's clock: server ticks, deliveries, client frames. */
  async function run(ms: number): Promise<void> {
    for (let t = 0; t < ms; t += TICK_MS) {
      time += TICK_MS;
      vi.advanceTimersByTime(TICK_MS);
      await flush();
      app.frame(time);
      await flush();
    }
  }

  it("joins and moves with no network", async () => {
    app.play("solo", local.start());
    await run(500);
    expect(app.inGame).toBe(true);
    const start = view!.self.position;

    intent = { forward: 1, right: 0 };
    await run(1000);
    intent = { forward: 0, right: 0 };
    await run(500);
    expect(view!.self.position.z).toBeLessThan(start.z - 3);
  });

  it("stops ticking when stopped", async () => {
    local.start();
    local.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("only starts one tick timer", () => {
    local.start();
    local.start();
    expect(vi.getTimerCount()).toBe(1);
  });
});
