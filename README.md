# ZSH

A small multiplayer voxel game: three.js in the browser, an authoritative
Node server, WebSockets in between.

```sh
npm install
npm run dev        # http://localhost:8080
npm test           # vitest (watch mode)
npm run check      # typecheck + tests + formatting, what CI should run
```

Move with WASD or the arrow keys.

## Architecture

```
src/shared/   runs on both sides; no DOM, no node, no packages
  world.ts      World: fixed-size voxel grid, block (x,y,z) fills [x,x+1)...
  sim.ts        stepPlayer(state, input, world, dt): movement + collision, pure
  protocol.ts   typed client/server messages, validated parsing
  constants.ts  tick rate, protocol version

src/server/
  game.ts         Game: authoritative state; join/leave/queueInput/step/snapshot
  gameServer.ts   GameServer: connections <-> players, decoding, broadcasting
  worldGenerator.ts
  entry.ts        the only file with side effects: http, vite, ws, tick timer

src/client/
  app.ts          App: wires everything, all dependencies injected
  clientGame.ts   ClientGame: state once joined; produces a GameView per frame
  localPlayer.ts  prediction + reconciliation for the player you control
  remotePlayers.ts interpolation for everyone else
  net.ts          Netcode: typed messages over an injected socket
  input.ts        KeyboardInput: keys -> move intent
  fixedStep.ts    frame time -> fixed ticks
  render/         camera rig, world mesher, player meshes (all testable),
                  renderer.ts (the WebGL shell, not unit tested)
  ui.ts           join screen (DOM shell)
  entry.ts        the only file with side effects: builds real deps, starts rAF

test/             cross-cutting tests: client+server over a fake laggy
                  network, and enforcement of the import rules below
```

Import rules (enforced by `test/boundaries.test.ts` and by each side's
`tsconfig.*.json` lib settings): `shared` imports nothing outside itself;
`server` and `client` each import `shared` but never each other.

### Networking model

The server is authoritative. Each client tick (20 Hz) the client sends its
input (`forward`, `right`, camera `yaw`) with a sequence number, and also
applies it locally with the same `stepPlayer` the server uses, so movement
feels instant regardless of latency. Snapshots from the server carry each
player's state and the last input sequence applied; the client rewinds to
that state and replays any inputs the server hasn't seen yet. Other
players are drawn two ticks in the past and interpolated between
snapshots.

## Attribution

- Textures are from https://faithfulpack.net/
