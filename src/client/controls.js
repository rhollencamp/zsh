import { Vector3 } from "three";

const direction = new Vector3();
let moveForward = false,
  moveBackward = false,
  moveLeft = false,
  moveRight = false;

function onKeyDown(event) {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = true;
      break;
    case "ArrowLeft":
    case "KeyA":
      moveLeft = true;
      break;
    case "ArrowDown":
    case "KeyS":
      moveBackward = true;
      break;
    case "ArrowRight":
    case "KeyD":
      moveRight = true;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = false;
      break;
    case "ArrowLeft":
    case "KeyA":
      moveLeft = false;
      break;
    case "ArrowDown":
    case "KeyS":
      moveBackward = false;
      break;
    case "ArrowRight":
    case "KeyD":
      moveRight = false;
      break;
  }
}

function getMoveVector() {
  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();
  return direction;
}

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

export { getMoveVector };
