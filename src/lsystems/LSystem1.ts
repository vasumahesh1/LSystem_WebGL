import { LSystem, LSystemTurtle } from '../core/lsystem/LSystem';
import MeshInstanced from '../geometry/MeshInstanced';

import {
  vec3,
  mat3,
  mat4,
  vec4
} from 'gl-matrix';

var kdTree = require('k-d-tree');
var boxIntersect = require('box-intersect');

var Logger = require('debug');
var systemTrace = Logger("lsystem:info:instance:transform");
var systemError = Logger("lsystem:error:instance:transform");

let branch1BoundingBox = [
  vec4.fromValues(-0.3, 0.2, -0.3, 1),
  vec4.fromValues(0.3, 0.8, 0.3, 1)
];

var distance = function(a: any, b: any){
  return Math.pow(a.coordinates[0] - b.coordinates[0], 2) +  Math.pow(a.coordinates[1] - b.coordinates[1], 2) + Math.pow(a.coordinates[2] - b.coordinates[2], 2);
}

var boundingBoxes : Array<any> = [];
var objectsTree = new kdTree([], distance);
var leavesTree = new kdTree([], distance);
// Tree Data:
//
// {
//   idx: 1,
//   type: "leaf|branch",
//   coordinates: [0, 0, 0]
// }



function degreeToRad(deg: number) {
  return deg * 0.0174533;
}

function segmentSegmentIntersect(S1: any, S2: any)
{
    let u = vec3.create();
    vec3.sub(u, S1[1], S1[0]);
    
    let v = vec3.create();
    vec3.sub(v, S2[1], S2[0]);
    
    let w = vec3.create();
    vec3.sub(w, S1[0], S2[0]);

    let a = vec3.dot(u,u);         // always >= 0
    let b = vec3.dot(u,v);
    let c = vec3.dot(v,v);         // always >= 0
    let d = vec3.dot(u,w);
    let e = vec3.dot(v,w);

    let D = a * c - b * b;        // always >= 0
    let sc, sN, sD = D;       // sc = sN / sD, default sD = D >= 0
    let tc, tN, tD = D;       // tc = tN / tD, default tD = D >= 0


    if (D < 0.0001) { // the lines are almost parallel
        sN = 0.0;         // force using point P0 on segment S1
        sD = 1.0;         // to prevent possible division by 0.0 later
        tN = e;
        tD = c;
    }
    else {                 // get the closest points on the infinite lines
        sN = (b * e - c * d);
        tN = (a * e - b * d);
        if (sN < 0.0) {        // sc < 0 => the s=0 edge is visible
            sN = 0.0;
            tN = e;
            tD = c;
        }
        else if (sN > sD) {  // sc > 1  => the s=1 edge is visible
            sN = sD;
            tN = e + b;
            tD = c;
        }
    }

    if (tN < 0.0) {            // tc < 0 => the t=0 edge is visible
        tN = 0.0;
        // recompute sc for this edge
        if (-d < 0.0)
            sN = 0.0;
        else if (-d > a)
            sN = sD;
        else {
            sN = -d;
            sD = a;
        }
    }
    else if (tN > tD) {      // tc > 1  => the t=1 edge is visible
        tN = tD;
        // recompute sc for this edge
        if ((-d + b) < 0.0)
            sN = 0;
        else if ((-d + b) > a)
            sN = sD;
        else {
            sN = (-d +  b);
            sD = a;
        }
    }
    // finally do the division to get sc and tc
    sc = (Math.abs(sN) < 0.00001 ? 0.0 : sN / sD);
    tc = (Math.abs(tN) < 0.00001 ? 0.0 : tN / tD);

    // get the difference of the two closest points
    // Vector   dP = w + (sc * u) - (tc * v);  // =  S1(sc) - S2(tc)

    let u1 = vec3.create();
    vec3.scale(u1, u, sc);
    let v1 = vec3.create();
    vec3.scale(v1, v, tc);

    let dP = vec3.create();
    vec3.add(dP, w, u1);
    vec3.sub(dP, dP, v1);


    return vec3.length(dP);   // return the closest distance
}

function makeBoundingLine(p0: vec3, p1: vec3, mesh: any) {
  mesh.linesArray.push(vec4.fromValues(p0[0], p0[1], p0[2], 1.0));
  mesh.linesArray.push(vec4.fromValues(p1[0], p1[1], p1[2], 1.0));
}

