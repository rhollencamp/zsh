import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  TextureLoader,
  WebGLRenderer,
} from "three";
import Stats from "three/addons/libs/stats.module.js";
import type { World } from "../../shared/world.js";
import type { GameView } from "../clientGame.js";
import { thirdPersonCamera } from "./camera.js";
import { PlayerMeshes } from "./playerMeshes.js";
import { buildWorldGeometry } from "./worldMesh.js";

const SKY = 0xbfd1e5;

/**
 * The WebGL shell: owns the three.js scene and draws a GameView. Logic
 * lives in the helpers it calls, which are tested without a GPU.
 */
export class GameRenderer {
  private readonly renderer = new WebGLRenderer({ antialias: true });
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(60, 1, 0.1, 200);
  private readonly stats = new Stats();
  private readonly worldMaterial: MeshBasicMaterial;
  private worldMesh: Mesh | null = null;
  private players: PlayerMeshes | null = null;

  constructor(container: HTMLElement) {
    this.scene.background = new Color(SKY);
    this.scene.fog = new Fog(SKY, 20, 60);
    this.scene.add(new AmbientLight(0xffffff, 1.5));
    const sun = new DirectionalLight(0xffffff, 2);
    sun.position.set(0.5, 1, 0.3);
    this.scene.add(sun);

    const texture = new TextureLoader().load(
      `${import.meta.env.BASE_URL}atlas.png`,
    );
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = NearestFilter;
    // no mipmaps: they would blend neighbouring atlas tiles at a distance
    texture.minFilter = NearestFilter;
    texture.generateMipmaps = false;
    this.worldMaterial = new MeshBasicMaterial({
      map: texture,
      vertexColors: true,
      alphaTest: 0.5, // cut-out textures such as leaves
    });

    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    container.appendChild(this.stats.dom);
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  setWorld(world: World, selfId: number): void {
    if (this.worldMesh !== null) {
      this.scene.remove(this.worldMesh);
      this.worldMesh.geometry.dispose();
    }
    this.worldMesh = new Mesh(buildWorldGeometry(world), this.worldMaterial);
    this.scene.add(this.worldMesh);
    this.players?.sync([]);
    this.players = new PlayerMeshes(this.scene, selfId);
  }

  render(view: GameView): void {
    this.players?.sync([view.self, ...view.others]);
    const { position, lookAt } = thirdPersonCamera(
      view.self.position,
      view.cameraYaw,
    );
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  }

  private resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
