import {CircleGeometry, Vector3, Mesh, MeshBasicMaterial} from "three";
import {ScrService} from "../services/ScrService";

let _geometry: CircleGeometry;

export class ParticleData {
  constructor(public center: Vector3 = new Vector3(0, 0, 0),
              public charge: number = 0,
              public radius: number = 0.15,
              public segments: number = 15) {
  }
}

export class Particle extends Mesh<CircleGeometry, MeshBasicMaterial> {
  public charge: number = 0;
  public radius2: number = 0;
  public radius: number = 0;
  
  public constructor(private SCR: ScrService, particleData: ParticleData) {
    super();
    this.type = 'Particle';

    if (_geometry === undefined ||
        _geometry.parameters.radius != particleData.radius ||
        _geometry.parameters.segments != particleData.segments) {
      _geometry = new CircleGeometry(particleData.radius, particleData.segments);
    }

    let material: MeshBasicMaterial = new MeshBasicMaterial({
      color: particleData.charge != 0 ? (particleData.charge > 0 ? 0xff0000 : 0x0000ff) : 0xffff00,
      transparent: true
    });

    this.geometry = _geometry;
    this.material = material;

    this.position.x = particleData.center.x;
    this.position.y = particleData.center.y;

    this.charge = particleData.charge;
    this.radius = particleData.radius;
    this.radius2 = particleData.radius * particleData.radius;

    SCR.scene.add(this);
  }
}