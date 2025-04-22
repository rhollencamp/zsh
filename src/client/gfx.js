import { AmbientLight } from "three";
import { BoxGeometry } from "three";
import { Clock } from "three";
import { Color } from "three";
import { DoubleSide } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Mesh } from "three";
import { MeshLambertMaterial } from "three";
import { NearestFilter } from "three";
import { PerspectiveCamera } from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Scene } from "three";
import { SRGBColorSpace } from "three";
import Stats from "three/addons/libs/stats.module.js";
import { TextureLoader } from "three";
import { WebGLRenderer } from "three";

import { getMoveVector } from "./controls.js";
import { world } from "./engine.js";

const camera = new PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
);
const clock = new Clock();
const scene = new Scene();
const renderer = new WebGLRenderer();
const stats = new Stats();

const controls = new PointerLockControls(camera, renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function init() {
  camera.position.set(0.0, 1.0, 0.0);
  camera.lookAt(1.0, 1.0, 1.0);

  scene.background = new Color(0xbfd1e5);

  const geometries = [];
  for (let y = 0; y < world.length; y++) {
    for (let x = 0; x < world[y].length; x++) {
      for (let z = 0; z < world[y][x].length; z++) {
        if (world[y][x][z] === 1) {
          const geometry = new BoxGeometry(1, 1, 1);
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

  const geometry = mergeGeometries(geometries);

  const texture = new TextureLoader().load("/atlas.png");
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;

  const mesh = new Mesh(
    geometry,
    new MeshLambertMaterial({ map: texture, side: DoubleSide }),
  );
  scene.add(mesh);

  const ambientLight = new AmbientLight(0xeeeeee, 3);
  scene.add(ambientLight);

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  scene.add(controls.getObject());

  document.body.appendChild(stats.dom);
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

export { controls, init };
