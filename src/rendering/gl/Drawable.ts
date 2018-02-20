import { mat4 } from 'gl-matrix';
import {gl} from '../../globals';

abstract class Drawable {
  count: number = 0;
  instances: number = 0;
  instanced: boolean = false;
  lines: boolean = false;

  modelMatrix: mat4 = mat4.create();

  bufIdx: WebGLBuffer;
  bufVert: WebGLBuffer;
  bufNor: WebGLBuffer;
  bufInstancePosition: WebGLBuffer;

  idxBound: boolean = false;
  vertBound: boolean = false;
  norBound: boolean = false;
  instPosBound: boolean = false;

  abstract create() : void;

  destory() {
    gl.deleteBuffer(this.bufIdx);
    gl.deleteBuffer(this.bufVert);
    gl.deleteBuffer(this.bufNor);
    gl.deleteBuffer(this.bufInstancePosition);
  }

  generateIdx() {
    this.idxBound = true;
    this.bufIdx = gl.createBuffer();
  }

  generateVert() {
    this.vertBound = true;
    this.bufVert = gl.createBuffer();
  }

  generateInstancePos() {
    this.instPosBound = true;
    this.bufInstancePosition = gl.createBuffer();
  }

  generateNor() {
    this.norBound = true;
    this.bufNor = gl.createBuffer();
  }

  bindIdx(): boolean {
    if (this.idxBound) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    }
    return this.idxBound;
  }

  bindVert(): boolean {
    if (this.vertBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVert);
    }
    return this.vertBound;
  }

  bindInstancePos(): boolean {
    if (this.instPosBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufInstancePosition);
    }
    return this.instPosBound;
  }

  bindNor(): boolean {
    if (this.norBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    }
    return this.norBound;
  }

  elemCount(): number {
    return this.count;
  }

  instanceCount(): number {
    return this.instances;
  }

  drawMode(): GLenum {
    if (this.lines) {
      return gl.LINES;
    }

    return gl.TRIANGLES;
  }

  isInstanced(): boolean {
    return this.instanced;
  }
};

export default Drawable;
