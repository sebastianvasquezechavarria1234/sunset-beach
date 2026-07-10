import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

/**
 * PostProcessing - Pipeline de post-procesamiento cinematográfico
 * Cadenas: Render → Bloom → Viñeta → Color Grading → FXAA
 * Cada pasada es modular y puede activarse/desactivarse
 */
export class PostProcessing {
  constructor(renderer, scene, camera, resourceManager) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.resourceManager = resourceManager;

    // Tamaño base para render targets
    const size = new THREE.Vector2();
    renderer.getSize(size);

    // EffectComposer: gestiona el pipeline de post-procesamiento
    this.composer = new EffectComposer(renderer);

    // === Pasada 1: Render de la escena ===
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // === Pasada 2: Bloom (resplandor) ===
    // UnrealBloomPass crea un efecto de glow en áreas brillantes
    this.bloomPass = new UnrealBloomPass(
      size,
      0.8,   // strength - intensidad del bloom
      0.4,   // radius - que tan lejos se extiende
      0.85   // threshold - brillo mínimo para activar bloom
    );
    this.composer.addPass(this.bloomPass);

    // === Pasada 3: Viñeta personalizada ===
    // Oscurece los bordes para dirigir la atención al centro
    this.vignettePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uIntensity: { value: 0.9 },
        uSmoothness: { value: 0.4 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uIntensity;
        uniform float uSmoothness;
        varying vec2 vUv;

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);

          // Viñeta radial
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float vignette = smoothstep(0.5, 0.5 - uSmoothness, dist * uIntensity);

          // Viñeta con un toque cálido en los bordes
          vec3 vignetteColor = mix(vec3(0.0, 0.0, 0.05), color.rgb, vignette);
          gl_FragColor = vec4(vignetteColor, color.a);
        }
      `
    });
    this.composer.addPass(this.vignettePass);

    // === Pasada 4: Color Grading cinematográfico ===
    // Ajusta tonos, contraste y temperatura de color
    this.colorPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uBrightness: { value: 0.02 },
        uContrast: { value: 1.15 },
        uSaturation: { value: 1.1 },
        uTemperature: { value: 0.08 }, // Más cálido
        uTint: { value: 0.02 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uBrightness;
        uniform float uContrast;
        uniform float uSaturation;
        uniform float uTemperature;
        uniform float uTint;
        varying vec2 vUv;

        // Función de saturación
        vec3 adjustSaturation(vec3 color, float adjustment) {
          const vec3 luminance = vec3(0.2126, 0.7152, 0.0722);
          float luminanceDot = dot(color, luminance);
          return mix(vec3(luminanceDot), color, adjustment);
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);

          // Brillo
          color.rgb += uBrightness;

          // Contraste
          color.rgb = (color.rgb - 0.5) * uContrast + 0.5;

          // Saturación
          color.rgb = adjustSaturation(color.rgb, uSaturation);

          // Temperatura de color (más cálido = más naranja)
          color.r += uTemperature;
          color.b -= uTemperature * 0.5;
          color.g += uTint * 0.3;

          // Clamp final
          color.rgb = clamp(color.rgb, 0.0, 1.0);

          gl_FragColor = color;
        }
      `
    });
    this.composer.addPass(this.colorPass);

    // === Pasada 5: FXAA (Anti-aliasing) ===
    // Siempre al final para suavizar bordes de toda la imagen
    this.fxaaPass = new ShaderPass(FXAAShader);
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / (size.x * renderer.getPixelRatio()),
      1 / (size.y * renderer.getPixelRatio())
    );
    this.composer.addPass(this.fxaaPass);
  }

  /** Renderiza el frame completo con todas las pasadas */
  render() {
    this.composer.render();
  }

  /** Maneja el redimensionamiento de ventana */
  resize(width, height) {
    const pixelRatio = this.renderer.getPixelRatio();
    this.composer.setSize(width, height);

    // Actualizar resolución de FXAA
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / (width * pixelRatio),
      1 / (height * pixelRatio)
    );

    // Actualizar resolución de Bloom
    this.bloomPass.resolution.set(width, height);
  }

  dispose() {
    this.composer.dispose();
  }
}
