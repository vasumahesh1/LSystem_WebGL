import {mat4, vec4, vec2, vec3} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  geometryColor: vec4;

  constructor(public canvas: HTMLCanvasElement) {
    this.geometryColor = vec4.fromValues(1, 0, 0, 1);
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setGeometryColor(color: vec4) {
    this.geometryColor = color;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>) {
    let model = mat4.create();
    let rotDelta = mat4.create();
    let viewProj = mat4.create();

    let invViewProj = mat4.create();

    let invProj = mat4.create();
    let invView = mat4.create();

    let color = this.geometryColor;

    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);


    mat4.invert(invProj, camera.projectionMatrix);
    mat4.invert(invView, camera.viewMatrix);
    mat4.multiply(invViewProj, invView, invProj);

    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);
    prog.setGeometryColor(color);
    prog.setInvViewProjMatrix(invViewProj);
    prog.setScreenDimensions(vec2.fromValues(this.canvas.width, this.canvas.height));

    for (let drawable of drawables) {
      prog.setModelMatrix(drawable.modelMatrix);
      prog.draw(drawable);
    }
  }
};

export default OpenGLRenderer;
