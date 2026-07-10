import * as THREE from 'three';

/**
 * SceneManager - Configuración centralizada de escena, cámara y renderer
 * Maneja resize, pixel ratio y configuración base de renderizado
 */
export class SceneManager {
  constructor() {
    // Escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);
    this.scene.fog = new THREE.FogExp2(0x1a1025, 0.015);

    // Cámara
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 1, 0);

    // Renderer con configuración cinematográfica
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Tone mapping ACES Filmic - estándar cinematográfico
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Sombras suaves
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Color de fondo del renderer
    this.renderer.setClearColor(0x0a0a12, 1);

    // Insertar canvas en el DOM
    document.body.appendChild(this.renderer.domElement);

    // Reloj para animaciones
    this.clock = new THREE.Clock();

    // Bind del handler de resize
    this._onResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  /** Manejador de redimensionamiento de ventana */
  _handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /** Obtiene el delta time desde el último frame */
  getDelta() {
    return this.clock.getDelta();
  }

  /** Obtiene el tiempo total transcurrido */
  getElapsedTime() {
    return this.clock.getElapsedTime();
  }

  /** Renderiza la escena */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /** Limpia recursos al destruir */
  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
