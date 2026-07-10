<div align="center">

# 🌅 Sunset Beach

<br/>

### *Una experiencia cinematográfica interactiva en Three.js*

<br/>

*Olas que rompen en la arena. Palmeras meciéndose con la brisa.*
*Un sol que se despide, y dos mil luciérnagas que no saben que la noche se acerca.*

<br/>

![Three.js](https://img.shields.io/badge/Three.js-v0.160-black?logo=three.js)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![GLSL](https://img.shields.io/badge/GLSL-ES_3.0-5586C4)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

<br/>

## Índice

<details>
<summary><strong>Explorar secciones</strong></summary>

<br/>

1. [La visión](#-la-visión)
2. [Cómo funciona](#-cómo-funciona)
3. [Decisiones técnicas](#-decisiones-técnicas)
4. [Arquitectura](#-arquitectura)
5. [Shaders GLSL](#-shaders-glsl)
6. [Pipeline de renderizado](#-pipeline-de-renderizado)
7. [Rendimiento](#-rendimiento)
8. [Instalación](#-instalación)
9. [Controles](#-controles)
10. [Personalización](#-personalización)
11. [Soporte del navegador](#-soporte-del-navegador)
12. [Contribuir](#-contribuir)
13. [Créditos](#-créditos)
14. [Licencia](#-licencia)

</details>

---

<br/>

## 🎬 La visión

> *No es un demo de Three.js. Es un momento suspendido en el tiempo.*

Sunset Beach captura esa instancia efímera en la que el sol toca el horizonte y todo se tiñe de dorado. Las olas rompen con paciencia infinita, las palmeras susurran, y la arena guarda aún el calor del día.

La escena no pretende ser realista — pretende *sentirse* real.

Cada shader, cada partícula, cada frame está diseñado para evocar una emoción: **calma, asombro, presencia**.

<br/>

### Capas de la escena

```
    ☁️  Cielo de atardecer
    │   Nubes volumétricas iluminadas desde abajo
    │
    🌊  Océano animado
    │   Olas rompiendo · Espuma · Sun glint · Caustics
    │
    🏖  Playa procedural
    │   Arena seca/mojada · Conchas · Dunas · Marcas de marea
    │
    🌴  Palmeras
    │   Troncos curvados · Hojas con viento · Cocos
    │
    ✨  Partículas
        2000 luciérnagas doradas flotando
```

---

<br/>

## ⚙️ Cómo funciona

La experiencia se construye sobre **cinco sistemas fundamentales**, cada uno ejecutándose de forma independiente pero sincronizada en un loop de animación a 60 FPS.

### 1. Terreno procedural

Un plano de 60×60 unidades con 16,384 vértices. La elevación se calcula en el **vertex shader** usando ruido Simplex en múltiples frecuencias:

```
Arena (z < 0)          →  superficie plana que desciende hacia el mar
Dunas (z > 5)          →  ondulaciones suaves con fbm
Marcas de marea        →  relief sutil donde el agua toca la arena
```

El **fragment shader** mezcla colores de arena seca y mojada basándose en la distancia al agua, añadiendo variación granular y conchas dispersas.

### 2. Océano animado

4 frecuencias de olas se combinan en el vertex shader:

| Frecuencia | Propósito |
|---|---|
| `0.3 rad/s` | Ola grande que se acerca a la orilla |
| `1.5 rad/s` | Ola que se rompe en la costa |
| `4.0 rad/s` | Chop pequeño (agitación superficial) |
| `Ruido Simplex` | Forma orgánica irregular |

El fragment shader calcula reflexión del cielo, sun glint specular, caustics bajo el agua, y espuma blanca donde las olas rompen.

### 3. Cielo de atardecer

Una esfera de 200 radios con **BackSide rendering**. El fragment shader genera:

- Gradiente de 4 colores (horizonte → medio → zenit → suelo)
- Nubes volumétricas con FBM noise
- Iluminación lateral de nubes (silver lining)
- Disco solar con halo y rayos horizontales
- Reflejo del sol sobre el agua

### 4. Partículas GPU-instanciadas

2000 luciérnagas se renderizan con **un solo draw call** usando `InstancedMesh`. Cada partícula tiene:

- Posición, escala, velocidad y fase propias (atributos instanciados)
- Movimiento flotante calculado en vertex shader
- Pulso de brillo tipo luciérnaga en fragment shader
- Color de la paleta cálida (dorado, naranja, crema)

### 5. Post-processing

7 pasadas encadenadas en `EffectComposer`:

```
Render → Bloom → God Rays → Chromatic Aberration → Viñeta → Color Grading → FXAA
```

Cada pasada es un `ShaderPass` independiente que puede activarse o desactivarse.

---

<br/>

## 🔬 Decisiones técnicas

> *Por qué no se hizo de otra manera.*

### ¿Por qué shaders custom en vez de materiales built-in?

Los materiales estándar de Three.js (`MeshStandardMaterial`, etc.) son excelentes para escenas PBR genéricas. Pero esta escena requiere:

- **Desplazamiento de vértices** animado en el terreno (wind ripple)
- **Olas** que cambian de forma cada frame
- **Mezcla de colores** basada en distancia al agua en tiempo real
- **Nubes** generadas proceduralmente

Ninguno de estos es posible con materiales predefinidos sin resortes como `onBeforeCompile`, que dificultan el mantenimiento.

### ¿Por qué `InstancedMesh` para partículas?

Crear 2000 `THREE.Mesh` individuales significaría 2000 draw calls por frame. Con `InstancedMesh`, todas las partículas se dibujan en **una sola llamada**. La animación se hace en el shader, no en JavaScript.

### ¿Por qué `FogExp2` en vez de `Fog` lineal?

La niebla exponencial produce una caída más natural de visibilidad con la distancia. En una playa, la brisa salada crea exactamente este efecto: los objetos cercanos se ven nítidos, los lejanos se disuelven gradualmente.

### ¿Por qué `OrbitControls` en vez de cámara animada?

Dar control al usuario crea una conexión más fuerte con la escena. El auto-rotate mantiene la sensación de movimiento cuando el usuario no interactúa, pero se detiene inmediatamente al tocar.

---

<br/>

## 🏗 Arquitectura

Cada sistema es una **clase independiente** con un contrato claro:

```javascript
class Sistema {
  constructor(scene, resourceManager) { /* init */ }
  update(elapsedTime, delta) { /* cada frame */ }
  dispose() { /* liberar recursos */ }
}
```

### Diagrama de módulos

```
main.js  ─────────────────── Orquestador
    │
    ├── core/
    │   ├── SceneManager.js       Escena · Cámara · Renderer
    │   ├── PostProcessing.js     Pipeline de 7 pasadas
    │   └── ResourceManager.js    Tracking y disposal de GPU resources
    │
    ├── environment/
    │   ├── Terrain.js            Playa procedural (GLSL)
    │   ├── Water.js              Océano con olas (GLSL)
    │   ├── Sky.js                Cielo de atardecer (GLSL)
    │   └── Fog.js                Niebla volumétrica
    │
    ├── lighting/
    │   └── LightingManager.js    Sol · Hemisférico · Ambient · Contraluz
    │
    ├── effects/
    │   ├── Particles.js          Luciérnagas GPU-instanciadas
    │   ├── Trees.js              Palmeras procedurales
    │   └── Wind.js               Controlador de viento
    │
    └── utils/
        └── Noise.js              Simplex 3D (CPU)
```

### ResourceManager

Todos los recursos GPU (geometrías, materiales, texturas, render targets) se registran al crearse y se liberan automáticamente en `beforeunload`:

```javascript
resourceManager.trackGeometry(geometry);
resourceManager.trackMaterial(material);
resourceManager.trackTexture(texture);
// ...
resourceManager.dispose();  // Libera todo de forma segura
```

---

<br/>

## 🎨 Shaders GLSL

Los shaders son el corazón de esta experiencia. Todo el movimiento visual ocurre en la GPU.

### Arena — Desplazamiento multi-capa

```glsl
// Vertex: 4 capas de ruido se combinan
float beachSlope  = smoothstep(-15.0, 20.0, pos.z) * 2.5;
float dunes       = fbm(vec3(pos.x * 0.15, pos.z * 0.1, 0.0)) * 1.5;
float tideMarks   = sin(pos.x * 3.0 + pos.z * 0.5) * 0.05 * tideMask;
float windRipple  = sin(windPhase) * uWindStrength * 0.02;

pos.y = beachSlope + dunes + tideMarks + windRipple;
```

### Agua — Olas de playa

```glsl
// 4 frecuencias + ruido orgánico
float approach   = sin(pos.x * 0.3 + uTime * 0.7) * uWaveHeight;
float breaking   = sin(pos.x * 1.5 + uTime * 1.5) * uWaveHeight * shoreProximity;
float chop       = sin(pos.x * 4.0 + pos.z * 3.0 + uTime * 2.5) * 0.05;
float noiseWave  = snoise(vec3(pos.x * 0.2, pos.z * 0.2, uTime * 0.3)) * 0.15;
```

### Cielo — Nubes volumétricas

```glsl
// Iluminación lateral de nubes
float cloudSun = max(dot(normalize(cloudDir), normalize(uSunDirection)), 0.0);
vec3 cloudLit  = mix(vec3(1.0, 0.45, 0.1),   // Lado iluminado
                     vec3(0.25, 0.08, 0.15),   // Lado sombreado
                     1.0 - pow(cloudSun, 0.4));

// Silver lining
float edgeGlow = pow(cloudSun, 10.0) * cloudDensity * 0.6;
```

### Luciérnagas — Pulso de brillo

```glsl
// Fragment: pulso exponencial
float pulse = sin(t * 3.0 + aPhase * 5.0) * 0.5 + 0.5;
pulse = pow(pulse, 3.0);  // Hace los pulsos más pronunciados

float core = exp(-dist * 12.0);   // Núcleo brillante
float halo = exp(-dist * 4.0);    // Halo exterior suave
```

---

<br/>

## 🔧 Pipeline de renderizado

```
┌──────────────────────────────────────────────────────────┐
│  ESCENA                                                  │
│                                                          │
│  ├─ Sky           BackSide · depthWrite: false · -1      │
│  ├─ Terrain       ShaderMaterial · displacement          │
│  ├─ Water         ShaderMaterial · transparent · 0.9     │
│  ├─ Trees         MeshStandardMaterial · castShadow      │
│  ├─ Particles     InstancedMesh · additive · order: 10   │
│  └─ Fog           ShaderMaterial · normal blend          │
│                                                          │
│  ILUMINACIÓN                                              │
│                                                          │
│  ├─ DirectionalLight    Sol · intensity: 1.2 · shadow    │
│  ├─ HemisphereLight     Cielo/Arena · intensity: 0.4     │
│  ├─ AmbientLight        Relleno · intensity: 0.3         │
│  └─ DirectionalLight    Contraluz · intensity: 0.3       │
├──────────────────────────────────────────────────────────┤
│  POST-PROCESSING (EffectComposer)                         │
│                                                          │
│  1. RenderPass           Escena completa                 │
│  2. UnrealBloomPass      Brillo suave · 0.3 strength     │
│  3. GodRaysShader        Rayos de luz · weight: 0.2      │
│  4. ChromaticAberration  Separación RGB · 0.003          │
│  5. VignetteShader       Enfoque al centro · 0.7         │
│  6. ColorCorrection      Temperature cálida · 0.04       │
│  7. FXAAShader           Anti-aliasing · último           │
└──────────────────────────────────────────────────────────┘
```

---

<br/>

## 🚀 Rendimiento

**Objetivo: 60 FPS constantes.**

| Estrategia | Implementación |
|---|---|
| GPU-first animation | Terreno, agua, cielo y partículas se animan íntegramente en shaders |
| Instanced rendering | 2000 partículas → 1 draw call via `InstancedMesh` |
| Pixel ratio cap | Limitado a `2` para evitar sobrecarga en Retina/4K |
| Shadow budget | 2048px solo en el sol, sin sombras en elementos transparentes |
| Zero allocations | Todos los `THREE.Vector3` se pre-asignan fuera del loop |
| Frustum culling | Habilitado por defecto en Three.js |
| Resource disposal | `ResourceManager` libera todo al descargar la página |

### Métricas típicas

| Dispositivo | FPS | Draw calls | Triángulos |
|---|---|---|---|
| Desktop (GTX 1060+) | 60 | ~15 | ~50K |
| Laptop (Intel UHD) | 45-60 | ~15 | ~50K |
| Mobile (Snapdragon 8) | 30-45 | ~15 | ~50K |

> **Tip:** En dispositivos de gama baja, reduce el shadow map a 1024px o desactiva god rays en `PostProcessing.js`.

---

<br/>

## 📦 Instalación

```bash
# Clonar
git clone https://github.com/tu-usuario/sunset-beach.git
cd sunset-beach

# Instalar
npm install

# Desarollar
npm run dev
```

El servidor arranca en `http://localhost:3000`.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción → `dist/` |
| `npm run preview` | Preview del build |

---

<br/>

## 🎮 Controles

| Acción | Desktop | Mobile |
|---|---|---|
| Rotar cámara | Click izq. + arrastrar | Un dedo + arrastrar |
| Zoom | Rueda del ratón | Pinch |
| Pan | Click der. + arrastrar | — |
| Reset vista | Doble click | Doble toque |

**Auto-rotate** activo a 0.3 rpm. Se detiene al interactuar, se reanuda tras 2s de inactividad.

---

<br/>

## 🎨 Personalización

### Hora del día

```javascript
// LightingManager.js
this.sunLight.position.set(-10, 6, -12);  // 🌅 Atardecer (default)
this.sunLight.position.set(0, 15, 0);     // ☀️ Mediodía
this.sunLight.position.set(10, 2, -5);    // 🌄 Amanecer
```

### Altura de las olas

```glsl
// shaders/water/vertex.glsl
uniform float uWaveHeight;  // Default: 0.3 — sube para tormenta, baja para calma
```

### Número de partículas

```javascript
// main.js
this.particles = new Particles(scene, resourceManager, 3000);  // Más partículas
```

### Modelo GLB personalizado

Coloca tu archivo `.glb` en `public/models/scene.glb`. El sistema lo detecta automáticamente y lo integra en la escena.

---

<br/>

## 🌐 Soporte del navegador

| Navegador | Soporte |
|---|---|
| Chrome 90+ | ✅ Completo |
| Firefox 90+ | ✅ Completo |
| Safari 15+ | ✅ Completo |
| Edge 90+ | ✅ Completo |
| iOS Safari 15+ | ✅ Touch optimizado |
| Chrome Android | ✅ Touch optimizado |

**Requisitos:** WebGL 2.0 habilitado. La mayoría de navegadores modernos lo soportan por defecto.

---

<br/>

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios significativos, abre un issue primero para discutir la propuesta.

```bash
# 1. Fork el proyecto
# 2. Crea una rama para tu feature
git checkout -b feature/nueva-funcionalidad

# 3. Commit con mensaje descriptivo
git commit -m "Agregar: sistema de mareas"

# 4. Push a tu rama
git push origin feature/nueva-funcionalidad

# 5. Abre un Pull Request
```

### Convenciones

- **Commits:** formato [Conventional Commits](https://www.conventionalcommits.org/)
- **Shaders:** documentar cada uniform con su propósito
- **Módulos:** cada clase debe tener `constructor`, `update` y `dispose`

---

<br/>

## 🙏 Créditos

- **[Three.js](https://threejs.org/)** — El motor WebGL que hace esto posible
- **[Vite](https://vitejs.dev/)** — Desarrollo instantáneo
- **[Simplex Noise](https://github.com/ashima/webgl-noise)** — Algoritmo de ruido procedural
- **[Three.js Examples](https://github.com/mrdoob/three.js/tree/dev/examples/jsm)** — Post-processing, loaders, controles

---

<br/>

## 📄 Licencia

MIT License — Usa este proyecto como quieras.

```
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files.
```

---

<br/>

<div align="center">

*Construido con pasión, pixels y un poco de luz dorada.*

<br/>

**[⬆ Volver al inicio](#-sunset-beach)**

</div>
