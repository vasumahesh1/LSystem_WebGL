#version 300 es

#define MAX_INSTANCES 200

/*----------  Uniforms  ----------*/
uniform mat4 u_LightSpaceMatrix;
uniform mat4 u_Model;
uniform mat4 u_ViewProj;
uniform mat4 u_InstanceModel[MAX_INSTANCES];

/*----------  Ins  ----------*/
in vec4 vs_Pos;

void main() {
  mat4 instanceModel = u_InstanceModel[gl_InstanceID];
  vec4 modelposition = instanceModel * u_Model * vs_Pos;

  gl_Position = u_LightSpaceMatrix * modelposition;
}
