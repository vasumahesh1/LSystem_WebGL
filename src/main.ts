import { vec3, vec4, mat4, glMatrix } from 'gl-matrix';
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
  createButton: loadAssets,
  toggleCollisionButton: toggleCollision,
  toggleLeavesButton: toggleLeaves,
  saveImage: saveImage,
  axiom: "[F][/-F][*+F][++*F][--*F]",
  seed: 858.739,
  iterations: 4,
  lightDirection: [15, 15, 15],
  influencers: {
    sunlight: 0.0,
    gravity: 5.0,
    collisionCheck: true
  },
  constraints: {
    minCollisionDistance: 0.015,
    rotateTilt: 20,
    rotateSwirl: 45,
    rotateSNoise: 5,
    rotateTNoise: 5,
  }
};

const SM_VIEWPORT_TRANSFORM:mat4 = mat4.fromValues(
  0.5, 0.0, 0.0, 0.0,
  0.0, 0.5, 0.0, 0.0,
  0.0, 0.0, 0.5, 0.0,
  0.5, 0.5, 0.5, 1.0);

const LEAF_COLOR_GRADIENT: Array<any> = [  
  [97, 130, 47, 255],
  [111, 140, 7, 255],
  [242, 206, 22, 255],
  [242, 164, 19, 255],
  [242, 79, 19, 255]
];

let prevTime: number;
let degreePerMS: number = -5.0 / 1000.0;

let boundingLines: Line;
let branchInstanced: MeshInstanced;
let flowerLeafInstance: MeshInstanced;
let leafInstances: Array<MeshInstanced>;
let sky: Sky;
let plane: NoisePlane;

let customLSystem: LSystem1;

let shaderControls: ShaderControls;

let activeShader: ShaderProgram;
let branchShader: ShaderProgram;
let leafShader: ShaderProgram;
let terrainShader: ShaderProgram;
let skyShader: ShaderProgram;
let visualShader: ShaderProgram;
let shadowMapShader: ShaderProgram;


let frameCount: number = 0;

let shouldCapture: boolean = false;

let drawOnlyCollisions: boolean = false;
let drawLeaves: boolean = true;


function toggleLeaves() {
  drawLeaves = !drawLeaves;
}

/**
 * @brief      Loads the geometry assets
 */
function loadAssets() {
  if (branchInstanced) {
    branchInstanced.destory();
  }

  if (boundingLines) {
    boundingLines.destory();
  }

  if (plane) {
    plane.destory();
  }

  if (sky) {
    sky.destory();
  }

  if (leafInstances) {
    for (var i = 0; i < LEAF_COLOR_GRADIENT.length; ++i) {
      leafInstances[i].destory();
    }
  }

  plane = new NoisePlane(500, 500, 75, 75, 8234.738169);
  plane.create();

  boundingLines = new Line();

  // Enable for Debug
  // boundingLines.linesArray.push(vec4.fromValues(0, 0, 0, 1.0));
  // boundingLines.linesArray.push(vec4.fromValues(30, 0, 0, 1.0));
  // boundingLines.linesArray.push(vec4.fromValues(0, 0, 0, 1.0));
  // boundingLines.linesArray.push(vec4.fromValues(0, 0, 30, 1.0));

  branchInstanced = new MeshInstanced("Branch Mesh");
  leafInstances = new Array<MeshInstanced>();

  let leafLoadPromises: Array<any> = [];

  for (var i = 0; i < LEAF_COLOR_GRADIENT.length; ++i) {
    let inst = new MeshInstanced("Leaf_Mesh_" + i);
    let color = vec4.fromValues(LEAF_COLOR_GRADIENT[i][0], LEAF_COLOR_GRADIENT[i][1], LEAF_COLOR_GRADIENT[i][2], LEAF_COLOR_GRADIENT[i][3]);
    vec4.scale(color, color, 1 / 255);
    inst.setColor(color);
    leafInstances.push(inst);

    leafLoadPromises.push(inst.load('./src/objs/leaf4.obj'));
  }

  branchInstanced.setColor(vec4.fromValues(0,0,0,1));

  branchInstanced.load('./src/objs/branch1.obj')
    .then(function() {
      return Promise.all(leafLoadPromises);
    })
    .then(function() {
      createLSystem();
    });

  sky = new Sky(vec3.fromValues(0, 0, 0));
  sky.create();
}

