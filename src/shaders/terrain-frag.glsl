#version 300 es

precision highp float;

uniform vec4 u_Eye;
uniform sampler2D u_ShadowTexture;

in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_SphereNor;
in vec4 fs_Pos;
in vec4 fs_ShadowCoord;

in float fs_Spec;
in float fs_Valid;
in float fs_useMatcap;

out vec4 out_Col;

void main() {

  float bias = 0.005;
  float fragmentVisibility = 1.0;

  vec3 mask = vec3(1.0) - vec3(texture(u_ShadowTexture, fs_ShadowCoord.xy).r);
  // return;

  // if (texture(u_ShadowTexture, fs_ShadowCoord.xy).r > 0.5) {
  //     fragmentVisibility = 0.0;
  // }

  vec4 diffuseColor = fs_Col;
  float alpha = diffuseColor.a;
  vec3 lightColor = vec3(1.84,1.27,0.99);

  float dist = length(fs_LightVec);

  float ambientTerm = 0.1;

  float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
  diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

  vec4 finalColor = vec4(diffuseColor.rgb * lightColor * mask.rgb * diffuseTerm * fragmentVisibility, alpha);
  finalColor.x = clamp(finalColor.x, 0.0, 1.0);
  finalColor.y = clamp(finalColor.y, 0.0, 1.0);
  finalColor.z = clamp(finalColor.z, 0.0, 1.0);

  out_Col = finalColor;
}
