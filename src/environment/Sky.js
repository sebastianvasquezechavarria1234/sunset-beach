import * as THREE from 'three';

import skyVertexShader from '../../shaders/sky/vertex.glsl?raw';
import skyFragmentShader from '../../shaders/sky/fragment.glsl?raw';

/**
 * Sky - Cúpula de cielo con nubes volumétricas y sol dramático
 */
export class Sky {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;

    const geometry = new THREE.SphereGeometry(200, 64, 64);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(-0.5, 0.3, -0.8).normalize() }
      },
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = 'sky';
    this.mesh.renderOrder = -1;

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
