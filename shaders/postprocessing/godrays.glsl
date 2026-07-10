// God Rays / Light Shafts - Screen-space effect
// Simula rayos de luz volumétricos desde la posición del sol

uniform sampler2D tDiffuse;
uniform vec2 uLightPosition;  // Posición del sol en screen space (NDC)
uniform float uExposure;
uniform float uDecay;
uniform float uDensity;
uniform float uWeight;

varying vec2 vUv;

void main() {
  vec2 texCoord = vUv;

  // Dirección desde cada pixel hacia el sol
  vec2 deltaTextCoord = texCoord - uLightPosition;
  deltaTextCoord *= 1.0 / 60.0 * uDensity;

  vec4 color = texture2D(tDiffuse, texCoord);
  float illumination = 1.0;

  // Samplear a lo largo de la dirección hacia el sol
  vec4 accum = vec4(0.0);
  for (int i = 0; i < 60; i++) {
    texCoord -= deltaTextCoord;
    vec4 sample = texture2D(tDiffuse, texCoord);

    // Atenuar cada sample
    sample *= illumination * uWeight;
    accum += sample;
    illumination *= uDecay;
  }

  accum *= uExposure;

  gl_FragColor = color + accum * 0.15;
}
