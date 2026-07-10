import * as THREE from 'three';

/**
 * Wind - Controlador de viento para la escena
 * Modifica la dirección y fuerza del viento que afecta al terreno
 * y a las partículas, creando un ambiente natural y vivo
 */
export class Wind {
  constructor() {
    // Estado del viento
    this.direction = new THREE.Vector2(1.0, 0.5).normalize();
    this.strength = 1.0;
    this.targetStrength = 1.0;
    this.turbulence = 0.0;

    // Para suavizar cambios de dirección
    this._directionTarget = this.direction.clone();
    this._time = 0;
  }

  /**
   * Actualiza el viento con variación temporal
   * @param {number} delta - Tiempo desde el último frame
   * @param {number} elapsedTime - Tiempo total
   */
  update(delta, elapsedTime) {
    this._time += delta;

    // Cambio suave de dirección cada ~8 segundos
    const dirAngle = Math.sin(this._time * 0.12) * 0.5;
    this._directionTarget.set(Math.cos(dirAngle), Math.sin(dirAngle)).normalize();
    this.direction.lerp(this._directionTarget, delta * 0.3);

    // Variación de intensidad (ráfagas suaves)
    this.targetStrength = 0.7 + Math.sin(this._time * 0.5) * 0.3
      + Math.sin(this._time * 1.3) * 0.15;
    this.strength += (this.targetStrength - this.strength) * delta * 2.0;

    // Turbulencia: fluctuaciones rápidas
    this.turbulence = Math.sin(this._time * 3.0) * 0.1
      + Math.sin(this._time * 7.0) * 0.05;
  }

  /** Obtiene la dirección del viento como Vector3 (con Y=0) */
  getDirection3D() {
    return new THREE.Vector3(this.direction.x, 0, this.direction.y);
  }

  dispose() {
    // No hay recursos que limpiar
  }
}
