import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// import basicSsl from '@vitejs/plugin-basic-ssl'


export default defineConfig({
  // base: '/coalatree-product-displays-frontend/',
  plugins: [react()], //, basicSsl()],
  assetsInclude: ['**/*.glb'],
  server: {
    port: 8080,
    host: true,
    allowedHosts: ['coalatree-products-frontend.ngrok.app'],
    // https: true,
    // proxy: {
    //   '/socket.io': {
    //     target: 'https://caolatree-products-backend.ngrok.app/',
    //     secure: true,
    //     // 'http://localhost:8000', // your backend
    //     ws: true,
    //     changeOrigin: true,
    //   },
  },
},
});
