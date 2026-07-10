import * as THREE from 'three';

import waterVertexShader from '../../shaders/water/vertex.glsl?raw';
import waterFragmentShader from '../../shaders/water/fragment.glsl?raw';

/**
 * Water - Superficie de agua cinematográfica
 * Océano animado con olas, reflejos del cielo, caustics y foam
 */
export class Water {
  constructor(scene, resourceManager, waterLevel = -0.3) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.waterLevel = waterLevel;

    const geometry = new THREE.PlaneGeometry(80, 80, 256, 256);
    geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaveHeight: { value: 0.3 },
        uWindDirection: { value: new THREE.Vector2(1.0, 0.5).normalize() },
        uSunDirection: { value: new THREE.Vector3(-0.5, 0.3, -0.8).normalize() },
        uSunColor: { value: new THREE.Color(0xffaa44) },
        uWaterColor: { value: new THREE.Color(0x1a4a6a) },
        uDeepColor: { value: new THREE.Color(0x051525) },
        uFogColor: { value: new THREE.Color(0x1a1025) },
        uFogDensity: { value: 0.012 },
        uCameraPosition: { value: new THREE.Vector3() }
      },
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = waterLevel;
    this.mesh.receiveShadow = true;
    this.mesh.name = 'water';

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
