// Water Fragment Shader - Agua cinematográfica con reflejos y caustics
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
varying vec3 vViewPosition;
varying float vWaveHeight;

// Simplex 2D para caustics
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
  vec3 q3 = vec3(d, 0.0);
  vec2 s = vec2(a.x * a.y * 2.0 * (a.x - a.y) + K1,
                d.x * d.y * 2.0 * (d.x - d.y) + K1);
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

  // === Fresnel (reflexión vs refracción) ===
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 4.0);
  fresnel = mix(0.04, 1.0, fresnel); // Reflectancia de Fresnel para agua

  // === Reflexión del cielo ===
  vec3 reflectDir = reflect(-viewDir, normal);
  float skyReflect = smoothstep(-0.1, 0.5, reflectDir.y);
  vec3 reflectionColor = mix(
    vec3(0.05, 0.08, 0.15),  // Reflejo del horizonte
    uSunColor * 0.8,          // Reflejo del sol
    skyReflect
  );

  // Specular del sol (sun glint)
  vec3 halfVec = normalize(sunDir + viewDir);
  float NdotH = max(dot(normal, halfVec), 0.0);
  float sunSpecular = pow(NdotH, 512.0) * 3.0;
  float sunSpecular2 = pow(NdotH, 64.0) * 0.3;
  reflectionColor += uSunColor * (sunSpecular + sunSpecular2);

  // === Refracción / Color del agua ===
  float depthFactor = smoothstep(-0.5, 2.0, vWaveHeight);
  vec3 waterColor = mix(uDeepColor, uWaterColor, depthFactor);

  // Caustics (patrones de luz en el fondo)
  float caustic1 = snoise2(vWorldPosition.xz * 2.0 + uTime * 0.5);
  float caustic2 = snoise2(vWorldPosition.xz * 3.0 - uTime * 0.3);
  float caustics = pow(abs(caustic1 + caustic2) * 0.5, 2.0) * 0.15;
  waterColor += uSunColor * caustics * depthFactor;

  // === Combinar reflexión y refracción ===
  vec3 color = mix(waterColor, reflectionColor, fresnel);

  // === Iluminación ===
  float NdotL = max(dot(normal, sunDir), 0.0);
  color *= 0.3 + NdotL * 0.7; // Diffuse suave

  // Añadir brillo del sol al agua
  color += uSunColor * sunSpecular * 0.5;

  // === Niebla ===
  float dist = length(vWorldPosition - cameraPosition);
  float fogFactor = 1.0 - exp(-uFogDensity * dist * dist);
  color = mix(color, uFogColor, clamp(fogFactor, 0.0, 1.0));

  // === Foam en crestas de olas ===
  float foam = smoothstep(0.8, 1.5, vWaveHeight);
  foam += snoise2(vWorldPosition.xz * 8.0 + uTime * 0.5) * 0.3 * foam;
  color = mix(color, vec3(0.9, 0.92, 0.95), foam * 0.4);

  gl_FragColor = vec4(color, 0.85);
}
