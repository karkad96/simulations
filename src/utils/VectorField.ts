import * as THREE from 'three';
import {ScrService} from "../services/ScrService";
import {Arrow2DHelper} from "../helpers/Arrow2DHelper";

export class VectorField {
  private _arrows: Arrow2DHelper[] = [];
  get arrows(): Arrow2DHelper[] {
    return this._arrows;
  }
  set arrows(value: Arrow2DHelper[]) {
    this._arrows = value;
  }
  constructor(private SRC: ScrService) {
    let vFOV = THREE.MathUtils.degToRad(SRC.camera.fov);
    let height = 2 * Math.tan(vFOV / 2) * SRC.camera.position.z;
    let width = height * SRC.camera.aspect;
    const dir = new THREE.Vector3(0, 0, 0);

    for(let i = -width / 2; i <= width / 2; i += 0.5) {
      for(let j = -height / 2; j <= height / 2; j += 0.5) {
        const origin = new THREE.Vector3(i, j, 0);
        const arrowHelper = new Arrow2DHelper(dir, origin, 0.5, 0xffff00, 0.1, 0.1);
        this._arrows.push(arrowHelper);
        SRC.scene.add(arrowHelper);
      }
    }
  }
}
