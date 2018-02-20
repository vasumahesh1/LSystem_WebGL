import { vec3, vec4, mat4 } from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import Line from './geometry/Line';
import NoisePlane from './geometry/NoisePlane';
import MeshInstanced from './geometry/MeshInstanced';
import Sky from './geometry/Sky';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Texture from './rendering/gl/Texture';
import Camera from './Camera';
import { setGL } from './globals';
import { ShaderControls, WaterControls } from './rendering/gl/ShaderControls';
import ShaderProgram, { Shader } from './rendering/gl/ShaderProgram';

import {LSystem} from './core/lsystem/LSystem';
import LSystem1 from './lsystems/LSystem1';


localStorage.debug = 'lsystem:info*,lsystem:error*';

(<any>window).LSystem = LSystem;

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
let controls = {
  tesselations: 9,
  loadPlanetSceneButton: loadPlanetScene,
  loadRedPlanetSceneButton: loadRedPlanetScene,
  toggleCollisionButton: toggleCollision,
  saveImage: saveImage,
  geometryColor: [255, 0, 0],

  waterControls: {
    opacity: 0.65
  }
};

let prevTime: number;
let degreePerMS: number = -5.0 / 1000.0;

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let boundingLines: Line;
let branchInstanced: MeshInstanced;
let leaf1Instanced: MeshInstanced;
let sky: Sky;
let plane: NoisePlane;

let customLSystem: LSystem1;

let shaderControls: ShaderControls;

let activeShader: ShaderProgram;
let branchShader: ShaderProgram;
let leafShader: ShaderProgram;
let terrainShader: ShaderProgram;
let skyShader: ShaderProgram;
let waterShader: ShaderProgram;


let leafShaderList: Array<ShaderProgram>;
let branchShaderList: Array<ShaderProgram>;

let shaderMode: number = 0;
let frameCount: number = 0;

let shouldCapture: boolean = false;

let drawOnlyCollisions: boolean = false;

let grassTexture: Texture;
let grassDarkTexture: Texture;
let mountainTexture: Texture;
let snowTexture: Texture;

/**
 * @brief      Loads the pokeball scene.
 */
function loadPlanetScene() {
  activeShader = branchShader;
  shaderMode = 0;
  frameCount = 0;

  shaderControls.reset();

  grassTexture = new Texture('./src/textures/planet1/foliage.png');
  grassDarkTexture = new Texture('./src/textures/planet1/foliage_dark.png');
  mountainTexture = new Texture('./src/textures/planet1/mountain.jpg');
  snowTexture = new Texture('./src/textures/planet1/snow.png');

  mat4.identity(icosphere.modelMatrix);
}

function loadRedPlanetScene() {
  shaderControls.reset();
  grassTexture = new Texture('./src/textures/planet2/soil.png');
  grassDarkTexture = new Texture('./src/textures/planet2/soil.png');
  mountainTexture = new Texture('./src/textures/planet2/mountain.jpg');
  snowTexture = new Texture('./src/textures/planet2/snow.jpg');

  shaderControls.waterControls.opacity = 0.95;
  shaderControls.waterControls.level = 0.42;
  shaderControls.waterControls.color = [193.0, 0.0, 1.0];
  shaderControls.sandColor = [64.0, 33.0, 16.0];
  shaderControls.elevation = 1.23;
  shaderControls.shoreLevel = 0.37;
  shaderControls.noiseScale = 0.81;

  mat4.identity(icosphere.modelMatrix);
}

function loadTestScene() {
  activeShader = terrainShader;
  shaderMode = 0;
  frameCount = 0;
}

/**
 * @brief      Loads the geometry assets
 */
function loadAssets() {
  customLSystem = new LSystem1(858.738169);

  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  // icosphere.create();

  plane = new NoisePlane(500, 500, 75, 75, 8234.738169);
  plane.create();

  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();

  boundingLines = new Line();

  boundingLines.linesArray.push(vec4.fromValues(0, 0, 0, 1.0));
  boundingLines.linesArray.push(vec4.fromValues(30, 0, 0, 1.0));
  boundingLines.linesArray.push(vec4.fromValues(0, 0, 0, 1.0));
  boundingLines.linesArray.push(vec4.fromValues(0, 0, 30, 1.0));

  branchInstanced = new MeshInstanced();
  leaf1Instanced = new MeshInstanced();

  branchInstanced.load('./src/objs/branch1.obj')
    .then(function() {
      return leaf1Instanced.load('./src/objs/leaf4.obj');
    })
    .then(function() {
      customLSystem.addInstance("leaf1", leaf1Instanced);
      customLSystem.addInstance("branch", branchInstanced);
      customLSystem.addScope("boundingLines", boundingLines);
      customLSystem.construct(4);

      boundingLines.create();
      branchInstanced.create();
      leaf1Instanced.create();
    });

  sky = new Sky(vec3.fromValues(0, 0, 0));
  sky.create();
}

function saveImage() {
  shouldCapture = true;
}

function toggleCollision() {
  drawOnlyCollisions = !drawOnlyCollisions;
}

