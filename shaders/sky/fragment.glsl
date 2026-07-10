// Sky Fragment Shader
// Gradiente procedural de atardecer cinematográfico con sol

uniform float uTime;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uSkyColorTop;
uniform vec3 uSkyColorHorizon;
uniform vec3 uGroundColor;

varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  // Normalizar dirección hacia el pixel del cielo
  vec3 dir = normalize(vWorldPosition - cameraPosition);
  float y = dir.y; // -1 = abajo, 0 = horizonte, 1 = arriba

  // Gradiente del cielo: horizonte cálido → zenith azul oscuro
  vec3 skyColor;
  if (y > 0.0) {
    // Mezclar desde horizonte hasta zenith
    float t = pow(y, 0.4);
    skyColor = mix(uSkyColorHorizon, uSkyColorTop, t);
  } else {
    // Debajo del horizonte: color del suelo
    float t = clamp(-y * 2.0, 0.0, 1.0);
    skyColor = mix(uSkyColorHorizon, uGroundColor, t);
  }

  // Disco solar - brillo intenso en la dirección del sol
  vec3 sunDir = normalize(uSunDirection);
  float sunAngle = acos(clamp(dot(dir, sunDir), -1.0, 1.0));

  // Núcleo del sol
  float sunDisc = smoothstep(0.04, 0.01, sunAngle);
  // Halo exterior más grande y suave
  float sunHalo = smoothstep(0.3, 0.0, sunAngle) * 0.4;
  // Brillo ambiental alrededor del sol
  float sunGlow = smoothstep(0.8, 0.0, sunAngle) * 0.15;

  // Combinar sol con el cielo
  vec3 sunBlend = uSunColor * (sunDisc * 3.0 + sunHalo + sunGlow);
  vec3 finalColor = skyColor + sunBlend;

  // Viñeta sutil en los bordes del cielo (más oscuro lejos del sol)
  float edgeFade = smoothstep(-0.1, 0.3, y);
  finalColor = mix(finalColor * 0.6, finalColor, edgeFade);

  // Variación sutil con el tiempo para sensación de vida
  float shimmer = sin(uTime * 0.5 + vUv.x * 10.0) * 0.01;
  finalColor += shimmer;

  gl_FragColor = vec4(finalColor, 1.0);
}
