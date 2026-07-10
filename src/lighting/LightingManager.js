import * as THREE from 'three';

/**
 * LightingManager - Iluminación suave y cálida de playa al atardecer
 * Busca un look natural, no aterrador
 */
export class LightingManager {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;

    // === Sol suave ===
    this.sunLight = new THREE.DirectionalLight(0xffaa66, 1.2);
    this.sunLight.position.set(-10, 6, -12);
    this.sunLight.target.position.set(0, 0, -3);

    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 50;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.02;
    this.sunLight.shadow.radius = 6;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // === Hemisphere: cielo cálido arriba, arena abajo ===
    this.hemiLight = new THREE.HemisphereLight(0xffccaa, 0x886644, 0.4);
    this.hemiLight.position.set(0, 15, 0);
    this.scene.add(this.hemiLight);

    // === Ambient: relleno muy suave ===
    this.ambientLight = new THREE.AmbientLight(0x554433, 0.3);
    this.scene.add(this.ambientLight);

    // === Contraluz suave (rim del sol) ===
    this.backLight = new THREE.DirectionalLight(0xffcc88, 0.3);
    this.backLight.position.set(8, 5, 12);
    this.scene.add(this.backLight);
  }

  update(t) {
    // El sol se mueve muy lentamente en un arco bajo
    const angle = t * Math.PI;
    this.sunLight.position.x = Math.cos(angle) * 12 - 2;
    this.sunLight.position.y = Math.sin(angle) * 5 + 2;
    this.sunLight.intensity = 1.0 + Math.sin(t * Math.PI) * 0.4;
  }

  dispose() {
    this.scene.remove(this.sunLight);
    this.scene.remove(this.sunLight.target);
    this.scene.remove(this.hemiLight);
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.backLight);
  }
}
