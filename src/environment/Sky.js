import * as THREE from 'three';

import skyVertexShader from '../../shaders/sky/vertex.glsl?raw';
import skyFragmentShader from '../../shaders/sky/fragment.glsl?raw';

/**
 * Sky - Cúpula de cielo procedural con gradiente de atardecer
 * Se renderiza en una esfera grande al revés para simular un skybox
 */
export class Sky {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;

    // Esfera grande para el cielo, solo caras internas
    const geometry = new THREE.SphereGeometry(200, 32, 32);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(-0.5, 0.3, -0.8).normalize() },
        uSunColor: { value: new THREE.Color(0xffaa44) },
        uSkyColorTop: { value: new THREE.Color(0x0a1628) },
        uSkyColorHorizon: { value: new THREE.Color(0x442244) },
        uGroundColor: { value: new THREE.Color(0x111111) }
      },
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: THREE.BackSide,       // Renderizar caras internas
      depthWrite: false,           // Siempre detrás de todo
      fog: false                   // Sin niebla en el cielo
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = 'sky';
    this.mesh.renderOrder = -1; // Renderizar primero

    this.scene.add(this.mesh);

    this.resourceManager.trackGeometry(geometry);
    this.resourceManager.trackMaterial(this.material);
  }

  update(elapsedTime) {
    this.material.uniforms.uTime.value = elapsedTime;
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}
