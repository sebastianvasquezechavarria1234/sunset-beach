// Terrain Vertex Shader - Versión mejorada con normales precisas
// Terreno procedural con múltiples capas de ruido y viento orgánico

uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uWindStrength;
uniform vec2 uWindDirection;
uniform float uWaterLevel;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;
varying float vSlope;
varying float vBelowWater;

// === Simplex 3D Noise (GLSL) ===
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

// FBM con más octavas para detalle fino
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.02;
    amplitude *= 0.49;
  }
  return value;
}

// Ruido de dominio warped para formas más orgánicas
float warpedNoise(vec3 p) {
  float n1 = fbm(p + vec3(0.0, 0.0, 0.0));
  float n2 = fbm(p + vec3(n1 * 1.5, 0.0, 0.0));
  float n3 = fbm(p + vec3(0.0, n2 * 1.5, 0.0));
  return fbm(p + vec3(n1, n2, n3) * 0.5);
}

void main() {
  vUv = uv;
  vec3 pos = position;

  // === Elevación multi-capa ===
  // Capa base: colinas suaves
  float baseHills = fbm(vec3(pos.x * 0.08, pos.z * 0.08, 0.0)) * 3.0;

  // Capa media: variación orgánica
  float midDetail = fbm(vec3(pos.x * 0.2, pos.z * 0.2, 10.0)) * 1.2;

  // Capa fina: roca y erosión
  float fineDetail = fbm(vec3(pos.x * 0.6, pos.z * 0.6, 20.0)) * 0.3;

  // Warped noise para formas de erosión realistas
  float erosion = warpedNoise(vec3(pos.x * 0.15, pos.z * 0.15, 30.0)) * 1.5;

  // Combinar capas
  float elevation = baseHills + midDetail + fineDetail + erosion;

  // === Viento orgánico ===
  float windPhase = dot(pos.xz, uWindDirection) * 0.4 + uTime * 0.6;
  float wind1 = sin(windPhase) * uWindStrength * 0.12;
  float wind2 = sin(windPhase * 2.7 + pos.x * 0.3) * uWindStrength * 0.06;
  float wind3 = sin(windPhase * 5.1 + pos.z * 0.7) * uWindStrength * 0.03;
  float windTotal = wind1 + wind2 + wind3;

  // Solo aplicar viento por encima del nivel del agua
  float waterMask = smoothstep(uWaterLevel - 0.5, uWaterLevel + 0.5, elevation);
  pos.y += elevation + windTotal * waterMask;

  vElevation = pos.y;
  vBelowWater = step(pos.y, uWaterLevel);

  // === Normales por diferencias finitas (más preciso) ===
  float eps = 0.08;
  float hL = fbm(vec3((pos.x - eps) * 0.08, pos.z * 0.08, 0.0)) * 3.0
           + fbm(vec3((pos.x - eps) * 0.2, pos.z * 0.2, 10.0)) * 1.2;
  float hR = fbm(vec3((pos.x + eps) * 0.08, pos.z * 0.08, 0.0)) * 3.0
           + fbm(vec3((pos.x + eps) * 0.2, pos.z * 0.2, 10.0)) * 1.2;
  float hD = fbm(vec3(pos.x * 0.08, (pos.z - eps) * 0.08, 0.0)) * 3.0
           + fbm(vec3(pos.x * 0.2, (pos.z - eps) * 0.2, 10.0)) * 1.2;
  float hU = fbm(vec3(pos.x * 0.08, (pos.z + eps) * 0.08, 0.0)) * 3.0
           + fbm(vec3(pos.x * 0.2, (pos.z + eps) * 0.2, 10.0)) * 1.2;

  vec3 computedNormal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));
  vNormal = normalize(normalMatrix * computedNormal);

  // Pendiente: 0 = plano, 1 = empinado
  vSlope = 1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0));

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
