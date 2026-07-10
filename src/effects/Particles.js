import * as THREE from 'three';

import particleVertexShader from '../../shaders/particles/vertex.glsl?raw';
import particleFragmentShader from '../../shaders/particles/fragment.glsl?raw';

/**
 * Particles - Sistema de partículas GPU-instanciado
 * Luciérnagas mágicas que flotan y pulsan en la luz del atardecer
 */
export class Particles {
  constructor(scene, resourceManager, count = 3000) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.count = count;

    // Datos de instancias
    const offsets = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    // Paleta de colores cálidos para las partículas
    const colorPalette = [
      new THREE.Color(0xffaa44), // Dorado
      new THREE.Color(0xff8833), // Naranja
      new THREE.Color(0xffcc66), // Amarillo claro
      new THREE.Color(0xff6644), // Rojo-naranja
      new THREE.Color(0xeedd88), // Crema
    ];

    for (let i = 0; i < count; i++) {
      // Distribución en volumen
      offsets[i * 3] = (Math.random() - 0.5) * 50;
      offsets[i * 3 + 1] = Math.random() * 14 - 2;
      offsets[i * 3 + 2] = (Math.random() - 0.5) * 50;

      scales[i] = 0.2 + Math.random() * 1.8;
      speeds[i] = 0.15 + Math.random() * 0.7;
      phases[i] = Math.random() * Math.PI * 2;

      // Color aleatorio de la paleta
      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();

    // Quad base
    const vertices = new Float32Array([
      -0.5, -0.5, 0,  0.5, -0.5, 0,  0.5, 0.5, 0,
      -0.5, -0.5, 0,  0.5, 0.5, 0,  -0.5, 0.5, 0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Atributos instanciados
    geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
    geometry.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
    geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
    geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uCameraPosition: { value: new THREE.Vector3() }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, count);
    this.mesh.name = 'particles';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 10;

    this.scene.add(this.mesh);

    this.resourceManager.trackGeometry(geometry);
    this.resourceManager.trackMaterial(this.material);
  }

  update(elapsedTime, cameraPosition) {
    this.material.uniforms.uTime.value = elapsedTime;
    this.material.uniforms.uCameraPosition.value.copy(cameraPosition);
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}
