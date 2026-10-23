import { App, type Transport } from "../client/app.js";
import { KeyboardInput, combineIntents } from "../client/input.js";
import { socketUrl } from "../client/net.js";
import { GameRenderer } from "../client/render/renderer.js";
import { TouchJoystick } from "../client/touchJoystick.js";
import { type PlayMode, WelcomeScreen } from "../client/ui.js";
import { WS_PATH } from "../shared/constants.js";
import { LocalServer } from "./localServer.js";
import "./style.css";

// the standalone build is a static site: there is no server to go online to
const modes: PlayMode[] =
  import.meta.env.MODE === "standalone" ? ["offline"] : ["online", "offline"];

let localServer: LocalServer | null = null;

function transport(mode: PlayMode): Transport {
  if (mode === "offline") {
    localServer ??= new LocalServer(console.log);
    return localServer.start();
  }
  return {
    createSocket: (url) => new WebSocket(url),
    url: socketUrl(window.location, WS_PATH),
  };
}

const keyboard = new KeyboardInput();
keyboard.attach(window);
const touch = new TouchJoystick(document.body);

const ui = new WelcomeScreen(document, modes);
const app = new App({
  renderer: new GameRenderer(document.body),
  ui,
  input: combineIntents([keyboard, touch]),
  now: () => performance.now(),
});
ui.onPlay((name, mode) => app.play(name, transport(mode)));

function loop(now: number): void {
  app.frame(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
