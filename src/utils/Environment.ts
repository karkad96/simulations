import * as THREE from 'three';
import {Vector3} from "three";
import {ScrService} from "../services/ScrService";
import {DragControls} from "three/examples/jsm/controls/DragControls";
import {VectorField} from "./VectorField"
import {Particle, ParticleData} from "./Particle";
import {Arrow2DHelper} from "../helpers/Arrow2DHelper";

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

  public constructor(private SCR: ScrService) {
    this._vectorField = new VectorField(this.SCR);
    this._dragControls = new DragControls([], this.SCR.camera, this.SCR.renderer.domElement);
  }

  public addNewParticle(particleData: ParticleData): void {
    this._particles.push(new Particle(this.SCR, particleData));
    this._dragControls.dispose();
    this.initDragControls();
  }

  private initDragControls(): void {
    this._dragControls = new DragControls(this._particles, this.SCR.camera, this.SCR.renderer.domElement);

    this._dragControls.addEventListener('dragstart', () => {
        document.addEventListener('mousemove', this.updateVectorField, false);
    });
    this._dragControls.addEventListener('dragend', () => {
        document.removeEventListener('mousemove', this.updateVectorField, false);
    });
  }

  public getLengthSquared(vector: Vector3): number {
    return vector.x * vector.x + vector.y * vector.y;
  }

  public updateVectorField = () => {
    this._vectorField.arrows.forEach((arrow: Arrow2DHelper) => {
      let superposition = new THREE.Vector3(0, 0, 0);
      this._particles.forEach((particle: Particle) => {
        let dir = new THREE.Vector3(arrow.position.x - particle.position.x, arrow.position.y - particle.position.y, 0);
        const len2 = this.getLengthSquared(dir);
        dir = dir.normalize();
        dir.multiplyScalar(particle.charge / len2);
        superposition.add(dir);
      });
      let color = new THREE.Color();
      color.setHSL(0.85 / (superposition.length() + 1), 1, 0.5);
      arrow.setColor(color);
      arrow.setLength(0.5 - 0.5 / (superposition.length() + 1), 0.1, 0.1);
      arrow.setDirection(superposition.normalize());
    });
  }
}
