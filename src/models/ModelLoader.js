import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * ModelLoader - Carga e integración de modelos GLB
 * Gestiona la carga con LoadingManager y procesa los modelos
 * para integrarlos naturalmente en la escena
 */
export class ModelLoader {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.loader = new GLTFLoader();
    this.models = new Map();
  }

  /**
   * Carga un modelo GLB desde una URL
   * @param {string} name - Nombre identificador del modelo
   * @param {string} url - Ruta al archivo .glb
   * @param {object} options - Opciones de posicionamiento
   * @returns {Promise<THREE.Group>} El modelo cargado
   */
  async load(name, url, options = {}) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // Configuración por defecto
          const {
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = 1,
            castShadow = true,
            receiveShadow = true
          } = options;

          // Aplicar transformaciones
          model.position.set(...position);
          model.rotation.set(...rotation);

          if (typeof scale === 'number') {
            model.scale.setScalar(scale);
          } else {
            model.scale.set(...scale);
          }

          // Habilitar sombras en todos los meshes
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = castShadow;
              child.receiveShadow = receiveShadow;

              // Optimizar materiales del modelo
              if (child.material) {
                child.material.envMapIntensity = 0.5;
                this.resourceManager.trackMaterial(child.material);
              }

              // Registrar geometrías
              if (child.geometry) {
                this.resourceManager.trackGeometry(child.geometry);
              }
            }
          });

          model.name = name;
          this.scene.add(model);
          this.models.set(name, model);

          console.log(`[ModelLoader] Modelo "${name}" cargado correctamente`);
          resolve(model);
        },
        undefined,
        (error) => {
          console.error(`[ModelLoader] Error cargando "${name}":`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Crea un placeholder procedural cuando no hay modelo GLB disponible
   * Genera una forma abstracta que se integra en la escena
   * @param {string} name - Nombre del placeholder
   * @param {object} options - Opciones de configuración
   */
  createPlaceholder(name, options = {}) {
    const {
      position = [0, 0, 0],
      geometryType = 'crystal', // crystal, monolith, obelisk
      color = 0x334455,
      emissive = 0x112233,
      scale = 1
    } = options;

    let geometry;

    switch (geometryType) {
      case 'crystal': {
        // Forma de cristal alargado - dodecaedro estirado
        geometry = new THREE.DodecahedronGeometry(1, 0);
        break;
      }
      case 'monolith': {
        // Monolito rectangular
        geometry = new THREE.BoxGeometry(0.5, 3, 0.5, 1, 4, 1);
        break;
      }
      case 'obelisk': {
        // Obelisco piramidal
        geometry = new THREE.ConeGeometry(0.6, 4, 4);
        break;
      }
      default: {
        geometry = new THREE.OctahedronGeometry(1, 0);
      }
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(emissive),
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.7,
      envMapIntensity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;

    this.scene.add(mesh);
    this.models.set(name, mesh);

    this.resourceManager.trackGeometry(geometry);
    this.resourceManager.trackMaterial(material);

    return mesh;
  }

  /**
   * Obtiene un modelo previamente cargado por nombre
   * @param {string} name
   * @returns {THREE.Group|THREE.Mesh|null}
   */
  getModel(name) {
    return this.models.get(name) || null;
  }

  dispose() {
    for (const [name, model] of this.models) {
      this.scene.remove(model);
    }
    this.models.clear();
  }
}
