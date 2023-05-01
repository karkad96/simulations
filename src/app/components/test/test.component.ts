import {Component, OnInit} from '@angular/core';
import {ScrService} from "../../../services/ScrService";
import {Environment} from "../../../utils/Environment";
import {Vector3} from "three";
import {ParticlesSimulationFrame} from "../../../utils/ParticlesSimulationFrame";

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  constructor(private SCR: ScrService) {

  }

  ngOnInit() {
    let env = new Environment(this.SCR);

    env.addNewParticle({ center: new Vector3(0, 0),   charge: -0.0001,  radius: 1, segments: 15 });
    env.addNewParticle({ center: new Vector3(-4, 13),   charge: -0.0003,  radius: 1, segments: 15 });
    env.addNewParticle({ center: new Vector3(15, 0),   charge: 0.0002,  radius: 1, segments: 15 });
    env.addNewParticle({ center: new Vector3(15, -16),  charge: 0.0001, radius: 1, segments: 15 });
    this.SCR.simulationFrames.push(new ParticlesSimulationFrame(env, this.SCR));
    this.SCR.animate();
  }

  ngOnDestroy(): void {

  }
}