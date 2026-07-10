import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
 * Experience - Atardecer en la playa
 * Cámara controlada por el usuario con OrbitControls
 */
class Experience {
  constructor() {
    this.isLoaded = false;
    this.WATER_LEVEL = -0.5;

    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingBarFill = document.getElementById('loading-bar-fill');
    this.loadingText = document.getElementById('loading-text');
    this.titleOverlay = document.getElementById('title-overlay');

    this.init();
  }

  async init() {
    try {
      this.updateLoadingText('Inicializando playa');
      this.updateLoading(5);

      // === Core ===
      this.sceneManager = new SceneManager();
      this.resourceManager = new ResourceManager();
      this.postProcessing = new PostProcessing(
        this.sceneManager.renderer,
        this.sceneManager.scene,
        this.sceneManager.camera
      );

      // Niebla cálida suave de playa
      this.sceneManager.scene.fog = new THREE.FogExp2(0x4a3020, 0.004);

      // === OrbitControls ===
      this.controls = new OrbitControls(
        this.sceneManager.camera,
        this.sceneManager.renderer.domElement
      );
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.rotateSpeed = 0.3;
      this.controls.zoomSpeed = 0.5;
      this.controls.minDistance = 5;
      this.controls.maxDistance = 35;
      this.controls.maxPolarAngle = Math.PI * 0.48;
      this.controls.minPolarAngle = Math.PI * 0.15;
      this.controls.target.set(0, 0.5, -3);
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.3;

      // Posición inicial de cámara
      this.sceneManager.camera.position.set(12, 4, 8);

      this.updateLoading(15);
      this.updateLoadingText('Pintando el cielo');

      this.sky = new Sky(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(25);
      this.updateLoadingText('Generando arena');

      this.terrain = new Terrain(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(35);
      this.updateLoadingText('Cargando el mar');

      this.water = new Water(this.sceneManager.scene, this.resourceManager, this.WATER_LEVEL);

      this.updateLoading(45);
      this.updateLoadingText('Encendiendo el sol');

      this.lighting = new LightingManager(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(55);
      this.updateLoadingText('Plantando palmeras');

      this.trees = new Trees(this.sceneManager.scene, this.resourceManager);
      this.trees.generate(35);

      this.updateLoading(65);
      this.updateLoadingText('Creando partículas de luz');

      this.particles = new Particles(this.sceneManager.scene, this.resourceManager, 2000);
      this.wind = new Wind();
      this.fog = new Fog(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(80);
      this.updateLoadingText('Preparando experiencia');

      this.updateLoading(100);
      this.updateLoadingText('Listo');

      setTimeout(() => this.startExperience(), 500);
      this.animate();

    } catch (error) {
      console.error('[Experience] Error:', error);
      this.updateLoadingText('Error al cargar');
    }
  }

  startExperience() {
    this.isLoaded = true;
    this.loadingScreen.classList.add('hidden');
    setTimeout(() => this.titleOverlay.classList.add('visible'), 600);
    setTimeout(() => this.titleOverlay.classList.remove('visible'), 6500);
  }

  updateLoading(percent) {
    if (this.loadingBarFill) this.loadingBarFill.style.width = `${percent}%`;
  }

  updateLoadingText(text) {
    if (this.loadingText) this.loadingText.textContent = text;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.sceneManager.getDelta();
    const elapsed = this.sceneManager.getElapsedTime();

    // Actualizar controles
    this.controls.update();

    // Actualizar sistemas
    this.terrain.update(elapsed);
    this.sky.update(elapsed);
    this.water.update(elapsed, this.sceneManager.camera.position);
    this.fog.update(elapsed);
    this.wind.update(delta, elapsed);
    this.particles.update(elapsed, this.sceneManager.camera.position);
    this.lighting.update(0.5 + Math.sin(elapsed * 0.05) * 0.1);

    this.postProcessing.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Experience();
});
