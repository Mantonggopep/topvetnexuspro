import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://vetnexus-backend.onrender.com', // Your Render Backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
