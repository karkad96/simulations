import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js';
import { BufferGeometry } from 'three/src/core/BufferGeometry.js';
import { Object3D } from 'three/src/core/Object3D.js';
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js';
import { Line } from 'three/src/objects/Line';
import {Mesh, MeshBasicMaterial, Vector3} from "three";
import {ColorRepresentation} from "three/src/utils";

const _axis = /*@__PURE__*/ new Vector3();
let _lineGeometry: BufferGeometry;
let _triangleGeometry: BufferGeometry;

export class Arrow2DHelper extends Object3D {
  override type: string;
  private readonly line: Line;
  private mat: LineBasicMaterial;
  private mat2: MeshBasicMaterial;
  private readonly arrowHead;
  constructor(dir               = new Vector3(0, 1, 0),
              origin            = new Vector3(0, 0, 0),
              length    = 1,
              color     = 0xffff00,
              headLength= length * 0.2,
              headWidth = headLength * 0.2) {
    super();

    this.type = 'Arrow2DHelper';

    if (_lineGeometry === undefined) {
      _lineGeometry = new BufferGeometry();
      _lineGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));

      _triangleGeometry = new BufferGeometry();
      _triangleGeometry.setAttribute('position', new Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, Math.sqrt(3) / 2, 0], 3));
    }

    this.position.copy(origin);

    this.line = new Line(_lineGeometry, this.mat = new LineBasicMaterial({color: color}));
    this.line.matrixAutoUpdate = false;
    this.add(this.line);

    this.arrowHead = new Mesh(_triangleGeometry, this.mat2 = new MeshBasicMaterial({color: color}));
    this.arrowHead.matrixAutoUpdate = false;
    this.add(this.arrowHead);

    this.setDirection(dir);
    this.setLength(length, headLength, headWidth);
  }

  setDirection(dir: Vector3) {
    if (dir.y > 1) {
      this.quaternion.set(0, 0, 0, 1);
    } else if (dir.y < -1) {
      this.quaternion.set(1, 0, 0, 0);
    } else {
      _axis.set(dir.z, 0, -dir.x).normalize();
      this.quaternion.setFromAxisAngle(_axis, Math.acos(dir.y));
    }
  }

  setLength(length: number, headLength = length * 0.2, headWidth = headLength * 0.2) {
    this.line.scale.set(1, length - headLength, 0);
    this.line.updateMatrix();

    this.arrowHead.scale.set(headWidth, headLength, headWidth);
    this.arrowHead.position.y = length - headLength;
    this.arrowHead.updateMatrix();
  }

  setColor(color: ColorRepresentation) {
    this.mat.color.set(color);
    this.mat2.color.set(color);
  }

  override copy(source: this): this {
    super.copy(source, false);
    this.line.copy(source.line);
    this.arrowHead.copy(source.arrowHead);
    return this;
  }
}
