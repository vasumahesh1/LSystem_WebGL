import { vec4, mat4 } from 'gl-matrix';
import Drawable from './Drawable';
import { gl } from '../../globals';

// let slotArray = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3, gl.TEXTURE4];
const glMap: { [key: number]: string } = {
    0: "TEXTURE0",
    1: 'TEXTURE1'
};


export class Texture {
  texture: WebGLTexture;

  /*----------  Code Taken from MDN  ----------*/
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
  // Based on the code, the Image Load is async. I haven't added a Callback or Promise.
  // Could lead to errors, but since the first scene is the cube scene. While the cube scene loads, the image gets downloaded (locally from the local server)
  constructor(url: string) {
    this.texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    var textureRef = this.texture;

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      width, height, border, srcFormat, srcType,
      pixel);

    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, textureRef);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        srcFormat, srcType, image);

      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // No, it's not a power of 2. Turn of mips and set
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    };

    image.src = url;
  }

  /**
   * @brief      Bind Texture
   *
   * @memberof   Texture
   *
   */
  bind(slot: number) {
    let slotType;

    switch (slot) {
      case 1:
        slotType = gl.TEXTURE1;
        break;

      case 2:
        slotType = gl.TEXTURE2;
        break;

      case 3:
        slotType = gl.TEXTURE3;
        break;

      case 4:
        slotType = gl.TEXTURE4;
        break;

      default:
        slotType = gl.TEXTURE0;
        break;
    }

    gl.activeTexture(slotType);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }
}

function isPowerOf2(value: number) {
  return (value & (value - 1)) == 0;
}

export default Texture;