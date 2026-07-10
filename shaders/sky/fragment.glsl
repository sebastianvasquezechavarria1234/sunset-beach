// Sky Fragment Shader - ATARDECER DE PLAYA más cálido y vibrante
uniform float uTime;
uniform vec3 uSunDirection;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

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

float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * snoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 dir = normalize(vWorldPosition - cameraPosition);
  float y = dir.y;

  // === Colores del atardecer de playa ===
  vec3 horizonColor = vec3(1.0, 0.5, 0.1);      // Naranja intenso
  vec3 warmGlow = vec3(1.0, 0.35, 0.05);         // Naranja rojo
  vec3 midColor = vec3(0.6, 0.15, 0.25);         // Púrpura cálido
  vec3 topColor = vec3(0.08, 0.05, 0.18);        // Azul profundo
  vec3 groundColor = vec3(0.03, 0.02, 0.05);     // Casi negro

  vec3 skyColor;
  if (y > 0.0) {
    float t = pow(y, 0.3);
    skyColor = mix(horizonColor, warmGlow, smoothstep(0.0, 0.15, t));
    skyColor = mix(skyColor, midColor, smoothstep(0.15, 0.4, t));
    skyColor = mix(skyColor, topColor, smoothstep(0.4, 1.0, t));
  } else {
    float t = clamp(-y * 4.0, 0.0, 1.0);
    skyColor = mix(horizonColor, groundColor, t);
  }

  // === Nubes de playa ===
  vec3 cloudDir = dir;
  float cloudY = max(cloudDir.y, 0.001);
  vec2 cloudUV = cloudDir.xz / cloudY;

  vec3 cloudNoisePos = vec3(cloudUV * 0.3 + uTime * 0.015, uTime * 0.008);
  float cloudDensity = fbm(cloudNoisePos);
  cloudDensity = smoothstep(0.0, 0.55, cloudDensity);

  // Las nubes de playa son más alargadas horizontalmente
  float cloudStretch = smoothstep(0.0, 0.3, abs(cloudDir.y));
  cloudDensity *= cloudStretch;

  // Iluminación de nubes
  float cloudSun = max(dot(normalize(cloudDir), normalize(uSunDirection)), 0.0);
  vec3 cloudLit = mix(
    vec3(1.0, 0.45, 0.1),   // Lado iluminado (naranja fuego)
    vec3(0.25, 0.08, 0.15),  // Lado sombreado
    1.0 - pow(cloudSun, 0.4)
  );

  // Silver lining
  float edgeGlow = pow(cloudSun, 10.0) * cloudDensity * 0.6;
  cloudLit += vec3(1.0, 0.8, 0.4) * edgeGlow;

  float cloudAlpha = cloudDensity * smoothstep(0.0, 0.1, y) * 0.65;
  skyColor = mix(skyColor, cloudLit, cloudAlpha);

  // === Sol ===
  vec3 sunDir = normalize(uSunDirection);
  float sunAngle = acos(clamp(dot(dir, sunDir), -1.0, 1.0));

  // Sol grande de playa
  float sunDisc = smoothstep(0.05, 0.01, sunAngle);
  float sunHalo = smoothstep(0.35, 0.0, sunAngle) * 0.6;
  float sunGlow = smoothstep(1.0, 0.0, sunAngle) * 0.25;

  // Rayos horizontales (reflejados en el agua)
  float hRay = pow(max(0.0, 1.0 - abs(dir.y)), 10.0) * sunGlow * 3.0;

  // Columna de sol sobre el agua (reflejo vertical)
  float waterReflection = 0.0;
  if (dir.y < 0.0) {
    float reflAngle = abs(dir.x - sunDir.x);
    waterReflection = exp(-reflAngle * 8.0) * exp(dir.y * 3.0) * 0.4;
  }

  vec3 sunColor = vec3(1.0, 0.65, 0.2);
  skyColor += sunColor * (sunDisc * 5.0 + sunHalo + sunGlow + hRay);
  skyColor += sunColor * waterReflection;

  // Glow del horizonte
  float horizonGlow = exp(-abs(y) * 5.0) * 0.4;
  skyColor += vec3(1.0, 0.45, 0.1) * horizonGlow;

  gl_FragColor = vec4(skyColor, 1.0);
}
