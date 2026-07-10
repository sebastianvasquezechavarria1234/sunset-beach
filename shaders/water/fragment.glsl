// Water Fragment Shader - AGUA DE PLAYA con espuma y reflejos
uniform float uTime;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uWaterColor;
uniform vec3 uDeepColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uCameraPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vWaveHeight_val;
varying float vDistToShore;

vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float snoise2(vec2 p) {
  const float K1 = 0.366025404;
  const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  vec2 b = a.x > a.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 c = a - b + K2;
  vec2 d = a - 1.0 + 2.0 * K2;
  vec2 h = max(0.5 - vec2(dot(a, a), dot(b, b)), 0.0);
  h *= h * h * h;
  float n = 0.5;
  n += 0.5 * h.x * dot(a, a);
  n += 0.5 * h.y * dot(b, b);
  vec3 p3 = vec3(a, 0.0);
  vec4 w = max(0.5 - vec4(dot(a, a), dot(b, b), dot(c, c), dot(d, d)), 0.0);
  w *= w; w *= w;
  n += 0.5 * w.x * dot(p3.xy, p3.xy);
  n += 0.5 * w.y * dot(b, b);
  n += 0.5 * w.z * dot(c, c);
  n += 0.5 * w.w * dot(d, d);
  return n;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 sunDir = normalize(uSunDirection);

  // === Fresnel ===
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 4.0);
  fresnel = mix(0.04, 1.0, fresnel);

  // === Reflexión del cielo ===
  vec3 reflectDir = reflect(-viewDir, normal);
  float skyReflect = smoothstep(-0.1, 0.5, reflectDir.y);
  vec3 reflectionColor = mix(
    vec3(0.1, 0.15, 0.2),
    uSunColor * 0.9,
    skyReflect
  );

  // Sun glint (brillo del sol en el agua)
  vec3 halfVec = normalize(sunDir + viewDir);
  float NdotH = max(dot(normal, halfVec), 0.0);
  float sunSpecular = pow(NdotH, 512.0) * 4.0;
  float sunSpecular2 = pow(NdotH, 64.0) * 0.4;
  reflectionColor += uSunColor * (sunSpecular + sunSpecular2);

  // === Color del agua ===
  float depth = smoothstep(-1.0, 3.0, vDistToShore);
  vec3 waterColor = mix(
    vec3(0.7, 0.8, 0.75),  // Agua muy浅 (casi transparente en la orilla)
    uDeepColor,              // Agua profunda
    depth
  );

  // Caustics
  float caustic1 = snoise2(vWorldPosition.xz * 2.5 + uTime * 0.6);
  float caustic2 = snoise2(vWorldPosition.xz * 4.0 - uTime * 0.4);
  float caustics = pow(abs(caustic1 + caustic2) * 0.5, 2.0) * 0.2;
  waterColor += uSunColor * caustics * depth;

  // === Combinar ===
  vec3 color = mix(waterColor, reflectionColor, fresnel);

  // Iluminación
  float NdotL = max(dot(normal, sunDir), 0.0);
  color *= 0.3 + NdotL * 0.7;
  color += uSunColor * sunSpecular * 0.4;

  // === ESPUMA DE PLAYA ===
  // Espuma donde las olas rompen
  float foamLine = smoothstep(0.8, 2.5, vWaveHeight_val);
  float foamNoise = snoise2(vWorldPosition.xz * 6.0 + uTime * 0.8);
  float foamNoise2 = snoise2(vWorldPosition.xz * 12.0 - uTime * 0.5);
  float foam = foamLine * (foamNoise * 0.5 + 0.5);
  foam += foamNoise2 * 0.2 * foamLine;

  // Espuma en la orilla (donde el agua toca la arena)
  float shoreFoam = smoothstep(1.0, -2.0, vDistToShore);
  float shoreFoamNoise = snoise2(vWorldPosition.xz * 8.0 + vec2(uTime * 0.3, 0.0));
  shoreFoam *= shoreFoamNoise * 0.5 + 0.5;
  foam += shoreFoam * 0.6;

  color = mix(color, vec3(0.95, 0.97, 1.0), clamp(foam * 0.6, 0.0, 1.0));

  // === Niebla ===
  float dist = length(vWorldPosition - cameraPosition);
  float fogFactor = 1.0 - exp(-uFogDensity * dist * dist);
  color = mix(color, uFogColor, clamp(fogFactor, 0.0, 1.0));

  gl_FragColor = vec4(color, 0.9);
}
