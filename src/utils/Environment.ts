import * as THREE from 'three';
import {Vector3} from "three";
import {ScrService} from "../services/ScrService";
import {DragControls} from "three/examples/jsm/controls/DragControls";
import {VectorField} from "./VectorField"
import {Particle, ParticleData} from "./Particle";
import {Arrow2DHelper} from "../helpers/Arrow2DHelper";
import {ParticlesSimulationFrame} from "./ParticlesSimulationFrame";

export class Environment {
  private _particles: Particle[] = [];
  get particles(): Particle[] {
    return this._particles;
  }

  set particles(value: Particle[]) {
    this._particles = value;
  }

  private readonly _vectorField: VectorField;
  private _dragControls: DragControls;
  private _lastMousePosition: Vector3 = new Vector3(0, 0, 0);
  public constructor(private SCR: ScrService) {
    this._vectorField = new VectorField(this.SCR);
    this._dragControls = new DragControls([], this.SCR.camera, this.SCR.renderer.domElement);
    document.addEventListener('wheel', this._vectorField.replaceVectors);
    document.addEventListener('mousedown', (e: MouseEvent) => {
      switch (e.button) {
        case 2:
          document.addEventListener('mousemove', this._vectorField.test);
          break;
        default:
          break;
      }
    });
    document.addEventListener('mouseup', (e: MouseEvent) => {
      switch (e.button) {
        case 2:
          document.removeEventListener('mousemove', this._vectorField.test);
          // let tt = new Particle(this.SCR, { center: new Vector3(-this.SCR.width / 2 + this.SCR.camera.position.x, -this.SCR.height / 2 + this.SCR.camera.position.y),   charge: -0.0001,  radius: 1, segments: 15 });
          // this.SCR.scene.add(tt);
          break;
        default:
          break;
      }
    });
  }

  public addNewParticle(particleData: ParticleData): void {
    this._particles.push(new Particle(this.SCR, particleData));
    this._dragControls.dispose();
    this.initDragControls();
  }

  private initDragControls(): void {
    this._dragControls = new DragControls(this._particles, this.SCR.camera, this.SCR.renderer.domElement);

    this._dragControls.addEventListener('dragstart', (event) => {
      this.SCR.params.draggedParticle = event['object'].uuid;
    });
    this._dragControls.addEventListener('dragend', (event) => {
      this.SCR.params.draggedParticle = "";
        this.SCR.simulationFrames.forEach((simFrame) => {
        if (simFrame as ParticlesSimulationFrame) {
          let mousePosition = new Vector3().copy(event['object'].position);
          //(simFrame as ParticlesSimulationFrame).setParticleVelocity(event['object'], mousePosition.sub(this._lastMousePosition));
        }
      });
    });
  }

  public getLengthSquared(vector: Vector3): number {
    return vector.x * vector.x + vector.y * vector.y;
  }

  public updateVectorField = () => {
    this._vectorField.arrows.flat().forEach((arrow: Arrow2DHelper) => {
      let superposition = new THREE.Vector3(0, 0, 0);
      this._particles.forEach((particle: Particle) => {
        let dir = new THREE.Vector3(arrow.position.x - particle.position.x, arrow.position.y - particle.position.y, 0).multiplyScalar(70);
        const len2 = this.getLengthSquared(dir);
        dir = dir.normalize();
        dir.multiplyScalar(particle.charge / len2);
        superposition.add(dir);
      });
      let color = new THREE.Color();
      let minArrowLength = this._vectorField.getMinArrowLength();

      color.setHSL(0.85 / (this.SCR.coulombConst * superposition.length() + 1), 1, 0.5);
      arrow.setColor(color);
      arrow.setLength(minArrowLength - minArrowLength / (this.SCR.coulombConst * 8 * superposition.length() + 1),
            minArrowLength * 0.3, minArrowLength * 0.3);
      arrow.setDirection(superposition.normalize());
    });
  }

  private setMouseCoordinatesOnScene = (event: MouseEvent) => {
    let vec = new THREE.Vector3();
    let pos = new THREE.Vector3();

    vec.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      0 );

    vec.unproject(this.SCR.camera);

    vec.sub(this.SCR.camera.position).normalize();

    let distance = - this.SCR.camera.position.z / vec.z;

    pos.copy(this.SCR.camera.position).add(vec.multiplyScalar(distance));
    this._lastMousePosition.copy(pos);
  }
}
