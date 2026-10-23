# Task List

## Short Term

- mouse: orbit the camera (sets `ClientGame.cameraYaw`), select blocks; on touch, drag on the right half of the screen (left half is the joystick)
- ability to destroy blocks
- ability to place blocks
- jumping
- spread out spawn points; players currently spawn on top of each other
- camera collision: pull the third-person camera in when blocks (e.g. tree canopies) are between it and the player

## Medium Term

- stamina and running
- inventory
- non-cube block shapes, animated and translucent textures (see docs/textures.md)
- authenticate players using some means
- ability to persist world data
- chunked world, sent as binary instead of a JSON array
- production build for online play: node serves a built `dist/web` instead of the vite middleware
- save offline worlds in the browser (IndexedDB), behind the same interface as server persistence
- move the offline server into a Web Worker if ticking or world generation starts to stutter rendering
- smooth out reconciliation corrections instead of snapping

## Long Term

- optimize netcode: binary encoding, delta snapshots
