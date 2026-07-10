// Particle Vertex Shader
// Movimiento de partículas completamente en GPU para máximo rendimiento

uniform float uTime;
uniform float uPixelRatio;
uniform vec3 uCameraPosition;

// Atributos instanciados - cada partícula tiene su propia información
attribute vec3 aOffset;      // Posición inicial de la partícula
attribute float aScale;      // Escala individual
attribute float aSpeed;      // Velocidad individual
attribute float aPhase;      // Fase offset para variación

varying float vAlpha;
varying float vDistanceToCamera;

void main() {
  // Animación procedural por partícula
  float t = uTime * aSpeed + aPhase;

  // Movimiento vertical flotante (como partículas de polvo en luz)
  vec3 pos = aOffset;
  pos.y += sin(t * 0.8) * 0.5;
  pos.x += sin(t * 0.3 + aPhase * 2.0) * 0.3;
  pos.z += cos(t * 0.4 + aPhase * 1.5) * 0.3;

  // Reposición suave cuando la partícula sube demasiado
  pos.y = mod(pos.y + 5.0, 12.0) - 5.0;

  // Calcular distancia a la cámara para la escala
  float dist = length(pos - uCameraPosition);
  vDistanceToCamera = dist;

  // Escala basada en distancia (perspectiva)
  float size = aScale * uPixelRatio * (80.0 / max(dist, 1.0));
  size = clamp(size, 0.5, 12.0);

  // Alpha: las partículas cercanas son más opacas, las lejanas se desvanecen
  vAlpha = smoothstep(40.0, 5.0, dist) * 0.6;
  vAlpha *= 0.5 + 0.5 * sin(t * 2.0); // Pulso sutil

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size;
}
