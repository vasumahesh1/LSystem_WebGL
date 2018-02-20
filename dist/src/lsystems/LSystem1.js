import { LSystem } from '../core/lsystem/LSystem';
import { vec3, mat4, vec4 } from 'gl-matrix';
var kdTree = require('k-d-tree');
var boxIntersect = require('box-intersect');
var Logger = require('debug');
var systemTrace = Logger("lsystem1:info:transform");
var systemError = Logger("lsystem1:error:transform");
let branch1BoundingBox = [
    vec4.fromValues(-0.3, 0.2, -0.3, 1),
    vec4.fromValues(0.3, 0.8, 0.3, 1)
];
var distance = function (a, b) {
    return Math.pow(a.coordinates[0] - b.coordinates[0], 2) + Math.pow(a.coordinates[1] - b.coordinates[1], 2) + Math.pow(a.coordinates[2] - b.coordinates[2], 2);
};
var boundingBoxes = [];
var objectsTree = new kdTree([], distance);
// Tree Data:
//
// {
//   idx: 1,
//   type: "leaf|branch",
//   coordinates: [0, 0, 0]
// }
function coordinateSystem(v1) {
    let v2 = vec3.create();
    let v3 = vec3.create();
    if (Math.abs(v1[0]) > Math.abs(v1[1])) {
        vec3.scale(v2, vec3.fromValues(-v1[2], 0, v1[0]), 1.0 / Math.sqrt(v1[0] * v1[0] + v1[2] * v1[2]));
    }
    else {
        vec3.scale(v2, vec3.fromValues(0, v1[2], -v1[1]), 1.0 / Math.sqrt(v1[1] * v1[1] + v1[2] * v1[2]));
    }
    vec3.cross(v3, v1, v2);
    return [v1, v2, v3];
}
function degreeToRad(deg) {
    return deg * 0.0174533;
}
function makeBoundingBox(min, max, mesh) {
    // bot
    mesh.linesArray.push(vec4.fromValues(min[0], min[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], min[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(min[0], min[1], max[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], min[1], max[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(min[0], min[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(min[0], min[1], max[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], min[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], min[1], max[2], 1.0));
    // Top
    mesh.linesArray.push(vec4.fromValues(min[0], max[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], max[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(min[0], max[1], max[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], max[1], max[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(min[0], max[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(min[0], max[1], max[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], max[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], max[1], max[2], 1.0));
    // Sides
    mesh.linesArray.push(vec4.fromValues(min[0], min[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(min[0], max[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], min[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], max[1], min[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], min[1], max[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(max[0], max[1], max[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(min[0], min[1], max[2], 1.0));
    mesh.linesArray.push(vec4.fromValues(min[0], max[1], max[2], 1.0));
}
function drawBranchLarge() {
    let transform = mat4.create();
    let meshInstance = this.scope.instanceMap["branch"];
    let turtlePos = this.turtle.position;
    let travelDistance = 2.0; // / this.depth;
    let localMid = vec4.fromValues(0.0, 0.5, 0.0, 1);
    let worldMid = vec4.create();
    let branchBoundingMin = vec4.create();
    let branchBoundingMax = vec4.create();
    let test = mat4.create();
    vec4.transformMat4(worldMid, localMid, this.turtle.transform);
    let instModel = mat4.create();
    let branchScale = mat4.create();
    let branchOffset = mat4.create();
    mat4.fromScaling(branchScale, vec3.fromValues(0.75, travelDistance, 0.75));
    // mat4.fromTranslation(branchScale, vec3.fromValues(0, -travelDistance / 2.0, 0.0));
    mat4.multiply(instModel, this.turtle.transform, branchScale);
    // instModel = this.turtle.transform;
    let instCopy = mat4.create();
    mat4.copy(instCopy, instModel);
    console.log("Drawing Instance at: ", instCopy);
    var nearest = objectsTree.nearest({
        coordinates: [worldMid[0], worldMid[1], worldMid[3]]
    }, 5);
    let axes = coordinateSystem(vec3.fromValues(this.turtle.heading[0], this.turtle.heading[1], this.turtle.heading[2]));
    let xCopy = vec3.create();
    let yCopy = vec3.create();
    let zCopy = vec3.create();
    let maxAxes = vec3.create();
    console.log("Bounding Box Axes: ", axes, this.turtle.heading);
    vec3.copy(xCopy, axes[1]);
    vec3.copy(yCopy, axes[0]);
    vec3.copy(zCopy, axes[2]);
    let boxMin = vec3.create();
    vec3.scale(xCopy, xCopy, -0.3);
    vec3.scale(yCopy, yCopy, 0.2);
    vec3.scale(zCopy, zCopy, -0.3);
    vec3.add(boxMin, xCopy, yCopy);
    vec3.add(boxMin, boxMin, zCopy);
    vec3.copy(xCopy, axes[2]);
    vec3.copy(yCopy, axes[0]);
    vec3.copy(zCopy, axes[1]);
    let boxMax = vec3.create();
    vec3.scale(xCopy, xCopy, 0.3);
    vec3.scale(yCopy, yCopy, 0.8);
    vec3.scale(zCopy, zCopy, 0.3);
    vec3.add(boxMax, xCopy, yCopy);
    vec3.add(boxMax, boxMax, zCopy);
    let tempSwap = vec3.create();
    vec3.copy(tempSwap, boxMax);
    boxMax[0] =
        branch1BoundingBox[0] = vec4.fromValues(boxMin[0], boxMin[1], boxMin[2], 1);
    branch1BoundingBox[1] = vec4.fromValues(boxMax[0], boxMax[1], boxMax[2], 1);
    console.log("Bounding Box Default: ", branch1BoundingBox[0]);
    console.log("Bounding Box Default: ", branch1BoundingBox[1]);
    let translationComponent = vec3.create();
    mat4.getTranslation(translationComponent, instModel);
    let instTranslationOnly = mat4.create();
    mat4.fromTranslation(instTranslationOnly, translationComponent);
    mat4.multiply(instTranslationOnly, instTranslationOnly, branchScale);
    vec4.transformMat4(branchBoundingMin, branch1BoundingBox[0], instTranslationOnly);
    vec4.transformMat4(branchBoundingMax, branch1BoundingBox[1], instTranslationOnly);
    test = mat4.create();
    mat4.copy(test, this.turtle.transform);
    console.log("Transformed Bounding: ", branchBoundingMin);
    console.log("Transformed Bounding: ", branchBoundingMax);
    console.log("Turtle Model: ", test);
    let boundingBoxData = [
        branchBoundingMin[0], branchBoundingMin[1], branchBoundingMin[2],
        branchBoundingMax[0], branchBoundingMax[1], branchBoundingMax[2]
    ];
    for (var itr = 0; itr < nearest.length; ++itr) {
        let obj = nearest[itr][0];
        let val = boundingBoxes[obj.idx];
        if (!val) {
            systemError("Error kdTree has data but Bounding Boxes doesn't");
            continue;
        }
        let result = boxIntersect([val], [boundingBoxData]).length > 0;
        if (result) {
            // We Collide;
            return;
        }
    }
    boundingBoxes.push(boundingBoxData);
    objectsTree.insert({
        idx: boundingBoxes.length - 1,
        type: "branch",
        coordinates: [worldMid[0], worldMid[1], worldMid[2]]
    });
    makeBoundingBox(branchBoundingMin, branchBoundingMax, this.scope.boundingLines);
    meshInstance.addInstanceUsingTransform(instModel);
    mat4.fromTranslation(transform, vec3.fromValues(0, travelDistance, 0));
    this.turtle.applyTransform(transform);
}
function drawLeaf1() {
    let transform = mat4.create();
    let meshInstance = this.scope.instanceMap["leaf1"];
    systemTrace("Making leaf");
    let currentUp = this.turtle.heading; // vec4.create();
    // vec4.transformMat4(currentUp, vec4.fromValues(1, 0, 0, 0), this.turtle.transform);
    let instModel = mat4.create();
    let offset = mat4.create();
    let meshScale = mat4.create();
    let currentUpVec3 = vec3.fromValues(0.5, 0, 0);
    // vec3.scale(currentUpVec3, currentUpVec3, 10.0);
    mat4.fromTranslation(offset, currentUpVec3);
    mat4.fromScaling(meshScale, vec3.fromValues(1.0, 1, 1.0));
    mat4.multiply(instModel, this.turtle.transform, offset);
    mat4.multiply(instModel, instModel, meshScale);
    meshInstance.addInstanceUsingTransform(instModel);
}
function natureTick() {
    let transform = mat4.create();
    let sunTransform = mat4.create();
    mat4.fromRotation(sunTransform, degreeToRad(-20) * this.scope.influencers.sunlight, this.scope.sunlightDir);
    let gravityTransform = mat4.create();
    let gravityFactor = this.depth / 2.0;
    mat4.fromRotation(gravityTransform, degreeToRad(-10) * gravityFactor * this.scope.influencers.gravity, vec3.fromValues(1, 0, 0));
    mat4.multiply(transform, gravityTransform, sunTransform);
    this.turtle.applyTransform(gravityTransform);
}
function rotateTurtleCW() {
    let transform = mat4.create();
    mat4.fromYRotation(transform, degreeToRad(-45));
    this.turtle.applyTransform(transform);
}
function rotateTurtleCCW() {
    let transform = mat4.create();
    mat4.fromYRotation(transform, degreeToRad(45));
    this.turtle.applyTransform(transform);
}
function rotateTiltCW() {
    let noise = this.noiseGen.perlin3(this.turtle.position[0], this.turtle.position[1], this.turtle.position[2]);
    let angleDetla = 10.0 * (noise - 0.5) * 2.0;
    let transform = mat4.create();
    mat4.fromZRotation(transform, degreeToRad(-30));
    this.turtle.applyTransform(transform);
}
function rotateTiltCCW() {
    let noise = this.noiseGen.perlin3(this.turtle.position[0], this.turtle.position[1], this.turtle.position[2]);
    let angleDetla = 10.0 * (noise - 0.5) * 2.0;
    let transform = mat4.create();
    mat4.fromZRotation(transform, degreeToRad(30));
    this.turtle.applyTransform(transform);
}
class LSystem1 {
    constructor(seed) {
        this.instanceMap = {};
        this.system = new LSystem(seed);
        this.system.setAxiom("F");
        // this.system.addRule("F", "FFF");
        // this.system.addRule("F", "F[/F]F[*F]F");
        this.system.addRule("F", "F[/F]");
        // this.system.addWeightedRule("F", "+FSFS[/-FS++FS++F1S][*+FS-FS-FS]", 0.5);
        // this.system.addWeightedRule("F", "--FSFS[/-FS++FS++F1S][*+FS-FS-FS]", 0.8);
        // this.system.addWeightedRule("F", "++FSFS[/-FS++FS++F1S][*+FS-FS-FS]", 0.4);
        // this.system.addRule("X", "F-[[X]+X]+F[+FX]-X");
        // this.system.addRule("F", "FF");
        this.system.addSymbol("1", drawLeaf1);
        this.system.addSymbol("F", drawBranchLarge);
        this.system.addSymbol("S", natureTick);
        this.system.addSymbol("-", rotateTurtleCCW);
        this.system.addSymbol("+", rotateTurtleCW);
        this.system.addSymbol("/", rotateTiltCW);
        this.system.addSymbol("*", rotateTiltCCW);
        this.system.addSymbol("[", function () {
            this.opSaveState();
            this.depth++;
        });
        this.system.addSymbol("]", function () {
            this.opRestoreState();
            this.depth--;
        });
        let sunlightDir = vec3.create();
        vec3.normalize(sunlightDir, vec3.fromValues(2, 2, 0));
        this.scope = {
            instanceMap: this.instanceMap,
            sunlightDir: sunlightDir,
            influencers: {
                sunlight: 0.0,
                gravity: 0.0
            }
        };
    }
    addScope(key, val) {
        this.scope[key] = val;
        // makeBoundingBox(vec4.fromValues(-1.0, 0.1, -1.0, 1), vec4.fromValues(1.0, 1.9, 1.0, 1), this.scope.boundingLines);
        let start = vec4.fromValues(2.0, 2.0, 2.0, 0);
        let end = vec4.fromValues(4.0, 4.0, 4.0, 0);
        vec4.sub(start, start, vec4.fromValues(2, 3, 2, 0));
        vec4.sub(end, end, vec4.fromValues(2, 3, 2, 0));
        let fuk = mat4.create();
        mat4.fromRotation(fuk, degreeToRad(45), vec3.fromValues(0, 1, 0));
        vec4.transformMat4(start, start, fuk);
        vec4.transformMat4(end, end, fuk);
        vec4.add(start, start, vec4.fromValues(2, 3, 2, 0));
        vec4.add(end, end, vec4.fromValues(2, 3, 2, 0));
        makeBoundingBox(start, end, this.scope.boundingLines);
    }
    addInstance(key, inst) {
        this.instanceMap[key] = inst;
    }
    construct(itr) {
        this.system.construct(itr);
        this.system.process(this.scope);
    }
}
export default LSystem1;
//# sourceMappingURL=LSystem1.js.map