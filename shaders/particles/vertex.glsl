// Particle Vertex Shader - Partículas de luciérnaga/magia
// Movimiento completamente en GPU, reaccionan a la cámara

uniform float uTime;
uniform float uPixelRatio;
uniform vec3 uCameraPosition;

attribute vec3 aOffset;
attribute float aScale;
attribute float aSpeed;
attribute float aPhase;
attribute vec3 aColor;

varying float vAlpha;
varying vec3 vColor;
varying float vGlow;

void main() {
  float t = uTime * aSpeed + aPhase;

  // Movimiento orgánico tipo luciérnaga
  vec3 pos = aOffset;

  // Flotar vertical con ciclo lento
  pos.y += sin(t * 0.5) * 1.5 + sin(t * 0.13) * 0.8;

  // Movimiento lateral errático
  pos.x += sin(t * 0.7 + aPhase * 3.0) * 0.8 + sin(t * 1.9) * 0.3;
  pos.z += cos(t * 0.6 + aPhase * 2.5) * 0.8 + cos(t * 1.7) * 0.3;

  // Reposición suave cuando se alejan mucho
  pos.y = mod(pos.y + 6.0, 14.0) - 6.0;

  // Distancia a cámara
  float dist = length(pos - uCameraPosition);
  vAlpha = smoothstep(35.0, 3.0, dist);

  // Pulso de brillo (como luciérnaga)
  float pulse = sin(t * 3.0 + aPhase * 5.0) * 0.5 + 0.5;
  pulse = pow(pulse, 3.0); // Hacer los pulsos más pronunciados
  vAlpha *= 0.2 + pulse * 0.8;

  // Escala con distancia
  float size = aScale * uPixelRatio * (60.0 / max(dist, 1.0));
  size = clamp(size, 0.3, 15.0);

  vColor = aColor;
  vGlow = pulse;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size;
}
