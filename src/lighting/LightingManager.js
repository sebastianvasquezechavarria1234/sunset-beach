import * as THREE from 'three';

/**
 * LightingManager - Iluminación de playa al atardecer
 * Sol bajo y cálido, ambiente dorado, reflejos en el agua
 */
export class LightingManager {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;

    // === Sol de playa ===
    this.sunLight = new THREE.DirectionalLight(0xff8833, 3.0);
    this.sunLight.position.set(-8, 4, -15);
    this.sunLight.target.position.set(0, 0, -5);

    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 60;
    this.sunLight.shadow.camera.left = -25;
    this.sunLight.shadow.camera.right = 25;
    this.sunLight.shadow.camera.top = 25;
    this.sunLight.shadow.camera.bottom = -25;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.sunLight.shadow.radius = 4;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // === HemisphereLight: cielo de playa ===
    this.hemiLight = new THREE.HemisphereLight(0xff9955, 0x443322, 0.5);
    this.hemiLight.position.set(0, 20, 0);
    this.scene.add(this.hemiLight);

    // === Ambient: relleno cálido ===
    this.ambientLight = new THREE.AmbientLight(0x332211, 0.4);
    this.scene.add(this.ambientLight);

    // === Contraluz del sol (dorada) ===
    this.backLight = new THREE.DirectionalLight(0xffcc88, 0.6);
    this.backLight.position.set(8, 6, 15);
    this.scene.add(this.backLight);
  }

  update(t) {
    const angle = t * Math.PI;
    this.sunLight.position.x = Math.cos(angle) * 15 - 3;
    this.sunLight.position.y = Math.sin(angle) * 8 + 1;
    this.sunLight.intensity = 2.5 + Math.sin(t * Math.PI) * 1.0;
  }

  dispose() {
    this.scene.remove(this.sunLight);
    this.scene.remove(this.sunLight.target);
    this.scene.remove(this.hemiLight);
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.backLight);
  }
}
