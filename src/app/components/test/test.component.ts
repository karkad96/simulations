import {Component, OnInit} from '@angular/core';
import {Particles} from "../../../utils/Particles";
import {VectorField} from "../../../utils/VectorField";
import {ScrService} from "../../../services/ScrService";
@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  constructor(private SCR: ScrService) {

  }

  ngOnInit() {
    let vectorField = new VectorField(this.SCR);
    let particles = new Particles(this.SCR, vectorField);

    particles.addParticle(5, 5, 20);
    particles.addParticle(0, 0, 10);
    particles.addParticle(2, 1, -10);
    particles.addParticle(-2, 1, -1);

    this.SCR.animate();
  }

  ngOnDestroy(): void {

  }
}
