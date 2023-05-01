import {ISimulationFrame} from "./ISimulationFrame";
import {Environment} from "./Environment";
import {Particle} from "./Particle";
import {Vector3} from "three";
import {ScrService} from "../services/ScrService";

enum Boder {
  eUnknown = -1,
  eTop = 0,
  eLeft = 1,
  eBottom = 2,
  eRight = 3,
};

export class ParticlesSimulationFrame implements ISimulationFrame {
  private readonly particles: Particle[] = [];
  private simulationState: number[] = [];
  private particlesNumber: number;

  public constructor(private env: Environment, private SCR: ScrService)
  {
    this.particlesNumber = this.env.particles.length;
    this.particles = this.env.particles;
    this.initSimulationState();
  }

  public generateNextFrame(delta: number): void {
    this.calculate(this.SCR.params.speedOfSimulation * delta, this.simulationState);
    this.findAndMergeParticles();

    this.particles.forEach((particle: Particle, index: number) => {
      if (particle.uuid != this.SCR.params.draggedParticle) {
        particle.position.x = this.simulationState[4 * index];
        particle.position.y = this.simulationState[4 * index + 1];
        this.changeParticleStateOnBorder(particle, index);
      } else {
        this.simulationState[4 * index] = particle.position.x;
        this.simulationState[4 * index + 1] = particle.position.y;
        this.simulationState[4 * index + 2] = 0;
        this.simulationState[4 * index + 3] = 0;
      }
    });

    if (this.SCR.params.isVectorFieldVisible)
      this.env.updateVectorField();
  }

  private initSimulationState(): void {
    let particleVelocities = this.getInitialParticleVelocities();
    this.particles.forEach((particle: Particle, index: number) => {
      this.simulationState.push(particle.position.x);
      this.simulationState.push(particle.position.y);
      this.simulationState.push(particleVelocities[index].x);
      this.simulationState.push(particleVelocities[index].y);
    });
  }

  private getInitialParticleVelocities(): Vector3[] {
    return Array<Vector3>(this.particlesNumber).fill(new Vector3());
  }

  private derivative(): number[] {
    let du = new Array(this.particlesNumber * 4);
    for (let iBody = 0; iBody < this.particlesNumber; iBody++) {
      let bodyStart = iBody * 4;
      let accVector = this.calculateAccelerationVector(iBody);

      du[bodyStart    ] = this.simulationState[bodyStart + 2];
      du[bodyStart + 1] = this.simulationState[bodyStart + 3];
      du[bodyStart + 2] = accVector.x;
      du[bodyStart + 3] = accVector.y;
    }
    return du;
  }

  private calculateAccelerationVector(iFromBody: number): Vector3 {
    let iFromBodyStart = iFromBody * 4;
    let superposition = new Vector3();
    let dir = new Vector3();

    for (let iToBody = 0; iToBody < this.particlesNumber; iToBody++) {
      if (iFromBody === iToBody)
        continue;

      let iToBodyStart = iToBody * 4;

      dir.x = this.simulationState[iFromBodyStart] -
        this.simulationState[iToBodyStart];

      dir.y = this.simulationState[iFromBodyStart + 1] -
        this.simulationState[iToBodyStart + 1];

      const len2 = dir.lengthSq();
      dir = dir.normalize();
      dir.multiplyScalar(this.particles[iToBody].charge / len2);
      superposition.add(dir);
    }

    return superposition.multiplyScalar(this.SCR.coulombConst * this.particles[iFromBody].charge);
  }

  private particleOnBorder(particle: Particle): Boder {
    if (particle.position.y + particle.radius >= this.SCR.height / 2 + this.SCR.camera.position.y)
      return Boder.eTop;
    else if (particle.position.x + particle.radius >= this.SCR.width / 2 + this.SCR.camera.position.x)
      return Boder.eLeft;
    else if (particle.position.y - particle.radius <= -this.SCR.height / 2 + this.SCR.camera.position.y)
      return Boder.eBottom;
    else if (particle.position.x - particle.radius <= -this.SCR.width / 2 + this.SCR.camera.position.x)
      return Boder.eRight;

    return Boder.eUnknown;
  }

