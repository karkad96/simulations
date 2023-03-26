import {Component, OnInit} from '@angular/core';
import {ScrService} from "../../../services/ScrService";
import {Environment} from "../../../utils/Environment";
import {Vector3} from "three";

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

    env.addNewParticle({ center: new Vector3(5, 5),  charge: 20,  radius: 0.15, segments: 15 });
    env.addNewParticle({ center: new Vector3(0, 0),  charge: 10,  radius: 0.15, segments: 15 });
    env.addNewParticle({ center: new Vector3(2, 1),  charge: -10, radius: 0.15, segments: 15 });
    env.addNewParticle({ center: new Vector3(-2, 1), charge: -1,  radius: 0.15, segments: 15 });

    this.SCR.animate();
  }

  ngOnDestroy(): void {

  }
}
