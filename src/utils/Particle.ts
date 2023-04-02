import * as THREE from 'three';
import {CircleGeometry, Vector3} from "three";
import {ScrService} from "../services/ScrService";

let _geometry: THREE.CircleGeometry;

export class ParticleData {
  constructor(public center: Vector3 = new Vector3(0, 0, 0),
              public charge: number = 0,
              public radius: number = 0.15,
              public segments: number = 15) {
  }
}

export class Particle extends THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> {
  public charge: number = 0;
  public constructor(private SCR: ScrService, particleData: ParticleData) {
    super();
    this.type = 'Particle';

    if (_geometry === undefined) {
      _geometry = new CircleGeometry(particleData.radius, particleData.segments);
    }

    let material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
      color: particleData.charge != 0 ? (particleData.charge > 0 ? 0xff0000 : 0x0000ff) : 0xffff00,
      transparent: true
    });

    this.geometry = _geometry;
    this.material = material;

    this.position.x = particleData.center.x;
    this.position.y = particleData.center.y;

    this.charge = particleData.charge;

    SCR.scene.add(this);
  }
}
