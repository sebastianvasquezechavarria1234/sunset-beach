import * as THREE from 'three';

import { SceneManager } from './core/SceneManager.js';
import { ResourceManager } from './core/ResourceManager.js';
import { PostProcessing } from './core/PostProcessing.js';
import { LightingManager } from './lighting/LightingManager.js';
import { Terrain } from './environment/Terrain.js';
import { Sky } from './environment/Sky.js';
import { Fog } from './environment/Fog.js';
import { Particles } from './effects/Particles.js';
import { Wind } from './effects/Wind.js';
import { ModelLoader } from './models/ModelLoader.js';

/**
 * Experience - Orquestador principal de la experiencia cinematográfica
 * Inicializa todos los sistemas y gestiona el loop de animación
 *
 * Arquitectura:
 * - Cada sistema es una clase independiente con update() y dispose()
 * - ResourceManager rastrea todos los recursos GPU para limpieza segura
 * - PostProcessing gestiona el pipeline de efectos visuales
 * - Wind controla el comportamiento del viento para terreno y partículas
 */
class Experience {
  constructor() {
    // Estado de carga
    this.isLoaded = false;
    this.loadProgress = 0;

    // UI elements
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingBarFill = document.getElementById('loading-bar-fill');
    this.loadingText = document.getElementById('loading-text');
    this.titleOverlay = document.getElementById('title-overlay');

    // Pre-asignar vectores para evitar allocaciones en el loop
    this._cameraTarget = new THREE.Vector3();
    this._cameraLookTarget = new THREE.Vector3();

    // Inicializar
    this.init();
  }

