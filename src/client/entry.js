import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

import "./style.scss";
import { Modal } from "bootstrap";
import { connectWebSocket } from "./netcode.js";
import { getMoveVector } from "./controls.js";

let stats;

let camera, controls, scene, renderer;

const world = initializeWorld(128, 128, 128);

const clock = new THREE.Clock();

function init() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
  );
  camera.position.set(0.0, 1.0, 0.0);
  camera.lookAt(1.0, 1.0, 1.0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  const geometries = [];
  for (let y = 0; y < world.length; y++) {
    for (let x = 0; x < world[y].length; x++) {
      for (let z = 0; z < world[y][x].length; z++) {
        if (world[y][x][z] === 1) {
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          geometry.translate(x, y, z);
          const attr = geometry.getAttribute("uv").array;
          attr[1] = 0.5;
          attr[3] = 0.5;
          attr[9] = 0.5;
          attr[11] = 0.5;
          attr[21] = 0.5;
          attr[23] = 0.5;
          attr[29] = 0.5;
          attr[31] = 0.5;
          attr[33] = 0.5;
          attr[35] = 0.5;
          attr[41] = 0.5;
          attr[43] = 0.5;
          attr[49] = 0.5;
          attr[51] = 0.5;
          geometries.push(geometry);
        }
      }
    }
  }

  const geometry = BufferGeometryUtils.mergeGeometries(geometries);

  const texture = new THREE.TextureLoader().load("/atlas.png");
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide }),
  );
  scene.add(mesh);

  const ambientLight = new THREE.AmbientLight(0xeeeeee, 3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 12);
  directionalLight.position.set(1, 1, 0.5).normalize();
  scene.add(directionalLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  controls = new PointerLockControls(camera, renderer.domElement);
  scene.add(controls.getObject());

  stats = new Stats();
  document.body.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

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

function animate() {
  render();
  stats.update();
}

function render() {
  const delta = clock.getDelta();
  if (controls.isLocked === true) {
    const direction = getMoveVector();
    direction.multiplyScalar(5.0 * delta);
    controls.moveRight(direction.x);
    controls.moveForward(direction.z);
  }
  renderer.render(scene, camera);
}

// add a welcome modal that captures mouse when you click play
new Modal(document.getElementById("welcomeModal")).show();
document
  .getElementById("welcomeModal")
  .addEventListener("hide.bs.modal", function () {
    connectWebSocket();
    init();
    controls.lock();
  });
