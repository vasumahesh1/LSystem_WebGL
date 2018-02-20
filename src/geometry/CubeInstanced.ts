import { vec3, vec4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';

var OBJ = require('webgl-obj-loader');

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

class CubeInstanced extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  constructor(center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.instanced = true;
  }

  create() {
    let ref = this;
    this.positions = new Float32Array([]);
    this.indices = new Uint32Array([]);
    this.normals = new Float32Array([]);

    OBJ.downloadMeshes({
      'wahoo': './src/objs/wahoo.obj'
    }, function(meshes: any) {

      let wahoo = meshes.wahoo;

      for (var itr = 0; itr < wahoo.vertices.length; itr+= 3) {
        let arr =  new Float32Array([
          wahoo.vertices[itr],
          wahoo.vertices[itr + 1],
          wahoo.vertices[itr + 2],
          1.0
        ]);

        let arrN =  new Float32Array([
          wahoo.vertexNormals[itr],
          wahoo.vertexNormals[itr + 1],
          wahoo.vertexNormals[itr + 2],
          1.0
        ]);

        ref.positions = concatFloat32Array(ref.positions, arr);
        ref.normals = concatFloat32Array(ref.normals, arrN);
      }

      for (var idx = 0; idx < wahoo.indices.length; ++idx) {
        ref.indices = concatUint32Array(ref.indices,
          new Uint32Array([
            wahoo.indices[idx]
          ])
        );
      }

      ref.generateIdx();
      ref.generateVert();
      ref.generateNor();
      ref.generateInstancePos();

      let instanceModels = new Float32Array([]);

      for (let i = 0; i < 1000; ++i) {
        let x = Math.random() * -100;
        let y = Math.random() * -100;
        let z = Math.random() * -100;

        instanceModels = concatFloat32Array(instanceModels,
          new Float32Array([
            x, y, z, 1
          ])
        );
      }

      ref.count = ref.indices.length;
      ref.instances = instanceModels.length / 4;

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ref.bufIdx);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ref.indices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, ref.bufNor);
      gl.bufferData(gl.ARRAY_BUFFER, ref.normals, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, ref.bufInstancePosition);
      gl.bufferData(gl.ARRAY_BUFFER, instanceModels, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, ref.bufVert);
      gl.bufferData(gl.ARRAY_BUFFER, ref.positions, gl.STATIC_DRAW);
        
      console.log(`Created CubeInstanced`);
    });
  }
};

export default CubeInstanced;