  private changeParticleStateOnBorder(particle: Particle, index: number): void {
    switch (this.particleOnBorder(particle)) {
      case Boder.eTop:
        this.simulationState[4 * index + 1] = this.SCR.height / 2  + this.SCR.camera.position.y - particle.radius;
        this.simulationState[4 * index + 3] = -this.simulationState[4 * index + 3];
        break;
      case Boder.eBottom:
        this.simulationState[4 * index + 1] = -this.SCR.height / 2 + this.SCR.camera.position.y + particle.radius;
        this.simulationState[4 * index + 3] = -this.simulationState[4 * index + 3];
        break;
      case Boder.eLeft:
        this.simulationState[4 * index] = this.SCR.width / 2 + this.SCR.camera.position.x - particle.radius;
        this.simulationState[4 * index + 2] = -this.simulationState[4 * index + 2];
        break;
      case Boder.eRight:
        this.simulationState[4 * index] = -this.SCR.width / 2 + this.SCR.camera.position.x + particle.radius;
        this.simulationState[4 * index + 2] = -this.simulationState[4 * index + 2];
        break;
      default:
        break;
    }
  }

  public setParticleVelocity(particle: Particle, velocity: Vector3): void {
    let index = this.particles.findIndex((otherParticle) => otherParticle.uuid == particle.uuid);
    if (index >= 0) {
      this.simulationState[4 * index + 2] = velocity.x;
      this.simulationState[4 * index + 3] = velocity.y;
    }
  }

  private calculate(h: number, u: number[]): void {
    let a = [h/2, h/2, h, 0];
    let b = [h/6, h/3, h/3, h/6];
    let u0 = [];
    let ut = [];
    let dimension = u.length;

    for (let i = 0; i < dimension; i++) {
      u0.push(u[i]);
      ut.push(0);
    }

    for (let j = 0; j < 4; j++) {
      let du = this.derivative();

      for (let i = 0; i < dimension; i++) {
        u[i] = u0[i] + a[j] * du[i];
        ut[i] = ut[i] + b[j] * du[i];
      }
    }

    for (let i = 0; i < dimension; i++) {
      u[i] = u0[i] + ut[i];
    }
  }

  private findAndMergeParticles(): void {
    let len: number = this.particlesNumber;
    let particleMerged: boolean = false;
    let subPos: Vector3 = new Vector3();

    for (let i = 0; i < len && !particleMerged; i++) {
      for (let j = i + 1; j < len; j++) {
        subPos.x = this.particles[i].position.x - this.particles[j].position.x;
        subPos.y = this.particles[i].position.y - this.particles[j].position.y;
        if (subPos.lengthSq() <= Math.max(this.particles[i].radius2, this.particles[j].radius2)) {
          let newParticle = this.mergeParticles(this.particles[i], this.particles[j]);
          let newVelocity = this.mergeVelocitiesOfParticles(i, j);
          this.removeParticleFromSimulationState(j);
          this.removeParticleFromSimulationState(i);
          this.addParticleToSimulationState(newParticle, newVelocity);
          particleMerged = true;
          break;
        }
      }
    }

    if(particleMerged)
      this.findAndMergeParticles();
  }

  private mergeParticles(particle1: Particle, particle2: Particle): Particle {
    let middlePosition = new Vector3(particle2.position.x + particle1.position.x,
                                     particle2.position.y + particle1.position.y, 0).multiplyScalar(0.5);
    let charge = particle1.charge + particle2.charge;

    return new Particle(this.SCR,{radius: 1, segments: 15, charge: Math.abs(charge) <= 1e-10 ? 0 : charge, center: middlePosition})
  }

  private removeParticleFromSimulationState(index: number): void {
    this.SCR.scene.remove(this.particles[index]);
    this.simulationState.splice(4 * index, 4);
    this.particles.splice(index, 1);
    this.particlesNumber--;
  }

  private addParticleToSimulationState(particle: Particle, velocity: Vector3) {
    this.simulationState.push(particle.position.x);
    this.simulationState.push(particle.position.y);
    this.simulationState.push(velocity.x);
    this.simulationState.push(velocity.y);
    this.particles.push(particle);
    this.particlesNumber++;
    this.SCR.scene.add(particle);
  }

  private mergeVelocitiesOfParticles(index1: number, index2: number): Vector3 {
    return new Vector3(this.simulationState[4 * index1 + 2] + this.simulationState[4 * index2 + 2],
                       this.simulationState[4 * index1 + 3] + this.simulationState[4 * index2 + 3]);
  }
}