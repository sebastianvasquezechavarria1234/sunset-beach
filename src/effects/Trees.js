import * as THREE from 'three';
import { simplex3D } from '../utils/Noise.js';

/**
 * Trees - Generador procedural de árboles y vegetación
 * Crea árboles de baja poligonización estilizados que se integran
 * naturalmente en el paisaje del atardecer
 */
export class Trees {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.group = new THREE.Group();
    this.group.name = 'trees';

    // Pool de geometrías y materiales para reutilizar
    this._trunkGeo = new THREE.CylinderGeometry(0.08, 0.15, 1.5, 6);
    this._leafGeo = new THREE.ConeGeometry(0.8, 2.0, 6);
    this._leafGeo2 = new THREE.ConeGeometry(0.6, 1.5, 6);

    this.resourceManager.trackGeometry(this._trunkGeo);
    this.resourceManager.trackGeometry(this._leafGeo);
    this.resourceManager.trackGeometry(this._leafGeo2);

    this._trunkMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      roughness: 0.9,
      metalness: 0.0
    });
    this._leafMat1 = new THREE.MeshStandardMaterial({
      color: 0x1a3a15,
      roughness: 0.8,
      metalness: 0.0
    });
    this._leafMat2 = new THREE.MeshStandardMaterial({
      color: 0x0d2a0a,
      roughness: 0.85,
      metalness: 0.0
    });
    this._leafMatAutumn = new THREE.MeshStandardMaterial({
      color: 0x8a4a15,
      roughness: 0.7,
      metalness: 0.0,
      emissive: 0x221100,
      emissiveIntensity: 0.1
    });

    this.resourceManager.trackMaterial(this._trunkMat);
    this.resourceManager.trackMaterial(this._leafMat1);
    this.resourceManager.trackMaterial(this._leafMat2);
    this.resourceManager.trackMaterial(this._leafMatAutumn);

    this.scene.add(this.group);
  }

  /**
   * Genera un bosque procedural en el terreno
   * @param {number} count - Número de árboles
   * @param {number} waterLevel - Nivel del agua (evitar crear árboles bajo el agua)
   */
  generate(count = 80, waterLevel = 0) {
    const spread = 25;

    for (let i = 0; i < count; i++) {
      // Posición aleatoria
      const x = (Math.random() - 0.5) * spread * 2;
      const z = (Math.random() - 0.5) * spread * 2;

      // Calcular elevación del terreno en esta posición (aproximación)
      const elevation = simplex3D(x * 0.15, z * 0.15, 0.0) * 3.0
        + simplex3D(x * 0.3, z * 0.3, 10.0) * 1.2;

      // No crear árboles bajo el agua ni en zonas muy empinadas
      if (elevation < waterLevel + 0.5) continue;

      const y = Math.max(elevation, waterLevel + 0.3);

      // Tamaño variado
      const treeType = Math.random();
      if (treeType < 0.6) {
        this._createPineTree(x, y, z);
      } else if (treeType < 0.85) {
        this._createSmallBush(x, y, z);
      } else {
        this._createAutumnTree(x, y, z);
      }
    }
  }

  /** Crea un pino estilizado */
  _createPineTree(x, y, z) {
    const scale = 0.6 + Math.random() * 0.8;
    const treeGroup = new THREE.Group();

    // Tronco
    const trunk = new THREE.Mesh(this._trunkGeo, this._trunkMat);
    trunk.position.y = 0.75;
    trunk.scale.setScalar(scale);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Copa (dos conos superpuestos)
    const leaves1 = new THREE.Mesh(this._leafGeo, this._leafMat1);
    leaves1.position.y = 2.2;
    leaves1.scale.setScalar(scale);
    leaves1.castShadow = true;
    treeGroup.add(leaves1);

    const leaves2 = new THREE.Mesh(this._leafGeo2, this._leafMat2);
    leaves2.position.y = 3.0;
    leaves2.scale.setScalar(scale * 0.8);
    leaves2.castShadow = true;
    treeGroup.add(leaves2);

    treeGroup.position.set(x, y, z);
    treeGroup.rotation.y = Math.random() * Math.PI * 2;
    treeGroup.scale.setScalar(0.8 + Math.random() * 0.4);

    this.group.add(treeGroup);
  }

  /** Crea un arbusto pequeño */
  _createSmallBush(x, y, z) {
    const bushGeo = new THREE.IcosahedronGeometry(0.5, 1);
    const bush = new THREE.Mesh(bushGeo, this._leafMat2);
    bush.position.set(x, y + 0.3, z);
    bush.scale.set(
      0.5 + Math.random() * 0.5,
      0.3 + Math.random() * 0.3,
      0.5 + Math.random() * 0.5
    );
    bush.castShadow = true;
    bush.receiveShadow = true;
    this.group.add(bush);
    this.resourceManager.trackGeometry(bushGeo);
  }

  /** Crea un árbol de otoño con hojas doradas */
  _createAutumnTree(x, y, z) {
    const scale = 0.7 + Math.random() * 0.5;
    const treeGroup = new THREE.Group();

    const trunk = new THREE.Mesh(this._trunkGeo, this._trunkMat);
    trunk.position.y = 0.75;
    trunk.scale.setScalar(scale * 1.2);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Copa redonda (dodecaedro)
    const crownGeo = new THREE.DodecahedronGeometry(1.0, 1);
    const crown = new THREE.Mesh(crownGeo, this._leafMatAutumn);
    crown.position.y = 2.5;
    crown.scale.setScalar(scale);
    crown.castShadow = true;
    treeGroup.add(crown);

    treeGroup.position.set(x, y, z);
    treeGroup.rotation.y = Math.random() * Math.PI * 2;

    this.group.add(treeGroup);
    this.resourceManager.trackGeometry(crownGeo);
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
