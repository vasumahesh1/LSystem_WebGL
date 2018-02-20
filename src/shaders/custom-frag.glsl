#version 300 es

precision highp float;

uniform vec4 u_Eye;
uniform vec4 u_Color;
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

  // Material base color (before shading)
  vec4 diffuseColor = fs_Col;
  float alpha = diffuseColor.a;

  /*----------  Ambient  ----------*/
  float ambientTerm = 0.1;

  /*----------  Lambertian  ----------*/
  float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
  diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

  float specularTerm = 0.0;

  if (diffuseTerm > 0.0 && fs_Spec > 0.0) {
    /*----------  Blinn Phong  ----------*/
    vec4 viewVec = u_Eye - fs_Pos;
    vec4 lightVec = fs_LightVec - fs_Pos;

    vec4 H = normalize((viewVec + lightVec) / 2.0f);
    specularTerm = max(pow(dot(H, normalize(fs_Nor)), fs_Spec), 0.0);
  }

  float lightIntensity =
      ambientTerm + (diffuseTerm + specularTerm);

  vec4 finalColor = vec4(diffuseColor.rgb * lightIntensity, alpha);
  finalColor.x = clamp(finalColor.x, 0.0, 1.0);
  finalColor.y = clamp(finalColor.y, 0.0, 1.0);
  finalColor.z = clamp(finalColor.z, 0.0, 1.0);

  out_Col = finalColor;
}
