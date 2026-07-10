/**
 * ResourceManager - Gestión centralizada de recursos GPU
 * Rastrea geometrías, materiales, texturas y render targets
 * para garantizar una limpieza completa de memoria
 */
export class ResourceManager {
  constructor() {
    this.geometries = new Set();
    this.materials = new Set();
    this.textures = new Set();
    this.renderTargets = new Set();
    this.mixers = new Set();

    // Liberar recursos al descargar la página
    this._onBeforeUnload = this.dispose.bind(this);
    window.addEventListener('beforeunload', this._onBeforeUnload);
  }

  /** Registra una geometría para limpieza posterior */
  trackGeometry(geometry) {
    this.geometries.add(geometry);
    return geometry;
  }

  /** Registra un material para limpieza posterior */
  trackMaterial(material) {
    this.materials.add(material);
    return material;
  }

  /** Registra una textura para limpieza posterior */
  trackTexture(texture) {
    this.textures.add(texture);
    return texture;
  }

  /** Registra un render target para limpieza posterior */
  trackRenderTarget(rt) {
    this.renderTargets.add(rt);
    return rt;
  }

  /** Registra un mixer de animación */
  trackMixer(mixer) {
    this.mixers.add(mixer);
    return mixer;
  }

  /**
   * Libera todos los recursos registrados
   * Llamado automáticamente en beforeunload, o manualmente
   */
  dispose() {
    // Geometrías
    for (const geo of this.geometries) {
      geo.dispose();
    }
    this.geometries.clear();

    // Materiales (incluyendo liberar sus texturas)
    for (const mat of this.materials) {
      if (mat.map) mat.map.dispose();
      if (mat.normalMap) mat.normalMap.dispose();
      if (mat.roughnessMap) mat.roughnessMap.dispose();
      if (mat.metalnessMap) mat.metalnessMap.dispose();
      if (mat.envMap) mat.envMap.dispose();
      if (mat.lightMap) mat.lightMap.dispose();
      if (mat.alphaMap) mat.alphaMap.dispose();
      if (mat.aoMap) mat.aoMap.dispose();
      if (mat.emissiveMap) mat.emissiveMap.dispose();
      if (mat.gradientMap) mat.gradientMap.dispose();
      mat.dispose();
    }
    this.materials.clear();

    // Texturas independientes
    for (const tex of this.textures) {
      tex.dispose();
    }
    this.textures.clear();

    // Render targets
    for (const rt of this.renderTargets) {
      rt.dispose();
    }
    this.renderTargets.clear();

    // Mixers
    for (const mixer of this.mixers) {
      mixer.stopAllAction();
      mixer.uncacheRoot(mixer.getRoot());
    }
    this.mixers.clear();

    window.removeEventListener('beforeunload', this._onBeforeUnload);
  }
}
