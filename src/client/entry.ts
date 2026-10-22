import { WS_PATH } from "../shared/constants.js";
import { App } from "./app.js";
import { KeyboardInput } from "./input.js";
import { socketUrl } from "./net.js";
import { GameRenderer } from "./render/renderer.js";
import { WelcomeScreen } from "./ui.js";
import "./style.css";

const input = new KeyboardInput();
input.attach(window);

const ui = new WelcomeScreen(document);
const app = new App({
  createSocket: (url) => new WebSocket(url),
  socketUrl: socketUrl(window.location, WS_PATH),
  renderer: new GameRenderer(document.body),
  ui,
  input,
  now: () => performance.now(),
});
ui.onPlay((name) => app.play(name));

function loop(now: number): void {
  app.frame(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
