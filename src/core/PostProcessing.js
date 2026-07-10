import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

/**
 * PostProcessing - Pipeline cinematográfico completo
 * Render → Bloom → God Rays → Chromatic Aberration → Viñeta → Color Grading → FXAA
 */
export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    const size = new THREE.Vector2();
    renderer.getSize(size);

    this.composer = new EffectComposer(renderer);

    // 1. Render de escena
    this.composer.addPass(new RenderPass(scene, camera));

    // 2. Bloom dramático
    this.bloomPass = new UnrealBloomPass(
      size,
      0.6,    // strength
      0.5,    // radius
      0.7     // threshold
    );
    this.composer.addPass(this.bloomPass);

    // 3. God Rays (rayos de luz volumétricos)
    this.godRaysPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uLightPosition: { value: new THREE.Vector2(0.3, 0.6) },
        uExposure: { value: 1.0 },
        uDecay: { value: 0.96 },
        uDensity: { value: 1.2 },
        uWeight: { value: 0.4 }
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
        uniform vec2 uLightPosition;
        uniform float uExposure;
        uniform float uDecay;
        uniform float uDensity;
        uniform float uWeight;
        varying vec2 vUv;

        void main() {
          vec2 texCoord = vUv;
          vec2 deltaTextCoord = texCoord - uLightPosition;
          deltaTextCoord *= 1.0 / 50.0 * uDensity;

          vec4 color = texture2D(tDiffuse, texCoord);
          float illumination = 1.0;
          vec4 accum = vec4(0.0);

          for (int i = 0; i < 50; i++) {
            texCoord -= deltaTextCoord;
            vec4 texSample = texture2D(tDiffuse, texCoord);
            texSample *= illumination * uWeight;
            accum += texSample;
            illumination *= uDecay;
          }

          accum *= uExposure;
          gl_FragColor = color + accum * 0.12;
        }
      `
    });
    this.composer.addPass(this.godRaysPass);

    // 4. Chromatic Aberration sutil
    this.chromaPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uAmount: { value: 0.003 }
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
        uniform float uAmount;
        varying vec2 vUv;

        void main() {
          vec2 dir = vUv - 0.5;
          float dist = length(dir);
          float offset = uAmount * dist;

          float r = texture2D(tDiffuse, vUv - dir * offset).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv + dir * offset).b;

          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `
    });
    this.composer.addPass(this.chromaPass);

    // 5. Viñeta cinematográfica
    this.vignettePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uIntensity: { value: 0.85 },
        uSmoothness: { value: 0.5 }
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
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float vignette = smoothstep(0.5, 0.5 - uSmoothness, dist * uIntensity);
          vec3 vignetteColor = mix(vec3(0.0, 0.0, 0.05), color.rgb, vignette);
          gl_FragColor = vec4(vignetteColor, color.a);
        }
      `
    });
    this.composer.addPass(this.vignettePass);

    // 6. Color Grading cinematográfico
    this.colorPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uBrightness: { value: 0.03 },
        uContrast: { value: 1.2 },
        uSaturation: { value: 1.15 },
        uTemperature: { value: 0.1 },
        uTint: { value: 0.03 }
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

        vec3 adjustSaturation(vec3 color, float adj) {
          const vec3 lum = vec3(0.2126, 0.7152, 0.0722);
          return mix(vec3(dot(color, lum)), color, adj);
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          color.rgb += uBrightness;
          color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
          color.rgb = adjustSaturation(color.rgb, uSaturation);
          color.r += uTemperature;
          color.b -= uTemperature * 0.5;
          color.g += uTint * 0.3;
          color.rgb = clamp(color.rgb, 0.0, 1.0);
          gl_FragColor = color;
        }
      `
    });
    this.composer.addPass(this.colorPass);

    // 7. FXAA (siempre al final)
    this.fxaaPass = new ShaderPass(FXAAShader);
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / (size.x * renderer.getPixelRatio()),
      1 / (size.y * renderer.getPixelRatio())
    );
    this.composer.addPass(this.fxaaPass);
  }

  render() {
    this.composer.render();
  }

  resize(width, height) {
    const pixelRatio = this.renderer.getPixelRatio();
    this.composer.setSize(width, height);

    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / (width * pixelRatio),
      1 / (height * pixelRatio)
    );

    this.bloomPass.resolution.set(width, height);
  }

  /** Actualiza la posición de los god rays basado en la posición del sol en pantalla */
  updateSunScreenPosition(screenPos) {
    this.godRaysPass.uniforms.uLightPosition.value.copy(screenPos);
  }

  dispose() {
    this.composer.dispose();
  }
}
