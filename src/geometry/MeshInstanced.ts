import { vec3, vec4, mat4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';

var Loader = require('webgl-obj-loader');

var Logger = require('debug');
var dCreate = Logger("lsystem:trace:mesh:instancedMesh");
var dCreateInfo = Logger("lsystem:info:mesh:instancedMesh");

let CHUNK_SIZE = 200;

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


function degreeToRad(deg: number) {
  return deg * 0.0174533;
}

class MeshInstanced extends Drawable {
  indices: Uint32Array;
  vertices: Float32Array;
  normals: Float32Array;
  positions: Float32Array;

  models: Array<mat4>;

  rawMesh: any;

  constructor() {
    super();
    this.instanced = true;

    this.positions = new Float32Array([]);
    this.normals = new Float32Array([]);
    this.vertices = new Float32Array([]);
    this.indices = new Uint32Array([]);
    this.models = new Array<mat4>();
  }

  load(url: string) {
    let ref = this;

    return new Promise(function(resolve, reject) {
      Loader.downloadMeshes({ mesh: url }, function(meshes: any) {
        ref.rawMesh = meshes.mesh;
        resolve();
      });
    });
  }

  getInstanceModelMatrices() {
    return this.models;
  }

  addInstanceUsingTransform(transform: mat4) {
    this.models.push(mat4.clone(transform));
  }

  addInstance(position: vec4, scale: vec4, orient: vec4) {
    let xRot = mat4.create();
    let yRot = mat4.create();
    let zRot = mat4.create();
    let orientation = mat4.create();
    let scaling = mat4.create();
    let translation = mat4.create();
    let finalMatrix = mat4.create();

    console.log(`[MeshInstanced] Rotation: (${orient[0]}, ${orient[1]}, ${orient[2]})`);

    mat4.fromRotation(xRot, orient[0], vec3.fromValues(1, 0, 0));
    mat4.fromRotation(yRot, orient[1], vec3.fromValues(0, 1, 0));
    mat4.fromRotation(zRot, orient[2], vec3.fromValues(0, 0, 1));

    mat4.multiply(orientation, yRot, zRot);
    mat4.multiply(orientation, xRot, orientation);

    mat4.fromScaling(scaling, vec3.fromValues(scale[0], scale[1], scale[2]));
    mat4.fromTranslation(translation, vec3.fromValues(position[0], position[1], position[2]));

    mat4.multiply(finalMatrix, orientation, scaling);
    mat4.multiply(finalMatrix, translation, finalMatrix);

    this.models.push(finalMatrix);

    let arr =  new Float32Array([
      position[0],
      position[1],
      position[2],
      position[3]
    ]);

    this.positions = concatFloat32Array(this.positions, arr);
  }

  getNumChunks(): number {
    return Math.ceil(this.models.length / CHUNK_SIZE);
  }

  getChunkedInstanceModelMatrices(chunk: number) {
    let start = chunk * CHUNK_SIZE;
    let end = Math.min((chunk + 1) * CHUNK_SIZE, this.models.length);
    return this.models.slice(start, end);
  }

  create() {
    this.vertices = new Float32Array([]);
    this.indices = new Uint32Array([]);
    this.normals = new Float32Array([]);

    let vertices = this.rawMesh.vertices;
    let indices = this.rawMesh.indices;
    let vertexNormals = this.rawMesh.vertexNormals;

    let vertexCount = vertices.length;

    dCreateInfo("Loading Vertices: " + vertexCount);
    dCreateInfo("Loading Indices: " + indices.length);
    dCreate("Loading Positions: " + this.positions.length);

    for (var itr = 0; itr < vertexCount; itr+= 3) {
      let arr =  new Float32Array([
        vertices[itr],
        vertices[itr + 1],
        vertices[itr + 2],
        1.0
      ]);

      let arrN =  new Float32Array([
        vertexNormals[itr],
        vertexNormals[itr + 1],
        vertexNormals[itr + 2],
        1.0
      ]);

      this.vertices = concatFloat32Array(this.vertices, arr);
      this.normals = concatFloat32Array(this.normals, arrN);
    }

    this.indices = new Uint32Array(indices);

    this.generateIdx();
    this.generateVert();
    this.generateNor();
    this.generateInstancePos();

    this.count = this.indices.length;
    this.instances = this.models.length;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufInstancePosition);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVert);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
      
    dCreateInfo(`Created MeshInstanced with ${this.instances} Instances`);
  }
};

export default MeshInstanced;
