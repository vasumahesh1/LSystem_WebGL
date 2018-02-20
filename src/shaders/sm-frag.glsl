#version 300 es

precision highp float;

out vec4 out_Col;

void main(){
  out_Col = vec4(gl_FragCoord.z, 0, 0, 1);
}