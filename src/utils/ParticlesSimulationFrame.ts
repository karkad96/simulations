import {ISimulationFrame} from "./ISimulationFrame";
import {Environment} from "./Environment";
import {Particle} from "./Particle";
import {BufferGeometry, LineBasicMaterial, Vector2, Vector3} from "three";
import {ScrService} from "../services/ScrService";
import {Line} from "three/src/objects/Line";

export class ParticlesSimulationFrame implements ISimulationFrame {
  private readonly _particles: Particle[] = [];
  private _simulationState: number[] = [];
  private _particlesNumber: number;
  private readonly _h: number[];
  public constructor(private env: Environment, private SCR: ScrService)
  {
    this._particlesNumber = this.env.particles.length;
    this._particles = this.env.particles;
    this._h = new Array<number>(this._particlesNumber * 4).fill(0.000001);
    this.initSimulationState();
  }

  public generateNextFrame(delta: number): void {
    this.calculate(this.SCR.params.speedOfSimulation * delta, this._simulationState);
    this.findAndMergeParticles();

    this._particles.forEach((particle: Particle, index: number) => {
/*      const material = new LineBasicMaterial( { color: 0x0000ff } );
      const points = [];
      points.push( new Vector3( particle.position.x, particle.position.y, 0 ) );
      points.push( new Vector3( this._simulationState[4 * index    ], this._simulationState[4 * index + 1], 0 ) );
      const geometry = new BufferGeometry().setFromPoints( points );
      const line = new Line( geometry, material );
      this.SCR.scene.add(line);*/
      if(particle.uuid != this.SCR.params.draggedParticle) {
        particle.position.x = this._simulationState[4 * index];
        particle.position.y = this._simulationState[4 * index + 1];

        switch (this.particleOnBorder(particle)) {
          case 0:
            this._simulationState[4 * index + 1] = this.SCR.height / 2 - particle.radius;
            this._simulationState[4 * index + 3] = -this._simulationState[4 * index + 3];
            break;
          case 2:
            this._simulationState[4 * index + 1] = -this.SCR.height / 2 + particle.radius;
            this._simulationState[4 * index + 3] = -this._simulationState[4 * index + 3];
            break;
          case 1:
            this._simulationState[4 * index] = this.SCR.width / 2 - particle.radius;
            this._simulationState[4 * index + 2] = -this._simulationState[4 * index + 2];
            break;
          case 3:
            this._simulationState[4 * index] = -this.SCR.width / 2 + particle.radius;
            this._simulationState[4 * index + 2] = -this._simulationState[4 * index + 2];
            break;
          default:
            break;
        }
      } else {
        this._simulationState[4 * index] = particle.position.x;
        this._simulationState[4 * index + 1] = particle.position.y;
        this._simulationState[4 * index + 2] = 0;
        this._simulationState[4 * index + 3] = 0;
      }
    });

    if (this.SCR.params.isVectorFieldVisible)
      this.env.updateVectorField();
  }

  private initSimulationState(): void {
    let particleVelocities = this.getInitialParticleVelocities();
    this._particles.forEach((particle: Particle, index: number) => {
      this._simulationState.push(particle.position.x);
      this._simulationState.push(particle.position.y);
      this._simulationState.push(particleVelocities[index].x);
      this._simulationState.push(particleVelocities[index].y);
    });
  }

  private getInitialParticleVelocities(): Vector3[] {
    return Array<Vector3>(this._particlesNumber).fill(new Vector3());
  }

  private derivative(): number[] {
    let du = new Array(this._particlesNumber * 4);
    for (let iBody = 0; iBody < this._particlesNumber; iBody++) {
      let bodyStart = iBody * 4;
      let accVector = this.accelerationVector(iBody);

      du[bodyStart    ] = this._simulationState[bodyStart + 2];
      du[bodyStart + 1] = this._simulationState[bodyStart + 3];
      du[bodyStart + 2] = accVector.x;
      du[bodyStart + 3] = accVector.y;
    }
    return du;
  }

  private accelerationVector(iFromBody: number): Vector3 {
    let iFromBodyStart = iFromBody * 4;
    let superposition = new Vector3();
    let dir = new Vector3();

    for (let iToBody = 0; iToBody < this._particlesNumber; iToBody++) {
      if (iFromBody === iToBody)
        continue;

      let iToBodyStart = iToBody * 4;

      dir.x = this._simulationState[iFromBodyStart] -
        this._simulationState[iToBodyStart];

      dir.y = this._simulationState[iFromBodyStart + 1] -
        this._simulationState[iToBodyStart + 1];

      const len2 = this.env.getLengthSquared(dir);
      dir = dir.normalize();
      dir.multiplyScalar(this._particles[iToBody].charge / len2);
      superposition.add(dir);
    }

    return superposition.multiplyScalar(this.SCR.coulombConst * this._particles[iFromBody].charge);
  }

  private particleOnBorder(particle: Particle): number {
    if(particle.position.y + particle.radius >= this.SCR.height / 2)
      return 0;
    else if(particle.position.x + particle.radius >= this.SCR.width / 2)
      return 1;
    else if(particle.position.y - particle.radius <= -this.SCR.height / 2)
      return 2;
    else if(particle.position.x - particle.radius <= -this.SCR.width / 2)
      return 3;

    return -1;
  }

  public setParticleVelocity(particle: Particle, velocity: Vector3): void {
    let index = this._particles.findIndex((otherParticle) => otherParticle.uuid == particle.uuid);
    if (index >= 0) {
      this._simulationState[4 * index + 2] = velocity.x / this.SCR.clock.getDelta() * 1000;
      this._simulationState[4 * index + 3] = velocity.y / this.SCR.clock.getDelta() * 1000;
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
    let len: number = this._particles.length;
    let particleMerged: boolean = false;
    let subPos: Vector3 = new Vector3();

    for(let i = 0; i < len && !particleMerged; i++) {
      for(let j = i + 1; j < len; j++) {
        subPos.x = this._particles[i].position.x - this._particles[j].position.x;
        subPos.y = this._particles[i].position.y - this._particles[j].position.y;
        if(this.env.getLengthSquared(subPos) <= Math.max(this._particles[i].radius2, this._particles[j].radius2)) {
          let newParticle = this.mergeParticles(this._particles[i], this._particles[j]);
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

    return new Particle(this.SCR,{radius: 1, segments: 15, charge: particle1.charge + particle2.charge, center: middlePosition})
  }

  private removeParticleFromSimulationState(index: number): void {
    this.SCR.scene.remove(this._particles[index]);

    this._simulationState.splice(4 * index, 4);
    this._particles.splice(index, 1);
    this._particlesNumber--;
  }

  private addParticleToSimulationState(particle: Particle, velocity: Vector3) {
    this._simulationState.push(particle.position.x);
    this._simulationState.push(particle.position.y);
    this._simulationState.push(velocity.x);
    this._simulationState.push(velocity.y);
    this._particles.push(particle);
    this._particlesNumber++;
    this.SCR.scene.add(particle);
  }

  private mergeVelocitiesOfParticles(index1: number, index2: number): Vector3 {
    let res = new Vector3();
    res.x = this._simulationState[4 * index1 + 2] + this._simulationState[4 * index2 + 2];
    res.y = this._simulationState[4 * index1 + 3] + this._simulationState[4 * index2 + 3];

    return res;
  }
}
