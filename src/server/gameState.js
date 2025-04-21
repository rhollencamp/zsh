const world = initializeWorld(100, 100, 100);

function initializeWorld(sizeY, sizeX, sizeZ) {
  const world = [];
  for (let y = 0; y < sizeY; y++) {
    const plane = [];
    for (let x = 0; x < sizeX; x++) {
      const column = [];
      for (let z = 0; z < sizeZ; z++) {
        column.push(y === 0 ? 1 : 0);
      }
      plane.push(column);
    }
    world.push(plane);
  }

  world[1][5][0] = 1;
  world[1][4][0] = 1;
  world[1][3][0] = 1;
  world[1][2][0] = 1;
  world[1][1][0] = 1;
  return world;
}

export { world };
