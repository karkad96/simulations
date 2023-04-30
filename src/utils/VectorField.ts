import {ScrService} from "../services/ScrService";
import {Arrow2DHelper} from "../helpers/Arrow2DHelper";
import {Vector3} from "three";
import { Particle } from "./Particle";

export class VectorField {
  private _arrows: Arrow2DHelper[][] = [];
  private _totalAxisX: number = 45;
  private _totalAxisY: number = 20;
  private _minArrowLength: number = 1;
  private _virtualOrigin: Vector3 = new Vector3();
  get arrows(): Arrow2DHelper[][] {
    return this._arrows;
  }
  set arrows(value: Arrow2DHelper[][]) {
    this._arrows = value;
  }
  constructor(private SRC: ScrService) {
    const dir = new Vector3(0, 0, 0);
    const width = this.SRC.width;
    const height = this.SRC.height;
    const xScale = width / this._totalAxisX;
    const yScale = height / this._totalAxisY;
    this._minArrowLength = Math.min(xScale, yScale);
    this.SRC.params.setVisibilityOfVectorField = () => {
      if(this.SRC.params.isVectorFieldVisible)
        this.hideVectorField();
      else
        this.showVectorField();
      this.SRC.params.isVectorFieldVisible = !this.SRC.params.isVectorFieldVisible;
    };

    for(let i = 0; i <= this._totalAxisY; i++) {
      let arrowRow: Arrow2DHelper[] = [];
      for(let j = 0; j <= this._totalAxisX; j++) {
        const origin = new Vector3(-width / 2 + j * xScale, -height / 2 + i * yScale, 0);
        const arrowHelper = new Arrow2DHelper(dir, origin, 0.5, 0xffff00, 0.1, 0.1);
        arrowRow.push(arrowHelper);
        SRC.scene.add(arrowHelper);
      }
      this._arrows.push(arrowRow);
    }

    // let a = new Particle(this.SRC, { center: new Vector3(-width / 2, -height / 2),   charge: -0.0001,  radius: 1, segments: 15 });
    // this.SRC.scene.add(a);
  }
  private tmpx: number = 1;
  private tmpy: number = 1;
  private tmp2x: number = 1;
  private tmp2y: number = 1;
  public replaceVectors = () => {
    const width = this.SRC.width;
    const height = this.SRC.height;
    const xScale = width / this._totalAxisX;
    const yScale = height / this._totalAxisY;
    this._minArrowLength = Math.min(xScale, yScale);
    const a = -width / 2 - this._arrows[0][0].position.x;
    const b = -height / 2 - this._arrows[0][0].position.y;
    const tmpxx = xScale / this.tmpx;
    const tmpyy = yScale / this.tmpy;
    this.tmpx = xScale;
    this.tmpy = yScale;
    // console.log(this.SRC.camera.position, this.SRC.camera.position.x % xScale, this.SRC.camera.position.y % yScale, width, height);
    // for(let i = 0; i <= this._totalAxisY; i++) {
    //   for(let j = 0; j <= this._totalAxisX; j++) {
    //     let arrow = this._arrows[i][j];
    //     arrow.position.x = -width / 2 + this.SRC.camera.position.x + Math.abs(this.SRC.camera.position.x % this.tmp2x) + j * xScale;
    //     arrow.position.y = -height / 2 + this.SRC.camera.position.y + Math.abs(this.SRC.camera.position.y % this.tmp2y) + i * yScale;
    //   }
    // }
    //let tt = new Particle(this.SRC, { center: new Vector3(-width / 2 + this.SRC.camera.position.x, -height / 2 + this.SRC.camera.position.y),   charge: -0.0001,  radius: 1, segments: 15 });
    //this.SRC.scene.add(tt);
    //console.log(this.SRC.camera.position);
    let tmpX = Math.floor(this.SRC.camera.position.x / xScale);
    let tmpY = Math.floor(this.SRC.camera.position.y / yScale);
    this._virtualOrigin.x = tmpX;
    this._virtualOrigin.y = tmpY;
  }

  public test = (): void => {
    const width = this.SRC.width;
    const height = this.SRC.height;
    const xScale = width / this._totalAxisX;
    const yScale = height / this._totalAxisY;
    let tmpX = Math.floor(this.SRC.camera.position.x / xScale);
    let tmpY = Math.floor(this.SRC.camera.position.y / yScale);
    this.tmp2x = xScale;
    this.tmp2y = yScale;
    //console.log(this.SRC.camera.position, this.SRC.camera.position.x % xScale, this.SRC.camera.position.y % yScale, xScale, yScale, tmpX, tmpY);
    if(this._virtualOrigin.x <= tmpX) {
      this._arrows.forEach((arrowRow: Arrow2DHelper[]) => {
        for(let i = tmpX; i > this._virtualOrigin.x; i--) {
          let arrow = arrowRow.shift();
          if (arrow !== undefined) {
            arrow.position.x = width / 2 + i * xScale;
            arrowRow.push(arrow);
          }
        }
      });
      this._virtualOrigin.x = tmpX;
    }
    if(this._virtualOrigin.x >= tmpX) {
      this._arrows.forEach((arrowRow: Arrow2DHelper[]) => {
        for(let i = this._virtualOrigin.x; i > tmpX; i--) {
          let arrow = arrowRow.pop();
          if (arrow !== undefined) {
            arrow.position.x = -width / 2 + i * xScale;
            arrowRow.unshift(arrow);
          }
        }
      });
      this._virtualOrigin.x = tmpX;
    }
    if(this._virtualOrigin.y <= tmpY) {
      for(let i = tmpY; i > this._virtualOrigin.y; i--) {
        let arrowRow = this._arrows.shift();
        if (arrowRow !== undefined) {
          arrowRow.forEach((arrow: Arrow2DHelper) => {
            arrow.position.y = height / 2 + i * yScale;
          });
          this._arrows.push(arrowRow);
        }
      }
      this._virtualOrigin.y = tmpY;
    }
    if(this._virtualOrigin.y >= tmpY) {
      for(let i = this._virtualOrigin.y; i > tmpY; i--) {
        let arrowRow = this._arrows.pop();
        if (arrowRow !== undefined) {
          arrowRow.forEach((arrow: Arrow2DHelper) => {
            arrow.position.y = -height / 2 + i * yScale;
          });
          this._arrows.unshift(arrowRow);
        }
      }
      this._virtualOrigin.y = tmpY;
    }
  }

  public getMinArrowLength(): number {
    return this._minArrowLength;
  }

  private hideVectorField(): void {
    this._arrows.flat().forEach((arrow) => arrow.visible = false);
  }

  private showVectorField(): void {
    this._arrows.flat().forEach((arrow) => arrow.visible = true);
  }
}
