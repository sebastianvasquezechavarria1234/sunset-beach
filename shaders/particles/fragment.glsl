// Particle Fragment Shader
// Círculos suaves con fade para aspecto de polvo luminoso

varying float vAlpha;
varying float vDistanceToCamera;

void main() {
  // Coordenadas del punto relativas al centro
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Descartar píxeles fuera del círculo
  if (dist > 0.5) discard;

  // Suavizar el borde (anti-aliasing del punto)
  float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
  alpha *= vAlpha;

  // Color cálido como partículas de luz de atardecer
  vec3 color = mix(
    vec3(1.0, 0.9, 0.7),  // Dorado cálido
    vec3(1.0, 0.6, 0.3),  // Naranja
    dist * 2.0
  );

  // Añadir brillo central
  float glow = exp(-dist * 6.0) * 0.5;
  color += glow;

  gl_FragColor = vec4(color, alpha);
}
