# Task List

## Short Term

- mouse: orbit the camera (sets `ClientGame.cameraYaw`), select blocks
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
- production build: serve `dist/client` instead of the vite middleware
- smooth out reconciliation corrections instead of snapping

## Long Term

- optimize netcode: binary encoding, delta snapshots
