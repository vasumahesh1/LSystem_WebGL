import { vec4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';
function concatFloat32Array(first, second) {
    var firstLength = first.length;
    var secondLength = second.length;
    var result = new Float32Array(firstLength + secondLength);
    result.set(first);
    result.set(second, firstLength);
    return result;
}
function concatUint32Array(first, second) {
    var firstLength = first.length;
    var secondLength = second.length;
    var result = new Uint32Array(firstLength + secondLength);
    result.set(first);
    result.set(second, firstLength);
    return result;
}
class Cube extends Drawable {
    constructor(center) {
        super(); // Call the constructor of the super class. This is required.
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
        this.instanced = false;
    }
    create() {
        this.positions = new Float32Array([]);
        this.indices = new Uint32Array([]);
        this.normals = new Float32Array([]);
        /*----------  Front Face  ----------*/
        this.positions = concatFloat32Array(this.positions, new Float32Array([
            -1, -1, 1, 1,
            1, -1, 1, 1,
            1, 1, 1, 1,
            -1, 1, 1, 1
        ]));
        this.indices = concatUint32Array(this.indices, new Uint32Array([
            0, 1, 2,
            0, 2, 3
        ]));
        this.normals = concatFloat32Array(this.normals, new Float32Array([
            0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0
        ]));
        /*----------  Back Face  ----------*/
        this.positions = concatFloat32Array(this.positions, new Float32Array([
            -1, -1, -1, 1,
            1, -1, -1, 1,
            1, 1, -1, 1,
            -1, 1, -1, 1
        ]));
        this.indices = concatUint32Array(this.indices, new Uint32Array([
            4, 5, 6,
            4, 6, 7
        ]));
        this.normals = concatFloat32Array(this.normals, new Float32Array([
            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0
        ]));
        /*----------  Right Face  ----------*/
        this.positions = concatFloat32Array(this.positions, new Float32Array([
            1, 1, 1, 1,
            1, -1, 1, 1,
            1, -1, -1, 1,
            1, 1, -1, 1
        ]));
        this.indices = concatUint32Array(this.indices, new Uint32Array([
            8, 9, 10,
            8, 10, 11
        ]));
        this.normals = concatFloat32Array(this.normals, new Float32Array([
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0
        ]));
        /*----------  Left Face  ----------*/
        this.positions = concatFloat32Array(this.positions, new Float32Array([
            -1, 1, 1, 1,
            -1, -1, 1, 1,
            -1, -1, -1, 1,
            -1, 1, -1, 1
        ]));
        this.indices = concatUint32Array(this.indices, new Uint32Array([
            12, 13, 14,
            12, 14, 15
        ]));
        this.normals = concatFloat32Array(this.normals, new Float32Array([
            -1, 0, 0, 0,
            -1, 0, 0, 0,
            -1, 0, 0, 0,
            -1, 0, 0, 0
        ]));
        /*----------  Top Face  ----------*/
        this.positions = concatFloat32Array(this.positions, new Float32Array([
            1, 1, 1, 1,
            1, 1, -1, 1,
            -1, 1, -1, 1,
            -1, 1, 1, 1
        ]));
        this.indices = concatUint32Array(this.indices, new Uint32Array([
            16, 17, 18,
            16, 18, 19
        ]));
        this.normals = concatFloat32Array(this.normals, new Float32Array([
            0, 1, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0
        ]));
        /*----------  Bottom Face  ----------*/
        this.positions = concatFloat32Array(this.positions, new Float32Array([
            1, -1, 1, 1,
            1, -1, -1, 1,
            -1, -1, -1, 1,
            -1, -1, 1, 1
        ]));
        this.indices = concatUint32Array(this.indices, new Uint32Array([
            20, 21, 22,
            20, 22, 23
        ]));
        this.normals = concatFloat32Array(this.normals, new Float32Array([
            0, -1, 0, 0,
            0, -1, 0, 0,
            0, -1, 0, 0,
            0, -1, 0, 0
        ]));
        this.generateIdx();
        this.generateVert();
        this.generateNor();
        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVert);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
        console.log(`Created Cube`);
    }
}
;
export default Cube;
//# sourceMappingURL=Cube.js.map