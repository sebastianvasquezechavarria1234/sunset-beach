// Terrain Fragment Shader - PLAYA con arena realista
// Arena mojada cerca del agua, seca lejos, con espuma

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;
varying float vSlope;
varying float vDistToWater;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(uSunDirection);

  // === Colores de la arena ===
  vec3 drySand = vec3(0.85, 0.78, 0.6);    // Arena seca clara
  vec3 wetSand = vec3(0.55, 0.45, 0.3);    // Arena mojada oscura
  vec3 shellWhite = vec3(0.95, 0.93, 0.88); // Cáscaras / espuma

  // Mezcla seca/mojada basada en distancia al agua
  float wetFactor = smoothstep(2.0, -1.0, vDistToWater);
  vec3 sandColor = mix(drySand, wetSand, wetFactor);

  // Añadir variación de color (pequeñas piedras, conchas)
  float grain = fract(sin(dot(vWorldPosition.xz * 7.0, vec2(12.9898, 78.233))) * 43758.5453);
  sandColor *= 0.92 + grain * 0.16;

  // Manchas de conchas/corales cerca del agua
  float shells = smoothstep(0.7, 0.75, grain) * wetFactor * 0.3;
  sandColor = mix(sandColor, shellWhite, shells);

  // === Iluminación ===
  float NdotL = max(dot(normal, sunDir), 0.0);
  float wrap = NdotL * 0.5 + 0.5;

  // Specular en arena mojada (brillo del agua en la superficie)
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 halfVec = normalize(sunDir + viewDir);
  float NdotH = max(dot(normal, halfVec), 0.0);
  float wetSpecular = pow(NdotH, 32.0) * wetFactor * 0.6;

  // Fresnel para brillo de borde
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0) * 0.1 * wetFactor;

  // Ambient
  vec3 ambient = vec3(0.15, 0.12, 0.1) * 0.8;

  // Componer
  vec3 diffuse = sandColor * wrap * uSunColor * 1.3;
  vec3 spec = uSunColor * wetSpecular;
  vec3 rim = vec3(0.8, 0.6, 0.3) * fresnel;

  vec3 finalColor = ambient + diffuse + spec + rim;

  // === Espuma de olas en la orilla ===
  float foamZone = smoothstep(0.5, -1.5, vDistToWater);
  float foamNoise = fract(sin(dot(vWorldPosition.xz * 5.0 + uTime * 0.3, vec2(12.9898, 78.233))) * 43758.5453);
  float foam = foamZone * smoothstep(0.3, 0.7, foamNoise) * 0.5;
  finalColor = mix(finalColor, vec3(0.95, 0.95, 0.98), foam);

  // === Niebla ===
  float dist = length(vWorldPosition - cameraPosition);
  float fogFactor = 1.0 - exp(-uFogDensity * dist * dist);
  finalColor = mix(finalColor, uFogColor, clamp(fogFactor, 0.0, 1.0));

  // Viñeta de distancia
  float distFade = smoothstep(40.0, 5.0, dist);
  finalColor *= mix(0.5, 1.0, distFade);

  gl_FragColor = vec4(finalColor, 1.0);
}
