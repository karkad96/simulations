import * as THREE from 'three';
import {ScrService} from "../services/ScrService";
import {DragControls} from "three/examples/jsm/controls/DragControls";
import {VectorField} from "./VectorField"

export class Particles {
  private circles: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>[] = [];
  private geometry: THREE.CircleGeometry = new THREE.CircleGeometry(0.15,15);
  private controls: DragControls;
  constructor(private SCR: ScrService, private vectorField?: VectorField) {
    this.controls = new DragControls([], SCR.camera, SCR.renderer.domElement);
  }

  public addParticle(x: number, y: number, charge: number) {
    let material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
      color: charge != 0 ? (charge > 0 ? 0xff0000 : 0x0000ff) : 0xffff00,
      transparent: true,
      userData: {charge: charge}
    });

    let circle = new THREE.Mesh(this.geometry, material);

    circle.position.x = x;
    circle.position.y = y;

    this.circles.push(circle);

    this.SCR.scene.add(circle);
    this.updateControls();
  }

  private updateControls(): void {
    this.controls.dispose();
    this.controls = new DragControls(this.circles, this.SCR.camera, this.SCR.renderer.domElement);
    this.controls.addEventListener('dragstart', () => {
      if(this.vectorField)
        document.addEventListener('mousemove', this.onParticleMouseMove, false);
    });
    this.controls.addEventListener('dragend', () => {
      if(this.vectorField)
        document.removeEventListener('mousemove', this.onParticleMouseMove, false);
    });
  }

  private onParticleMouseMove = () => {
    this.vectorField?.updateVectorField(this.circles);
  }
}
