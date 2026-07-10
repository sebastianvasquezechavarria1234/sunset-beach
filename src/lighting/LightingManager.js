import * as THREE from 'three';

/**
 * LightingManager - Sistema de iluminación cinematográfica de atardecer
 * Combina DirectionalLight (sol), HemisphereLight (cielo/suelo) y AmbientLight (relleno)
 * para lograr un look cálido y cinematográfico
 */
export class LightingManager {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;

    // === DireccionalLight: El sol de atardecer ===
    // Color cálido naranja/dorado, intensidad alta para crear contraste dramático
    this.sunLight = new THREE.DirectionalLight(0xffa040, 2.5);
    this.sunLight.position.set(-15, 8, -10);
    this.sunLight.target.position.set(0, 0, 0);

    // Sombras: 2048px para calidad cinematográfica sin excesivo costo
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
    this.resourceManager.trackTexture(this.sunLight.shadow.map);

    // === HemisphereLight: Gradiente cielo-suelo ===
    // Simula la luz ambiental del cielo (azul frío arriba) y el suelo (cálido abajo)
    this.hemiLight = new THREE.HemisphereLight(0x4466aa, 0x885533, 0.6);
    this.hemiLight.position.set(0, 20, 0);
    this.scene.add(this.hemiLight);

    // === AmbientLight: Relleno suave ===
    // Evita sombras completamente negras
    this.ambientLight = new THREE.AmbientLight(0x221133, 0.3);
    this.scene.add(this.ambientLight);

    // === Luz de acento sutil (rim light) ===
    // Añade un toque de luz desde atrás para separar objetos del fondo
    this.rimLight = new THREE.DirectionalLight(0x6688cc, 0.4);
    this.rimLight.position.set(10, 5, 15);
    this.scene.add(this.rimLight);
  }

  /**
   * Actualiza la iluminación basado en un factor de tiempo (0-1)
   * Permite animar el ciclo de atardecer
   * @param {number} t - Factor de tiempo (0 = atardecer temprano, 1 = atardecer tardío)
   */
  update(t) {
    // Animar posición del sol en un arco suave
    const angle = t * Math.PI;
    this.sunLight.position.x = Math.cos(angle) * 20 - 5;
    this.sunLight.position.y = Math.sin(angle) * 12 + 2;

    // Variar intensidad del sol suavemente
    this.sunLight.intensity = 2.0 + Math.sin(t * Math.PI) * 1.0;
  }

  dispose() {
    this.scene.remove(this.sunLight);
    this.scene.remove(this.sunLight.target);
    this.scene.remove(this.hemiLight);
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.rimLight);
  }
}
