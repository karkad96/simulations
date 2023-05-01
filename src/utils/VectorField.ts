import {ScrService} from "../services/ScrService";
import {Arrow2DHelper} from "../helpers/Arrow2DHelper";
import {Vector3} from "three";

export class VectorField {
  get arrows(): Arrow2DHelper[][] {
    return this._arrows;
  }
  set arrows(value: Arrow2DHelper[][]) {
    this._arrows = value;
  }

  private _arrows: Arrow2DHelper[][] = [];
  private totalAxisX: number = 45;
  private totalAxisY: number = 20;
  private minArrowLength: number = 1;
  private virtualOrigin: Vector3 = new Vector3();

  constructor(private SCR: ScrService) {
    const dir = new Vector3(0, 0, 0);
    const width = this.SCR.width;
    const height = this.SCR.height;
    const xScale = width / this.totalAxisX;
    const yScale = height / this.totalAxisY;
    this.minArrowLength = Math.min(xScale, yScale);

    this.SCR.params.setVisibilityOfVectorField = () => {
      if (this.SCR.params.isVectorFieldVisible)
        this.hideVectorField();
      else
        this.showVectorField();
      this.SCR.params.isVectorFieldVisible = !this.SCR.params.isVectorFieldVisible;
    };

    for (let i = 0; i <= this.totalAxisY; i++) {
      let arrowRow: Arrow2DHelper[] = [];
      for (let j = 0; j <= this.totalAxisX; j++) {
        const origin = new Vector3(-width / 2 + j * xScale, -height / 2 + i * yScale, 0);
        const arrowHelper = new Arrow2DHelper(dir, origin, 0.5, 0xffff00, 0.1, 0.1);
        arrowRow.push(arrowHelper);
        this.SCR.scene.add(arrowHelper);
      }
      this._arrows.push(arrowRow);
    }
  }

  public replaceVectors = () => {
    const width = this.SCR.width;
    const height = this.SCR.height;
    const xScale = width / this.totalAxisX;
    const yScale = height / this.totalAxisY;
    this.minArrowLength = Math.min(xScale, yScale);
    // for(let i = 0; i <= this._totalAxisY; i++) {
    //   for(let j = 0; j <= this._totalAxisX; j++) {
    //     let arrow = this._arrows[i][j];
    //     arrow.position.x = -width / 2 + this.SRC.camera.position.x + Math.abs(this.SRC.camera.position.x % this.tmp2x) + j * xScale;
    //     arrow.position.y = -height / 2 + this.SRC.camera.position.y + Math.abs(this.SRC.camera.position.y % this.tmp2y) + i * yScale;
    //   }
    // }
    let tmpX = Math.floor(this.SCR.camera.position.x / xScale);
    let tmpY = Math.floor(this.SCR.camera.position.y / yScale);
    this.virtualOrigin.x = tmpX;
    this.virtualOrigin.y = tmpY;
  }

  public onPanning = (): void => {
    const width = this.SCR.width;
    const height = this.SCR.height;
    const xScale = width / this.totalAxisX;
    const yScale = height / this.totalAxisY;
    let tmpX = Math.floor(this.SCR.camera.position.x / xScale);
    let tmpY = Math.floor(this.SCR.camera.position.y / yScale);

    if (this.virtualOrigin.x <= tmpX) {
      this._arrows.forEach((arrowRow: Arrow2DHelper[]) => {
        for (let i = tmpX; i > this.virtualOrigin.x; i--) {
          let arrow = arrowRow.shift();
          if (arrow !== undefined) {
            arrow.position.x = width / 2 + i * xScale;
            arrowRow.push(arrow);
          }
        }
      });
      this.virtualOrigin.x = tmpX;
    }

    if (this.virtualOrigin.x >= tmpX) {
      this._arrows.forEach((arrowRow: Arrow2DHelper[]) => {
        for (let i = this.virtualOrigin.x; i > tmpX; i--) {
          let arrow = arrowRow.pop();
          if (arrow !== undefined) {
            arrow.position.x = -width / 2 + i * xScale;
            arrowRow.unshift(arrow);
          }
        }
      });
      this.virtualOrigin.x = tmpX;
    }

    if (this.virtualOrigin.y <= tmpY) {
      for (let i = tmpY; i > this.virtualOrigin.y; i--) {
        let arrowRow = this._arrows.shift();
        if (arrowRow !== undefined) {
          arrowRow.forEach((arrow: Arrow2DHelper) => {
            arrow.position.y = height / 2 + i * yScale;
          });
          this._arrows.push(arrowRow);
        }
      }
      this.virtualOrigin.y = tmpY;
    }

    if (this.virtualOrigin.y >= tmpY) {
      for (let i = this.virtualOrigin.y; i > tmpY; i--) {
        let arrowRow = this._arrows.pop();
        if (arrowRow !== undefined) {
          arrowRow.forEach((arrow: Arrow2DHelper) => {
            arrow.position.y = -height / 2 + i * yScale;
          });
          this._arrows.unshift(arrowRow);
        }
      }
      this.virtualOrigin.y = tmpY;
    }
  }

  public getMinArrowLength(): number {
    return this.minArrowLength;
  }

  private hideVectorField(): void {
    this._arrows.flat().forEach((arrow) => arrow.visible = false);
  }

  private showVectorField(): void {
    this._arrows.flat().forEach((arrow) => arrow.visible = true);
  }
}