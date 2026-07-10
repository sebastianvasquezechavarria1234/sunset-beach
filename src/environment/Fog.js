import * as THREE from 'three';

/**
 * Fog - Sistema de niebla volumétrica usando planos transparentes
 * Crea la sensación de profundidad atmosférica cinematográfica
 * Usando múltiples planos con blending aditivo
 */
export class Fog {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.planes = [];

    // Material de niebla: suave, aditivo, sin escribir en depth buffer
    const fogMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x2a1535) },
        uOpacity: { value: 0.15 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;

        // Simple hash para variación
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        // Value noise suave
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          vec2 uv = vUv;

          // Mover las nubes suavemente
          uv.x += uTime * 0.02;
          uv.y += uTime * 0.01;

          // Capas de ruido para nubes densas
          float n = 0.0;
          n += noise(uv * 3.0) * 0.5;
          n += noise(uv * 6.0) * 0.25;
          n += noise(uv * 12.0) * 0.125;
          n = n / 0.875;

          // Suavizar bordes del plano
          float edgeFade = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
          edgeFade *= smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

          float alpha = n * edgeFade * uOpacity;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Crear múltiples planos de niebla en diferentes distancias y alturas
    const fogConfigs = [
      { y: 0.5, z: -5, scale: 1.0, opacity: 0.08, rotY: 0 },
      { y: 1.0, z: -8, scale: 1.5, opacity: 0.06, rotY: 0.3 },
      { y: 0.3, z: -3, scale: 0.8, opacity: 0.1, rotY: -0.2 },
      { y: 1.5, z: -12, scale: 2.0, opacity: 0.04, rotY: 0.1 },
    ];

    for (const config of fogConfigs) {
      const mat = fogMaterial.clone();
      mat.uniforms.uOpacity.value = config.opacity;
      mat.uniforms.uColor.value = new THREE.Color(0x2a1535);

      const planeGeo = new THREE.PlaneGeometry(30 * config.scale, 8 * config.scale);
      const plane = new THREE.Mesh(planeGeo, mat);
      plane.position.set(0, config.y, config.z);
      plane.rotation.y = config.rotY;
      plane.name = `fog_plane_${this.planes.length}`;

      this.scene.add(plane);
      this.planes.push(plane);

      this.resourceManager.trackGeometry(planeGeo);
      this.resourceManager.trackMaterial(mat);
    }
  }

  update(elapsedTime) {
    for (const plane of this.planes) {
      plane.material.uniforms.uTime.value = elapsedTime;
    }
  }

  dispose() {
    for (const plane of this.planes) {
      this.scene.remove(plane);
    }
    this.planes = [];
  }
}
