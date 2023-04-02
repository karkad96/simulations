import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {Injectable} from "@angular/core";
import Stats from "three/examples/jsm/libs/stats.module";
import {ISimulationFrame} from "../utils/ISimulationFrame";

@Injectable({
  providedIn: 'root',
})
export class ScrService {
  public scene: THREE.Scene = new THREE.Scene();
  public camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  public renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
  public orbitControls: OrbitControls;
  private stats: Stats;
  public animationFrames: ISimulationFrame[] = [];
  constructor() {
    this.camera.position.set(0, 0, 10);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableRotate = false;

    this.stats = Stats();
    document.body.appendChild(this.stats.dom)
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public animate = () => {
    requestAnimationFrame(this.animate);
    this.orbitControls.update();
    this.animationFrames.forEach((frame) => frame.generateNextFrame());
    this.render();
    this.stats.update();
  }
}
