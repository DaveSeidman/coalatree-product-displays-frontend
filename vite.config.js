import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/coalatree-product-displays/',
  plugins: [react()],
  server: {
    port: 8080,
    host: true,
  },
});