function drawBranchLarge() {
  let transform = mat4.create();
  let meshInstance = this.scope.instanceMap["branch"];
  let turtlePos = this.turtle.position;
  let depthFactor = this.depth * 0.45;

  let travelDistance = 1.0 / (depthFactor * depthFactor);
  let scale = 0.1 / depthFactor;

  if (this.depth <= 2) {
    travelDistance = 0.4;
    scale = 0.1;
  }

  let localMid = vec4.fromValues(0.0, 0.5 * travelDistance, 0.0, 1);
  let localHead = vec4.fromValues(0.0, 1.0, 0.0, 1);

  let worldMid = vec4.create();
  let worldHead = vec4.create();
  let worldOrigin = vec4.create();
  let worldOriginVec3 = vec3.create();

  let branchBoundingMin = vec4.create();
  let branchBoundingMax = vec4.create();

  let test = mat4.create();

  vec4.transformMat4(worldMid, localMid, this.turtle.transform);
  vec4.transformMat4(worldHead, localHead, this.turtle.transform);
  vec4.transformMat4(worldOrigin, vec4.fromValues(0.0, 0.0, 0.0, 1), this.turtle.transform);

  if (worldOrigin[1] < 0) {
    return;
  }

  let instModel = mat4.create();
  let branchScale = mat4.create();
  let branchOffset = mat4.create();

  mat4.fromScaling(branchScale, vec3.fromValues(scale, travelDistance, scale));
  mat4.multiply(instModel, this.turtle.transform, branchScale);

  var nearest = objectsTree.nearest({
    coordinates: [worldMid[0], worldMid[1], worldMid[3]]
  }, 20);

  if (this.scope.influencers.collisionCheck) {
    let currentData: any = {};
    currentData.p0 = vec3.create();
    currentData.p1 = vec3.create();

    worldOriginVec3 = vec3.fromValues(worldOrigin[0], worldOrigin[1], worldOrigin[2]);
    let worldHeadVec3 = vec3.create();
    vec4.sub(worldHead, worldMid, worldOrigin);
    worldHeadVec3 = vec3.fromValues(worldHead[0], worldHead[1], worldHead[2]);
    vec3.normalize(worldHeadVec3, worldHeadVec3);

    let temp = vec3.create();
    let start = vec3.fromValues(this.turtle.position[0], this.turtle.position[1], this.turtle.position[2]);
    let heading = vec3.fromValues(this.turtle.heading[0], this.turtle.heading[1], this.turtle.heading[2]);

    vec3.scale(temp, worldHeadVec3, 0.05);
    vec3.add(currentData.p0, worldOriginVec3, temp);

    temp = vec3.create();
    vec3.scale(temp, worldHeadVec3, 0.95 * travelDistance);
    vec3.add(currentData.p1, worldOriginVec3, temp);

    for (var itr = 0; itr < nearest.length; ++itr) {
      let obj = nearest[itr][0];
      let val = boundingBoxes[obj.idx];
      if (!val) {
        systemError("Error kdTree has data but Bounding Boxes doesn't");
        continue;
      }

      let result = segmentSegmentIntersect([val.p0, val.p1], [currentData.p0, currentData.p1]) < 0.015;

      if (result) {
        this.scope.collisionCount++;
        // We Collide;
        return;
      }
    }

    boundingBoxes.push(currentData);

    objectsTree.insert({
      idx: boundingBoxes.length - 1,
      type: "branch",
      coordinates: [worldMid[0], worldMid[1], worldMid[2]]
    });

    objectsTree.insert({
      idx: boundingBoxes.length - 1,
      type: "branch",
      coordinates: [currentData.p0[0], currentData.p0[1], currentData.p0[2]]
    });

    objectsTree.insert({
      idx: boundingBoxes.length - 1,
      type: "branch",
      coordinates: [currentData.p1[0], currentData.p1[1], currentData.p1[2]]
    });

    makeBoundingLine(currentData.p0, currentData.p1, this.scope.boundingLines);
  }

  meshInstance.addInstanceUsingTransform(instModel);

  mat4.fromTranslation(transform,  vec3.fromValues(0, travelDistance, 0));
  this.turtle.applyTransform(transform);
}

