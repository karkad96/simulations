import * as THREE from "three";
import {Clock} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {Injectable} from "@angular/core";
import Stats from "three/examples/jsm/libs/stats.module";
import {ISimulationFrame} from "../utils/ISimulationFrame";
import {GUI} from "lil-gui";

@Injectable({
  providedIn: 'root',
})
export class ScrService {
  get width(): number {
    return this.height * this.camera.aspect;
  }
  get height(): number {
    let vFOV = THREE.MathUtils.degToRad(this.camera.fov);
    return 2 * Math.tan(vFOV / 2) * this.camera.position.z;
  }
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
  public simulationFrames: ISimulationFrame[] = [];
  public clock: Clock = new Clock();
  public coulombConst: number = 8987551792.314;
  public gui = new GUI();
  public params = {
    speedOfSimulation: 1,
    setVisibilityOfVectorField: () => {},
    isVectorFieldVisible: true,
    draggedParticle: "",
  };
  constructor() {
    this.camera.position.set(0, 0, 50);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableRotate = false;

    this.stats = Stats();
    document.body.appendChild(this.stats.dom);

    const folder = this.gui.addFolder( 'Speed of simulation' );

    folder.add(this.params, 'speedOfSimulation', 1, 10).name("Speed of simulation");
    folder.add(this.params, 'setVisibilityOfVectorField').name("Show/hide vector field");

/*    let grid = new THREE.GridHelper(100, 100, new THREE.Color( 0x7a7a7a ), new THREE.Color( 0x3a3a3a ));
    grid.geometry.rotateX(Math.PI / 2);

    this.scene.add(grid);*/
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public animate = () => {
    requestAnimationFrame(this.animate);
    this.orbitControls.update();
    this.simulationFrames.forEach((frame) => frame.generateNextFrame(this.clock.getDelta()));
    this.render();
    this.stats.update();
  }
}
