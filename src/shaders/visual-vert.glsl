#version 300 es

#define MAX_INSTANCES 200

/*----------  Shader Uniforms  ----------*/
uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform int u_Time;
uniform vec4 u_Eye;

uniform mat4 u_InstanceModel[MAX_INSTANCES];

/*----------  Shader UI Controls  ----------*/
uniform vec3 u_ControlsWaterBedrock1Color;
uniform vec3 u_ControlsWaterBedrock2Color;
uniform vec3 u_ControlsSandColor;
uniform float u_ControlsWaterLevel;
uniform float u_ControlsShoreLevel;
uniform float u_ControlsElevation;
uniform float u_ControlsNoiseScale;

/*----------  Shader Inputs  ----------*/
in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

/*----------  Shader Outputs  ----------*/
out vec4 fs_Col;



void main() {
  vec4 vertexColor;
  vec4 vertexPosition = vs_Pos;

  fs_Col = vec4(1, 1, 1, 1);

  vec4 modelposition = u_Model * vertexPosition;

  gl_Position = u_ViewProj * modelposition;
}
