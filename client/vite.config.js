import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'https://ggufoodies-backend-j53o.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});