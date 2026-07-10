// Terrain Vertex Shader - PLAYA con arena y dunas
// Terreno plano que desciende suavemente hacia el mar

uniform float uTime;
uniform float uWindStrength;
uniform vec2 uWindDirection;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;
varying float vSlope;
varying float vDistToWater;

// Simplex 3D Noise
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
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(x2,x2),dot(p3,x3)));
}

float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vUv = uv;
  vec3 pos = position;

  // === Terreno de playa ===
  // La playa desciende suavemente hacia el mar (z negativa = más cerca del mar)
  // z positivo = tierra firme (dunas), z negativo = orilla

  float distFromCenter = length(pos.xz);

  // Pendiente suave de la playa: tierra alta → orilla baja
  float beachSlope = smoothstep(-15.0, 20.0, pos.z) * 2.5;

  // Dunas de arena suaves (solo en tierra firme)
  float dunes = 0.0;
  if (pos.z > -2.0) {
    float duneMask = smoothstep(-2.0, 5.0, pos.z);
    dunes = fbm(vec3(pos.x * 0.15, pos.z * 0.1, 0.0)) * 1.5 * duneMask;
    // Añadir crestas de dunas
    dunes += sin(pos.x * 0.8 + pos.z * 0.3) * 0.3 * duneMask;
  }

  // Ondulaciones de arena cerca del agua (marcas de marea)
  float tideMarks = 0.0;
  if (pos.z > -6.0 && pos.z < 0.0) {
    float tideMask = smoothstep(-6.0, -1.0, pos.z) * smoothstep(0.0, -3.0, pos.z);
    tideMarks = sin(pos.x * 3.0 + pos.z * 0.5) * 0.05 * tideMask;
  }

  // Viento en la arena (partículas de arena)
  float windPhase = dot(pos.xz, uWindDirection) * 0.3 + uTime * 0.5;
  float windRipple = sin(windPhase) * uWindStrength * 0.02;
  windRipple += sin(windPhase * 3.0 + pos.x) * uWindStrength * 0.01;

  pos.y = beachSlope + dunes + tideMarks + windRipple;
  vElevation = pos.y;

  // Distancia al nivel del agua (aproximado)
  vDistToWater = pos.z + 1.0; // positivo = sobre el agua

  // Normales por diferencias finitas
  float eps = 0.1;
  float hL = smoothstep(-15.0, 20.0, (pos.x - eps) > 0.0 ? pos.z : pos.z) * 2.5
           + fbm(vec3((pos.x - eps) * 0.15, pos.z * 0.1, 0.0)) * 1.5;
  float hR = smoothstep(-15.0, 20.0, (pos.x + eps) > 0.0 ? pos.z : pos.z) * 2.5
           + fbm(vec3((pos.x + eps) * 0.15, pos.z * 0.1, 0.0)) * 1.5;
  float hD = smoothstep(-15.0, 20.0, pos.z - eps) * 2.5;
  float hU = smoothstep(-15.0, 20.0, pos.z + eps) * 2.5;

  vec3 computedNormal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));
  vNormal = normalize(normalMatrix * computedNormal);
  vSlope = 1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0));

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