function drawBranchLeaf2() {
  if (this.depth < 3) {
    return;
  }

  let transform = mat4.create();
  let transformX = mat4.create();
  let transformZ = mat4.create();

  let instModel = mat4.create();
  let offset = mat4.create();
  let meshScale = mat4.create();

  let baseScale = 0.3;

  mat4.fromZRotation(transformZ, degreeToRad(33));
  mat4.fromScaling(meshScale, vec3.fromValues(baseScale, baseScale, baseScale));

  mat4.multiply(transform, transform, transformZ);
  mat4.multiply(transform, transform, meshScale);
  mat4.multiply(instModel, this.turtle.transform, transform);

  let localOrigin = vec4.fromValues(0.0, 0.0, 0.0, 1);
  let localMidPoint = vec4.fromValues(0.0, -1.0, 0.0, 1);
  let worldOrigin = vec4.create();
  let worldMidPoint = vec4.create();
  vec4.transformMat4(worldOrigin, vec4.fromValues(0.0, 0.0, 0.0, 1), instModel);
  vec4.transformMat4(worldMidPoint, localMidPoint, instModel);

  if (worldOrigin[1] < 1.0) {
    return;
  }

  let val = worldOrigin[1] / 5.0;
  if (val > 1.0) {
    val = 1.0;
  }

  // if (this.scope.influencers.collisionCheck) {
  //   var nearest = leavesTree.nearest({
  //     coordinates: [worldMidPoint[0], worldMidPoint[1], worldMidPoint[3]]
  //   }, 20);

  //   for (var j = 0; j < nearest.length; ++j) {
  //     let obj = nearest[j][0];
  //     let coords = obj.coordinates;

  //     let dist = distance({coordinates: worldMidPoint}, obj);

  //     if (dist < 1) {
  //       return;
  //     }
  //   }
  // }

  let leafInstances = this.scope.leafInstances;

  let noise = this.noiseGen.perlin3(this.turtle.position[0] * 23, this.turtle.position[1] * 23, this.turtle.position[2] * 23);

  let idx = Math.floor((leafInstances.length - 1) * (noise + 1.0) / 2.0);
  let meshInstance = leafInstances[idx];

  let itr = this.itr;
  let str = this.rootString;
  let len = str.length;

  let depth = this.depth;
  let hasLeaf = false;
  let useLast = false;

  let lastDepth = this.depth;

  for (var i = itr + 1; i < len; ++i) {
    if (str[i] == "[") {
      depth++;
      hasLeaf = false;
    }
    else if (str[i] == "l") {
      if (depth > lastDepth) {
        lastDepth = depth;
        break;
      }

    }
    else if (str[i] == "]") {
      depth--;
    }

    if (depth <= 0) {
      break;
    }
  }

  useLast = lastDepth <= this.depth;

  if (useLast) {
    meshInstance = leafInstances[leafInstances.length - 1];
  }

  // leavesTree.insert({
  //   type: "leaf",
  //   coordinates: [worldMidPoint[0], worldMidPoint[1], worldMidPoint[2]]
  // });

  meshInstance.addInstanceUsingTransform(instModel);
}

function natureTick() {
  let worldMid = vec4.create();
  let worldOrigin = vec4.create();
  let worldHead = vec4.create();

  let localMid = vec4.fromValues(0.0, 0.5, 0.0, 1);
  let localHead = vec4.fromValues(0.0, 0.0, 0.0, 1);
  vec4.transformMat4(worldMid, localMid, this.turtle.transform);
  vec4.transformMat4(worldOrigin, vec4.fromValues(0.0, 0.0, 0.0, 1), this.turtle.transform);

  let worldOriginVec3 = vec3.fromValues(worldOrigin[0], worldOrigin[1], worldOrigin[2]);
  let worldHeadVec3 = vec3.create();
  vec4.sub(worldHead, worldMid, worldOrigin);
  worldHeadVec3 = vec3.fromValues(worldHead[0], worldHead[1], worldHead[2]);
  vec3.normalize(worldHeadVec3, worldHeadVec3);

  let transform = mat4.create();
  let sunTransform = mat4.create();

  let planeNormal = vec3.create();
  vec3.cross(planeNormal, worldHeadVec3, this.scope.sunlightDir);
  vec3.normalize(planeNormal, planeNormal);

  mat4.fromRotation(sunTransform, degreeToRad(10) * this.scope.influencers.sunlight, planeNormal);

  let gravityTransform = mat4.create();
  let gravityFactor = this.depth;

  planeNormal = vec3.create();
  vec3.cross(planeNormal, worldHeadVec3, vec3.fromValues(0,-1,0));
  vec3.normalize(planeNormal, planeNormal);

  mat4.fromRotation(gravityTransform, degreeToRad(20) * gravityFactor * this.scope.influencers.gravity, planeNormal);

  mat4.multiply(transform, gravityTransform, sunTransform);

  this.turtle.applyTransform(transform);
}

