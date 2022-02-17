import * as THREE from 'three';
import {ScrService} from "../services/ScrService";
import {Arrow2DHelper} from "../helpers/Arrow2DHelper";

export class VectorField {
  private arrows: Arrow2DHelper[] = [];
  constructor(private SRC: ScrService) {
    let vFOV = THREE.MathUtils.degToRad(SRC.camera.fov);
    let height = 2 * Math.tan(vFOV / 2) * SRC.camera.position.z;
    let width = height * SRC.camera.aspect;
    const dir = new THREE.Vector3(0, 0, 0);
    for(let i = -width / 2; i <= width / 2; i += 0.5)
    {
      for(let j = -height / 2; j <= height / 2; j += 0.5)
      {
        const origin = new THREE.Vector3(i, j, 0);

        const arrowHelper = new Arrow2DHelper(dir, origin, 0.5, 0xffff00, 0.1, 0.1);
        this.arrows.push(arrowHelper);
        SRC.scene.add(arrowHelper);
      }
    }
  }

  public updateVectorField(circles: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>[]): void {
    this.arrows.forEach((arrow) => {
      let superposition = new THREE.Vector3(0, 0, 0);
      circles.forEach((circle) => {
        let dir = new THREE.Vector3(arrow.position.x - circle.position.x, arrow.position.y - circle.position.y, 0);
        const len2 = dir.length() * dir.length();
        dir = dir.normalize();
        dir.multiplyScalar(circle.material.userData.charge / len2);
        superposition.add(dir);
      });

      let color = new THREE.Color();
      color.setHSL(0.7 / (superposition.length() + 1) ,1,0.5);
      arrow.setColor(color);
      //arrow.setLength(0.5 - 0.5 / (superposition.length() + 1), 0.1, 0.1);
      arrow.setDirection(superposition.normalize());
    });
  }
}
