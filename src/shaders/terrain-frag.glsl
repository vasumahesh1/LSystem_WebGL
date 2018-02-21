#version 300 es

precision highp float;

uniform vec4 u_Eye;
uniform sampler2D u_ShadowTexture;
uniform vec3 u_LightPos;
uniform vec4 u_Color;

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

// Uncharted 2 Tonemapping made by John Hable, filmicworlds.com
vec3 uc2Tonemap(vec3 x)
{
   return ((x*(0.15*x+0.1*0.5)+0.2*0.02)/(x*(0.15*x+0.5)+0.2*0.3))-0.02/0.3;
}

vec3 tonemap(vec3 x, float exposure, float invGamma, float whiteBalance) {
    vec3 white = vec3(whiteBalance);
    vec3 color = uc2Tonemap(exposure * x);
    vec3 whitemap = 1.0 / uc2Tonemap(white);
    color *= whitemap;
    return pow(color, vec3(invGamma));
}

void main() {

  float bias = 0.005;
  float fragmentVisibility = 1.0;

  vec3 mask = vec3(1.0) - vec3(texture(u_ShadowTexture, fs_ShadowCoord.xy).r);
  // return;

  // if (texture(u_ShadowTexture, fs_ShadowCoord.xy).r > 0.5) {
  //     fragmentVisibility = 0.0;
  // }

  vec4 diffuseColor = vec4(242, 226, 207, 255.0) / 255.0;
  float alpha = diffuseColor.a;
  vec3 lightColor = vec3(1.84,1.27,0.99);

  float dist = length(fs_LightVec);

  float ambientTerm = 0.1;

  float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
  diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

  float attn = 1.0;

  float s = 128.0;
  float kSpot = pow(max(dot(normalize(vec3(-fs_LightVec)), normalize(-u_LightPos)), 0.0), s);

  // float lightIntensity = kSpot * (ambientTerm + (diffuseTerm / attn));
  // vec4 finalColor = vec4(diffuseColor.rgb * lightColor * mask.rgb * lightIntensity * fragmentVisibility, alpha);

  vec3 fragColor = lightColor * kSpot * mask * (ambientTerm + (diffuseTerm * diffuseColor.rgb));

  float whiteBalance = 9.2;
  float exposure = 10.0;
  float invGamma = 1.0 / 0.4;

  fragColor = tonemap(fragColor , exposure, invGamma, whiteBalance);

  vec4 finalColor = vec4(fragColor, alpha);

  out_Col = finalColor;
}