function createLSystem() {
  customLSystem = new LSystem1(controls.seed);
  customLSystem.system.setAxiom(controls.axiom);

  let lightDir = controls.lightDirection;
  let lightDirection =  vec3.fromValues(lightDir[0], lightDir[1], lightDir[2]);

  customLSystem.addInstance("branch", branchInstanced);
  customLSystem.addScope("boundingLines", boundingLines);
  customLSystem.addScope("leafInstances", leafInstances);
  customLSystem.addScope("sunlightDir", lightDirection);
  customLSystem.addScope("influencers", controls.influencers);
  customLSystem.addScope("constraints", controls.constraints);
  customLSystem.construct(controls.iterations);

  for (var i = 0; i < LEAF_COLOR_GRADIENT.length; ++i) {
    leafInstances[i].create();
  }

  boundingLines.create();
  branchInstanced.create();
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
  gui.add(controls, 'saveImage').name('Save Image');
  gui.add(controls, 'toggleCollisionButton').name('Toggle Collision View');
  gui.add(controls, 'toggleLeavesButton').name('Toggle Leaves');
  gui.add(controls, 'iterations', 1, 10).step(1.0).name('Iterations').listen();
  gui.add(controls, 'seed', 0, 32767).step(0.05).name('Seed').listen();
  gui.add(controls, 'axiom').name('Axiom');

  let group = gui.addFolder('Environment Influencers');
  group.add(controls.influencers, 'gravity', 0, 30).step(1.0).name('Gravity Factor').listen();
  group.add(controls.influencers, 'sunlight', 0, 2).step(0.1).name('Sunlight Bend Factor').listen();
  group.add(controls.lightDirection, '0', -20, 20).step(1.0).name('Light X').listen();
  group.add(controls.lightDirection, '1', -20, 20).step(1.0).name('Light Y').listen();
  group.add(controls.lightDirection, '2', -20, 20).step(1.0).name('Light Z').listen();

  group = gui.addFolder('Constraints');
  group.add(controls.constraints, 'minCollisionDistance', 0, 0.05).step(0.005).name('minBranchCollisionDistance').listen();
  group.add(controls.constraints, 'rotateSwirl', 0, 90).step(1.0).name('Swirl Rotate').listen();
  group.add(controls.constraints, 'rotateTilt', 0, 90).step(1.0).name('Tilt Rotate').listen();
  group.add(controls.constraints, 'rotateTNoise', 0, 20).step(1.0).name('Tilt Noise').listen();
  group.add(controls.constraints, 'rotateSNoise', 0, 20).step(1.0).name('Swirl Noise').listen();
  group.add(controls.influencers, 'collisionCheck').name('Collision Check').listen();

  group = gui.addFolder('Colors');
  group.addColor(LEAF_COLOR_GRADIENT, '0').name('Leaf Color 1').listen();
  group.addColor(LEAF_COLOR_GRADIENT, '1').name('Leaf Color 2').listen();
  group.addColor(LEAF_COLOR_GRADIENT, '2').name('Leaf Color 3').listen();
  group.addColor(LEAF_COLOR_GRADIENT, '3').name('Leaf Color 4').listen();
  group.addColor(LEAF_COLOR_GRADIENT, '4').name('Leaf Color 5').listen();

  gui.add(controls, 'createButton').name('Generate');
}

function lookAtMat4(out: any, eye: any, center: any, up: any) {
  let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  let eyex = eye[0];
  let eyey = eye[1];
  let eyez = eye[2];
  let upx = up[0];
  let upy = up[1];
  let upz = up[2];
  let centerx = center[0];
  let centery = center[1];
  let centerz = center[2];

  if (Math.abs(eyex - centerx) < glMatrix.EPSILON &&
      Math.abs(eyey - centery) < glMatrix.EPSILON &&
      Math.abs(eyez - centerz) < glMatrix.EPSILON) {
    return mat4.identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;

  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;

  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;

  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;

  return out;
}

function setShadowMapData(shader: ShaderProgram) {
  let lightDir = controls.lightDirection;
  let lightDirection =  vec3.fromValues(lightDir[0], lightDir[1], lightDir[2]);

  let lightSpaceOrthoProj = mat4.create();
  mat4.ortho(lightSpaceOrthoProj, -8.0, 8.0, -8.0, 8.0, 0.0, 100.0);


  let lightSpaceView = mat4.create();
  lookAtMat4(lightSpaceView, lightDirection, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
  let lightSpaceModel = mat4.create();
  let lightSpaceViewProj = mat4.create();

  mat4.multiply(lightSpaceViewProj, lightSpaceView, lightSpaceModel);
  mat4.multiply(lightSpaceViewProj, lightSpaceOrthoProj, lightSpaceViewProj);

  // Convert Model Space -> Light Space Matrix (outputs NDC) to output texCoords between 0 & 1
  let lightSpaceToViewport = mat4.create();
  mat4.multiply(lightSpaceToViewport, SM_VIEWPORT_TRANSFORM, lightSpaceViewProj);

  shader.setShadowMapMatrices(lightSpaceViewProj, lightSpaceToViewport);
}

function createFrameBuffer(gl: WebGL2RenderingContext, frameRefs: any) {

    // Creating a Framebuffer
    let frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    // Creating a texture that is outputed to by the frame buffer
    let frameTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, window.innerWidth, window.innerHeight, 0, gl.RGB, gl.UNSIGNED_BYTE, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, frameTexture, 0);

    // Creating a depth buffer
    let depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.FRAMEBUFFER, depthBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT, window.innerWidth, window.innerHeight);

    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)


    let drawBuffers = [gl.COLOR_ATTACHMENT0];
    gl.drawBuffers(drawBuffers);

    // Adding a safe Check log
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(status != gl.FRAMEBUFFER_COMPLETE) {
        console.error("Error while creating framebuffer");
    }

    frameRefs.frameBuffer = frameBuffer;
    frameRefs.depthBuffer = depthBuffer;
    frameRefs.frameTexture = frameTexture;
}

