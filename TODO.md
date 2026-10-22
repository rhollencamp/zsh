# Task List

## Short Term

- mouse: orbit the camera (sets `ClientGame.cameraYaw`), select blocks
- ability to destroy blocks
- ability to place blocks
- jumping
- spread out spawn points; players currently spawn on top of each other

## Medium Term

- stamina and running
- inventory
- different block shapes and textures
- authenticate players using some means
- ability to persist world data
- chunked world, sent as binary instead of a JSON array
- production build: serve `dist/client` instead of the vite middleware
- smooth out reconciliation corrections instead of snapping

## Long Term

- optimize netcode: binary encoding, delta snapshots
