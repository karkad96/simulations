import {ISimulationFrame} from "./ISimulationFrame";
import {Environment} from "./Environment";
import {Particle} from "./Particle";
import { Vector3 } from "three";

export class ParticlesSimulationFrame implements ISimulationFrame {
  private _timestep: number = 0.005;
  private _simulationState: number[] = [];
  private readonly _particlesNumber: number;
  public constructor(private env: Environment)
  {
    this._particlesNumber = this.env.particles.length;
    this.initSimulationState();
  }

  public generateNextFrame(): void {
    this.calculate(this._timestep, this._simulationState);

    this.env.particles.forEach((particle: Particle, index: number) => {
      particle.position.x = this._simulationState[4 * index    ];
      particle.position.y = this._simulationState[4 * index + 1];
    });

    this.env.updateVectorField();
  }

  private initSimulationState(): void {
    let particleVelocities = this.getInitialParticleVelocities();
    this.env.particles.forEach((particle: Particle, index: number) => {
      this._simulationState.push(particle.position.x);
      this._simulationState.push(particle.position.y);
      this._simulationState.push(particleVelocities[index].x);
      this._simulationState.push(particleVelocities[index].y);
    });
  }

  private getInitialParticleVelocities(): Vector3[] {
    return Array<Vector3>(this.env.particles.length).fill(new Vector3());
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
      dir.multiplyScalar(this.env.particles[iToBody].charge / len2);
      superposition.add(dir);
    }

    return superposition.multiplyScalar(this.env.particles[iFromBody].charge);
  }

  private calculate(h: number, u: number[]) {
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
}