function downloadImage() {
  // Dump the canvas contents to a file.
  var canvas = <HTMLCanvasElement>document.getElementById("canvas");
  canvas.toBlob(function(blob) {
    var link = document.createElement("a");
    link.download = "image.png";

    link.href = URL.createObjectURL(blob);
    console.log(blob);

    link.click();

  }, 'image/png');
}

function constructGUI() {
  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'loadPlanetSceneButton').name('Load Planet Scene');
  gui.add(controls, 'loadRedPlanetSceneButton').name('Load Red Planet Scene');
  gui.add(controls, 'saveImage').name('Save Image');
  gui.add(controls, 'toggleCollisionButton').name('Toggle Collision');

  let group = gui.addFolder('Water Controls');
  group.add(shaderControls.waterControls, 'opacity', 0, 1).step(0.05).name('Water Opacity').listen();
  group.add(shaderControls.waterControls, 'level', 0, 1).step(0.01).name('Water Level').listen();
  group.addColor(shaderControls.waterControls, 'color').name('Water Color').listen();
  group.addColor(shaderControls, 'bedrock1Color').name('Water Bedrock 1 Color').listen();
  group.addColor(shaderControls, 'bedrock2Color').name('Water Bedrock 2 Color').listen();

  group = gui.addFolder('Terrain Controls');
  group.addColor(shaderControls, 'sandColor').name('Shore Color').listen();
  group.add(shaderControls, 'shoreLevel', 0, 1).step(0.01).name('Shore Level').listen();
  group.add(shaderControls, 'elevation', 0.1, 2.0).step(0.01).name('Terrain Elevation').listen();
  group.add(shaderControls, 'noiseScale', 0.1, 2.0).step(0.01).name('Terrain Noise Scale').listen();
}

/**
 * @brief      Main execution code
 *
 * @memberof   Main
 */
function main() {
  shaderControls = new ShaderControls();

  leafShaderList = new Array<ShaderProgram>();
  branchShaderList = new Array<ShaderProgram>();

  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  constructGUI();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement>document.getElementById('canvas');
  const gl = <WebGL2RenderingContext>canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene

  const camera = new Camera(vec3.fromValues(10, 10, 10), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.05, 0.05, 0.05, 1);
  gl.enable(gl.DEPTH_TEST);

  branchShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  leafShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/leaf-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/leaf-frag.glsl')),
  ]);

  terrainShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/terrain-frag.glsl')),
  ]);

  skyShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/sky-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/sky-frag.glsl')),
  ]);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  loadAssets();
  loadPlanetScene();

  // This function will be called every frame
  function tick() {
    let deltaTime = (new Date()).getTime() - prevTime;

    let degrees = deltaTime * degreePerMS;

    let rotDelta = mat4.create();

    mat4.fromRotation(rotDelta, degrees * 0.0174533, vec3.fromValues(0, 1, 0));
    mat4.multiply(icosphere.modelMatrix, icosphere.modelMatrix, rotDelta);

    camera.update();
    let position = camera.getPosition();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    // shaderControls.waterControls.opacity = controls.waterControls.opacity;

    gl.disable(gl.DEPTH_TEST);

    skyShader.setTime(frameCount);
    skyShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));
    renderer.render(camera, skyShader, [sky]);

    gl.enable(gl.DEPTH_TEST);

    activeShader.setTime(frameCount);
    activeShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));

    // activeShader.setInstanceModelMatrices(branchInstanced.getInstanceModelMatrices());
    // renderer.render(camera, activeShader, [branchInstanced]);

    terrainShader.setTime(frameCount);
    terrainShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));
    renderer.render(camera, terrainShader, [plane]);

    if (!drawOnlyCollisions) {

      let chunks = branchInstanced.getNumChunks();
      for (let ctr = 0; ctr < chunks; ++ctr) {
        activeShader.setInstanceModelMatrices(branchInstanced.getChunkedInstanceModelMatrices(ctr));
        renderer.render(camera, activeShader, [branchInstanced]);
      }

      leafShader.setTime(frameCount);
      leafShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));

      chunks = leaf1Instanced.getNumChunks();
      for (let ctr = 0; ctr < chunks; ++ctr) {
        leafShader.setInstanceModelMatrices(leaf1Instanced.getChunkedInstanceModelMatrices(ctr));
        renderer.render(camera, leafShader, [leaf1Instanced]);
      }
      
    }
    
    // for (let ctr = 0; ctr < branchShaderList.length; ++ctr) {
    //   let shader = branchShaderList[ctr];
    //   shader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));
    //   renderer.render(camera, shader, [leaf1Instanced]);
    // }

    // for (let ctr = 0; ctr < leafShaderList.length; ++ctr) {
    //   let shader = leafShaderList[ctr];
    //   shader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));
    //   renderer.render(camera, shader, [leaf1Instanced]);
    // }

    // leafShader.setInstanceModelMatrices(leaf1Instanced.getInstanceModelMatrices());
    // renderer.render(camera, leafShader, [leaf1Instanced]);

    if (drawOnlyCollisions) {
      renderer.render(camera, terrainShader, [boundingLines]);
    }

    frameCount++;

    stats.end();

    if (shouldCapture) {
      downloadImage();
      shouldCapture = false;
    }

    prevTime = (new Date()).getTime();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  prevTime = (new Date()).getTime();
  tick();
}

main();
