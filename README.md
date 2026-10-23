# ZSH

A small multiplayer voxel game: three.js in the browser, an authoritative
Node server, WebSockets in between. It can also run with no server at all:
the same game server code runs inside the page.

```sh
npm install
npm run dev                 # http://localhost:8080, play online or offline
npm run build:standalone    # static, offline-only site in dist/standalone
npm run preview:standalone  # serve that build locally
npm test                    # vitest (watch mode)
npm run check               # typecheck + tests + formatting + build, what CI should run
```

Move with WASD or the arrow keys.

## Online and offline

- **Online** (the default when served by `npm run dev`): the page connects
  to the Node server over a WebSocket on `/ws`.
- **Offline** ("Play offline", and the only option in the standalone
  build): the page creates its own `GameServer` and connects to it with an
  in-page socket (`src/web/localSocket.ts`) that calls it directly. Messages
  are still encoded and delivered asynchronously, so both modes run exactly
  the same code; client prediction is simply always right.

The standalone build is plain static files with relative URLs, so it can
be hosted from any path (GitHub Pages, itch.io, a folder on a web server).
Offline worlds are not saved yet, and the game pauses in background tabs
because browsers throttle timers there.

## Architecture

```
src/shared/   runs everywhere; no DOM, no node, no packages
  world.ts      World: fixed-size voxel grid, block (x,y,z) fills [x,x+1)...
  blocks.ts     block ids and gameplay properties
  sim.ts        stepPlayer(state, input, world, dt): movement + collision, pure
  protocol.ts   typed client/server messages, validated parsing
  constants.ts  tick rate, protocol version

src/server/   the game server; runs in node AND in the browser, so like
              shared/ it may not use node, DOM or packages
  game.ts         Game: authoritative state; join/leave/queueInput/step/snapshot
  gameServer.ts   GameServer: connections <-> players, decoding, broadcasting
  worldGenerator.ts

src/client/   the browser game client, given a way to reach a server
  app.ts          App: wires everything, all dependencies injected;
                  play(name, transport) picks the server per game
  clientGame.ts   ClientGame: state once joined; produces a GameView per frame
  localPlayer.ts  prediction + reconciliation for the player you control
  remotePlayers.ts interpolation for everyone else
  net.ts          Netcode: typed messages over an injected socket
  input.ts        KeyboardInput: keys -> move intent
  fixedStep.ts    frame time -> fixed ticks
  render/         camera rig, world mesher, player meshes (all testable),
                  renderer.ts (the WebGL shell, not unit tested)
  ui.ts           join screen (DOM shell)

src/node/     node host: entry.ts serves the page (vite) and runs the
              server over WebSockets, ticking on a timer
src/web/      the page: index.html, style.css, and entry.ts, which builds
              the client and, for offline play, a LocalServer +
              in-page socket (localServer.ts, localSocket.ts)

test/         cross-cutting tests: client+server over a fake laggy
              network, and enforcement of the import rules below
```

Only the two `entry.ts` files have side effects. Import rules (enforced by
`test/boundaries.test.ts`, and by each `tsconfig.*.json`'s lib/types
settings): `shared` and `server` import nothing outside themselves and no
packages; `client` imports only `shared`; `node` may use `server`; `web`
may use anything except `node`.

### Networking model

The server is authoritative. Each client tick (20 Hz) the client sends its
input (`forward`, `right`, camera `yaw`) with a sequence number, and also
applies it locally with the same `stepPlayer` the server uses, so movement
feels instant regardless of latency. Snapshots from the server carry each
player's state and the last input sequence applied; the client rewinds to
that state and replays any inputs the server hasn't seen yet. Other
players are drawn two ticks in the past and interpolated between
snapshots.

## Textures

Block textures come from the Pixel Perfection pack. Find and add more with
`npm run texture -- search|info|add`; see [docs/textures.md](docs/textures.md)
for the pipeline, licensing rules and what the engine can't draw yet.

## Credits

Textures are from Pixel Perfection by XSSheep and contributors, CC BY-SA
4.0. See [CREDITS.md](CREDITS.md).
