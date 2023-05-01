import {Vector3, Color} from "three";
import {ScrService} from "../services/ScrService";
import {DragControls} from "three/examples/jsm/controls/DragControls";
import {VectorField} from "./VectorField"
import {Particle, ParticleData} from "./Particle";
import {Arrow2DHelper} from "../helpers/Arrow2DHelper";
import {ParticlesSimulationFrame} from "./ParticlesSimulationFrame";

export class Environment {
  get particles(): Particle[] {
    return this._particles;
  }

  set particles(value: Particle[]) {
    this._particles = value;
  }

  private readonly vectorField: VectorField;
  private speed: Vector3 = new Vector3(0, 0, 0);
  private lastMouseposition: Vector3 = new Vector3(0, 0, 0);
  private _particles: Particle[] = [];
  private movingParticle!: Particle;
  private dragControls: DragControls;
  private timestamp: number = 0;

  public constructor(private SCR: ScrService) {
    this.vectorField = new VectorField(this.SCR);
    this.dragControls = new DragControls([], this.SCR.camera, this.SCR.renderer.domElement);
    this.addNeccessaryEvents();
  }

  public addNewParticle(particleData: ParticleData): void {
    this._particles.push(new Particle(this.SCR, particleData));
    this.dragControls.dispose();
    this.initDragControls();
  }

  private initDragControls(): void {
    this.dragControls = new DragControls(this._particles, this.SCR.camera, this.SCR.renderer.domElement);
    this.addDragStartEvent();
    this.addDragEndEvent();
  }

  public updateVectorField = (): void => {
    this.vectorField.arrows.forEach((arrowsRow: Arrow2DHelper[]) => {
      arrowsRow.forEach((arrow: Arrow2DHelper) => {
        let superposition = new Vector3(0, 0, 0);
        this._particles.forEach((particle: Particle) => {
          let dir = new Vector3(arrow.position.x - particle.position.x, arrow.position.y - particle.position.y, 0).multiplyScalar(70);
          const len2 = dir.lengthSq();
          dir = dir.normalize();
          dir.multiplyScalar(particle.charge / len2);
          superposition.add(dir);
        });
        let color = new Color();
        let minArrowLength = this.vectorField.getMinArrowLength();
  
        color.setHSL(0.85 / (this.SCR.coulombConst * superposition.length() + 1), 1, 0.5);
        arrow.setColor(color);
        arrow.setLength(minArrowLength - minArrowLength / (this.SCR.coulombConst * 8 * superposition.length() + 1), minArrowLength * 0.3, minArrowLength * 0.3);
        arrow.setDirection(superposition.normalize());
      });
    });
  }

  private getSpeedOfMouse = (event: MouseEvent): void => {
    if (this.timestamp === 0) {
      this.timestamp = Date.now();
      this.lastMouseposition.x = this.movingParticle!.position.x;
      this.lastMouseposition.y = this.movingParticle!.position.y;
      return;
    }
    
    let now = Date.now();
    let dt =  now - this.timestamp;
    let dx = this.movingParticle.position.x - this.lastMouseposition.x;
    let dy = this.movingParticle.position.y - this.lastMouseposition.y;
    let speedX = Math.round(dx / dt * 500);
    let speedY = Math.round(dy / dt * 500);
    
    if (speedX === Infinity || speedX === -Infinity || isNaN(speedX))
      speedX = 0;
    if (speedY === Infinity || speedY === -Infinity || isNaN(speedY))
      speedY = 0;

    this.speed.set(speedX, speedY, 0);
    this.timestamp = now;
    this.lastMouseposition.x = this.movingParticle.position.x;
    this.lastMouseposition.y = this.movingParticle.position.y;
  }

  private addNeccessaryEvents(): void {
    document.addEventListener('wheel', this.vectorField.replaceVectors);
    document.addEventListener('mousedown', (e: MouseEvent) => {
      switch (e.button) {
        case 2:
          document.addEventListener('mousemove', this.vectorField.onPanning);
          break;
        default:
          break;
      }
    });
    document.addEventListener('mouseup', (e: MouseEvent) => {
      switch (e.button) {
        case 2:
          document.removeEventListener('mousemove', this.vectorField.onPanning);
          break;
        default:
          break;
      }
    });
  }

  private addDragStartEvent(): void {
    this.dragControls.addEventListener('dragstart', (event) => {
      this.SCR.params.draggedParticle = event['object'].uuid;
      this.movingParticle = event['object'] as Particle;
      document.addEventListener('mousemove', this.getSpeedOfMouse);
    });
  }

  private addDragEndEvent(): void {
    this.dragControls.addEventListener('dragend', (event) => {
      this.SCR.params.draggedParticle = "";
      document.removeEventListener('mousemove', this.getSpeedOfMouse);
      this.SCR.simulationFrames.forEach((simFrame) => {
        if (simFrame as ParticlesSimulationFrame) {
          (simFrame as ParticlesSimulationFrame).setParticleVelocity(event['object'], this.speed);
        }
      });
    });
  }
}