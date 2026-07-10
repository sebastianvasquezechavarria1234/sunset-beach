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
 * Experience - Atardecer en la playa
 * Escena inmersiva con olas, arena, palmeras y partículas doradas
 */
class Experience {
  constructor() {
    this.isLoaded = false;
    this.WATER_LEVEL = -0.5;

    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingBarFill = document.getElementById('loading-bar-fill');
    this.loadingText = document.getElementById('loading-text');
    this.titleOverlay = document.getElementById('title-overlay');

    this._cameraTarget = new THREE.Vector3();
    this._cameraLookTarget = new THREE.Vector3();
    this._mouse = new THREE.Vector2(0, 0);
    this._mouseSmooth = new THREE.Vector2(0, 0);

    this.init();
  }

  async init() {
    try {
      this.updateLoadingText('Inicializando playa');
      this.updateLoading(5);

      this.sceneManager = new SceneManager();
      this.resourceManager = new ResourceManager();
      this.postProcessing = new PostProcessing(
        this.sceneManager.renderer,
        this.sceneManager.scene,
        this.sceneManager.camera
      );

      // Niebla cálida de playa
      this.sceneManager.scene.fog = new THREE.FogExp2(0x2a1510, 0.008);

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

      this.setupMouse();
      this.setupCamera();

      this.updateLoading(100);
      this.updateLoadingText('Listo');

      setTimeout(() => this.startExperience(), 500);
      this.animate();

    } catch (error) {
      console.error('[Experience] Error:', error);
      this.updateLoadingText('Error al cargar');
    }
  }

  setupMouse() {
    window.addEventListener('mousemove', (e) => {
      this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this._mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        this._mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    }, { passive: true });
  }

  setupCamera() {
    this.cameraAngle = 0;
    this.cameraRadius = 14;
    this.cameraHeight = 3.5;
    this.cameraLookHeight = 0.8;
    this.cameraSpeed = 0.04;
  }

  updateCamera(elapsed) {
    this.cameraAngle = elapsed * this.cameraSpeed;

    this._mouseSmooth.lerp(this._mouse, 0.03);

    const mouseAngleOffset = this._mouseSmooth.x * 0.6;
    const mouseHeightOffset = this._mouseSmooth.y * 1.2;

    const angle = this.cameraAngle + mouseAngleOffset;
    const x = Math.cos(angle) * this.cameraRadius;
    const z = Math.sin(angle) * this.cameraRadius;

    const breathe = Math.sin(elapsed * 0.2) * 0.15;
    const y = this.cameraHeight + breathe + mouseHeightOffset;

    this._cameraTarget.set(x, y, z);
    this.sceneManager.camera.position.copy(this._cameraTarget);

    const lookX = this._mouseSmooth.x * 1.0;
    const lookZ = -3 + this._mouseSmooth.y * 0.8;
    this._cameraLookTarget.set(lookX, this.cameraLookHeight, lookZ);
    this.sceneManager.camera.lookAt(this._cameraLookTarget);
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

    this.terrain.update(elapsed);
    this.sky.update(elapsed);
    this.water.update(elapsed, this.sceneManager.camera.position);
    this.fog.update(elapsed);
    this.wind.update(delta, elapsed);
    this.particles.update(elapsed, this.sceneManager.camera.position);
    this.lighting.update(0.5 + Math.sin(elapsed * 0.06) * 0.1);
    this.updateCamera(elapsed);
    this.postProcessing.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Experience();
});