function createShadowMapFrameBuffer(gl: WebGL2RenderingContext, frameRefs: any) {

    // Creating a Framebuffer
    let frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    // Creating a texture that is outputed to by the frame buffer
    let frameTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, window.innerWidth, window.innerHeight, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, frameTexture, 0);

    // Creating a depth buffer
    let depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, window.innerWidth, window.innerHeight);

    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)


    // Adding a safe Check log
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(status != gl.FRAMEBUFFER_COMPLETE) {
        console.error("Error while creating framebuffer");
    }

    frameRefs.frameBuffer = frameBuffer;
    frameRefs.depthBuffer = depthBuffer;
    frameRefs.frameTexture = frameTexture;
}

/**
 * @brief      Main execution code
 *
 * @memberof   Main
 */
function main() {
  shaderControls = new ShaderControls();

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

  const camera = new Camera(vec3.fromValues(8, 8, -8), vec3.fromValues(0, 0, 0));

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

  visualShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/visual-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/visual-frag.glsl')),
  ]);

  shadowMapShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/sm-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/sm-frag.glsl')),
  ]);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  loadAssets();

  let shadowMapBuffer:any = {};

  createShadowMapFrameBuffer(gl, shadowMapBuffer);

  // This function will be called every frame
  function tick() {
    let deltaTime = (new Date()).getTime() - prevTime;

    let degrees = deltaTime * degreePerMS;

    let rotDelta = mat4.create();

    let lightDir = controls.lightDirection;
    let lightDirection =  vec3.fromValues(lightDir[0], lightDir[1], lightDir[2]);

    camera.update();
    let position = camera.getPosition();
    stats.begin();

    /*----------  Render Shadow Map into Buffer  ----------*/
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapBuffer.frameBuffer);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    shadowMapShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));

    setShadowMapData(shadowMapShader);

    let chunks = branchInstanced.getNumChunks();
    for (let ctr = 0; ctr < chunks; ++ctr) {
      shadowMapShader.setInstanceModelMatrices(branchInstanced.getChunkedInstanceModelMatrices(ctr));
      renderer.render(camera, shadowMapShader, [branchInstanced]);
    }

    if (drawLeaves) {
      for (var i = 0; i < LEAF_COLOR_GRADIENT.length; ++i) {
        let instance = leafInstances[i];

        chunks = instance.getNumChunks();
        for (let ctr = 0; ctr < chunks; ++ctr) {
          shadowMapShader.setInstanceModelMatrices(instance.getChunkedInstanceModelMatrices(ctr));
          renderer.render(camera, shadowMapShader, [instance]);
        }
      }
    }

    /*----------  Render Scene  ----------*/
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    gl.disable(gl.DEPTH_TEST);

    skyShader.setTime(frameCount);
    skyShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));
    renderer.render(camera, skyShader, [sky]);

    gl.enable(gl.DEPTH_TEST);

    branchShader.setTime(frameCount);
    branchShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));

    terrainShader.setTime(frameCount);
    terrainShader.setLightPosition(lightDirection);

    terrainShader.setShadowTexture(1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowMapBuffer.frameTexture);

    setShadowMapData(terrainShader);

    terrainShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));
    renderer.render(camera, terrainShader, [plane]);

    if (!drawOnlyCollisions) {

      branchShader.setLightPosition(lightDirection);

      let chunks = branchInstanced.getNumChunks();
      for (let ctr = 0; ctr < chunks; ++ctr) {
        branchShader.setInstanceModelMatrices(branchInstanced.getChunkedInstanceModelMatrices(ctr));
        renderer.render(camera, branchShader, [branchInstanced]);
      }

      if (drawLeaves) {
        leafShader.setTime(frameCount);
        leafShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));
        leafShader.setLightPosition(lightDirection);

        for (var i = 0; i < LEAF_COLOR_GRADIENT.length; ++i) {
          let instance = leafInstances[i];

          chunks = instance.getNumChunks();
          for (let ctr = 0; ctr < chunks; ++ctr) {
            leafShader.setInstanceModelMatrices(instance.getChunkedInstanceModelMatrices(ctr));
            renderer.render(camera, leafShader, [instance]);
          }
        }
      }
    }
    
    if (drawOnlyCollisions) {
      visualShader.setEyePosition(vec4.fromValues(position[0], position[1], position[2], 1));
      renderer.render(camera, visualShader, [boundingLines]);
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
