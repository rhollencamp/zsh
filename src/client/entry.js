import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

import "./style.scss";
import { Modal } from "bootstrap";
import { connectWebSocket } from "./netcode.js";
import { getMoveVector } from "./controls.js";

let stats;

let camera, controls, scene, renderer;

const worldWidth = 128,
  worldDepth = 128;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;
const data = generateHeight(worldWidth, worldDepth);

const clock = new THREE.Clock();

init();

function init() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
  );
  camera.position.y = getY(worldHalfWidth, worldHalfDepth) + 1;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  // sides

  const matrix = new THREE.Matrix4();

  const pxGeometry = new THREE.PlaneGeometry(1, 1);
  pxGeometry.attributes.uv.array[1] = 0.5;
  pxGeometry.attributes.uv.array[3] = 0.5;
  pxGeometry.rotateY(Math.PI / 2);
  pxGeometry.translate(0.5, 0, 0);

  const nxGeometry = new THREE.PlaneGeometry(1, 1);
  nxGeometry.attributes.uv.array[1] = 0.5;
  nxGeometry.attributes.uv.array[3] = 0.5;
  nxGeometry.rotateY(-Math.PI / 2);
  nxGeometry.translate(-0.5, 0, 0);

  const pyGeometry = new THREE.PlaneGeometry(1, 1);
  pyGeometry.attributes.uv.array[5] = 0.5;
  pyGeometry.attributes.uv.array[7] = 0.5;
  pyGeometry.rotateX(-Math.PI / 2);
  pyGeometry.translate(0, 0.5, 0);

  const pzGeometry = new THREE.PlaneGeometry(1, 1);
  pzGeometry.attributes.uv.array[1] = 0.5;
  pzGeometry.attributes.uv.array[3] = 0.5;
  pzGeometry.translate(0, 0, 0.5);

  const nzGeometry = new THREE.PlaneGeometry(1, 1);
  nzGeometry.attributes.uv.array[1] = 0.5;
  nzGeometry.attributes.uv.array[3] = 0.5;
  nzGeometry.rotateY(Math.PI);
  nzGeometry.translate(0, 0, -0.5);

  const geometries = [];

  for (let z = 0; z < worldDepth; z++) {
    for (let x = 0; x < worldWidth; x++) {
      const h = getY(x, z);

      matrix.makeTranslation(x - worldHalfWidth, h, z - worldHalfDepth);

      const px = getY(x + 1, z);
      const nx = getY(x - 1, z);
      const pz = getY(x, z + 1);
      const nz = getY(x, z - 1);

      geometries.push(pyGeometry.clone().applyMatrix4(matrix));

      if ((px !== h && px !== h + 1) || x === 0) {
        geometries.push(pxGeometry.clone().applyMatrix4(matrix));
      }

      if ((nx !== h && nx !== h + 1) || x === worldWidth - 1) {
        geometries.push(nxGeometry.clone().applyMatrix4(matrix));
      }

      if ((pz !== h && pz !== h + 1) || z === worldDepth - 1) {
        geometries.push(pzGeometry.clone().applyMatrix4(matrix));
      }

      if ((nz !== h && nz !== h + 1) || z === 0) {
        geometries.push(nzGeometry.clone().applyMatrix4(matrix));
      }
    }
  }

  const geometry = BufferGeometryUtils.mergeGeometries(geometries);
  geometry.computeBoundingSphere();

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

  // add a welcome modal that captures mouse when you click play
  new Modal(document.getElementById("welcomeModal")).show();
  document
    .getElementById("welcomeModal")
    .addEventListener("hide.bs.modal", function () {
      controls.lock();
      connectWebSocket();
    });

  stats = new Stats();
  document.body.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateHeight(width, height) {
  const data = [],
    perlin = new ImprovedNoise(),
    size = width * height,
    z = Math.random() * 100;

  let quality = 2;

  for (let j = 0; j < 4; j++) {
    if (j === 0) for (let i = 0; i < size; i++) data[i] = 0;

    for (let i = 0; i < size; i++) {
      const x = i % width,
        y = (i / width) | 0;
      data[i] += perlin.noise(x / quality, y / quality, z) * quality;
    }

    quality *= 4;
  }

  return data;
}

function getY(x, z) {
  return (data[x + z * worldWidth] * 0.15) | 0;
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
