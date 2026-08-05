import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Permite que funcione en GitHub Pages u cualquier hosting estático sin problemas de rutas
  server: {
    port: 3000,
    open: false
  }
});
