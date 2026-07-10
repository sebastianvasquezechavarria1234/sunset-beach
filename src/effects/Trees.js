import * as THREE from 'three';
import { simplex3D } from '../utils/Noise.js';

/**
 * Trees - Palmeras de playa
 * Crea palmeras procedural con troncos curvados y hojas que se mueven con el viento
 */
export class Trees {
  constructor(scene, resourceManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.group = new THREE.Group();
    this.group.name = 'palm-trees';

    this.scene.add(this.group);
  }

  /**
   * Genera palmeras en la playa
   * @param {number} count - Número de palmeras
   */
  generate(count = 30) {
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const z = 3.0 + Math.random() * 18; // Solo en tierra firme (lejos del agua)

      const elevation = simplex3D(x * 0.15, z * 0.15, 0.0) * 1.5 + 0.5;
      const y = Math.max(elevation, 0.3);

      this._createPalmTree(x, y, z);
    }
  }

  _createPalmTree(x, y, z) {
    const treeGroup = new THREE.Group();
    const scale = 0.7 + Math.random() * 0.6;

    // === Tronco curvado (segmentos de cilindro) ===
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a15,
      roughness: 0.95,
      metalness: 0.0
    });
    this.resourceManager.trackMaterial(trunkMat);

    const segments = 8;
    const trunkHeight = 3.5 * scale;
    const curve = 0.8 + Math.random() * 0.5; // Curvatura del tronco
    const lean = (Math.random() - 0.5) * 0.4; // Inclinación

    for (let s = 0; s < segments; s++) {
      const t = s / segments;
      const segH = trunkHeight / segments;
      const radius = THREE.MathUtils.lerp(0.12, 0.06, t) * scale;

      const segGeo = new THREE.CylinderGeometry(radius * 0.85, radius, segH, 5);
      const seg = new THREE.Mesh(segGeo, trunkMat);

      // Posición a lo largo de la curva
      const curveX = Math.sin(t * Math.PI * 0.5) * curve;
      const curveZ = lean * t;
      seg.position.set(curveX * scale, t * trunkHeight + segH * 0.5, curveZ * scale);

      // Rotación siguiendo la curva
      seg.rotation.z = -Math.cos(t * Math.PI * 0.5) * 0.3 * (curve > 0 ? 1 : -1);

      seg.castShadow = true;
      treeGroup.add(seg);
      this.resourceManager.trackGeometry(segGeo);
    }

    // === Copa de hojas (palmera) ===
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x1a5a20,
      roughness: 0.7,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    this.resourceManager.trackMaterial(leafMat);

    const darkLeafMat = new THREE.MeshStandardMaterial({
      color: 0x0d3a10,
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    this.resourceManager.trackMaterial(darkLeafMat);

    // Crear hojas de palmera (5-7 hojas curvadas)
    const leafCount = 5 + Math.floor(Math.random() * 3);
    const topX = Math.sin(Math.PI * 0.5) * curve * scale;
    const topZ = lean * scale;

    for (let l = 0; l < leafCount; l++) {
      const angle = (l / leafCount) * Math.PI * 2;
      const leafLen = (1.2 + Math.random() * 0.8) * scale;

      // Hoja como cono estirado y aplanado
      const leafGeo = new THREE.ConeGeometry(0.15 * scale, leafLen, 4);
      const leaf = new THREE.Mesh(leafGeo, Math.random() > 0.5 ? leafMat : darkLeafMat);

      // Posicionar en la copa
      leaf.position.set(
        topX + Math.cos(angle) * 0.3 * scale,
        trunkHeight + Math.sin(l * 0.5) * 0.15 * scale,
        topZ + Math.sin(angle) * 0.3 * scale
      );

      // Orientar la hoja hacia afuera y hacia abajo
      leaf.rotation.x = Math.sin(angle) * 0.8;
      leaf.rotation.z = Math.cos(angle) * 1.2;
      leaf.rotation.y = angle;

      leaf.castShadow = true;
      treeGroup.add(leaf);
      this.resourceManager.trackGeometry(leafGeo);
    }

    // Coco (esfera pequeña)
    const coconutGeo = new THREE.SphereGeometry(0.08 * scale, 4, 4);
    const coconutMat = new THREE.MeshStandardMaterial({
      color: 0x4a3520,
      roughness: 0.9
    });
    for (let c = 0; c < 3; c++) {
      const coconut = new THREE.Mesh(coconutGeo, coconutMat);
      coconut.position.set(
        topX + (Math.random() - 0.5) * 0.2 * scale,
        trunkHeight - 0.1,
        topZ + (Math.random() - 0.5) * 0.2 * scale
      );
      treeGroup.add(coconut);
    }
    this.resourceManager.trackGeometry(coconutGeo);
    this.resourceManager.trackMaterial(coconutMat);

    treeGroup.position.set(x, y, z);
    treeGroup.rotation.y = Math.random() * Math.PI * 2;
    treeGroup.scale.setScalar(0.8 + Math.random() * 0.4);

    this.group.add(treeGroup);
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
