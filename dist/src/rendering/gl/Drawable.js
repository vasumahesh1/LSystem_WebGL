import { mat4 } from 'gl-matrix';
import { gl } from '../../globals';
class Drawable {
    constructor() {
        this.count = 0;
        this.instances = 0;
        this.instanced = false;
        this.lines = false;
        this.modelMatrix = mat4.create();
        this.idxBound = false;
        this.vertBound = false;
        this.norBound = false;
        this.instPosBound = false;
    }
    destory() {
        gl.deleteBuffer(this.bufIdx);
        gl.deleteBuffer(this.bufVert);
        gl.deleteBuffer(this.bufNor);
        gl.deleteBuffer(this.bufInstancePosition);
    }
    generateIdx() {
        this.idxBound = true;
        this.bufIdx = gl.createBuffer();
    }
    generateVert() {
        this.vertBound = true;
        this.bufVert = gl.createBuffer();
    }
    generateInstancePos() {
        this.instPosBound = true;
        this.bufInstancePosition = gl.createBuffer();
    }
    generateNor() {
        this.norBound = true;
        this.bufNor = gl.createBuffer();
    }
    bindIdx() {
        if (this.idxBound) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        }
        return this.idxBound;
    }
    bindVert() {
        if (this.vertBound) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVert);
        }
        return this.vertBound;
    }
    bindInstancePos() {
        if (this.instPosBound) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufInstancePosition);
        }
        return this.instPosBound;
    }
    bindNor() {
        if (this.norBound) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        }
        return this.norBound;
    }
    elemCount() {
        return this.count;
    }
    instanceCount() {
        return this.instances;
    }
    drawMode() {
        if (this.lines) {
            return gl.LINES;
        }
        return gl.TRIANGLES;
    }
    isInstanced() {
        return this.instanced;
    }
}
;
export default Drawable;
//# sourceMappingURL=Drawable.js.map