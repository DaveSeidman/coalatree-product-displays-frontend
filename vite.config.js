import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  server: {
    port: 8080,
    host: true,
    allowedHosts: ['coalatree-products-frontend.ngrok.app'],
  },
});
