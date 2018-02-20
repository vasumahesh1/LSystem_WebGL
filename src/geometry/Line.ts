import { vec3, vec4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';

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

class Line extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  linesArray: Array<vec4>;

  constructor() {
    super(); // Call the constructor of the super class. This is required.
    this.instanced = false;
    this.linesArray = new Array<vec4>();
    this.lines = true;
  }

  create() {

    this.positions = new Float32Array([]);
    this.indices = new Uint32Array([]);

    for (var itr = 0; itr < this.linesArray.length; itr+= 2) {
      let start = this.linesArray[itr];
      let end = this.linesArray[itr + 1];

      this.positions = concatFloat32Array(this.positions,
        new Float32Array([
          start[0], start[1], start[2], start[3],
          end[0], end[1], end[2], end[3]
        ])
      );

      this.indices = concatUint32Array(this.indices,
        new Uint32Array([
          itr, itr + 1
        ])
      );
    }

    this.generateIdx();
    this.generateVert();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVert);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created Line`);
  }
};

export default Line;