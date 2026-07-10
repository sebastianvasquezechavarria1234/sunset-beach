import { defineConfig } from 'vite';

export default defineConfig({
  // Vite maneja archivos .glsl con el sufijo ?raw nativamente
  // No se necesitan plugins adicionales
  server: {
    host: true,
    port: 3000
  },
  build: {
    target: 'esnext',
    minify: 'esbuild'
  }
});
