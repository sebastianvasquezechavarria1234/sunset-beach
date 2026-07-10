import * as THREE from 'three';

import { SceneManager } from './core/SceneManager.js';
import { ResourceManager } from './core/ResourceManager.js';
import { PostProcessing } from './core/PostProcessing.js';
import { LightingManager } from './lighting/LightingManager.js';
import { Terrain } from './environment/Terrain.js';
import { Sky } from './environment/Sky.js';
import { Water } from './environment/Water.js';
import { Fog } from './environment/Fog.js';
import { Particles } from './effects/Particles.js';
import { Wind } from './effects/Wind.js';
import { Trees } from './effects/Trees.js';

/**
 * Experience - Experiencia cinematográfica inmersiva
 * Paisaje de atardecer con océano, bosque, partículas y post-processing
 */
class Experience {
  constructor() {
    this.isLoaded = false;
    this.WATER_LEVEL = -0.3;

    // UI
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingBarFill = document.getElementById('loading-bar-fill');
    this.loadingText = document.getElementById('loading-text');
    this.titleOverlay = document.getElementById('title-overlay');

    // Vectores pre-asignados (sin allocaciones en el loop)
    this._cameraTarget = new THREE.Vector3();
    this._cameraLookTarget = new THREE.Vector3();
    this._mouse = new THREE.Vector2(0, 0);
    this._mouseSmooth = new THREE.Vector2(0, 0);

    this.init();
  }

  async init() {
    try {
      this.updateLoadingText('Inicializando escena');
      this.updateLoading(5);

      // === Core ===
      this.sceneManager = new SceneManager();
      this.resourceManager = new ResourceManager();
      this.postProcessing = new PostProcessing(
        this.sceneManager.renderer,
        this.sceneManager.scene,
        this.sceneManager.camera
      );

      // Niebla de escena (coordinada con los shaders)
      this.sceneManager.scene.fog = new THREE.FogExp2(0x1a1025, 0.01);

      this.updateLoading(15);
      this.updateLoadingText('Generando cielo');

      // === Environment ===
      this.sky = new Sky(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(25);
      this.updateLoadingText('Generando terreno');

      this.terrain = new Terrain(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(35);
      this.updateLoadingText('Generando océano');

      this.water = new Water(this.sceneManager.scene, this.resourceManager, this.WATER_LEVEL);

      this.updateLoading(45);
      this.updateLoadingText('Configurando iluminación');

      // === Lighting ===
      this.lighting = new LightingManager(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(55);
      this.updateLoadingText('Poblando bosque');

      // === Vegetación ===
      this.trees = new Trees(this.sceneManager.scene, this.resourceManager);
      this.trees.generate(100, this.WATER_LEVEL);

      this.updateLoading(65);
      this.updateLoadingText('Creando partículas');

      // === Effects ===
      this.particles = new Particles(this.sceneManager.scene, this.resourceManager, 3000);
      this.wind = new Wind();
      this.fog = new Fog(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(80);
      this.updateLoadingText('Preparando experiencia');

      // === Interacción con mouse ===
      this.setupMouse();

      // === Cámara ===
      this.setupCamera();

      this.updateLoading(100);
      this.updateLoadingText('Listo');

      setTimeout(() => this.startExperience(), 500);

      // Loop de animación
      this.animate();

    } catch (error) {
      console.error('[Experience] Error:', error);
      this.updateLoadingText('Error al cargar');
    }
  }

  /** Configura el tracking del mouse para interacción */
  setupMouse() {
    window.addEventListener('mousemove', (e) => {
      // Normalizar a -1 ... 1
      this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Touch support
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this._mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        this._mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    }, { passive: true });
  }

  /** Configura parámetros de cámara */
  setupCamera() {
    this.cameraAngle = 0;
    this.cameraRadius = 12;
    this.cameraHeight = 4;
    this.cameraLookHeight = 1.0;
    this.cameraSpeed = 0.06;
  }

  /**
   * Cámara orbital con influencia del mouse
   * El mouse desplaza suavemente el ángulo y la altura
   */
  updateCamera(elapsed) {
    // Ángulo base orbital
    this.cameraAngle = elapsed * this.cameraSpeed;

    // Suavizar el mouse (lerp)
    this._mouseSmooth.lerp(this._mouse, 0.03);

    // Influencia del mouse en el ángulo y altura
    const mouseAngleOffset = this._mouseSmooth.x * 0.5;
    const mouseHeightOffset = this._mouseSmooth.y * 1.5;

    const angle = this.cameraAngle + mouseAngleOffset;
    const x = Math.cos(angle) * this.cameraRadius;
    const z = Math.sin(angle) * this.cameraRadius;

    // Respiración + mouse
    const breathe = Math.sin(elapsed * 0.25) * 0.2;
    const y = this.cameraHeight + breathe + mouseHeightOffset;

    this._cameraTarget.set(x, y, z);
    this.sceneManager.camera.position.copy(this._cameraTarget);

    // Mirar al centro con offset suave
    const lookX = this._mouseSmooth.x * 0.8;
    const lookZ = -2 + this._mouseSmooth.y * 0.5;
    this._cameraLookTarget.set(lookX, this.cameraLookHeight, lookZ);
    this.sceneManager.camera.lookAt(this._cameraLookTarget);
  }

  /** Transición de entrada */
  startExperience() {
    this.isLoaded = true;
    this.loadingScreen.classList.add('hidden');

    setTimeout(() => {
      this.titleOverlay.classList.add('visible');
    }, 600);

    setTimeout(() => {
      this.titleOverlay.classList.remove('visible');
    }, 6500);
  }

  updateLoading(percent) {
    if (this.loadingBarFill) {
      this.loadingBarFill.style.width = `${percent}%`;
    }
  }

  updateLoadingText(text) {
    if (this.loadingText) {
      this.loadingText.textContent = text;
    }
  }

  /**
   * Loop principal - ~60 FPS
   * Orden: terreno → cielo → agua → niebla → viento → partículas → iluminación → cámara → render
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.sceneManager.getDelta();
    const elapsed = this.sceneManager.getElapsedTime();

    // 1. Terreno
    this.terrain.update(elapsed);

    // 2. Cielo
    this.sky.update(elapsed);

    // 3. Agua
    this.water.update(elapsed, this.sceneManager.camera.position);

    // 4. Niebla
    this.fog.update(elapsed);

    // 5. Viento
    this.wind.update(delta, elapsed);

    // 6. Partículas
    this.particles.update(elapsed, this.sceneManager.camera.position);

    // 7. Iluminación
    this.lighting.update(0.5 + Math.sin(elapsed * 0.08) * 0.15);

    // 8. Cámara (con mouse)
    this.updateCamera(elapsed);

    // 9. Render
    this.postProcessing.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Experience();
});
