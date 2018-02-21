#version 300 es

precision highp float;

uniform vec4 u_Eye;
uniform vec4 u_Color;
uniform vec3 u_LightPos;
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

  vec3 mask = vec3(1.0) - vec3(texture(u_ShadowTexture, fs_ShadowCoord.xy).r);

  // Material base color (before shading)
  vec4 diffuseColor = fs_Col;
  float alpha = diffuseColor.a;
  vec3 lightColor = vec3(1.0,1.0,1.0);

  /*----------  Ambient  ----------*/
  float ambientTerm = 0.1;

  /*----------  Lambertian  ----------*/
  float diffuseTerm = abs(dot(normalize(fs_Nor), normalize(fs_LightVec)));
  diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

  float specularTerm = 0.0;

  if (diffuseTerm > 0.0) {
    /*----------  Blinn Phong  ----------*/
    vec4 viewVec = u_Eye - fs_Pos;
    vec4 lightVec = vec4(u_LightPos, 0) - fs_Pos;

    vec4 H = normalize((viewVec + lightVec) / 2.0f);
    specularTerm = max(pow(dot(H, normalize(fs_Nor)), 128.0), 0.0);
  }

  // float lightIntensity =
  //     ambientTerm + (diffuseTerm + specularTerm);

  // vec4 finalColor = vec4(diffuseColor.rgb * lightColor * mask * lightIntensity, alpha);
  // finalColor.x = clamp(finalColor.x, 0.0, 1.0);
  // finalColor.y = clamp(finalColor.y, 0.0, 1.0);
  // finalColor.z = clamp(finalColor.z, 0.0, 1.0);

  vec3 fragColor = lightColor * mask * (ambientTerm + (diffuseTerm *diffuseColor.rgb));

  float whiteBalance = 9.2;
  float exposure = 10.0;
  float invGamma = 1.0 / 0.4;

  fragColor = tonemap(fragColor , exposure, invGamma, whiteBalance);

  vec4 finalColor = vec4(fragColor, alpha);

  out_Col = finalColor;
}
