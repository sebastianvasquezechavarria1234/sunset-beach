import * as THREE from 'three';

import particleVertexShader from '../../shaders/particles/vertex.glsl?raw';
import particleFragmentShader from '../../shaders/particles/fragment.glsl?raw';

/**
 * Particles - Sistema de partículas GPU-instanciado
 * Miles de partículas animadas completamente en GPU
 * Simula polvo/destello flotando en la luz del atardecer
 */
export class Particles {
  constructor(scene, resourceManager, count = 2000) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.count = count;

    // Generar datos de instancias (posición, escala, velocidad, fase)
    const offsets = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Posición aleatoria en un volumen grande
      offsets[i * 3] = (Math.random() - 0.5) * 50;
      offsets[i * 3 + 1] = Math.random() * 12 - 2;
      offsets[i * 3 + 2] = (Math.random() - 0.5) * 50;

      // Escala variada (algunas partículas más grandes que otras)
      scales[i] = 0.3 + Math.random() * 1.5;

      // Velocidad individual
      speeds[i] = 0.2 + Math.random() * 0.8;

      // Fase random para variación temporal
      phases[i] = Math.random() * Math.PI * 2;
    }

    // Geometría base: un quad pequeño (2 triángulos)
    const geometry = new THREE.BufferGeometry();

    // Vertices de un quad centrado en origen
    const vertices = new Float32Array([
      -0.5, -0.5, 0,
       0.5, -0.5, 0,
       0.5,  0.5, 0,
      -0.5, -0.5, 0,
       0.5,  0.5, 0,
      -0.5,  0.5, 0
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Atributos instanciados
    geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
    geometry.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
    geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));

    // Material con shaders custom
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
    this.mesh.frustumCulled = false; // Las partículas se mueven, no cull
    this.mesh.renderOrder = 10; // Después de opacos

    this.scene.add(this.mesh);

    this.resourceManager.trackGeometry(geometry);
    this.resourceManager.trackMaterial(this.material);
  }

  /**
   * Actualiza las partículas cada frame
   * @param {number} elapsedTime - Tiempo total
   * @param {THREE.Vector3} cameraPosition - Posición actual de la cámara
   */
  update(elapsedTime, cameraPosition) {
    this.material.uniforms.uTime.value = elapsedTime;
    this.material.uniforms.uCameraPosition.value.copy(cameraPosition);
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}