function rotateTurtleCW() {
  let noise = this.noiseGen.perlin3(this.turtle.position[0], this.turtle.position[1], this.turtle.position[2]);

  let angleDetla = 5.0 * (noise - 0.5) * 2.0;

  let transform = mat4.create();
  mat4.fromYRotation(transform, degreeToRad(-45 + angleDetla));
  this.turtle.applyTransform(transform);
}

function rotateTurtleCCW() {
  let noise = this.noiseGen.perlin3(this.turtle.position[0], this.turtle.position[1], this.turtle.position[2]);

  let angleDetla = 5.0 * (noise - 0.5) * 2.0;

  let transform = mat4.create();
  mat4.fromYRotation(transform, degreeToRad(45 + angleDetla));
  this.turtle.applyTransform(transform);
}

function rotateTiltCW() {
  let noise = this.noiseGen.perlin3(this.turtle.position[0], this.turtle.position[1], this.turtle.position[2]);

  let angleDetla = 5.0 * (noise - 0.5) * 2.0;

  let transform = mat4.create();
  mat4.fromZRotation(transform, degreeToRad(-20 + angleDetla));
  this.turtle.applyTransform(transform);
}

function rotateTiltCCW() {
  let noise = this.noiseGen.perlin3(this.turtle.position[0], this.turtle.position[1], this.turtle.position[2]);

  let angleDetla = 5.0 * (noise - 0.5) * 2.0;

  let transform = mat4.create();
  mat4.fromZRotation(transform, degreeToRad(20 + angleDetla));
  this.turtle.applyTransform(transform);
}

class LSystem1 {
  system: LSystem;
  scope: any;
  instanceMap: { [instance: string]: MeshInstanced; } = { };

  constructor(seed: number) {
    this.system = new LSystem(seed);
    this.system.setAxiom("[F][/-F][*+F][++*F][--*F]");
    // this.system.addRule("F", "F");
    // this.system.addRule("F", "F[/F]F[*F]F");
    // this.system.addRule("F", "F[/F]F[*F]F");
    
    this.system.addWeightedRule("F", "BS++[/BFS][*BFS]++[/BFS][*BbFS]", 0.5);
    this.system.addWeightedRule("F", "BS++[/BFS][*BFS]", 0.3);
    // this.system.addWeightedRule("F", "FBS--[/BF1S][*BF1S]", 0.4);
    // this.system.addWeightedRule("F", "FBS--[/BF1S][*BF1S]", 0.4);
    // this.system.addWeightedRule("F", "BS", 0.2);
    this.system.addWeightedRule("B", "SD[l]SD", 0.2);
    // this.system.addWeightedRule("B", "DD", 0.8);
    // this.system.addWeightedRule("F", "--FSFS[/-FS++FS++F1S][*+FS-FS-FS]", 0.8);
    // this.system.addWeightedRule("F", "++FSFS[/-FS++FS++F1S][*+FS-FS-FS]", 0.4);
    
    // this.system.addRule("X", "F-[[X]+X]+F[+FX]-X");
    // this.system.addRule("F", "FF");


    this.system.addSymbol("l", drawBranchLeaf2, []);
    this.system.addSymbol("b", drawBranchLeaf2, []);
    this.system.addSymbol("D", drawBranchLarge, []);
    this.system.addSymbol("S", natureTick, []);
    this.system.addSymbol("-", rotateTurtleCCW, []);
    this.system.addSymbol("+", rotateTurtleCW, []);
    this.system.addSymbol("/", rotateTiltCW, []);
    this.system.addSymbol("*", rotateTiltCCW, []);

    let sunlightDir = vec3.create();
    vec3.normalize(sunlightDir, vec3.fromValues(20, 20, 20));

    this.scope = {
      instanceMap: this.instanceMap,
      sunlightDir: sunlightDir,
      collisionCount: 0,

      influencers: {
        sunlight: 0.0,
        gravity: 0.1,
        collisionCheck: true
      }
    };
  }

  addScope(key: string, val:any) {
    this.scope[key] = val;
  }

  addInstance(key: string, inst: MeshInstanced) {
    this.instanceMap[key] = inst;
  }

  construct(itr: number) {
    this.system.construct(itr);
    this.system.process(this.scope);

    systemError(`Found Collisions: ${this.scope.collisionCount}`);
  }
}

export default LSystem1;