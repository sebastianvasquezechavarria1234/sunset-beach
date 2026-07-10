// Terrain Fragment Shader - Realista con blending por pendiente y altura
// Mezcla hierba, tierra, roca y nieve basado en pendiente y elevación

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uWaterLevel;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;
varying float vSlope;
varying float vBelowWater;

// Función de blending suave
float blend(float a, float b, float t) {
  return mix(a, b, smoothstep(0.0, 1.0, t));
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(uSunDirection);

  // === Colores base del terreno ===
  // Hierba oscura (zonas bajas, pendientes suaves)
  vec3 grassColor = vec3(0.12, 0.18, 0.08);
  // Hierba clara (altura media)
  vec3 grassLight = vec3(0.18, 0.25, 0.1);
  // Tierra/musgo (pendientes medias)
  vec3 dirtColor = vec3(0.22, 0.16, 0.1);
  // Roca (pendientes empinadas)
  vec3 rockColor = vec3(0.25, 0.23, 0.22);
  // Roca clara (cimas)
  vec3 rockLight = vec3(0.35, 0.33, 0.3);
  // Nieve (zonas muy altas)
  vec3 snowColor = vec3(0.85, 0.88, 0.92);

  // === Blending multi-capa ===
  float heightNorm = smoothstep(-1.0, 8.0, vElevation);

  // Hierba: dominante en zonas bajas con poca pendiente
  float grassFactor = (1.0 - vSlope) * (1.0 - smoothstep(0.4, 0.7, heightNorm));
  grassFactor *= mix(0.6, 1.0, smoothstep(-1.0, 2.0, vElevation));

  // Tierra: transición entre hierba y roca
  float dirtFactor = smoothstep(0.15, 0.4, vSlope) * (1.0 - smoothstep(0.6, 0.8, heightNorm));

  // Roca: dominante en pendientes empinadas
  float rockFactor = smoothstep(0.3, 0.65, vSlope);
  rockFactor += smoothstep(0.5, 0.8, heightNorm) * 0.5;

  // Nieve: solo en cimas y áreas planas altas
  float snowFactor = smoothstep(0.7, 0.9, heightNorm) * (1.0 - smoothstep(0.5, 0.7, vSlope));

  // Normalizar pesos
  float total = grassFactor + dirtFactor + rockFactor + snowFactor + 0.001;
  grassFactor /= total;
  dirtFactor /= total;
  rockFactor /= total;
  snowFactor /= total;

  // Mezclar colores
  vec3 baseColor = grassColor * grassFactor
                 + dirtColor * dirtFactor
                 + rockColor * rockFactor
                 + snowColor * snowFactor;

  // Añadir variación de color por UV (textura procedural)
  float colorNoise = fract(sin(dot(vUv * 47.0, vec2(12.9898, 78.233))) * 43758.5453);
  baseColor *= 0.9 + colorNoise * 0.2;

  // === Iluminación PBR simplificada ===
  // Diffuse
  float NdotL = max(dot(normal, sunDir), 0.0);
  float wrap = NdotL * 0.5 + 0.5; // Wrapped diffuse para look suave

  // Specular (Blinn-Phong)
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 halfDir = normalize(sunDir + viewDir);
  float NdotH = max(dot(normal, halfDir), 0.0);
  float specular = pow(NdotH, 32.0) * 0.3;

  // Fresnel sutil para bordes
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0) * 0.15;

  // Ambient occlusion aproximado
  float ao = smoothstep(-1.0, 2.0, vElevation) * 0.4 + 0.6;

  // === Componer iluminación ===
  vec3 ambient = vec3(0.08, 0.06, 0.12) * ao; // Ambient violeta oscuro
  vec3 diffuse = baseColor * wrap * uSunColor * 1.2;
  vec3 spec = uSunColor * specular * 0.5;
  vec3 rim = vec3(0.4, 0.25, 0.15) * fresnel;

  vec3 finalColor = ambient + diffuse + spec + rim;

  // === Niebla atmosférica ===
  float dist = length(vWorldPosition - cameraPosition);
  float fogFactor = 1.0 - exp(-uFogDensity * dist * dist);
  finalColor = mix(finalColor, uFogColor, clamp(fogFactor, 0.0, 1.0));

  // === Viñeta de distancia (más oscuro lejos) ===
  float distFade = smoothstep(30.0, 5.0, dist);
  finalColor *= mix(0.4, 1.0, distFade);

  gl_FragColor = vec4(finalColor, 1.0);
}
