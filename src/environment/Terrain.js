import * as THREE from 'three';

// Importar shaders como strings (Vite los maneja como raw assets)
import terrainVertexShader from '../../shaders/terrain/vertex.glsl?raw';
import terrainFragmentShader from '../../shaders/terrain/fragment.glsl?raw';

/**
 * Terrain - Terreno procedural con shaders GLSL custom
 * Genera un plano grande con desplazamiento por ruido Simplex
 * y animación de viento en tiempo real
 */
export class Terrain {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;

    // Geometría del terreno: 128x128 subdivisiones para detalle sin exceso
    const geometry = new THREE.PlaneGeometry(60, 60, 128, 128);
    geometry.rotateX(-Math.PI / 2); // Horizontal

    // Material con shaders custom
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 2.5 },
        uFrequency: { value: 0.15 },
        uWindStrength: { value: 1.0 },
        uWindDirection: { value: new THREE.Vector2(1.0, 0.5).normalize() },
        uColorLow: { value: new THREE.Color(0x1a2a1a) },
        uColorMid: { value: new THREE.Color(0x3d2b1f) },
        uColorHigh: { value: new THREE.Color(0x4a4a5a) },
        uColorSlope: { value: new THREE.Color(0x5a5040) },
        uSunDirection: { value: new THREE.Vector3(-15, 8, -10).normalize() },
        uFogDensity: { value: 0.012 },
        uFogColor: { value: new THREE.Color(0x1a1025) }
      },
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.name = 'terrain';

    this.scene.add(this.mesh);

    // Registrar recursos para limpieza
    this.resourceManager.trackGeometry(geometry);
    this.resourceManager.trackMaterial(this.material);
  }

  /**
   * Actualiza el terreno cada frame
   * @param {number} elapsedTime - Tiempo total en segundos
   */
  update(elapsedTime) {
    this.material.uniforms.uTime.value = elapsedTime;
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}
