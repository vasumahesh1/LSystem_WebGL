import {vec3, vec4, vec2} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

let Noise = require('noisejs').Noise;

var Logger = require('debug');
var dCreateInfo = Logger("lsystem:info:mesh:NoisePlane");
var dCreate = Logger("lsystem:trace:mesh:NoisePlane");

function concatFloat32Array(first: Float32Array, second: Float32Array) {
  var firstLength = first.length;
  var secondLength = second.length
  var result = new Float32Array(firstLength + secondLength);

  result.set(first);
  result.set(second, firstLength);

  return result;
}

function concatUint32Array(first: Uint32Array, second: Uint32Array) {
  var firstLength = first.length;
  var secondLength = second.length
  var result = new Uint32Array(firstLength + secondLength);

  result.set(first);
  result.set(second, firstLength);

  return result;
}

class NoisePlane extends Drawable {
  indices: Uint32Array;
  vertices: Float32Array;
  normals: Float32Array;
  
  seed: number;
  width: number;
  height: number;
  subDivX: number;
  subDivY: number;

  noiseGen: any;

  fbm2D(x: number, y: number) {
    let s = 0.0;
    let m = 0.0;
    let a = 0.5;

    let p = vec2.fromValues(x, y);
    
    for(let i = 0; i < 8; i++ ){
      s = s + (a * this.noiseGen.simplex2(p[0] * 0.005, p[1] * 0.005));
      m = m + a;
      a = a * 0.5;
      vec2.scale(p, p, 2.0);
    }

    return s / m;
  }

  constructor(width: number, height: number, subDivX: number, subDivY: number, seed: number) {
    super();

    this.width = width;
    this.height = height;
    this.subDivX = subDivX;
    this.subDivY = subDivY;
    this.seed = seed;

    this.normals = new Float32Array([]);
    this.vertices = new Float32Array([]);
    this.indices = new Uint32Array([]);

    let noise = new Noise(seed);
    this.noiseGen = noise;
  }

  create() {

    let widthStep = this.width / this.subDivX;
    let heightStep = this.height / this.subDivY;

    let idxCount = 0;

    for(let startX = -this.width / 2; startX < this.width / 2; startX += widthStep) {
      for(let startY = -this.height / 2; startY < this.height / 2; startY += heightStep) {

        let noise1 = this.fbm2D(startX, startY) * 512;
        let noise2 = this.fbm2D((startX + widthStep), startY) * 512;
        let noise3 = this.fbm2D((startX + widthStep), (startY + heightStep)) * 512;
        let noise4 = this.fbm2D(startX, (startY + heightStep)) * 512;

        noise1 = Math.floor(noise1 / 128) * 4;
        noise2 = Math.floor(noise2 / 128) * 4;
        noise3 = Math.floor(noise3 / 128) * 4;
        noise4 = Math.floor(noise4 / 128) * 4;

        noise1 = 0;
        noise2 = 0;
        noise3 = 0;
        noise4 = 0;

        this.vertices = concatFloat32Array(this.vertices,
          new Float32Array([
            startX, noise1, startY, 1,
            startX + widthStep, noise2, startY, 1,
            startX + widthStep, noise3, startY + heightStep, 1,
            startX, noise4, startY + heightStep, 1
            ])
          );

        // dCreate(`Noises: ${noise1}, ${noise2}, ${noise3}, ${noise4}`);

        let vec1 = vec3.fromValues(-widthStep, noise1 - noise2, 0);
        let vec2 = vec3.fromValues(0, noise3 - noise2, heightStep);

        let normal = vec3.create();
        vec3.cross(normal, vec1, vec2);
        vec3.normalize(normal, normal);

        this.normals = concatFloat32Array(this.normals,
          new Float32Array([
            normal[0], normal[1], normal[2], 0,
            normal[0], normal[1], normal[2], 0,
            normal[0], normal[1], normal[2], 0,
            normal[0], normal[1], normal[2], 0
            ])
          );

        this.indices = concatUint32Array(this.indices,
          new Uint32Array([
            idxCount, idxCount + 1, idxCount + 2,
            idxCount, idxCount + 2, idxCount + 3
            ])
          );

        idxCount += 4;
      }
    }
    
    this.generateIdx();
    this.generateVert();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVert);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    dCreateInfo(`Created NoisePlane with ${this.vertices.length} Vertices`);
  }
};

export default NoisePlane;