  async init() {
    try {
      this.updateLoadingText('Inicializando escena');
      this.updateLoading(10);

      // === Core ===
      this.sceneManager = new SceneManager();
      this.resourceManager = new ResourceManager();
      this.postProcessing = new PostProcessing(
        this.sceneManager.renderer,
        this.sceneManager.scene,
        this.sceneManager.camera,
        this.resourceManager
      );

      this.updateLoading(20);
      this.updateLoadingText('Generando terreno');

      // === Environment ===
      this.sky = new Sky(this.sceneManager.scene, this.resourceManager);
      this.terrain = new Terrain(this.sceneManager.scene, this.resourceManager);
      this.fog = new Fog(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(40);
      this.updateLoadingText('Configurando iluminación');

      // === Lighting ===
      this.lighting = new LightingManager(this.sceneManager.scene, this.resourceManager);

      this.updateLoading(55);
      this.updateLoadingText('Creando partículas');

      // === Effects ===
      this.particles = new Particles(this.sceneManager.scene, this.resourceManager, 2500);
      this.wind = new Wind();

      this.updateLoading(70);
      this.updateLoadingText('Cargando modelos');

      // === Models ===
      this.modelLoader = new ModelLoader(this.sceneManager.scene, this.resourceManager);

      // Intentar cargar un modelo GLB (si existe)
      // Si no existe, crear placeholders procedurales
      await this.loadModels();

      this.updateLoading(90);
      this.updateLoadingText('Preparando experiencia');

      // === Configuración final ===
      this.setupCameraAnimation();

      this.updateLoading(100);
      this.updateLoadingText('Listo');

      // Iniciar la experiencia después de una breve pausa
      setTimeout(() => {
        this.startExperience();
      }, 600);

      // Iniciar loop de animación
      this.animate();

    } catch (error) {
      console.error('[Experience] Error durante la inicialización:', error);
      this.updateLoadingText('Error al cargar');
    }
  }

  /**
   * Intenta cargar modelos GLB. Si falla, crea placeholders procedurales
   * para que la escena siempre tenga elementos visuales
   */
  async loadModels() {
    try {
      // Intentar cargar un modelo GLB desde /public/models/
      // Si el archivo no existe, se crea un placeholder
      await this.modelLoader.load('main-model', '/models/scene.glb', {
        position: [0, 0.5, -2],
        scale: 1
      });
    } catch {
      // Modelo no disponible — crear formas procedurales abstractas
      console.log('[Experience] Usando placeholders procedurales');

      // Cristal principal
      this.modelLoader.createPlaceholder('crystal-1', {
        position: [-3, 1.5, -4],
        geometryType: 'crystal',
        color: 0x2244aa,
        emissive: 0x112244,
        scale: 0.8
      });

      // Monolito
      this.modelLoader.createPlaceholder('monolith-1', {
        position: [2, 1.5, -5],
        geometryType: 'monolith',
        color: 0x334455,
        emissive: 0x111122,
        scale: 0.6
      });

      // Obelisco
      this.modelLoader.createPlaceholder('obelisk-1', {
        position: [-1, 2, -6],
        geometryType: 'obelisk',
        color: 0x445566,
        emissive: 0x222233,
        scale: 0.5
      });

      // Cristales pequeños dispersos
      const positions = [
        [4, 0.5, -3], [-5, 0.8, -2], [1, 0.3, -1],
        [-2, 0.6, -7], [3, 0.4, -6], [-4, 0.7, -5]
      ];

      positions.forEach((pos, i) => {
        this.modelLoader.createPlaceholder(`crystal-small-${i}`, {
          position: pos,
          geometryType: 'crystal',
          color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.5, 0.3),
          emissive: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.3, 0.1),
          scale: 0.15 + Math.random() * 0.3
        });
      });
    }
  }

  /**
   * Configura la animación orbital de la cámara
   * Movimiento suave y cinematográfico alrededor de la escena
   */
  setupCameraAnimation() {
    this.cameraAngle = 0;
    this.cameraRadius = 10;
    this.cameraHeight = 3.5;
    this.cameraLookHeight = 1.2;
    this.cameraSpeed = 0.08; // Radianes por segundo
  }

  /**
   * Actualiza la posición de la cámara en cada frame
   * Crea un movimiento orbital suave con variación vertical
   * @param {number} elapsed - Tiempo total en segundos
   */
  updateCamera(elapsed) {
    // Orbita suave alrededor del centro de la escena
    this.cameraAngle = elapsed * this.cameraSpeed;

    const x = Math.cos(this.cameraAngle) * this.cameraRadius;
    const z = Math.sin(this.cameraAngle) * this.cameraRadius;

    // Variación vertical sutil (como respiración)
    const breathe = Math.sin(elapsed * 0.3) * 0.3;

    // Pre-asignar posición (sin crear nuevo Vector3)
    this._cameraTarget.set(x, this.cameraHeight + breathe, z);
    this.sceneManager.camera.position.copy(this._cameraTarget);

    // Mirar ligeramente arriba del centro
    this._cameraLookTarget.set(0, this.cameraLookHeight, -2);
    this.sceneManager.camera.lookAt(this._cameraLookTarget);
  }

  /** Muestra la experiencia con transición suave */
  startExperience() {
    this.isLoaded = true;
    this.loadingScreen.classList.add('hidden');

    // Mostrar título después de un momento
    setTimeout(() => {
      this.titleOverlay.classList.add('visible');
    }, 800);

    // Ocultar título después de 6 segundos
    setTimeout(() => {
      this.titleOverlay.classList.remove('visible');
    }, 7000);
  }

  /** Actualiza la barra de progreso */
  updateLoading(percent) {
    this.loadProgress = percent;
    if (this.loadingBarFill) {
      this.loadingBarFill.style.width = `${percent}%`;
    }
  }

  /** Actualiza el texto de carga */
  updateLoadingText(text) {
    if (this.loadingText) {
      this.loadingText.textContent = text;
    }
  }

  /**
   * Loop principal de animación
   * Se ejecuta cada frame (~60 FPS)
   * Actualiza todos los sistemas en orden
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.sceneManager.getDelta();
    const elapsed = this.sceneManager.getElapsedTime();

    // === Actualizar todos los sistemas ===

    // 1. Terreno (viento + animación)
    this.terrain.update(elapsed);

    // 2. Cielo (variación temporal)
    this.sky.update(elapsed);

    // 3. Niebla (movimiento de nubes)
    this.fog.update(elapsed);

    // 4. Viento (variación de dirección y fuerza)
    this.wind.update(delta, elapsed);

    // 5. Partículas (movimiento en GPU)
    this.particles.update(elapsed, this.sceneManager.camera.position);

    // 6. Iluminación (ciclo de atardecer sutil)
    this.lighting.update(0.5 + Math.sin(elapsed * 0.1) * 0.2);

    // 7. Cámara (movimiento orbital)
    this.updateCamera(elapsed);

    // 8. Renderizar con post-processing
    this.postProcessing.render();
  }
}

// === Iniciar la experiencia cuando el DOM esté listo ===
window.addEventListener('DOMContentLoaded', () => {
  new Experience();
});
