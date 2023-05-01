import {Clock, MathUtils, Scene, PerspectiveCamera, WebGLRenderer} from "three";
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
    let vFOV = MathUtils.degToRad(this.camera.fov);
    return 2 * Math.tan(vFOV / 2) * this.camera.position.z;
  }

  public scene: Scene = new Scene();
  public camera: PerspectiveCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  public renderer: WebGLRenderer = new WebGLRenderer();
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
    this.gui.add(this.params, 'speedOfSimulation', 1, 10).name("Speed of simulation");
    this.gui.add(this.params, 'setVisibilityOfVectorField').name("Show/hide vector field");
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