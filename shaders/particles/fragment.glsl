// Particle Fragment Shader - Luciérnagas brillantes con glow suave
varying float vAlpha;
varying vec3 vColor;
varying float vGlow;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  if (dist > 0.5) discard;

  // Core brillante
  float core = exp(-dist * 12.0);

  // Halo exterior suave
  float halo = exp(-dist * 4.0) * 0.4;

  // Combinar
  float brightness = core + halo;
  brightness *= vAlpha;

  // Color con glow
  vec3 color = vColor * brightness;
  color += vColor * vGlow * core * 0.5; // Brillo extra en el pulso

  gl_FragColor = vec4(color, brightness * 0.9);
}
