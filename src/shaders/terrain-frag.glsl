#version 300 es

precision highp float;

uniform vec4 u_Eye;
uniform sampler2D u_Texture;
uniform sampler2D u_Texture1;
uniform sampler2D u_Texture2;
uniform sampler2D u_Texture3;

in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_SphereNor;
in vec4 fs_Pos;
in float fs_Spec;
in float fs_Valid;
in float fs_useMatcap;

out vec4 out_Col;

void main() {

  vec4 diffuseColor = fs_Col;
  float alpha = diffuseColor.a;
  vec3 lightColor = vec3(1.84,1.27,0.99);

  float dist = length(fs_LightVec);

  float ambientTerm = 0.1;

  float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
  diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

  vec4 finalColor = vec4(diffuseColor.rgb * lightColor * diffuseTerm, alpha);
  finalColor.x = clamp(finalColor.x, 0.0, 1.0);
  finalColor.y = clamp(finalColor.y, 0.0, 1.0);
  finalColor.z = clamp(finalColor.z, 0.0, 1.0);

  out_Col = finalColor;
}
